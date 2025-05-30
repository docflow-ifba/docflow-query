import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AskQuestionMessageDTO } from 'src/dto/request/ask-question-message.dto';
import { KafkaService } from './kafka.service';
import { NoticeService } from './notice.service';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Socket } from 'socket.io';
import { Conversation } from 'src/entity/conversation.entity';
import { Message } from 'src/entity/message.entity';
import { User } from 'src/entity/user.entity';
import { Sender } from 'src/enum/sender.enum';
import { UserService } from './user.service';
import { Notice } from 'src/entity/notice.entity';

interface HandleQuestionWSParams {
  noticeId: string;
  question: string;
  userId: string;
  socket: Socket;
  conversationId?: string;
}

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly noticeService: NoticeService,
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async handleQuestionWebSocket(params: HandleQuestionWSParams): Promise<void> {
    const { noticeId, question, userId, socket, conversationId } = params;

    const notice = await this.noticeService.getById(noticeId);
    const user = await this.userService.getById(userId);

    const conversation = conversationId
      ? await this.loadExistingConversation(conversationId, notice, user)
      : await this.createNewConversation(notice, user);

    const questionMessage = this.buildQuestionMessage(question, notice, conversation);

    await this.saveUserMessage(conversation, question);
    socket.data.conversationId = conversation.conversationId;

    this.sendMessage(questionMessage);
  }

  async sendMessage(questionMessage: AskQuestionMessageDTO) {
    const topic = this.configService.get<string>('KAFKA_QUESTION_TOPIC');
    await this.kafkaService.sendMessage<AskQuestionMessageDTO>(topic, questionMessage);
  }

  private async loadExistingConversation(conversationId: string, notice: Notice, user: User): Promise<Conversation> {
    return this.conversationRepository.findOneOrFail({
      where: { conversationId, notice, user },
      relations: ['messages'],
    });
  }

  private async createNewConversation(notice: Notice, user: User): Promise<Conversation> {
    const conversation = this.conversationRepository.create({ notice, user });
    return this.conversationRepository.save(conversation);
  }

  private buildQuestionMessage(question: string, notice: Notice, conversation: Conversation): AskQuestionMessageDTO {
    const baseMessage: AskQuestionMessageDTO = {
      question,
      docflow_notice_id: notice.docflowNoticeId,
      conversation_id: conversation.conversationId,
    };

    if (conversation.messages) {
      baseMessage.messages = conversation.messages.map(message => ({
        content: message.content,
        role: message.sender === Sender.USER ? 'user' : 'system',
      }));
    }

    return baseMessage;
  }

  private async saveUserMessage(conversation: Conversation, content: string): Promise<void> {
    const message = this.messageRepository.create({
      conversation,
      content,
      sender: Sender.USER,
    });
    await this.messageRepository.save(message);
  }

  async create(noticeId: string, userId: string): Promise<Conversation> {
    const notice = await this.noticeService.getById(noticeId);
    const user = await this.userService.getById(userId);

    const conversation = this.conversationRepository.create({ notice, user });
    return this.conversationRepository.save(conversation);
  }

  async find(noticeId: string, userId: string): Promise<Conversation[]> {
    try {
      const notice = await this.noticeService.getById(noticeId);
      const user = await this.userService.getById(userId);

      const conversations = await this.conversationRepository.find({
        where: { notice, user },
        relations: ['messages'],
        // order: { createdAt: 'DESC' },
      });
      return conversations;
    } catch (e) {
      this.logger.error(`Failed to find conversations: ${e.message}`, e);
    }
  }
}
