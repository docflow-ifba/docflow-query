import {
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm';
import { Notice } from './notice.entity';
import { User } from './user.entity';
import { Message } from './message.entity';

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


  @OneToMany(() => Message, message => message.conversation)
  messages: Message[];
}
