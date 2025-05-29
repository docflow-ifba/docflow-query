import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { Notice } from './notice.entity';
import { User } from './user.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid', { name: 'conversation_id' })
  conversationId: string;

  @ManyToOne(() => Notice)
  @JoinColumn({ name: 'notice_id' })
  notice: Notice;

  @ManyToOne(() => User, user => user.conversations)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
