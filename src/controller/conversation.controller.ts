import { Controller, Get, Logger, Param, Query, Request, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AnswerResponseDTO } from 'src/dto/response/answer-response.dto';
import { ConversationService } from '../service/conversation.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';

@Controller('v1/conversations')
export class ConversationController {
  private readonly logger = new Logger(ConversationController.name);

  constructor(private readonly service: ConversationService) {}

  @MessagePattern('docflow-answer')
  async handleEmbedResult(@Payload() payload: any) {
    try {
      console.log(`\n\n\n\n\n\nReceived answer: ${JSON.stringify(payload)}`);
    } catch (error) {
      this.logger.warn(`Error processing message: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("ask/:noticeId")
  async ask(
    @Request() req,
    @Param('noticeId') noticeId: string,
    @Query('question') question?: string,
  ) {
    this.logger.log(`Received question: ${question}`);
    try {
      const answer = await this.service.handleQuestion(noticeId, question, req.user.userId);
      this.logger.log(`Answer generated successfully`);
      return { answer };
    } catch (error) {
      this.logger.error(`Failed to handle question: ${error.message}`, error.stack);
      throw error;
    }
  }
}
