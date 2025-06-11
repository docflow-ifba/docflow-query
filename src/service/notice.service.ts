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
import { EmbedNoticeResponseDTO } from 'src/dto/response/embed-notice-response.dto';
import { NoticeStatus } from 'src/enum/notice-status.enum';
import { NoticeTable } from 'src/entity/notice-table.entity';

@Injectable()
export class NoticeService {
  private readonly logger = new Logger(NoticeService.name);

  constructor(
    @InjectRepository(Notice)
    private readonly repository: Repository<Notice>,
    @InjectRepository(NoticeTable)
    private readonly tableRepository: Repository<NoticeTable>,
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
  ) {}

  async handleEmbedResult(payload: EmbedNoticeResponseDTO) {
    try {
      this.logger.log(`Processing embed result for notice: ${payload.docflow_notice_id}`);
      
      const notice = await this.getByDocflowNoticeId(payload.docflow_notice_id);

      if(notice.status === NoticeStatus.ERROR || payload.error) {
        this.logger.error(`Embed error for notice ${payload.docflow_notice_id}: ${payload.error}`);
        notice.status = NoticeStatus.ERROR;
        await this.repository.save(notice);
        throw new InternalServerErrorException(`Embed error: ${payload.error}`);
      }

      notice.contentMarkdown = payload.content_md;
      notice.cleanMarkdown = payload.clean_md;
      notice.status = NoticeStatus.PROCESSED;

      if(payload.tables_md && payload.tables_md.length > 0) {
        this.logger.log(`Processing ${payload.tables_md.length} tables for notice: ${notice.noticeId}`);
        
        for (const table of payload.tables_md) {
          const tableEntity = this.tableRepository.create({
            content: table,
            notice,
          });
          await this.tableRepository.save(tableEntity);
        }
        this.logger.log(`Tables saved successfully for notice: ${notice.noticeId}`);
      }

      await this.repository.save(notice);
      this.logger.log(`Notice updated successfully with embedded content: ${notice.noticeId}`);
    } catch (error) {
      this.logger.error(`Failed to handle embed result for notice: ${payload.docflow_notice_id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to handle embed result');
    }
  }

  async embed(id: string): Promise<void> {
    try {
      this.logger.log(`Starting embed process for notice: ${id}`);
      
      const TOPIC = this.configService.get<string>('KAFKA_EMBED_TOPIC');
      const notice = await this.getById(id);

      const message: CreateNoticeMessageDTO = {
        pdf_base64: notice.pdfBase64.split(',')[1],
        docflow_notice_id: notice.docflowNoticeId,
      };

      this.logger.log(`Sending notice to embedding service via Kafka (topic: ${TOPIC})`);
      await this.kafkaService.sendMessage<CreateNoticeMessageDTO>(TOPIC, message);

      notice.status = NoticeStatus.PROCESSING;
      await this.repository.save(notice);
      
      this.logger.log(`Notice status updated to PROCESSING: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to embed notice ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to embed notice');
    }
  }

  async create(data: CreateNoticeRequestDTO): Promise<Notice> {
    try {
      this.logger.log(`Creating new notice with title: ${data.title}`);
      
      const DOCFLOW_NOTICE_ID = uuidv7();
      this.logger.log(`Generated docflow notice ID: ${DOCFLOW_NOTICE_ID}`);
      
      const noticeEntity = this.repository.create({ 
        ...data, 
        organization: data.organization,
        docflowNoticeId: DOCFLOW_NOTICE_ID 
      });
      
      const savedNotice = await this.repository.save(noticeEntity);
      this.logger.log(`Notice created successfully with ID: ${savedNotice.noticeId}`);
      
      return savedNotice;
    } catch (error) {
      this.logger.error(`Failed to create notice: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create notice');
    }
  }

  private async getByDocflowNoticeId(id: string): Promise<Notice> {
    try {
      this.logger.log(`Finding notice by docflow ID: ${id}`);
      
      const notice = await this.repository.findOne({ where: { docflowNoticeId: id } });
      if (!notice) {
        this.logger.warn(`Notice not found with docflow ID: ${id}`);
        throw new NotFoundException('Notice not found');
      }
      
      this.logger.log(`Notice found with docflow ID: ${id}`);
      return notice;
    } catch (error) {
      this.logger.error(`Error retrieving notice by docflow ID ${id}: ${error.message}`, error.stack);
      throw error instanceof NotFoundException ? error : new InternalServerErrorException();
    }
  }

  async getById(id: string): Promise<Notice> {
    try {
      this.logger.log(`Finding notice by ID: ${id}`);
      
      const notice = await this.repository.findOne({ where: { noticeId: id } });
      if (!notice) {
        this.logger.warn(`Notice not found with ID: ${id}`);
        throw new NotFoundException('Notice not found');
      }
      
      this.logger.log(`Notice found with ID: ${id}`);
      return notice;
    } catch (error) {
      this.logger.error(`Error retrieving notice by ID ${id}: ${error.message}`, error.stack);
      throw error instanceof NotFoundException ? error : new InternalServerErrorException();
    }
  }

  async find(filters: {
    status?: string;
    title?: string;
    organizationId?: string;
    isEmbeded?: boolean;
  }): Promise<NoticeResponseDTO[]> {
    try {
      this.logger.log(`Finding notices with filters: ${JSON.stringify(filters)}`);
      
      const qb = this.repository.createQueryBuilder('notice')
        .leftJoinAndSelect('notice.organization', 'organization')
        .select([
          'notice.noticeId',
          'notice.docflowNoticeId',
          'notice.title',
          'notice.deadline',
          'notice.status',
          'organization',
        ]);

      if (filters.status) {
        qb.andWhere('notice.status = :status', { status: filters.status });
      }

      if (filters.organizationId) {
        qb.andWhere('organization.organizationId = :organizationId', {
          organizationId: filters.organizationId,
        });
      }

      if (filters.title) {
        qb.andWhere('notice.title ILIKE :title', { title: `%${filters.title}%` });
      }

      if (filters.isEmbeded !== undefined) {
        qb.andWhere('notice.status = :status', { status: NoticeStatus.PROCESSED });
      }

      const notices = await qb.getMany();
      this.logger.log(`Found ${notices.length} notices matching filters`);
      
      return notices;
    } catch (error) {
      this.logger.error(`Failed to find notices: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve notices');
    }
  }

  async update(id: string, updateData: Partial<Notice>): Promise<Notice> {
    try {
      this.logger.log(`Updating notice with ID: ${id}`);
      
      const notice = await this.getById(id);
      Object.assign(notice, updateData);
      
      const updated = await this.repository.save(notice);
      this.logger.log(`Notice updated successfully: ${id}`);
      
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update notice ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update notice');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      this.logger.log(`Deleting notice with ID: ${id}`);
      
      const result = await this.repository.delete(id);
      if (result.affected === 0) {
        this.logger.warn(`Notice not found for deletion: ${id}`);
        throw new NotFoundException('Notice not found');
      }
      
      this.logger.log(`Notice deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete notice ${id}: ${error.message}`, error.stack);
      throw error instanceof NotFoundException ? error : new InternalServerErrorException();
    }
  }
}