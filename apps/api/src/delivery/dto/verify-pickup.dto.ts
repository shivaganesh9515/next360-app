import { IsString, Matches } from 'class-validator';

export class VerifyPickupDto {
  @IsString()
  @Matches(/^\d{4}$/, { message: 'OTP must be exactly 4 digits' })
  otp: string;
}
