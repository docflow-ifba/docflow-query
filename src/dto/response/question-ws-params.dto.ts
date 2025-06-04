import { Socket } from 'socket.io';

export class QuestionWSParamsDTO {
  noticeId: string;
  prompt: string;
  userId: string;
  socket: Socket;
}