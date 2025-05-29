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

@Injectable()
export class ConversationService {
  constructor(
    private readonly noticeService: NoticeService,
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async handleQuestion(noticeId: string, question: string, user: User): Promise<string> {
    const notice = await this.noticeService.getById(noticeId);
    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    const conversation = this.conversationRepository.create({
      notice,
      user,
    });

    await this.conversationRepository.save(conversation);

    // const message = this.messageRepository.create({
    //   conversation,
    //   user,
    //   content: question,
    //   sender: Sender.USER,
    // });
    // await this.messageRepository.save(message);

    const questionMessage: AskQuestionMessageDTO = {
      question,
      docflow_notice_id: notice.docflowNoticeId,
      conversation_id: conversation.conversationId,
    };

    const KAFKA_QUESTION_TOPIC = this.configService.get<string>('KAFKA_QUESTION_TOPIC');
    await this.kafkaService.sendMessage<AskQuestionMessageDTO>(KAFKA_QUESTION_TOPIC, questionMessage);

    return 'Question sent successfully';
  }
}
