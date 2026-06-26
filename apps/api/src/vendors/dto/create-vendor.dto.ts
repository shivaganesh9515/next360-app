import { IsString, IsOptional, IsEnum } from 'class-validator';
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
  @IsString()
  zoneId?: string;
}
