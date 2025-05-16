import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { NoticeService } from '../service/notice.service';
import { CreateNoticeRequestDTO } from '../dto/request/create-notice-request.dto';
import { Notice } from '../entity/notice.entity';
import { NoticeResponseDTO } from 'src/dto/response/notice-response.dto';

@Controller('v1/notices')
export class NoticeController {
  private readonly logger = new Logger(NoticeController.name);

  constructor(private readonly noticeService: NoticeService) {}

  @Post()
  async create(@Body() body: CreateNoticeRequestDTO): Promise<void> {
    this.logger.log(`Creating notice with title: ${body.title}`);
    const notice = await this.noticeService.create(body);
    this.logger.log(`Notice created with ID: ${notice.noticeId}`);
  }

  @Get(':id')
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
  async find(
    @Query('status') status?: string,
    @Query('title') title?: string,
    @Query('organizationId') organizationId?: string,
  ): Promise<NoticeResponseDTO[]> {
    this.logger.log(`Fetching notices with filters: ${JSON.stringify({ status, title, organizationId })}`);
    return this.noticeService.find({ status, title, organizationId });
  }

  @Patch(':id')
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
