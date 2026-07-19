import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from '../commission/commission.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateRazorpayOrderDto,
  VerifyPaymentDto,
  RazorpayWebhookDto,
} from './dto/create-razorpay-order.dto';
import * as crypto from 'crypto';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionService: CommissionService,
    private readonly notificationsService: NotificationsService,
  ) {
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      const Razorpay = require('razorpay');
      this.razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      });
    }
  }

  isConfigured(): boolean {
    return !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
  }

  /**
   * Create a Razorpay order for the given internal order.
   */
  async createRazorpayOrder(userId: string, dto: CreateRazorpayOrderDto) {
    if (!this.isConfigured()) {
      throw new HttpException(
        'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
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
      key: RAZORPAY_KEY_ID,
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
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
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
              `Skipping vendor ${group.vendorId} — dedup: existing Payout ${existingPayout.id} found for order ${order.id}`,
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
                vendorId: group.vendorId,
                orderId: order.id,
                amount: payoutAmount,
                status: payoutStatus,
              },
            });
            this.logger.log(
              `Payout record created — vendor: ${group.vendorId}, order: ${order.id}, status: ${payoutStatus}`,
            );
          } catch (dbError: any) {
            if (dbError?.code === 'P2002') {
              this.logger.log(
                `Payout skipped — duplicate constraint for vendor: ${group.vendorId}, order: ${order.id}`,
              );
              continue;
            }
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
        const refundEntity = webhookDto.payload.refund?.entity;
        if (!refundEntity) {
          this.logger.warn('refund.created webhook missing refund entity — ignoring');
          return { received: true, status: 'ignored' };
        }

        this.logger.log(
          `refund.created received — refundId: ${refundEntity.id}, paymentId: ${refundEntity.payment_id}, status: ${refundEntity.status}`,
        );

        return { received: true, status: 'refund_created' };
      }

      case 'refund.processed': {
        const refundEntity = webhookDto.payload.refund?.entity;
        if (!refundEntity) {
          this.logger.warn('refund.processed webhook missing refund entity — ignoring');
          return { received: true, status: 'ignored' };
        }

        this.logger.log(
          `refund.processed received — refundId: ${refundEntity.id}, paymentId: ${refundEntity.payment_id}`,
        );

        const payment = await this.prisma.payment.findFirst({
          where: { razorpayPaymentId: refundEntity.payment_id },
        });

        if (!payment) {
          this.logger.warn(
            `refund.processed — no payment found for razorpayPaymentId ${refundEntity.payment_id} — ignoring`,
          );
          return { received: true, status: 'ignored' };
        }

        // Idempotency: skip if already refunded
        if (payment.status === 'REFUNDED') {
          this.logger.log(
            `refund.processed — payment ${payment.id} already REFUNDED — skipping duplicate`,
          );
          return { received: true, status: 'already_refunded' };
        }

        const refundOrder = await this.prisma.order.findUnique({
          where: { id: payment.orderId },
        });

        if (!refundOrder) {
          this.logger.error(
            `refund.processed — order ${payment.orderId} not found for payment ${payment.id}`,
          );
          return { received: true, status: 'error' };
        }

        await this.prisma.$transaction([
          this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'REFUNDED' },
          }),
          this.prisma.order.update({
            where: { id: refundOrder.id },
            data: { paymentStatus: 'REFUNDED', status: 'REFUNDED' },
          }),
        ]);

        try {
          await this.notificationsService.sendRefundCompletedNotification(
            refundOrder.userId,
            refundOrder.id,
            Number(refundOrder.totalAmount),
          );
        } catch (error: any) {
          this.logger.error(`Refund completed notification failed: ${error.message}`);
        }

        return { received: true, status: 'refund_processed' };
      }

      default:
        return { received: true, event };
    }
  }

  /**
   * Get payment history for an order.
   */
  async getPaymentsForOrder(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * List all payments with filters and pagination (admin).
   */
  async listPayments(query: {
    status?: string;
    vendorId?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.vendorId) {
      where.order = {
        vendorGroups: {
          some: { vendorId: query.vendorId },
        },
      };
    }

    if (query.paymentMethod) {
      where.order = {
        ...where.order,
        paymentMethod: query.paymentMethod,
      };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNo: true,
              totalAmount: true,
              paymentMethod: true,
              paymentStatus: true,
              status: true,
              createdAt: true,
              vendorGroups: {
                select: {
                  vendorId: true,
                  subtotal: true,
                  vendor: {
                    select: {
                      id: true,
                      storeName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Process weekly payouts for delivery partners.
   * Finds all completed deliveries in the given period that have NOT already been
   * paid, groups by partner, and creates one Payout record per partner. Uses the
   * DB-level unique constraint on (deliveryPartnerId, periodStart, periodEnd) for
   * idempotency — rerunning with the same parameters is always safe.
   */
  async processDeliveryPartnerPayouts(periodStart?: string, periodEnd?: string) {
    const end = periodEnd ? new Date(periodEnd) : new Date();
    const start = periodStart
      ? new Date(periodStart)
      : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const DELIVERY_FEE = 40;

    const completedAssignments = await this.prisma.deliveryAssignment.findMany({
      where: {
        deliveredAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        deliveryPartnerId: true,
        deliveredAt: true,
      },
    });

    if (completedAssignments.length === 0) {
      return { processed: 0, partners: [], periodStart: start, periodEnd: end };
    }

    const partnerTotals = new Map<string, number>();
    for (const a of completedAssignments) {
      partnerTotals.set(
        a.deliveryPartnerId,
        (partnerTotals.get(a.deliveryPartnerId) || 0) + DELIVERY_FEE,
      );
    }

    const results: { partnerId: string; amount: number; status: string }[] = [];

    for (const [partnerId, totalAmount] of partnerTotals) {
      try {
        await this.prisma.payout.create({
          data: {
            deliveryPartnerId: partnerId,
            amount: totalAmount,
            status: 'PENDING',
            periodStart: start,
            periodEnd: end,
          },
        });
        results.push({ partnerId, amount: totalAmount, status: 'CREATED' });
        this.logger.log(
          `Delivery payout created — partner: ${partnerId}, amount: ₹${totalAmount}, period: ${start.toISOString()} – ${end.toISOString()}`,
        );
      } catch (error: any) {
        if (error?.code === 'P2002') {
          results.push({ partnerId, amount: totalAmount, status: 'SKIPPED' });
          this.logger.log(
            `Delivery payout skipped — dedup constraint for partner ${partnerId}, period ${start.toISOString()} – ${end.toISOString()}`,
          );
        } else {
          results.push({ partnerId, amount: totalAmount, status: 'FAILED' });
          this.logger.error(
            `Delivery payout DB write failed — partner: ${partnerId}, error: ${error?.message || error}`,
          );
        }
      }
    }

    return {
      processed: results.filter((r) => r.status === 'CREATED').length,
      skipped: results.filter((r) => r.status === 'SKIPPED').length,
      failed: results.filter((r) => r.status === 'FAILED').length,
      partners: results,
      periodStart: start,
      periodEnd: end,
    };
  }

  /**
   * Get settlement information for a vendor — last paid date, pending amount,
   * payout history summary. Uses parallel queries to avoid N+1.
   */
  async getVendorSettlementInfo(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        storeName: true,
        storeType: true,
        commissionPct: true,
        zoneId: true,
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const [lastPaidPayout, pendingAgg, statusBreakdown, recentPayouts] =
      await Promise.all([
        this.prisma.payout.findFirst({
          where: {
            vendorId,
            status: { in: ['PROCESSED', 'PAID'] },
          },
          orderBy: { createdAt: 'desc' },
          select: { amount: true, createdAt: true, paidAt: true },
        }),
        this.prisma.payout.aggregate({
          where: { vendorId, status: 'PENDING' },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.payout.groupBy({
          by: ['status'],
          where: { vendorId },
          _count: true,
          _sum: { amount: true },
        }),
        this.prisma.payout.findMany({
          where: { vendorId },
          select: {
            id: true,
            amount: true,
            status: true,
            orderId: true,
            periodStart: true,
            periodEnd: true,
            paidAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ]);

    const totalSettled = Number(
      statusBreakdown
        .filter((s) => s.status === 'PROCESSED' || s.status === 'PAID')
        .reduce((sum, s) => sum + Number(s._sum.amount || 0), 0),
    );

    const totalPending = Number(pendingAgg._sum.amount || 0);
    const pendingCount = pendingAgg._count;

    return {
      vendor: {
        id: vendor.id,
        storeName: vendor.storeName,
        storeType: vendor.storeType,
        commissionPct: vendor.commissionPct,
        zoneId: vendor.zoneId,
      },
      settlement: {
        totalSettled,
        totalPending,
        pendingCount,
        lastPaidAt: lastPaidPayout?.paidAt || lastPaidPayout?.createdAt || null,
        lastPaidAmount: lastPaidPayout ? Number(lastPaidPayout.amount) : null,
      },
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count,
        totalAmount: Number(s._sum.amount || 0),
      })),
      recentPayouts: recentPayouts.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        orderId: p.orderId,
        period:
          p.periodStart && p.periodEnd
            ? `${p.periodStart.toISOString().split('T')[0]} – ${p.periodEnd.toISOString().split('T')[0]}`
            : null,
        paidAt: p.paidAt ? p.paidAt.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
      })),
    };
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
}
