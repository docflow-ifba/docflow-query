import { Sender } from 'src/enum/sender.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid', { name: 'message_id' })
  messageId: string;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', name: 'sender' })
  sender: Sender;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
