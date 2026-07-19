import { IsOptional, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsUUID()
  vendorId?: string;
}

export class UpdateStockDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;
}

export class LowStockQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  threshold?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsUUID()
  vendorId?: string;
}
