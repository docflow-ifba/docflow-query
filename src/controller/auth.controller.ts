import { Controller, Post, Body, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginDTO } from 'src/dto/request/login.dto';
import { RegisterDTO } from 'src/dto/request/register.dto';
import { UserRole } from 'src/enum/user-role.enum';
import { AuthService } from 'src/service/auth.service';

@Controller('v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly service: AuthService) {}

  @Post('login')
  async login(@Body() loginDTO: LoginDTO) {
    try {
      this.logger.log(`Login attempt for email: ${loginDTO.email}`);
      const user = await this.service.validateUser(loginDTO.email, loginDTO.password);
      if (!user) {
        this.logger.warn(`Invalid credentials for email: ${loginDTO.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      this.logger.log(`Successful login for email: ${loginDTO.email}`);
      return await this.service.login(user);
    } catch (error) {
      this.logger.error(`Error in login endpoint: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('register')
  async register(@Body() registerDTO: RegisterDTO) {
    try {
      this.logger.log(`Registration attempt for email: ${registerDTO.email}`);
      const result = await this.service.register(registerDTO.name, registerDTO.email, registerDTO.password);
      this.logger.log(`Successful registration for email: ${registerDTO.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Error in register endpoint: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('register/admin')
  async registerAdmin(@Body() registerDTO: RegisterDTO) {
    try {
      this.logger.log(`Registration attempt for email: ${registerDTO.email}`);
      const result = await this.service.register(registerDTO.name, registerDTO.email, registerDTO.password, UserRole.ADMIN);
      this.logger.log(`Successful registration for email: ${registerDTO.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Error in register endpoint: ${error.message}`, error.stack);
      throw error;
    }
  }
}