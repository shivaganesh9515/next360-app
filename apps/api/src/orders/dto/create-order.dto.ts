import { IsString, IsOptional, IsIn, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  addressId: string;

  @IsIn(['RAZORPAY', 'COD'])
  paymentMethod: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsUUID()
  offerId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
