import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { forwardRef, Inject } from '@nestjs/common';

import { AskQuestionMessageDTO } from 'src/dto/request/ask-question-message.dto';
import { AskQuestionResponseDTO } from 'src/dto/response/ask-question-response.dto';
import { QuestionWSParamsDTO } from 'src/dto/response/question-ws-params.dto';
import { Conversation } from 'src/entity/conversation.entity';
import { Sender } from 'src/enum/sender.enum';
import { ConversationGateway } from 'src/gateway/conversation.gateway';
import { ANSWER_TIMEOUT_MS, TIMEOUT_MESSAGE } from 'src/constants/app.constants';
import { KafkaService } from './kafka.service';
import { NoticeService } from './notice.service';
import { UserService } from './user.service';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  /**
   * Maps conversationId → timeout-cancel function.
   * When an answer arrives with done=true, the pending entry is resolved (timer cancelled).
   * If the timer fires first, a fallback message is sent and the entry is removed.
   */
  private readonly pendingAnswers = new Map<string, () => void>();

  constructor(
    private readonly noticeService: NoticeService,
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @InjectRepository(Conversation)
    public readonly repository: Repository<Conversation>,
    @Inject(forwardRef(() => ConversationGateway))
    private readonly gateway: ConversationGateway,
  ) {}

  async handleEmbedResult(payload: AskQuestionResponseDTO): Promise<void> {
    try {
      this.logger.log(`Processing answer chunk for conversation: ${payload.answer_conversation_id}`);

      const answerConversation = await this.repository.findOne({
        where: { conversationId: payload.answer_conversation_id },
      });

      if (!answerConversation) {
        this.logger.warn(`Conversation not found: ${payload.answer_conversation_id}`);
        return;
      }

      answerConversation.content = payload.done
        ? payload.answer
        : `${answerConversation.content ?? ''}${payload.answer ?? ''}`;

      await this.repository.save(answerConversation);

      this.gateway.sendAnswerChunk(
        payload.user_id,
        payload.docflow_notice_id,
        answerConversation,
        payload.done,
      );

      if (payload.done) {
        this.resolvePending(payload.answer_conversation_id);
      }
    } catch (error) {
      this.logger.error(`Error handling answer chunk: ${error.message}`, error.stack);
      throw error;
    }
  }

  async handleQuestionWebSocket(params: QuestionWSParamsDTO): Promise<[Conversation, Conversation]> {
    try {
      const { notice, prompt, userId } = params;
      this.logger.log(`Processing question for notice: ${notice.noticeId}, user: ${userId}`);

      const user = await this.userService.getById(userId);

      const question = this.repository.create({ notice, user, content: prompt, sender: Sender.USER });
      const answer = this.repository.create({ notice, user, content: '', sender: Sender.AI });

      await this.repository.save(question);
      const answerEntity = await this.repository.save(answer);

      const topic = this.configService.getOrThrow<string>('KAFKA_QUESTION_TOPIC');
      this.logger.log(`Sending question to Kafka topic: ${topic}`);

      await this.kafkaService.sendMessage<AskQuestionMessageDTO>(topic, {
        prompt,
        user_id: userId,
        docflow_notice_id: notice.docflowNoticeId,
        answer_conversation_id: answerEntity.conversationId,
      });

      this.scheduleAnswerTimeout(answerEntity.conversationId, userId, notice.docflowNoticeId);

      return [question, answerEntity];
    } catch (error) {
      this.logger.error(`Error handling WebSocket question: ${error.message}`, error.stack);
      throw error;
    }
  }

  async find(noticeId: string, userId: string): Promise<Conversation[]> {
    try {
      const notice = await this.noticeService.getById(noticeId);
      const user = await this.userService.getById(userId);

      return this.repository.find({
        where: { notice, user },
        order: { createdAt: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Error finding conversations: ${error.message}`, error.stack);
      throw error;
    }
  }

  async clear(noticeId: string, userId: string): Promise<void> {
    try {
      const notice = await this.noticeService.getById(noticeId);
      const user = await this.userService.getById(userId);

      await this.repository.delete({ notice, user });
      this.logger.log(`Conversations cleared for notice: ${noticeId}, user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error clearing conversations: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Registers a timeout for an answer conversation.
   * If the answer arrives (done=true) before the timeout, the timer is cancelled.
   * Otherwise, a fallback message is persisted and sent to the client.
   */
  private scheduleAnswerTimeout(conversationId: string, userId: string, docflowNoticeId: string): void {
    const timer = setTimeout(async () => {
      if (!this.pendingAnswers.has(conversationId)) return;

      this.pendingAnswers.delete(conversationId);
      this.logger.warn(`Timeout waiting for answer on conversation: ${conversationId}`);

      await this.repository.update(
        { conversationId, sender: Sender.AI },
        { content: TIMEOUT_MESSAGE },
      );

      const updated = await this.repository.findOne({ where: { conversationId } });
      if (updated) this.gateway.sendAnswerChunk(userId, docflowNoticeId, updated, true);
    }, ANSWER_TIMEOUT_MS);

    this.pendingAnswers.set(conversationId, () => clearTimeout(timer));
  }

  private resolvePending(conversationId: string): void {
    const cancel = this.pendingAnswers.get(conversationId);
    if (cancel) {
      cancel();
      this.pendingAnswers.delete(conversationId);
    }
  }
}
