import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/entity/user.entity';
import { UserRole } from 'src/enum/user-role.enum';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    try {
      this.logger.log(`Finding user by email: ${email}`);
      const user = await this.repository.findOne({ where: { email } });
      
      if (user) {
        this.logger.log(`User found with email: ${email}`);
      } else {
        this.logger.log(`No user found with email: ${email}`);
      }
      
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createUser(name: string, email: string, password: string): Promise<User> {
    try {
      this.logger.log(`Creating new user: ${email}`);
      
      const hashedPassword = await bcrypt.hash(password, 10);
      this.logger.log(`Password hashed successfully for user: ${email}`);
      
      const user = this.repository.create({ 
        name, 
        email, 
        password: hashedPassword, 
        role: UserRole.ADMIN // TODO: Make this configurable
      });
      
      const savedUser = await this.repository.save(user);
      this.logger.log(`User created successfully with ID: ${savedUser.userId}`);
      
      return savedUser;
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      this.logger.log(`Validating credentials for user: ${email}`);
      
      const user = await this.findByEmail(email);
      if (!user) {
        this.logger.warn(`Validation failed: User not found: ${email}`);
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Validation failed: Invalid password for user: ${email}`);
        return null;
      }

      this.logger.log(`Credentials validated successfully for user: ${email}`);
      return user;
    } catch (error) {
      this.logger.error(`Error validating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getById(id: string): Promise<User> {
    try {
      this.logger.log(`Finding user by ID: ${id}`);
      
      const user = await this.repository.findOne({ where: { userId: id } });
      if (!user) {
        this.logger.warn(`User not found with ID: ${id}`);
        throw new NotFoundException('User not found');
      }
      
      this.logger.log(`User found with ID: ${id}`);
      return user;
    } catch (error) {
      this.logger.error(`Error retrieving user by ID ${id}: ${error.message}`, error.stack);
      throw error instanceof NotFoundException ? error : new InternalServerErrorException();
    }
  }
}