import { Controller, Post, Body, Logger } from '@nestjs/common';
import { QuestionService } from '../service/question.service';

@Controller('v1/questions')
export class QuestionController {
  private readonly logger = new Logger(QuestionController.name);

  constructor(private readonly questionService: QuestionService) {}

  @Post()
  async ask(@Body() data: { question: string }) {
    this.logger.log(`Received question: ${data.question}`);
    try {
      const answer = await this.questionService.handleQuestion(data.question);
      this.logger.log(`Answer generated successfully`);
      return { answer };
    } catch (error) {
      this.logger.error(`Failed to handle question: ${error.message}`, error.stack);
      throw error;
    }
  }
}
