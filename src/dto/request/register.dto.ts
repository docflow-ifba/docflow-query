import { IsEmail, IsString } from "class-validator";

export class RegisterDTO {

  @IsString()
  name: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}