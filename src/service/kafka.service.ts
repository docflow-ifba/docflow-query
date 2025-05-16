import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, KafkaConfig, Producer, ProducerRecord } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaService implements OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private isConnected = false;
  private readonly logger = new Logger(KafkaService.name);

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS')?.split(',') ?? [];
    const clientId = this.configService.get<string>('KAFKA_CLIENT_ID') ?? 'default-client';

    const kafkaConfig: KafkaConfig = {
      clientId,
      brokers,
      retry: { retries: 5 },
      requestTimeout: 30_000,
    };

    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      maxInFlightRequests: 5,
      idempotent: true,
    });
  }

  private async connectIfNeeded() {
    if (!this.isConnected) {
      try {
        await this.producer.connect();
        this.isConnected = true;
        this.logger.log('Kafka producer connected');
      } catch (error) {
        this.logger.error('Failed to connect Kafka producer', error);
        throw error;
      }
    }
  }

  async sendMessage<T>(topic: string, data: T): Promise<void> {
    try {
      const message = JSON.stringify(data);
      const size = Buffer.byteLength(message, 'utf-8');

      if (size > 50 * 1024 * 1024) {
        throw new Error('Mensagem excede o limite de 50MB');
      }

      await this.connectIfNeeded();

      const record: ProducerRecord = {
        topic,
        messages: [{ value: message }],
        acks: -1,
        timeout: 30_000,
      };

      await this.producer.send(record);
      this.logger.debug(`Message sent to topic "${topic}"`);
    } catch (error) {
      this.logger.error(`Failed to send message to topic "${topic}"`, error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.producer.disconnect();
        this.logger.log('Kafka producer disconnected');
      } catch (error) {
        this.logger.error('Failed to disconnect Kafka producer', error);
      }
    }
  }
}
