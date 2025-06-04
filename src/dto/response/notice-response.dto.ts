import { Organization } from 'src/entity/organization.entity';
import { NoticeStatus } from 'src/enum/notice-status.enum';

export class NoticeResponseDTO {
  noticeId: string;
  docflowNoticeId: string;
  title: string;
  deadline: Date;
  status: NoticeStatus;
  organization: Organization;
}
