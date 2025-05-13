import { IsString } from 'class-validator';

export class PdfUploadDto {
  @IsString()
  name: string;

  @IsString()
  deadline: string;

  @IsString()
  pdf_base64: string;
}
