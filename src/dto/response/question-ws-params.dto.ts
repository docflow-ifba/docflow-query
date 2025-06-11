import { Socket } from 'socket.io';
import { Notice } from 'src/entity/notice.entity';

export class QuestionWSParamsDTO {
  notice: Notice;
  prompt: string;
  userId: string;
  socket: Socket;
}