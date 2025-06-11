import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { NoticeStatus } from 'src/enum/notice-status.enum';

@Entity('notices')
export class Notice {
  @PrimaryGeneratedColumn('uuid', { name: 'notice_id' })
  noticeId: string;

  @Column({ name: 'docflow_notice_id' })
  docflowNoticeId: string;

  @Column({ name: 'title' })
  title: string;

  @Column({ type: 'date', name: 'deadline' })
  deadline: Date;

  @Column({ type: 'text', name: 'content_markdown', nullable: true })
  contentMarkdown: string;

  @Column({ type: 'text', name: 'clean_markdown', nullable: true })
  cleanMarkdown: string;

  @Column({ type: 'text', name: 'pdf_base64' })
  pdfBase64: string;

  @Column({
    type: 'text',
    default: NoticeStatus.PENDING,
    name: 'status',
  })
  status: NoticeStatus;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
