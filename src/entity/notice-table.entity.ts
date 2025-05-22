import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Notice } from './notice.entity';

@Entity('notice_tables')
export class NoticeTable {
  @PrimaryGeneratedColumn('uuid', { name: 'table_id' })
  tableId: string;

  @ManyToOne(() => Notice)
  @JoinColumn({ name: 'notice_id' })
  notice: Notice;

  @Column({ type: 'text', name: 'content' })
  content: string;
}
