import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOrganizationDTO } from 'src/dto/request/create-organization-request.dto';
import { Organization } from 'src/entity/organization.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
  ) {}

  async find(query?: string): Promise<Organization[]> {
    const qb = this.repository
      .createQueryBuilder('organization')
      .limit(10);

    if (query) {
      qb.where('LOWER(organization.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    return qb.getMany();
  }

  async create(dto: CreateOrganizationDTO): Promise<Organization> {
    const organization = this.repository.create(dto);
    return this.repository.save(organization);
  }

  async getById(id: string): Promise<Organization> {
    try {
      const organization = await this.repository.findOne({ where: { organizationId: id } });
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }
      return organization;
    } catch (error) {
      throw error instanceof NotFoundException ? error : new InternalServerErrorException();
    }
  }

  async update(id: string, updateData: Partial<Organization>): Promise<Organization> {
    try {
      const organization = await this.getById(id);
      Object.assign(organization, updateData);
      const updated = await this.repository.save(organization);
      return updated;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update organization');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.repository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException('Organization not found');
      }
    } catch (error) {
      throw error instanceof NotFoundException ? error : new InternalServerErrorException();
    }
  }
}
