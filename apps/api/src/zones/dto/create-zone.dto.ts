import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class CreateZoneDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  deliveryRadius?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2000)
  codCap?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
