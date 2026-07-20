import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { NotificationProcessor } from './processors/notification.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'invoices' },
      { name: 'settlements' },
    ),
    PrismaModule,
  ],
  providers: [QueueService, NotificationProcessor],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
