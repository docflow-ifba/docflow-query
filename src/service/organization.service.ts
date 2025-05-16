import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from 'src/entity/organization.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
  ) {}

  async find(query: string): Promise<Organization[]> {
    return this.repository
      .createQueryBuilder('organization')
      .where('organization.name ILIKE :query', { query: `%${query}%` })
      .limit(10)
      .getMany();
  }
}
