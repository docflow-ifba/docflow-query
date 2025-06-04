import { Sender } from 'src/enum/sender.enum';
import {
  Column,
  CreateDateColumn,
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

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', name: 'sender' })
  sender: Sender;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Notice)
  @JoinColumn({ name: 'notice_id' })
  notice: Notice;

  @ManyToOne(() => User, user => user.conversations)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
