import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from '../commission/commission.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateRazorpayOrderDto,
  VerifyPaymentDto,
  RazorpayWebhookDto,
} from './dto/create-razorpay-order.dto';
import * as crypto from 'crypto';

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
    private readonly commissionService: CommissionService,
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
   */
  async createRazorpayOrder(userId: string, dto: CreateRazorpayOrderDto) {
    if (!this.isConfigured()) {
      throw new HttpException(
        'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (dashboard.razorpay.com → Settings → API Keys).',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new BadRequestException('Access denied');
    if (order.paymentMethod !== 'RAZORPAY') {
      throw new BadRequestException('This order does not use Razorpay payment');
    }
    if (order.paymentStatus !== 'PENDING') {
      throw new BadRequestException('Payment already processed for this order');
    }

    // Create Razorpay order (amount in paise)
    const amountInPaise = Math.round(Number(order.totalAmount) * 100);

    const razorpayOrder = await this.razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.orderNo,
      notes: {
        orderId: order.id,
        userId: order.userId,
      },
    });

    // Store the Razorpay order ID on the order
    await this.prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    // Create a payment record
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: order.totalAmount,
        status: 'PENDING',
      },
    });

    return {
      key: this.razorpayKeyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order_id: razorpayOrder.id,
      receipt: razorpayOrder.receipt,
    };
  }

  /**
   * Verify a Razorpay payment signature after successful payment on the client side.
   */
  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    // Verify signature
    const body = dto.razorpayOrderId + '|' + dto.razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', this.razorpayKeySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Find the order
    const order = await this.prisma.order.findFirst({
      where: { razorpayOrderId: dto.razorpayOrderId },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Ownership: a customer must never verify another customer's payment.
    if (order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    // Idempotency: duplicate verify callbacks must not duplicate effects.
    if (order.paymentStatus === 'PAID') {
      return { success: true, message: 'Payment already verified' };
    }

    // Update payment and order status
    await this.prisma.$transaction([
      this.prisma.payment.updateMany({
        where: { razorpayOrderId: dto.razorpayOrderId },
        data: {
          razorpayPaymentId: dto.razorpayPaymentId,
          status: 'CAPTURED',
        },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PAID' },
      }),
    ]);

    // Send payment success notification
    try {
      await this.notificationsService.sendPaymentSuccessNotification(
        order.userId,
        order.id,
        Number(order.totalAmount),
      );
    } catch (error: any) {
      this.logger.error(`Payment success notification failed: ${error.message}`);
    }

    return { success: true, message: 'Payment verified successfully' };
  }

  /**
   * Handle Razorpay webhook events (payment captured, failed, etc.)
   */
  async handleWebhook(webhookDto: RazorpayWebhookDto) {
    const event = webhookDto.event;

    switch (event) {
      case 'payment.captured': {
        const payment = webhookDto.payload.payment?.entity;
        if (!payment) throw new BadRequestException('Invalid webhook payload');

        const order = await this.prisma.order.findFirst({
          where: { razorpayOrderId: payment.order_id },
        });
        if (!order) throw new NotFoundException('Order not found');

        // Idempotency: Razorpay retries webhooks. Same provider payment ID
        // must never double-apply financial effects.
        const alreadyCaptured = await this.prisma.payment.findFirst({
          where: {
            razorpayOrderId: payment.order_id,
            razorpayPaymentId: payment.id,
            status: 'CAPTURED',
          },
          select: { id: true },
        });
        if (alreadyCaptured && order.paymentStatus === 'PAID') {
          this.logger.log(
            `Webhook dedup: payment ${payment.id} for order ${order.id} already captured — skipping`,
          );
          return { received: true, status: 'captured', deduplicated: true };
        }

        await this.prisma.$transaction([
          this.prisma.payment.updateMany({
            where: { razorpayOrderId: payment.order_id },
            data: {
              razorpayPaymentId: payment.id,
              status: 'CAPTURED',
              method: payment.method,
            },
          }),
          this.prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'PAID' },
          }),
        ]);

        await this.commissionService.calculateCommissions(order.id);

        const fullOrder = await this.prisma.order.findUnique({
          where: { id: order.id },
          include: {
            vendorGroups: {
              include: {
                vendor: {
                  select: {
                    id: true,
                    razorpayAccountId: true,
                    commissionPct: true,
                  },
                },
              },
            },
            commissions: true,
          },
        });

        if (!fullOrder) {
          this.logger.error(
            `Order ${order.id} not found after payment capture — aborting Route transfers`,
          );
          return { received: true, status: 'captured', transfersSkipped: true };
        }

        if (!this.isConfigured()) {
          this.logger.warn(
            `Razorpay not configured — skipping Route transfers for order ${order.id}`,
          );
          return { received: true, status: 'captured', transfersSkipped: true };
        }

        /*
         * Exact idempotency via Payout(orderId, vendorId).
         * The schema carries @@unique([orderId, vendorId]), so a retried
         * webhook for the same order+vendor hits the existing record and
         * skips the duplicate Route transfer. No time-window heuristic.
         */
        for (const group of fullOrder.vendorGroups) {
          const commission = fullOrder.commissions.find(
            (c: any) => c.vendorId === group.vendorId,
          );
          if (!commission) {
            this.logger.warn(
              `Skipping vendor ${group.vendorId} — no commission record for order ${order.id}`,
            );
            continue;
          }

          if (!group.vendor.razorpayAccountId) {
            this.logger.warn(
              `Skipping vendor ${group.vendorId} — no razorpayAccountId linked`,
            );
            continue;
          }

          const subtotal = Number(group.subtotal);
          const commissionAmount = Number(commission.commissionAmount);

          if (subtotal < commissionAmount) {
            this.logger.warn(
              `Skipping vendor ${group.vendorId} — subtotal ${subtotal} < commission ${commissionAmount} for order ${order.id}`,
            );
            continue;
          }

          const payoutAmount = subtotal - commissionAmount;
          const payoutAmountPaise = Math.round(payoutAmount * 100);

          if (payoutAmountPaise <= 0) {
            this.logger.warn(
              `Skipping vendor ${group.vendorId} — payout ${payoutAmount} rounds to 0 paise for order ${order.id}`,
            );
            continue;
          }

          const existingPayout = await this.prisma.payout.findUnique({
            where: {
              orderId_vendorId: {
                orderId: order.id,
                vendorId: group.vendorId,
              },
            },
          });
          if (existingPayout) {
            this.logger.log(
              `Skipping vendor ${group.vendorId} — dedup: existing Payout ${existingPayout.id} for order ${order.id}`,
            );
            continue;
          }

          let payoutStatus = 'PENDING';

          try {
            await this.razorpay.transfers.create({
              account: group.vendor.razorpayAccountId,
              amount: payoutAmountPaise,
              currency: 'INR',
              notes: {
                orderId: order.id,
                vendorId: group.vendorId,
                orderNo: fullOrder.orderNo,
              },
            });
            payoutStatus = 'PROCESSED';
            this.logger.log(
              `Route transfer PROCESSED — order: ${order.id}, vendor: ${group.vendorId}, amount: ₹${payoutAmount}`,
            );
          } catch (error: any) {
            payoutStatus = 'FAILED';
            this.logger.error(
              `Route transfer FAILED — order: ${order.id}, vendor: ${group.vendorId}, amount: ₹${payoutAmount}, error: ${error?.message || error}`,
            );
          }

          try {
            await this.prisma.payout.create({
              data: {
                orderId: order.id,
                vendorId: group.vendorId,
                amount: payoutAmount,
                status: payoutStatus,
              },
            });
            this.logger.log(
              `Payout record created — vendor: ${group.vendorId}, order: ${order.id}, status: ${payoutStatus}`,
            );
          } catch (dbError: any) {
            this.logger.error(
              `Payout DB write failed — vendor: ${group.vendorId}, order: ${order.id}, error: ${dbError?.message || dbError}`,
            );
          }
        }

        return { received: true, status: 'captured' };
      }

      case 'payment.failed': {
        const failedPayment = webhookDto.payload.payment?.entity;
        if (!failedPayment) throw new BadRequestException('Invalid webhook payload');

        const failedOrder = await this.prisma.order.findFirst({
          where: { razorpayOrderId: failedPayment.order_id },
        });

        await this.prisma.payment.updateMany({
          where: { razorpayOrderId: failedPayment.order_id },
          data: { status: 'FAILED' },
        });

        await this.prisma.order.updateMany({
          where: { razorpayOrderId: failedPayment.order_id },
          data: { paymentStatus: 'FAILED' },
        });

        if (failedOrder) {
          try {
            await this.notificationsService.sendPaymentFailedNotification(
              failedOrder.userId,
              failedOrder.id,
              failedPayment.error_description || failedPayment.error_reason || 'Payment declined',
            );
          } catch (error: any) {
            this.logger.error(`Payment failed notification error: ${error.message}`);
          }

          try {
            await this.notificationsService.sendAdminPaymentFailedAlert(
              failedOrder.id,
              failedPayment.error_description || failedPayment.error_reason || 'Payment declined',
            );
          } catch (error: any) {
            this.logger.error(`Admin payment failure alert error: ${error.message}`);
          }
        }

        return { received: true, status: 'failed' };
      }

      case 'order.paid': {
        // Handle order-level payment success (for full order payments)
        return { received: true, status: 'order_paid' };
      }

      case 'refund.created': {
        const refundCreated = webhookDto.payload.refund?.entity;
        if (refundCreated) {
          const paymentId = refundCreated.payment_id;
          await this.prisma.payment.updateMany({
            where: { razorpayPaymentId: paymentId },
            data: { status: 'REFUNDED' },
          });
        }
        return { received: true, status: 'refund_created' };
      }

      case 'refund.processed': {
        const refundProcessed = webhookDto.payload.refund?.entity;
        if (refundProcessed) {
          const orderId = refundProcessed.order_id;
          await this.prisma.order.updateMany({
            where: { razorpayOrderId: orderId },
            data: { status: 'REFUNDED', paymentStatus: 'REFUNDED' },
          });

          // Restore product stock
          const order = await this.prisma.order.findFirst({
            where: { razorpayOrderId: orderId },
            include: { vendorGroups: { include: { items: true } } },
          });
          if (order) {
            for (const group of order.vendorGroups) {
              for (const item of group.items) {
                await this.prisma.product.update({
                  where: { id: item.productId },
                  data: { stock: { increment: item.quantity } },
                });
              }
            }
          }

          // Notify customer
          if (order) {
            try {
              await this.notificationsService.sendRefundCompletedNotification(
                order.userId, order.id,
              );
            } catch (_) {}
          }
        }
        return { received: true, status: 'refund_processed' };
      }

      default:
        return { received: true, event };
    }
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
   */
  async initiateRefund(orderId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    const payment = order.payments.find((p) => p.status === 'CAPTURED');
    if (!payment) throw new BadRequestException('No captured payment found for refund');

    // Call Razorpay refund API if configured
    if (this.isConfigured() && payment.razorpayPaymentId) {
      try {
        await this.razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: Math.round(Number(order.totalAmount) * 100),
          notes: { reason: reason || 'Customer requested refund' },
        });
      } catch (error: any) {
        throw new BadRequestException(`Razorpay refund failed: ${error.message}`);
      }
    }

    // Update payment and order status
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'REFUNDED', status: 'REFUNDED' },
      }),
    ]);

    // Send refund notification to customer
    try {
      await this.notificationsService.sendRefundCompletedNotification(
        order.userId,
        orderId,
        Number(order.totalAmount),
      );
    } catch (error: any) {
      this.logger.error(`Refund notification failed: ${error.message}`);
    }

    return { success: true, message: 'Refund processed successfully' };
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
