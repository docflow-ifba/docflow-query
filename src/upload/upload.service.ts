import { Injectable } from '@nestjs/common';
import { PdfUploadDto } from './dto/pdf-upload.dto';
import { KafkaService } from '../kafka/kafka.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
  ) {}

  async handleUpload(data: PdfUploadDto) {
    const message = JSON.stringify(data);
    const size = Buffer.byteLength(message, 'utf-8');

    if (size > 50 * 1024 * 1024) {
      throw new Error('Mensagem excede o limite de 50MB');
    }

    const topic = this.configService.get<string>('KAFKA_TOPIC');
    await this.kafkaService.sendMessage(topic, message);
  }
}
