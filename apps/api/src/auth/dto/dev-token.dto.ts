import { IsString, IsEmail } from 'class-validator';

export class DevTokenDto {
  @IsEmail()
  email: string;
}
