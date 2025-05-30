import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Conversation } from './conversation.entity';
import { UserRole } from 'src/enum/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'email', unique: true })
  email: string;

  @Column({ name: 'password' })
  password: string;

  @Column({
    type: 'text',
    default: UserRole.USER,
    name: 'role',
  })
  role: UserRole;

  @OneToMany(() => Conversation, conversation => conversation.user)
  conversations: Conversation[];
}
