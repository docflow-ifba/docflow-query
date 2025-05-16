import { IsString } from 'class-validator';

export class CreateNoticeRequestDTO {
  @IsString()
  title: string;

  @IsString()
  deadline: string;

  @IsString()
  pdfBase64: string;

  @IsString()
  organization_id: string;
}
