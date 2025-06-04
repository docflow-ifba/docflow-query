import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOrganizationDTO } from 'src/dto/request/create-organization-request.dto';
import { Organization } from 'src/entity/organization.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
  ) {}

  async find(query?: string): Promise<Organization[]> {
    try {
      this.logger.log(`Finding organizations with query: ${query || 'all'}`);
      
      const qb = this.repository
        .createQueryBuilder('organization')
        .limit(10);

      if (query) {
        qb.where('LOWER(organization.name) LIKE :query', {
          query: `%${query.toLowerCase()}%`,
        });
      }

      const organizations = await qb.getMany();
      this.logger.log(`Found ${organizations.length} organizations`);
      
      return organizations;
    } catch (error) {
      this.logger.error(`Failed to find organizations: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve organizations');
    }
  }

  async create(dto: CreateOrganizationDTO): Promise<Organization> {
    try {
      this.logger.log(`Creating organization with name: ${dto.name}`);
      
      const organization = this.repository.create(dto);
      const saved = await this.repository.save(organization);
      
      this.logger.log(`Organization created successfully with ID: ${saved.organizationId}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create organization: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create organization');
    }
  }

  async getById(id: string): Promise<Organization> {
    try {
      this.logger.log(`Finding organization by ID: ${id}`);
      
      const organization = await this.repository.findOne({ where: { organizationId: id } });
      if (!organization) {
        this.logger.warn(`Organization not found with ID: ${id}`);
        throw new NotFoundException('Organization not found');
      }
      
      this.logger.log(`Organization found with ID: ${id}`);
      return organization;
    } catch (error) {
      this.logger.error(`Error retrieving organization by ID ${id}: ${error.message}`, error.stack);
      throw error instanceof NotFoundException ? error : new InternalServerErrorException();
    }
  }

  async update(id: string, updateData: Partial<Organization>): Promise<Organization> {
    try {
      this.logger.log(`Updating organization with ID: ${id}`);
      
      const organization = await this.getById(id);
      Object.assign(organization, updateData);
      
      const updated = await this.repository.save(organization);
      this.logger.log(`Organization updated successfully: ${id}`);
      
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update organization ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update organization');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      this.logger.log(`Deleting organization with ID: ${id}`);
      
      const result = await this.repository.delete(id);
      if (result.affected === 0) {
        this.logger.warn(`Organization not found for deletion: ${id}`);
        throw new NotFoundException('Organization not found');
      }
      
      this.logger.log(`Organization deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete organization ${id}: ${error.message}`, error.stack);
      throw error instanceof NotFoundException ? error : new InternalServerErrorException();
    }
  }
}