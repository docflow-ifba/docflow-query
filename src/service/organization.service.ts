import { Injectable } from '@nestjs/common';
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
}
