import { Body, Controller, Get, Logger, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
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
  ) {}

  @MessagePattern('docflow-answer')
  async handleEmbedResult(@Payload() payload: AskQuestionResponseDTO) {
    try {
      this.logger.log(`Processing docflow-answer message for conversation: ${payload.answer_conversation_id || 'unknown'}`);
      await this.service.handleEmbedResult(payload);
      this.logger.log(`Successfully processed docflow-answer message`);
    } catch (error) {
      this.logger.error(`Error processing docflow-answer message: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async find(
    @Req() req: Request,
    @Query('noticeId') noticeId: string,
  ): Promise<Conversation[]> {
    try {
      const user = req.user as { userId: string };
      this.logger.log(`Fetching conversations for user: ${user.userId}, noticeId: ${noticeId || 'all'}`);
      const conversations = await this.service.find(noticeId, user.userId);
      this.logger.log(`Found ${conversations.length} conversations for user: ${user.userId}`);
      return conversations;
    } catch (error) {
      this.logger.error(`Failed to find conversations: ${error.message}`, error.stack);
      throw error;
    }
  }
}