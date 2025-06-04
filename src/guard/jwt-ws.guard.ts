import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class JwtWsGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth?.token;

    if (!token) throw new WsException('Token not provided.');

    try {
      const payload = this.jwtService.verify(token.replace(/^Bearer\s+/i, ''));
      client.data.user = payload;
      return true;
    } catch (err) {
      throw new WsException('Token inválido');
    }
  }
}
