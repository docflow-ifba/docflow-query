import { Controller, Post, Body, Logger, UnauthorizedException, UseGuards } from '@nestjs/common';
import { LoginDTO } from 'src/dto/request/login.dto';
import { RegisterDTO } from 'src/dto/request/register.dto';
import { UserRole } from 'src/enum/user-role.enum';
import { AuthService } from 'src/service/auth.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { Roles } from 'src/decorator/roles.decorator';

@Controller('v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly service: AuthService) {}

  @Post('login')
  async login(@Body() loginDTO: LoginDTO) {
    const user = await this.service.validateUser(loginDTO.email, loginDTO.password);
    if (!user) {
      this.logger.warn(`Invalid credentials for email: ${loginDTO.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.service.login(user);
  }

  @Post('register')
  async register(@Body() registerDTO: RegisterDTO) {
    return this.service.register(registerDTO.name, registerDTO.email, registerDTO.password);
  }

  /** Only existing admins can register new admin accounts */
  @Post('register/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async registerAdmin(@Body() registerDTO: RegisterDTO) {
    return this.service.register(
      registerDTO.name,
      registerDTO.email,
      registerDTO.password,
      UserRole.ADMIN,
    );
  }
}