import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto, UpdateOrderStatusDto } from './dto/order-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: { id: string; role: string },
    @Query() query: OrderQueryDto,
  ) {
    return this.ordersService.findAll(user.id, user.role, query);
  }

  @Get('vendor')
  @Roles('VENDOR')
  findVendorOrders(
    @CurrentUser() user: { id: string },
    @Query() query: OrderQueryDto,
  ) {
    return this.ordersService.findVendorOrders(user.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
  ) {
    return this.ordersService.findOne(user.id, user.role, id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(user.id, user.role, id, dto);
  }

  @Patch(':id/groups/:groupId/status')
  updateVendorGroupStatus(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(user.id, user.role, id, dto, groupId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
  ) {
    return this.ordersService.cancel(user.id, user.role, id);
  }

  @Post(':id/groups/:groupId/cancel')
  @HttpCode(HttpStatus.OK)
  cancelVendorGroup(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Param('groupId') groupId: string,
  ) {
    return this.ordersService.cancel(user.id, user.role, id, groupId);
  }
}
