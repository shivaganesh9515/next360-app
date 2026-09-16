import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReturnDto, ProcessReturnDto } from './dto/return.dto';

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateReturnDto) {
    // Verify order exists and belongs to user
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('Only delivered orders can be returned');
    }

    // Check if return already exists
    const existing = await this.prisma.returnRequest.findFirst({
      where: { orderId: dto.orderId, userId },
    });
    if (existing) {
      throw new BadRequestException('Return request already exists for this order');
    }

    const returnRequest = await this.prisma.returnRequest.create({
      data: {
        orderId: dto.orderId,
        userId,
        reason: dto.reason,
        refundAmount: order.totalAmount,
      },
      include: { order: true },
    });

    // Notify customer that refund has been initiated
    try {
      await this.notificationsService.sendRefundInitiatedNotification(userId, dto.orderId);
    } catch (error: any) {
      this.logger.error(`Refund initiated notification failed: ${error.message}`);
    }

    return returnRequest;
  }

  async findAll(userId: string, role: string) {
    const where: any = {};

    // Customers see only their returns; vendors see returns on orders
    // containing their groups; admins see all.
    if (role === 'CUSTOMER') {
      where.userId = userId;
    } else if (role === 'VENDOR') {
      const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
      if (!vendor) throw new NotFoundException('Vendor profile not found');
      where.order = { vendorGroups: { some: { vendorId: vendor.id } } };
    } else if (role !== 'ADMIN') {
      where.userId = userId;
    }

    return this.prisma.returnRequest.findMany({
      where,
      include: {
        order: { select: { id: true, orderNo: true, totalAmount: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    const ret = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNo: true,
            totalAmount: true,
            status: true,
            userId: true,
            vendorGroups: { select: { vendorId: true } },
          },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!ret) throw new NotFoundException('Return request not found');
    if (role !== 'ADMIN' && ret.userId !== userId) {
      if (role === 'VENDOR') {
        const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
        const member =
          vendor &&
          (ret.order as any)?.vendorGroups?.some((g: any) => g.vendorId === vendor.id);
        if (!member) throw new ForbiddenException('Access denied');
      } else {
        throw new ForbiddenException('Access denied');
      }
    }
    return ret;
  }

  async findRefunds() {
    return this.prisma.returnRequest.findMany({
      where: { status: { in: ['PENDING', 'APPROVED', 'REFUNDED'] } },
      include: {
        order: { select: { id: true, orderNo: true, totalAmount: true, status: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async process(id: string, dto: ProcessReturnDto) {
    // Admin-only caller (controller enforces ADMIN); bypass ownership checks.
    const ret = await this.findOne(id, '', 'ADMIN');

    if (ret.status !== 'PENDING') {
      throw new BadRequestException(`Return is already ${ret.status.toLowerCase()}`);
    }

    const refundAmount = dto.refundAmount ?? ret.refundAmount;

    if (dto.status === 'APPROVED') {
      const order = await this.prisma.order.findUnique({
        where: { id: ret.orderId },
        include: {
          vendorGroups: { include: { items: true } },
        },
      });

      if (!order) throw new NotFoundException('Order not found');

      // Razorpay orders: trigger refund via Razorpay API
      // (initiateRefund already updates Payment + Order status to REFUNDED)
      if (order.paymentMethod === 'RAZORPAY') {
        try {
          await this.paymentsService.initiateRefund(order.id, 'Return approved');
        } catch (error: any) {
          this.logger.error(
            `Razorpay refund failed for order ${order.id}: ${error.message}`,
          );
          throw new BadRequestException(`Refund failed: ${error.message}`);
        }
      }

      // COD orders: update order status directly (no Razorpay payment to refund)
      if (order.paymentMethod === 'COD') {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'REFUNDED' },
        });
      }

      // Restore product stock atomically with the return-record update so a
      // crash between the two can never double-restore or lose the restore.
      const stockOps = [];
      for (const group of order.vendorGroups) {
        for (const item of group.items || []) {
          stockOps.push(
            this.prisma.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            }),
          );
        }
      }

      const updated = await this.prisma.$transaction([
        ...stockOps,
        this.prisma.returnRequest.update({
          where: { id },
          data: { status: dto.status, refundAmount },
        }),
      ]);

      // Send notifications based on status change
      try {
        if (dto.status === 'APPROVED') {
          await this.notificationsService.sendRefundInitiatedNotification(ret.userId, ret.orderId);
        } else if (dto.status === 'REFUNDED') {
          await this.notificationsService.sendRefundCompletedNotification(
            ret.userId,
            ret.orderId,
            Number(refundAmount),
          );
        }
      } catch (error: any) {
        this.logger.error(`Return status notification failed: ${error.message}`);
      }

      return updated[updated.length - 1];
    }

    const updated = await this.prisma.returnRequest.update({
      where: { id },
      data: {
        status: dto.status,
        refundAmount,
      },
    });

    // Send notifications based on status change.
    // Only REJECTED and direct-to-REFUNDED reach here (APPROVED returns above).
    try {
      if (dto.status === 'REFUNDED') {
        await this.notificationsService.sendRefundCompletedNotification(
          ret.userId,
          ret.orderId,
          Number(refundAmount),
        );
      }
    } catch (error: any) {
      this.logger.error(`Return status notification failed: ${error.message}`);
    }

    return updated;
  }
}
