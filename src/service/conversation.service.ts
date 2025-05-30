import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import { NoticeService } from './notice.service';
import { AskQuestionMessageDTO } from 'src/dto/request/ask-question-message.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Sender } from 'src/enum/sender.enum';
import { Conversation } from 'src/entity/conversation.entity';
import { Message } from 'src/entity/message.entity';
import { User } from 'src/entity/user.entity';
import { Socket } from 'socket.io';
import { UserService } from './user.service';

interface HandleQuestionWSParams {
  noticeId: string;
  question: string;
  userId: string;
  socket: Socket;
}

@Injectable()
export class ConversationService {
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
    const { noticeId, question, userId, socket } = params;
    const notice = await this.noticeService.getById(noticeId);
    const user = await this.userService.getById(userId);

    const conversation = this.conversationRepository.create({ notice, user });
    await this.conversationRepository.save(conversation);

    const message = this.messageRepository.create({
      conversation,
      content: question,
      sender: Sender.USER,
    });
    await this.messageRepository.save(message);

    const questionMessage: AskQuestionMessageDTO = {
      question,
      docflow_notice_id: notice.docflowNoticeId,
      conversation_id: conversation.conversationId,
    };

    socket.data.conversationId = conversation.conversationId;

    const KAFKA_QUESTION_TOPIC = this.configService.get<string>('KAFKA_QUESTION_TOPIC');
    await this.kafkaService.sendMessage<AskQuestionMessageDTO>(KAFKA_QUESTION_TOPIC, questionMessage);
  }

  async create(noticeId: string, userId: string): Promise<Conversation> {
    const notice = await this.noticeService.getById(noticeId);
    const user = await this.userService.getById(userId);

    const conversation = this.conversationRepository.create({ notice, user });
    return this.conversationRepository.save(conversation);
  }
}
