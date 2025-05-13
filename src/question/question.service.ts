import { Injectable } from '@nestjs/common';

@Injectable()
export class QuestionService {
  async handleQuestion(question: string): Promise<string> {
    // Aqui você pode integrar com seu sistema de embeddings / IA
    return `Você perguntou: "${question}". A resposta será aqui.`;
  }
}
