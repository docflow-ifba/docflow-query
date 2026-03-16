import { Body, Controller, Get, Logger, Param, Put, UseGuards } from '@nestjs/common';
import { UserService } from 'src/service/user.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';

@Controller('v1/users')
@UseGuards(JwtAuthGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly service: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() body: { name: string; email: string }) {
    return this.service.update(id, body);
  }
}