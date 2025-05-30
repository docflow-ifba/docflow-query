import { Body, Controller, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { ConversationGateway } from '../gateway/conversation.gateway';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AskQuestionResponseDTO } from 'src/dto/response/ask-question-response.dto';
import { ConversationService } from 'src/service/conversation.service';
import { Conversation } from 'src/entity/conversation.entity';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { Request } from 'express';

@Controller('v1/conversations')
export class ConversationController {
  private readonly logger = new Logger(ConversationController.name);
  
  constructor(
    private readonly service: ConversationService,
    private readonly gateway: ConversationGateway,
  ) {}

  @MessagePattern('docflow-answer')
  async handleEmbedResult(@Payload() payload: AskQuestionResponseDTO) {
    try {
      this.gateway.sendAnswerChunk(
        payload.conversation_id,
        payload.answer_chunk,
        payload.done,
      );
    } catch (error) {
      this.logger.warn(`Error processing message: ${error.message}`);
      throw error;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: Request, @Body() noticeId: string): Promise<Conversation> {
    this.logger.log(`Creating conversation with noticeId: ${noticeId}`);
    try {
      const user = req.user as { userId: string };
      const conversation = await this.service.create(noticeId, user.userId);
      this.logger.log(`Notice created with ID: ${conversation.conversationId}`);
      return conversation;
    } catch (error) {
      this.logger.error(`Failed to create conversation: ${error.message}`, error.stack);
      throw error;
    }
  }
}
