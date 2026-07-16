import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseEnumPipe, ForbiddenException } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, StoreType } from '@prisma/client';

interface TransactionQueryDto {
  page?: string;
  limit?: string;
  startDate?: string;
  endDate?: string;
}

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  async register(@CurrentUser('id') userId: string, @Body() dto: CreateVendorDto) {
    return this.vendorsService.register(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('storeType') storeType?: StoreType,
    @Query('isApproved') isApproved?: string,
  ) {
    return this.vendorsService.findAll(
      storeType,
      isApproved !== undefined ? isApproved === 'true' : undefined,
    );
  }

  @Get('storefront/:storeType')
  async getStorefrontVendors(@Param('storeType', new ParseEnumPipe(StoreType)) storeType: StoreType) {
    return this.vendorsService.getStorefrontVendors(storeType);
  }

  @Get('my-profile')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.vendorsService.getVendorByUserId(userId);
  }

  @Get('me/payouts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getMyPayouts(@CurrentUser('vendorId') vendorId: string) {
    if (!vendorId) {
      throw new ForbiddenException('You do not have a vendor profile');
    }
    return this.vendorsService.getVendorPayouts(vendorId);
  }

  @Get('me/earnings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getMyEarnings(@CurrentUser('vendorId') vendorId: string) {
    if (!vendorId) {
      throw new ForbiddenException('You do not have a vendor profile');
    }
    return this.vendorsService.getVendorEarnings(vendorId);
  }

  @Get('me/transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getMyTransactions(
    @CurrentUser('vendorId') vendorId: string,
    @Query() query: TransactionQueryDto,
  ) {
    if (!vendorId) {
      throw new ForbiddenException('You do not have a vendor profile');
    }
    return this.vendorsService.getVendorTransactions(vendorId, {
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.vendorsService.update(id, dto, userId);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async approve(@Param('id') id: string) {
    return this.vendorsService.approve(id);
  }

  @Get(':id/products')
  async getVendorProducts(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vendorsService.getVendorProducts(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
