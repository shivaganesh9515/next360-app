import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { StoreType } from '@prisma/client';

export class CreateVendorDto {
  @IsString()
  storeName: string;

  @IsString()
  storeSlug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(StoreType)
  storeType: StoreType;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  deliveryTimeMin?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(180)
  deliveryTimeMax?: number;

  @IsOptional()
  @IsString()
  deliveryLabel?: string;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsString()
  razorpayAccountId?: string;
}
