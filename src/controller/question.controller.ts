import { Controller, Post, Body } from '@nestjs/common';
import { QuestionService } from '../service/question.service';

@Controller('v1/questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  async ask(@Body() data: { question: string }) {
    const answer = await this.questionService.handleQuestion(data.question);
    return { answer };
  }
}
