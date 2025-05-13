import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaService implements OnModuleDestroy {
  private kafka;
  private producer;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS').split(',');
    const clientId = this.configService.get<string>('KAFKA_CLIENT_ID');

    this.kafka = new Kafka({
      clientId,
      brokers,
      retry: { retries: 5 },
      requestTimeout: 30000,
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      maxInFlightRequests: 5,
      idempotent: true,
    });
  }

  async sendMessage(topic: string, message: string) {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
    }

    await this.producer.send({
      topic,
      messages: [{ value: message }],
      acks: -1,
      timeout: 30000,
    });
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.producer.disconnect();
    }
  }
}
