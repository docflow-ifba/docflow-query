import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, Logger, UseGuards } from '@nestjs/common';
import { ConversationService } from '../service/conversation.service';
import { JwtWsGuard } from 'src/guard/jwt-ws.guard';
import { Conversation } from 'src/entity/conversation.entity';
import { JwtService } from '@nestjs/jwt';
import { NoticeService } from 'src/service/notice.service';

@WebSocketGateway({ cors: true })
@UseGuards(JwtWsGuard)
export class ConversationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ConversationGateway.name);

  constructor(
    @Inject(forwardRef(() => ConversationService))
    private readonly conversationService: ConversationService,
    private readonly noticeService: NoticeService,
    private readonly jwtService: JwtService
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized successfully');
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      this.logger.warn(`Connection attempt rejected: Missing authentication token for client ${client.id}`);
      client.disconnect();
      return;
    }

    try {
      const tokenValue = token.replace(/^Bearer\s+/i, '');
      const payload = this.jwtService.verify(tokenValue);
      client.data.user = payload;
      
      await client.join(payload.sub);
      this.logger.log(`Client connected: ${client.id} (userId: ${payload.sub})`);
    } catch (err) {
      this.logger.error(`Authentication failed: Invalid token for client ${client.id}`, err.stack);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const user = client.data.user;
      const userId = user?.sub;

      if (userId) {
        await client.leave(userId);
        this.logger.log(`Client disconnected: ${client.id} (userId: ${userId})`);
      } else {
        this.logger.log(`Client disconnected: ${client.id} (unauthenticated)`);
      }
    } catch (error) {
      this.logger.error(`Error during client disconnect: ${error.message}`, error.stack);
    }
  }

  @SubscribeMessage('question')
  async handleQuestion(client: Socket, payload: { noticeId: string; prompt: string }) {
    try {
      const { noticeId, prompt } = payload;
      const user = client.data.user;
      const userId = user.sub;

      this.logger.log(`Received question from user ${userId} for notice ${noticeId}: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
      
      const notice = await this.noticeService.getById(noticeId);
      const question = await this.conversationService.handleQuestionWebSocket({
        notice,
        prompt,
        userId,
        socket: client,
      });
      
      this.server.to(userId).emit(notice.docflowNoticeId, { conversation: question, done: true });
      this.logger.log(`Question processing initiated for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error processing question: ${error.message}`, error.stack);
      client.emit('error', { message: 'Failed to process your question. Please try again.' });
    }
  }

  sendAnswerChunk(userId: string, docflowNoticeId: string, conversation: Conversation, done: boolean) {
    try {
      this.logger.log(`Sending ${done ? 'final' : 'partial'} answer chunk to user ${userId} for notice ${docflowNoticeId}`);
      this.server.to(userId).emit(docflowNoticeId, { conversation, done });
    } catch (error) {
      this.logger.error(`Failed to send answer chunk to user ${userId}: ${error.message}`, error.stack);
    }
  }
}