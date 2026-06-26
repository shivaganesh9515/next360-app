import { IsString, IsOptional, IsNumber, IsInt, Min, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  compareAtPrice?: number;

  @IsString()
  unit: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  isActive?: boolean;
}
