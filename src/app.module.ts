import { Module } from '@nestjs/common';
import { KafkaService } from './service/kafka.service';
import { ConfigModule } from '@nestjs/config';
import { QuestionService } from './service/question.service';
import { QuestionController } from './controller/question.controller';
import { NoticeService } from './service/notice.service';
import { NoticeController } from './controller/notice.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table } from 'typeorm';
import { Notice } from './entity/notice.entity';
import { Organization } from './entity/organization.entity';
import { User } from './entity/user.entity';
import { OrganizationService } from './service/organization.service';
import { OrganizationController } from './controller/organization.controller';
import { NoticeTable } from './entity/notice-table.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [User, Organization, Notice, Table, NoticeTable],
      synchronize: true, // apenas para dev, usar migrations em produção
    }),
    TypeOrmModule.forFeature([User, Organization, Notice, Table, NoticeTable]),
  ],
  providers: [KafkaService, QuestionService, NoticeService, OrganizationService],
  controllers: [QuestionController, NoticeController, OrganizationController],
})
export class AppModule {}
