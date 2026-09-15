import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateRazorpayOrderDto,
  VerifyPaymentDto,
  RazorpayWebhookDto,
} from './dto/create-razorpay-order.dto';

/**
 * Lazily read Razorpay env at construction so tests and hot-reload see latest values.
 * RAZORPAY_WEBHOOK_SECRET is validated at controller level.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: any;
  private readonly razorpayKeyId: string;
  private readonly razorpayKeySecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly queueService: QueueService,
  ) {
    this.razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
    this.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
    if (this.razorpayKeyId && this.razorpayKeySecret) {
      const Razorpay = require('razorpay');
      this.razorpay = new Razorpay({
        key_id: this.razorpayKeyId,
        key_secret: this.razorpayKeySecret,
      });
      this.logger.log('[Razorpay] Configured (live keys present)');
    } else {
      this.logger.warn(
        '[Razorpay] RAZORPAY_KEY_ID/SECRET not set — payments will return 503. Set live keys from dashboard.razorpay.com',
      );
    }
  }

  async findAll(filters: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const skip = (filters.page - 1) * filters.limit;
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: filters.limit,
        include: { order: { select: { orderNo: true, userId: true, totalAmount: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) },
    };
  }

  isConfigured(): boolean {
    return !!(this.razorpayKeyId && this.razorpayKeySecret);
  }

  /**
   * Create a Razorpay order for the given internal order.
   * DISABLED (2026-09): COD-only MVP — no Razorpay keys. Returns 503 so the
   * partner-audit Razorpay findings (idempotency race, order-creation abuse,
   * webhook replay) are out of scope by design. Re-enable by deleting this guard.
   */
  async createRazorpayOrder(userId: string, dto: CreateRazorpayOrderDto) {
    throw new HttpException(
      'Online payments are disabled. Please use Cash on Delivery (COD).',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  /**
   * Verify a Razorpay payment signature after successful payment on the client side.
   * DISABLED (2026-09): COD-only MVP — see createRazorpayOrder guard.
   */
  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    throw new HttpException(
      'Online payments are disabled. Please use Cash on Delivery (COD).',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  /**
   * Handle Razorpay webhook events (payment captured, failed, etc.)
   * DISABLED (2026-09): COD-only MVP — see createRazorpayOrder guard.
   */
  async handleWebhook(webhookDto: RazorpayWebhookDto) {
    throw new HttpException(
      'Online payments are disabled. Webhooks not accepted.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  /**
   * List all payments (admin only).
   */
  async listAll() {
    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        order: {
          select: { orderNo: true, userId: true, totalAmount: true },
        },
      },
    });
  }

  /**
   * Get payment history for an order. Owner, participating vendor, or admin.
   */
  async getPaymentsForOrder(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        vendorGroups: { select: { vendorId: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (role !== 'ADMIN' && order.userId !== userId) {
      if (role === 'VENDOR') {
        const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
        const member = vendor && order.vendorGroups.some((g) => g.vendorId === vendor.id);
        if (!member) throw new NotFoundException('Order not found');
      } else {
        throw new NotFoundException('Order not found');
      }
    }

    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Initiate a refund for a payment.
   * DISABLED (2026-09): COD-only MVP — no captured online payments exist.
   */
  async initiateRefund(orderId: string, reason?: string) {
    throw new HttpException(
      'Online refunds are disabled in COD-only mode.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  async processWeeklyPayouts() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Find completed deliveries in the past week
    const assignments = await this.prisma.deliveryAssignment.findMany({
      where: {
        deliveredAt: { gte: oneWeekAgo },
      },
      include: { deliveryPartner: true },
    });

    // Group by delivery partner
    const dpMap = new Map<string, number>();
    for (const a of assignments) {
      const current = dpMap.get(a.deliveryPartnerId) || 0;
      dpMap.set(a.deliveryPartnerId, current + 50); // ₹50 per delivery
    }

    // Create payout records
    let processed = 0;
    for (const [dpId, amount] of dpMap) {
      await this.prisma.payout.create({
        data: {
          deliveryPartnerId: dpId,
          amount,
          status: 'PENDING',
          periodStart: oneWeekAgo,
          periodEnd: new Date(),
        },
      });
      processed++;
    }

    // Queue notification job
    if (processed > 0) {
      try {
        await this.queueService.sendPush(
          'Weekly Payouts Processed',
          `${processed} delivery partners paid for ${assignments.length} deliveries`,
          '',
          { count: processed },
        );
      } catch (_) {}
    }

    return { processed, totalDeliveries: assignments.length };
  }

  async autoSettleVendors(threshold = 1000) {
    const unpaidCommissions = await this.prisma.commission.groupBy({
      by: ['vendorId'],
      where: { isPaid: false },
      _sum: { orderAmount: true, commissionAmount: true },
    });

    const results = [];
    for (const c of unpaidCommissions) {
      const totalAmount = Number(c._sum.orderAmount || 0);
      if (totalAmount >= threshold) {
        const vendor = await this.prisma.vendor.findUnique({ where: { id: c.vendorId } });
        if (vendor?.razorpayAccountId) {
          await this.prisma.payout.create({
            data: {
              vendorId: c.vendorId,
              amount: totalAmount,
              status: 'PROCESSED',
              periodStart: new Date(),
              periodEnd: new Date(),
            },
          });

          await this.prisma.commission.updateMany({
            where: { vendorId: c.vendorId, isPaid: false },
            data: { isPaid: true, paidAt: new Date() },
          });

          results.push({ vendorId: c.vendorId, amount: totalAmount, settled: true });
        }
      }
    }

    return { settled: results.length, vendors: results };
  }
}
