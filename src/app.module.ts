import { Module } from '@nestjs/common';
import { KafkaService } from './kafka/kafka.service';
import { UploadModule } from './upload/upload.module';
import { QuestionModule } from './question/question.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    UploadModule, 
    QuestionModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [KafkaService],
})
export class AppModule {}
