import { Body, Controller, Get, Post, Query, Logger } from '@nestjs/common';
import { CreateOrganizationDTO } from 'src/dto/request/create-organization-request.dto';
import { Organization } from 'src/entity/organization.entity';
import { OrganizationService } from 'src/service/organization.service';

@Controller('v1/organizations')
export class OrganizationController {
  private readonly logger = new Logger(OrganizationController.name);

  constructor(private readonly service: OrganizationService) {}

  @Get()
  async find(@Query('query') query: string): Promise<Organization[]> {
    this.logger.log(`Searching for organizations with query: ${query}`);
    try {
      return await this.service.find(query);
    } catch (error) {
      this.logger.error(`Failed to fetch organizations: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post()
  async create(@Body() dto: CreateOrganizationDTO): Promise<Organization> {
    this.logger.log(`Creating organization with name: ${dto.name}`);
    try {
      const org = await this.service.create(dto);
      this.logger.log(`Organization created with ID: ${org.organizationId}`);
      return org;
    } catch (error) {
      this.logger.error(`Failed to create organization: ${error.message}`, error.stack);
      throw error;
    }
  }
}
