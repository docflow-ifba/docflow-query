import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmbedNoticeResponseDTO } from 'src/dto/response/embed-notice-response.dto';
import { NoticeResponseDTO } from 'src/dto/response/notice-response.dto';
import { CreateNoticeRequestDTO } from '../dto/request/create-notice-request.dto';
import { Notice } from '../entity/notice.entity';
import { NoticeService } from '../service/notice.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';

@Controller('v1/notices')
export class NoticeController {
  private readonly logger = new Logger(NoticeController.name);

  constructor(
    private readonly noticeService: NoticeService, 
  ) {}

  @MessagePattern('docflow-embed-result')
  async handleEmbedResult(@Payload() payload: EmbedNoticeResponseDTO) {
    try {
      this.logger.log(`Received message from Kafka: ${payload.docflow_notice_id}`);
      await this.noticeService.handleEmbedResult(payload);
    } catch (error) {
      this.logger.warn(`Error processing message: ${error.message}`);
      throw error;
    }
  }
  
  @Post("embed/:id")
  @UseGuards(JwtAuthGuard)
  async embed(@Param('id') id: string): Promise<void> {
    try {
      this.logger.log(`Fetching notice with id: ${id}`);
      await this.noticeService.embed(id);
    } catch (error) {
      this.logger.warn(`Error embedding notice with id: ${id}`);
      throw error;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: CreateNoticeRequestDTO): Promise<Notice> {
    this.logger.log(`Creating notice with title: ${body.title}`);
    try {
      const notice = await this.noticeService.create(body);
      this.logger.log(`Notice created with ID: ${notice.noticeId}`);
      delete notice.pdfBase64
      return notice;
    } catch (error) {
      this.logger.error(`Failed to create notice: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getById(@Param('id') id: string): Promise<Notice> {
    this.logger.log(`Fetching notice with ID: ${id}`);
    try {
      return await this.noticeService.getById(id);
    } catch (error) {
      this.logger.warn(`Notice with ID ${id} not found`);
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async find(
    @Query('status') status?: string,
    @Query('title') title?: string,
    @Query('organizationId') organizationId?: string,
  ): Promise<NoticeResponseDTO[]> {
    this.logger.log(`Fetching notices with filters: ${JSON.stringify({ status, title, organizationId })}`);
    return this.noticeService.find({ status, title, organizationId });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateData: Partial<Notice>): Promise<Notice> {
    this.logger.log(`Updating notice with ID: ${id}`);
    try {
      const updated = await this.noticeService.update(id, updateData);
      this.logger.log(`Notice with ID ${id} updated`);
      return updated;
    } catch (error) {
      this.logger.warn(`Update failed for notice with ID ${id}`);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting notice with ID: ${id}`);
    try {
      await this.noticeService.delete(id);
      this.logger.log(`Notice with ID ${id} deleted`);
    } catch (error) {
      this.logger.warn(`Delete failed for notice with ID ${id}`);
      throw error;
    }
  }
}
