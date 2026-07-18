import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DeliveryModule } from '../delivery/delivery.module';
import { CommissionModule } from '../commission/commission.module';
import { OffersModule } from '../offers/offers.module';

@Module({
  imports: [DeliveryModule, CommissionModule, OffersModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
