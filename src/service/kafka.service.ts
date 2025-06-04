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
    const brokers = this.configService.get<string>('KAFKA_BROKER')?.split(',') ?? [];
    const clientId = this.configService.get<string>('KAFKA_CLIENT_ID');

    const kafkaConfig: KafkaConfig = {
      clientId,
      brokers,
      retry: { retries: 5 },
      requestTimeout: 30_000,
    };

    this.logger.log(`Initializing Kafka with client ID: ${clientId}, brokers: ${brokers.join(',')}`);
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
        this.logger.log('Connecting to Kafka...');
        await this.producer.connect();
        this.isConnected = true;
        this.logger.log('Kafka producer connected successfully');
      } catch (error) {
        this.logger.error('Failed to connect Kafka producer', error.stack);
        throw error;
      }
    }
  }

  async sendMessage<T>(topic: string, data: T): Promise<void> {
    try {
      const message = JSON.stringify(data);
      const size = Buffer.byteLength(message, 'utf-8');

      if (size > 50 * 1024 * 1024) {
        this.logger.error(`Message size (${size} bytes) exceeds 50MB limit`);
        throw new Error('Message exceeds the 50MB limit');
      }

      await this.connectIfNeeded();

      const record: ProducerRecord = {
        topic,
        messages: [{ value: message }],
        acks: -1,
        timeout: 30_000,
      };

      this.logger.log(`Sending message to topic "${topic}" (size: ${(size / 1024).toFixed(2)} KB)`);
      await this.producer.send(record);
      this.logger.log(`Message successfully sent to topic "${topic}"`);
    } catch (error) {
      this.logger.error(`Failed to send message to topic "${topic}": ${error.message}`, error.stack);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.isConnected) {
      try {
        this.logger.log('Disconnecting Kafka producer...');
        await this.producer.disconnect();
        this.logger.log('Kafka producer disconnected successfully');
      } catch (error) {
        this.logger.error('Failed to disconnect Kafka producer', error.stack);
      }
    }
  }
}