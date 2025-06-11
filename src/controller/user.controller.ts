import { Body, Controller, Get, Logger, Param, Put } from '@nestjs/common';
import { UserService } from 'src/service/user.service';

@Controller('v1/users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly service: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    try {
      this.logger.log(`Fetching user with ID: ${id}`);
      return await this.service.getById(id);
    } catch (error) {
      this.logger.error(`Error fetching user with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  async createAdmin(@Param('id') id: string, @Body() body: { name: string; email: string }) {
    try {
      this.logger.log(`Updating user with ID: ${id}`);
      return await this.service.update(id, body);
    } catch (error) {
      this.logger.error(`Error in login endpoint: ${error.message}`, error.stack);
      throw error;
    }
  }
}