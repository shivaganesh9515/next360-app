import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  private razorpay: any;

  constructor(private readonly prisma: PrismaService) {
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

        return { received: true, status: 'captured' };
      }

      case 'payment.failed': {
        const failedPayment = webhookDto.payload.payment?.entity;
        if (!failedPayment) throw new BadRequestException('Invalid webhook payload');

        await this.prisma.payment.updateMany({
          where: { razorpayOrderId: failedPayment.order_id },
          data: { status: 'FAILED' },
        });

        await this.prisma.order.updateMany({
          where: { razorpayOrderId: failedPayment.order_id },
          data: { paymentStatus: 'FAILED' },
        });

        return { received: true, status: 'failed' };
      }

      case 'order.paid': {
        // Handle order-level payment success (for full order payments)
        return { received: true, status: 'order_paid' };
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
}
