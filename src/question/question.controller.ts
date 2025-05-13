import { Controller, Post, Body } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionDto } from './dto/question.dto';

@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  async ask(@Body() data: QuestionDto) {
    const answer = await this.questionService.handleQuestion(data.question);
    return { answer };
  }
}
