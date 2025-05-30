// conversation.gateway.ts
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ConversationService } from '../service/conversation.service';
import { JwtWsGuard } from 'src/guard/jwt-ws.guard';

@WebSocketGateway({ cors: true })
@UseGuards(JwtWsGuard)
export class ConversationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ConversationGateway.name);

  constructor(private readonly conversationService: ConversationService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('question')
  async handleQuestion(client: Socket, payload: { noticeId: string; question: string }) {
    const { noticeId, question } = payload;
    this.logger.log(`Received question: ${question} from ${client.id}`);
    const user = client.data.user;
    const userId = user.sub;

    await this.conversationService.handleQuestionWebSocket({
      noticeId,
      question,
      userId,
      socket: client,
    });
  }

  sendAnswerChunk(conversationId: string, chunk: string, done: boolean) {
    this.server.emit(conversationId, { answer_chunk: chunk, done });
  }
}
