import { KafkaOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export function getKafkaConfig(configService: ConfigService): KafkaOptions {
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('KAFKA_CLIENT_ID'),
        brokers: [configService.get('KAFKA_BROKER')],
      },
      consumer: {
        groupId: configService.get('KAFKA_GROUP_ID'),
      },
    },
  };
}
