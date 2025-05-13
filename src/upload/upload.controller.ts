import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';
import { PdfUploadDto } from './dto/pdf-upload.dto';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  async uploadPdf(@Body() data: PdfUploadDto) {
    try {
      await this.uploadService.handleUpload(data);
      return { message: 'Enviado com sucesso ao Kafka' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
