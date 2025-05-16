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

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ default: 0, name: 'views' })
  views: number;

  @Column({ type: 'text', name: 'content_markdown' })
  contentMarkdown: string;

  @Column({ type: 'text', name: 'clean_markdown' })
  cleanMarkdown: string;

  @Column({ type: 'text', name: 'pdf_base64', nullable: true })
  pdfBase64: string;

  @Column({
    type: 'text',
    default: NoticeStatus.PENDING_EMBEDDING,
    name: 'status',
  })
  status: NoticeStatus;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
