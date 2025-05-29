import { Type } from 'class-transformer';
import { IsDefined, IsString, ValidateNested } from 'class-validator';
import { CreateOrganizationDTO } from './create-organization-request.dto';

export class CreateNoticeRequestDTO {
  @IsString()
  title: string;

  @IsString()
  deadline: string;

  @IsString()
  pdfBase64: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateOrganizationDTO)
  organization: CreateOrganizationDTO;
}
