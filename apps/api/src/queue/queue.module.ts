import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { NotificationProcessor } from './processors/notification.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'invoices' },
      { name: 'settlements' },
    ),
  ],
  providers: [QueueService, NotificationProcessor],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
