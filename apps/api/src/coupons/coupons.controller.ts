import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // Vendor creates a coupon for their store
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  create(@CurrentUser() user: any, @Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto, user.vendorId);
  }

  // Vendor lists their coupons
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  findAll(@CurrentUser() user: any) {
    return this.couponsService.findAll(user.vendorId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  // Public validate endpoint
  @Post('validate')
  validate(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validate(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
