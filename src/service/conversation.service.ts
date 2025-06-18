import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AskQuestionMessageDTO } from 'src/dto/request/ask-question-message.dto';
import { KafkaService } from './kafka.service';
import { NoticeService } from './notice.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from 'src/entity/conversation.entity';
import { Sender } from 'src/enum/sender.enum';
import { UserService } from './user.service';
import { ConversationGateway } from 'src/gateway/conversation.gateway';
import { AskQuestionResponseDTO } from 'src/dto/response/ask-question-response.dto';
import { QuestionWSParamsDTO } from 'src/dto/response/question-ws-params.dto';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly noticeService: NoticeService,
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @InjectRepository(Conversation)
    public readonly repository: Repository<Conversation>,
    private readonly gateway: ConversationGateway
  ) {}

  async handleEmbedResult(payload: AskQuestionResponseDTO): Promise<void> {
    try {
      this.logger.log(`Processing answer for conversation: ${payload.answer_conversation_id}`);
      
      const answerConversation = await this.repository.findOne({
          where: { conversationId: payload.answer_conversation_id },
      });
      
      if (!answerConversation) {
        this.logger.warn(`Conversation not found: ${payload.answer_conversation_id}`);
        return;
      }

      answerConversation.content = payload.done 
        ? payload.answer 
        : `${answerConversation.content || ""}${payload.answer || ""}`;
      
      await this.repository.save(answerConversation);
      this.logger.log(`Conversation updated: ${payload.answer_conversation_id}, done: ${payload.done}`);

      this.gateway.sendAnswerChunk(
        payload.user_id,
        payload.docflow_notice_id,
        answerConversation,
        payload.done
      );
    } catch (error) {
      this.logger.error(`Error handling embed result: ${error.message}`, error.stack);
      throw error;
    }
  }

  async handleQuestionWebSocket(params: QuestionWSParamsDTO): Promise<Conversation> {
    try {
      const { notice, prompt, userId } = params;
      this.logger.log(`Processing question for notice: ${notice.noticeId}, user: ${userId}`);

      const user = await this.userService.getById(userId);

      this.logger.log(`Creating conversation entries for question and answer`);
      const question = this.repository.create({ notice, user, content: prompt, sender: Sender.USER });
      const answer = this.repository.create({ notice, user, content: "", sender: Sender.AI });

      await this.repository.save(question);
      const answerEntity = await this.repository.save(answer);
      
      const topic = this.configService.get<string>('KAFKA_QUESTION_TOPIC');
      this.logger.log(`Sending question to Kafka topic: ${topic}`);
      
      await this.kafkaService.sendMessage<AskQuestionMessageDTO>(topic, {
        prompt,
        user_id: userId,
        docflow_notice_id: notice.docflowNoticeId,
        answer_conversation_id: answerEntity.conversationId,
      });
      
      this.logger.log(`Question successfully sent to processing queue`);

      this.waitForAnswerOrTimeout(answerEntity.conversationId, user.userId, notice.docflowNoticeId).catch((error) => {
        this.logger.error(`Error white waiting for a response: ${error.message}`, error.stack);
      });

      return question;
    } catch (error) {
      this.logger.error(`Error handling WebSocket question: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(noticeId: string, userId: string): Promise<Conversation> {
    try {
      this.logger.log(`Creating new conversation for notice: ${noticeId}, user: ${userId}`);
      
      const notice = await this.noticeService.getById(noticeId);
      const user = await this.userService.getById(userId);

      const conversation = this.repository.create({ notice, user });
      const saved = await this.repository.save(conversation);
      
      this.logger.log(`Conversation created: ${saved.conversationId}`);
      return saved;
    } catch (error) {
      this.logger.error(`Error creating conversation: ${error.message}`, error.stack);
      throw error;
    }
  }

  async find(noticeId: string, userId: string): Promise<Conversation[]> {
    try {
      this.logger.log(`Finding conversations for notice: ${noticeId}, user: ${userId}`);
      
      const notice = await this.noticeService.getById(noticeId);
      const user = await this.userService.getById(userId);

      const conversations = await this.repository.find({
        where: { notice, user },
        order: { createdAt: 'ASC' },
      });
      
      this.logger.log(`Found ${conversations.length} conversations`);
      return conversations;
    } catch (error) {
      this.logger.error(`Error finding conversations: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(conversationId: string): Promise<Conversation> {
    try {
      this.logger.log(`Finding conversation by ID: ${conversationId}`);
      
      const conversation = await this.repository.findOne({
        where: { conversationId },
      });
      
      if (!conversation) {
        this.logger.warn(`Conversation not found: ${conversationId}`);
      } else {
        this.logger.log(`Conversation found: ${conversationId}`);
      }
      
      return conversation;
    } catch (error) {
      this.logger.error(`Error finding conversation by ID: ${conversationId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async waitForAnswerOrTimeout(conversationId: string, userId: string, docflowNoticeId: string, timeoutMs: number = 30000): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 1000;
    const content = 'Desculpe, não conseguimos gerar uma resposta no momento.'

    while (Date.now() - startTime < timeoutMs) {
      const answer = await this.repository.findOne({ where: { conversationId: conversationId, sender: Sender.AI } });
      
      if (answer?.content && answer.content.trim() !== '') {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    await this.repository.update({ conversationId: conversationId, sender: Sender.AI }, {
      content,
    });

    this.gateway.sendAnswerChunk(
        userId,
        docflowNoticeId,
        await this.repository.findOne({ where: { conversationId: conversationId } }),
        true
    );

    this.logger.warn(`Timeout while waiting for conversationId: ${conversationId}`);
  }

  async clear(noticeId: string, userId: string): Promise<void> {
    try {
      this.logger.log(`Clearing conversations for notice: ${noticeId}, user: ${userId}`);
      
      const notice = await this.noticeService.getById(noticeId);
      const user = await this.userService.getById(userId);

      await this.repository.delete({ notice, user });
      this.logger.log(`Conversations cleared for notice: ${noticeId}, user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error clearing conversations: ${error.message}`, error.stack);
      throw error;
    }
  }
}