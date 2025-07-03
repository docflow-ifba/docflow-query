import { Module } from '@nestjs/common';
import { KafkaService } from './service/kafka.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConversationService } from './service/conversation.service';
import { ConversationController } from './controller/conversation.controller';
import { NoticeService } from './service/notice.service';
import { NoticeController } from './controller/notice.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice } from './entity/notice.entity';
import { Organization } from './entity/organization.entity';
import { User } from './entity/user.entity';
import { OrganizationService } from './service/organization.service';
import { OrganizationController } from './controller/organization.controller';
import { Conversation } from './entity/conversation.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { UserService } from './service/user.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { ConversationGateway } from './gateway/conversation.gateway';
import { UserController } from './controller/user.controller';

const entities = [User, Organization, Notice, Conversation]

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h' },
      }),
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: entities,
      synchronize: true, // apenas para dev, usar migrations em produção
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [
    KafkaService,
    ConversationService,
    NoticeService,
    OrganizationService,
    AuthService,
    UserService,
    JwtStrategy,
    ConversationGateway
  ],
  controllers: [AuthController, ConversationController, NoticeController, OrganizationController, UserController],
})
export class AppModule {}
