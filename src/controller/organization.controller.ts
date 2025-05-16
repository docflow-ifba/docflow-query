import { Controller, Get, Query } from '@nestjs/common';
import { Organization } from 'src/entity/organization.entity';
import { OrganizationService } from 'src/service/organization.service';

@Controller('v1/organizations')
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Get()
  async find(@Query('query') query: string): Promise<Organization[]> {
    return this.service.find(query);
  }
}
