import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from '../entity/notice.entity';
import { CreateNoticeRequestDTO } from '../dto/request/create-notice-request.dto';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import { uuidv7 } from 'uuidv7';
import { CreateNoticeMessageDTO } from 'src/dto/request/create-notice-message.dto';
import { NoticeResponseDTO } from 'src/dto/response/notice-response.dto';

@Injectable()
export class NoticeService {
  private readonly logger = new Logger(NoticeService.name);

  constructor(
    @InjectRepository(Notice)
    private readonly repository: Repository<Notice>,
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
  ) {}

  async embed(docflowNoticeId: string): Promise<void> {
    try {
      const TOPIC = this.configService.get<string>('KAFKA_TOPIC');
      const notice = await this.getByDocflowNoticeId(docflowNoticeId);

      const message: CreateNoticeMessageDTO = {
        title: notice.title,
        pdf_base64: notice.pdfBase64,
        docflowNoticeId,
      };

      this.logger.log(`Sending message to Kafka (topic: ${TOPIC})`);
      await this.kafkaService.sendMessage<CreateNoticeMessageDTO>(TOPIC, message);
    } catch (error) {
      this.logger.error(`Failed to embed notice: ${docflowNoticeId}`, error.stack);
      throw new InternalServerErrorException('Failed to embed notice');
    }
  }

  async create(data: CreateNoticeRequestDTO): Promise<Notice> {
    try {
      const DOCFLOW_NOTICE_ID = uuidv7();
      const noticeEntity = this.repository.create({
        ...data,
        docflowNoticeId: DOCFLOW_NOTICE_ID,
      });

      const savedNotice = await this.repository.save(noticeEntity);
      this.logger.log(`Notice created with ID: ${savedNotice.noticeId}`);
      return savedNotice;
    } catch (error) {
      this.logger.error('Failed to create notice', error.stack);
      throw new InternalServerErrorException('Failed to create notice');
    }
  }

  private async getByDocflowNoticeId(id: string): Promise<Notice> {
    try {
      const notice = await this.repository.findOne({ where: { docflowNoticeId: id } });
      if (!notice) {
        this.logger.warn(`Notice not found with docflowNoticeId: ${id}`);
        throw new NotFoundException('Notice not found');
      }
      return notice;
    } catch (error) {
      this.logger.error(`Failed to get notice by docflowNoticeId: ${id}`, error.stack);
      throw error instanceof NotFoundException ? error : new InternalServerErrorException();
    }
  }

  async getById(id: string): Promise<Notice> {
    try {
      const notice = await this.repository.findOne({ where: { noticeId: id } });
      if (!notice) {
        this.logger.warn(`Notice not found with noticeId: ${id}`);
        throw new NotFoundException('Notice not found');
      }
      return notice;
    } catch (error) {
      this.logger.error(`Failed to get notice by ID: ${id}`, error.stack);
      throw error instanceof NotFoundException ? error : new InternalServerErrorException();
    }
  }

  async find(filters: {
    status?: string;
    title?: string;
    organizationId?: string;
  }): Promise<NoticeResponseDTO[]> {
    try {
      const qb = this.repository.createQueryBuilder('notice')
        .leftJoinAndSelect('notice.organization', 'organization')
        .select([
          'notice.noticeId',
          'notice.docflowNoticeId',
          'notice.title',
          'notice.deadline',
          'notice.organizationId',
          'notice.views',
          'notice.status',
        ]);

      if (filters.status) {
        qb.andWhere('notice.status = :status', { status: filters.status });
      }

      if (filters.organizationId) {
        qb.andWhere('notice.organizationId = :organizationId', { organizationId: filters.organizationId });
      }

      if (filters.title) {
        qb.andWhere('notice.title ILIKE :title', { title: `%${filters.title}%` });
      }

      return await qb.getMany();
    } catch (error) {
      this.logger.error('Failed to find notices with filters', error.stack);
      throw new InternalServerErrorException('Failed to retrieve notices');
    }
  }

  async update(id: string, updateData: Partial<Notice>): Promise<Notice> {
    try {
      const notice = await this.getById(id);
      Object.assign(notice, updateData);
      const updated = await this.repository.save(notice);
      this.logger.log(`Notice updated: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update notice: ${id}`, error.stack);
      throw new InternalServerErrorException('Failed to update notice');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.repository.delete(id);
      if (result.affected === 0) {
        this.logger.warn(`Notice not found for deletion: ${id}`);
        throw new NotFoundException('Notice not found');
      }
      this.logger.log(`Notice deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete notice: ${id}`, error.stack);
      throw error instanceof NotFoundException ? error : new InternalServerErrorException();
    }
  }
}
