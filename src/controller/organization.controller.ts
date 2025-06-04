import { Body, Controller, Get, Post, Query, Logger, UseGuards, Param, Put, Delete } from '@nestjs/common';
import { CreateOrganizationDTO } from 'src/dto/request/create-organization-request.dto';
import { Organization } from 'src/entity/organization.entity';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { OrganizationService } from 'src/service/organization.service';

@Controller('v1/organizations')
export class OrganizationController {
  private readonly logger = new Logger(OrganizationController.name);

  constructor(private readonly service: OrganizationService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async find(@Query('query') query: string): Promise<Organization[]> {
    this.logger.log(`Searching for organizations with query: ${query || 'all'}`);
    try {
      const organizations = await this.service.find(query);
      this.logger.log(`Found ${organizations.length} organizations matching query`);
      return organizations;
    } catch (error) {
      this.logger.error(`Failed to fetch organizations: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getById(@Param('id') id: string): Promise<Organization> {
    this.logger.log(`Fetching organization with ID: ${id}`);
    try {
      const organization = await this.service.getById(id);
      this.logger.log(`Successfully retrieved organization with ID: ${id}`);
      return organization;
    } catch (error) {
      this.logger.error(`Organization with ID ${id} not found: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateOrganizationDTO): Promise<Organization> {
    this.logger.log(`Creating organization with name: ${dto.name}`);
    try {
      const org = await this.service.create(dto);
      this.logger.log(`Organization created successfully with ID: ${org.organizationId}`);
      return org;
    } catch (error) {
      this.logger.error(`Failed to create organization: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateData: Partial<Organization>): Promise<Organization> {
    this.logger.log(`Updating organization with ID: ${id}`);
    try {
      const updated = await this.service.update(id, updateData);
      this.logger.log(`Organization with ID ${id} updated successfully`);
      return updated;
    } catch (error) {
      this.logger.error(`Update failed for organization with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting organization with ID: ${id}`);
    try {
      await this.service.delete(id);
      this.logger.log(`Organization with ID ${id} deleted successfully`);
    } catch (error) {
      this.logger.error(`Delete failed for organization with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}