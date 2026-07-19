import { IsString, IsOptional, IsEnum, IsInt, IsBoolean } from 'class-validator';
import { StoreType } from '@prisma/client';

export class CreateBannerDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsEnum(StoreType)
  storeType: StoreType;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
