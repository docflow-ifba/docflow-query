import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { User } from 'src/entity/user.entity';
import { UserRole } from 'src/enum/user-role.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      this.logger.log(`Validating user credentials for: ${email}`);
      const user = await this.userService.validateUser(email, password);
      if (user) {
        this.logger.log(`User validation successful for: ${email}`);
      } else {
        this.logger.warn(`User validation failed for: ${email}`);
      }
      return user;
    } catch (error) {
      this.logger.error(`User validation error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async login(user: User) {
    try {
      const payload = { sub: user.userId, email: user.email, role: user.role };
      this.logger.log(`Generating JWT token for user: ${user.email}`);
      const token = this.jwtService.sign(payload);
      this.logger.log(`Login successful for user: ${user.email}`);
      return {
        token,
        user
      };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Login failed');
    }
  }

  async register(name: string, email: string, password: string, role: UserRole = UserRole.USER) {
    try {
      this.logger.log(`Processing registration request for: ${email}`);
      const existingUser = await this.userService.findByEmail(email);
      if (existingUser) {
        this.logger.warn(`Registration failed: User already exists: ${email}`);
        throw new UnauthorizedException('User already exists');
      }
      
      this.logger.log(`Creating new user account for: ${email}`);
      const user = await this.userService.createUser(name, email, password, role);
      this.logger.log(`User registered successfully: ${email}`);
      return this.login(user);
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`, error.stack);
      throw error;
    }
  }
}