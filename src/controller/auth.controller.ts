import { Controller, Post, Body, Logger } from '@nestjs/common';
import { LoginDTO } from 'src/dto/request/login.dto';
import { RegisterDTO } from 'src/dto/request/register.dto';
import { AuthService } from 'src/service/auth.service';

@Controller('v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly service: AuthService) {}

  @Post('login')
  async login(@Body() loginDTO: LoginDTO) {
    try {
      this.logger.log(`Tentativa de login para email: ${loginDTO.email}`);
      const user = await this.service.validateUser(loginDTO.email, loginDTO.password);
      if (!user) {
        return { message: 'Credenciais inválidas' };
      }
      return await this.service.login(user);
    } catch (error) {
      this.logger.error(`Erro no endpoint login: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('register')
  async register(@Body() registerDTO: RegisterDTO) {
    try {
      this.logger.log(`Tentativa de registro para: ${JSON.stringify(registerDTO)}`);
      return await this.service.register(registerDTO.name, registerDTO.email, registerDTO.password);
    } catch (error) {
      this.logger.error(`Erro no endpoint register: ${error.message}`, error.stack);
      throw error;
    }
  }
}
