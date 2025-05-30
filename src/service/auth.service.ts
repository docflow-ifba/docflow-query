import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { User } from 'src/entity/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      return await this.userService.validateUser(email, password);
    } catch (error) {
      this.logger.error(`Erro na validação do usuário: ${error.message}`, error.stack);
      throw error;
    }
  }

  async login(user: User) {
    try {
      const payload = { sub: user.userId, email: user.email, role: user.role };
      this.logger.log(`Gerando token JWT para usuário: ${user.email}`);
      return {
        token: this.jwtService.sign(payload),
        user
      };
    } catch (error) {
      this.logger.error(`Erro no login: ${error.message}`, error.stack);
      throw new UnauthorizedException('Falha no login');
    }
  }

  async register(name: string, email: string, password: string) {
    try {
      const existingUser = await this.userService.findByEmail(email);
      if (existingUser) {
        throw new UnauthorizedException('Usuário já existe');
      }
      const user = await this.userService.createUser(name, email, password);
      return this.login(user);
    } catch (error) {
      this.logger.error(`Erro no registro: ${error.message}`, error.stack);
      throw error;
    }
  }
}
