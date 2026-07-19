import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CommissionModule } from '../commission/commission.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CommissionModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
