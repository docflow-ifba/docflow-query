import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid', { name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'name' })
  name: string;
}
