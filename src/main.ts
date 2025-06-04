import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { GlobalExceptionHandler } from './config/global-exception-handler';
import { ConfigService } from '@nestjs/config';
import { getKafkaConfig } from './config/kafka.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const kafkaConfig = getKafkaConfig(configService);
  app.connectMicroservice(kafkaConfig);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new GlobalExceptionHandler());

  await app.startAllMicroservices();
  await app.listen(3001);
  console.log('🚀 Servidor rodando em http://localhost:3001');
}
bootstrap();
