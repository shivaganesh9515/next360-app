import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateReturnDto, ProcessReturnDto } from './dto/return.dto';

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
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

    return this.prisma.returnRequest.create({
      data: {
        orderId: dto.orderId,
        userId,
        reason: dto.reason,
        refundAmount: order.totalAmount,
      },
      include: { order: true },
    });
  }

  async findAll(userId: string, role: string) {
    const where: any = {};

    // Customers see only their returns
    if (role === 'CUSTOMER') {
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

  async findOne(id: string) {
    const ret = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          select: { id: true, orderNo: true, totalAmount: true, status: true },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!ret) throw new NotFoundException('Return request not found');
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
    const ret = await this.findOne(id);

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

      // Restore product stock
      for (const group of order.vendorGroups) {
        for (const item of group.items || []) {
          await this.prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }

    return this.prisma.returnRequest.update({
      where: { id },
      data: {
        status: dto.status,
        refundAmount,
      },
    });
  }
}
