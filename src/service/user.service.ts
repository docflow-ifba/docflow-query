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
      this.logger.log(`Buscando usuário por email: ${email}`);
      return await this.repository.findOne({ where: { email } });
    } catch (error) {
      this.logger.error(`Erro ao buscar usuário: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createUser(name: string, email: string, password: string): Promise<User> {
    try {
      this.logger.log(`Criando usuário: ${email}`);
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = this.repository.create({ name, email, password: hashedPassword, role: UserRole.ADMIN }); // TODO
      return await this.repository.save(user);
    } catch (error) {
      this.logger.error(`Erro ao criar usuário: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      this.logger.log(`Validando usuário: ${email}`);
      const user = await this.findByEmail(email);
      if (!user) return null;

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return null;

      return user;
    } catch (error) {
      this.logger.error(`Erro ao validar usuário: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getById(id: string): Promise<User> {
    try {
      const user = await this.repository.findOne({ where: { userId: id } });
      if (!user) {
        this.logger.warn(`User not found with userId: ${id}`);
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`Failed to get user by ID: ${id}`, error.stack);
      throw error instanceof NotFoundException ? error : new InternalServerErrorException();
    }
  }
}
