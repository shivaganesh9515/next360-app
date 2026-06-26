import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto, UpdateOrderStatusDto } from './dto/order-query.dto';
import { OrderStatus } from '@prisma/client';

// Valid order status transitions (status machine) — 9-state model
const VALID_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.PLACED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  [OrderStatus.PACKED]: [OrderStatus.ASSIGNED_TO_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.ASSIGNED_TO_DELIVERY]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [],
};

const COD_MAX_AMOUNT = 2000; // ₹2,000 cap for COD orders

function generateOrderNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `N360-${timestamp}-${random}`;
}

function generateInvoiceNo(orderId: string): string {
  const year = new Date().getFullYear();
  const shortId = orderId.substring(0, 8).toUpperCase();
  return `INV-${year}-${shortId}`;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an order from the user's current cart.
   * Groups items by vendor, creates OrderVendorGroup records,
   * validates stock, applies COD cap, clears cart on success.
   */
  async create(userId: string, dto: CreateOrderDto) {
    // Validate address belongs to user
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) throw new NotFoundException('Address not found');

    // Fetch cart items with product + vendor info
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: { vendor: true },
        },
      },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate stock for each item
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}, requested: ${item.quantity}`,
        );
      }
    }

    // COD validation: total must be ≤ ₹2,000
    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    if (dto.paymentMethod === 'COD' && subtotal > COD_MAX_AMOUNT) {
      throw new BadRequestException(
        `COD orders are capped at ₹${COD_MAX_AMOUNT}. Please use Razorpay for orders above ₹${COD_MAX_AMOUNT}.`,
      );
    }

    // Validate coupon if provided
    let discountAmount = 0;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.couponCode.toUpperCase() },
      });
      if (!coupon) throw new NotFoundException('Coupon not found');
      if (!coupon.isActive) throw new BadRequestException('Coupon is expired or inactive');
      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        throw new BadRequestException('Coupon has expired');
      }
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new BadRequestException('Coupon usage limit reached');
      }

      if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
        throw new BadRequestException(
          `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
        );
      }

      if (coupon.type === 'PERCENTAGE') {
        discountAmount = (subtotal * Number(coupon.value)) / 100;
        if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
          discountAmount = Number(coupon.maxDiscount);
        }
      } else {
        discountAmount = Number(coupon.value);
      }

      // Increment coupon usage
      await this.prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Group items by vendor
    const vendorGroups = new Map<string, typeof cartItems>();
    for (const item of cartItems) {
      const vendorId = item.product.vendorId;
      if (!vendorGroups.has(vendorId)) {
        vendorGroups.set(vendorId, []);
      }
      vendorGroups.get(vendorId)!.push(item);
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    // For COD, automatically confirm the order
    const initialStatus = dto.paymentMethod === 'COD' ? 'CONFIRMED' : 'PLACED';

    // Create order with vendor groups and items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNo: generateOrderNo(),
          userId,
          addressId: dto.addressId,
          totalAmount,
          paymentMethod: dto.paymentMethod,
          status: initialStatus,
          notes: dto.notes || null,
          vendorGroups: {
            create: Array.from(vendorGroups.entries()).map(([vendorId, items]) => ({
              vendorId,
              subtotal: items.reduce(
                (sum, item) => sum + Number(item.product.price) * item.quantity,
                0,
              ),
              status: initialStatus,
              items: {
                create: items.map((item) => ({
                  productId: item.product.id,
                  name: item.product.name,
                  priceAtPurchase: item.product.price,
                  quantity: item.quantity,
                })),
              },
            })),
          },
        },
        include: {
          address: true,
          vendorGroups: {
            include: {
              vendor: { select: { id: true, storeName: true } },
              items: {
                include: { product: { select: { id: true, name: true, images: true } } },
              },
            },
          },
        },
      });

      // Decrement stock for each product
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId } });

      return created;
    });

    return order;
  }

  /**
   * Get all orders for the current user with pagination.
   * ADMIN sees all orders.
   */
  async findAll(userId: string, role: string, query: OrderQueryDto) {
    const where: any = {};
    if (role !== 'ADMIN') {
      where.userId = userId;
    }
    if (query.status) {
      where.status = query.status;
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          vendorGroups: {
            include: {
              vendor: { select: { id: true, storeName: true } },
              items: {
                include: { product: { select: { id: true, name: true, images: true } } },
              },
            },
          },
          address: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get order summary stats for the dashboard.
   */
  async getSummary(userId: string, role: string) {
    const where: any = {};
    if (role !== 'ADMIN') {
      where.userId = userId;
    }

    const [totalOrders, totalRevenue, statusCounts, recentOrders] =
      await this.prisma.$transaction([
        this.prisma.order.count({ where }),
        this.prisma.order.aggregate({
          where: { ...where, paymentStatus: 'PAID' },
          _sum: { totalAmount: true },
        }),
        this.prisma.order.groupBy({
          by: ['status'],
          where,
          orderBy: { status: 'asc' },
          _count: true,
        }),
        this.prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            orderNo: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      statusBreakdown: statusCounts.reduce(
        (acc, curr) => {
          acc[curr.status] = (curr._count as number) || 0;
          return acc;
        },
        {} as Record<string, number>,
      ),
      recentOrders,
    };
  }

  /**
   * Get a single order by ID with invoice data.
   */
  async findOne(userId: string, role: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendorGroups: {
          include: {
            vendor: { select: { id: true, storeName: true, storeSlug: true } },
            items: {
              include: { product: { select: { id: true, name: true, images: true } } },
            },
          },
        },
        address: true,
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        commissions: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Access control: user can only see their own orders (except ADMIN)
    if (role !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // For VENDOR role, verify they have items in this order
    if (role === 'VENDOR') {
      const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
      if (!vendor) throw new NotFoundException('Vendor profile not found');
      const hasItems = order.vendorGroups?.some((g: any) => g.vendorId === vendor.id) ?? false;
      if (!hasItems) throw new ForbiddenException('Access denied');
    }

    // Attach invoice data
    const invoice = this.generateInvoiceData(order);

    return { ...order, invoice };
  }

  /**
   * Generate invoice data for an order.
   */
  private generateInvoiceData(order: any) {
    const items = order.vendorGroups?.flatMap((g: any) =>
      g.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.priceAtPurchase),
        total: Number(item.priceAtPurchase) * item.quantity,
        vendor: g.vendor?.storeName || 'Unknown',
      })),
    ) || [];

    const subtotal = items.reduce((sum: number, i: any) => sum + i.total, 0);

    return {
      invoiceNumber: generateInvoiceNo(order.id),
      orderNumber: order.orderNo,
      invoiceDate: order.createdAt,
      customer: order.user
        ? { name: order.user.name, email: order.user.email, phone: order.user.phone }
        : null,
      deliveryAddress: order.address
        ? {
            line1: order.address.line1,
            line2: order.address.line2,
            city: order.address.city,
            state: order.address.state,
            pincode: order.address.pincode,
          }
        : null,
      items,
      subtotal,
      deliveryFee: 0,
      total: Number(order.totalAmount),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
    };
  }

  /**
   * Update order status (status machine with validation).
   */
  async updateStatus(
    userId: string,
    role: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
    vendorGroupId?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendorGroups: {
          include: { vendor: true, items: true },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // If targeting a specific vendor group
    if (vendorGroupId) {
      const group = order.vendorGroups.find((g) => g.id === vendorGroupId);
      if (!group) throw new NotFoundException('Vendor group not found');

      // VENDOR can only update their own vendor groups
      if (role === 'VENDOR' && group.vendor.userId !== userId) {
        throw new ForbiddenException('Access denied');
      }

      if (role !== 'ADMIN' && role !== 'VENDOR') {
        throw new ForbiddenException('Only vendors and admins can update order status');
      }

      // Validate status transition
      if (!VALID_TRANSITIONS[group.status]?.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition vendor group from ${group.status} to ${dto.status}`,
        );
      }

      return this.prisma.orderVendorGroup.update({
        where: { id: vendorGroupId },
        data: { status: dto.status as OrderStatus },
        include: {
          vendor: { select: { id: true, storeName: true } },
          items: true,
        },
      });
    }

    // Update the main order status
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update order status');
    }

    // Validate transition
    if (!VALID_TRANSITIONS[order.status]?.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition order from ${order.status} to ${dto.status}`,
      );
    }

    // Auto-update payment status when delivered
    const updateData: any = { status: dto.status as OrderStatus };
    if (dto.status === 'DELIVERED') {
      updateData.paymentStatus = 'PAID';
    }

    // If cancelling, restore stock for all items
    if (dto.status === 'CANCELLED') {
      await this.restoreStock(order.vendorGroups);
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        vendorGroups: {
          include: {
            vendor: { select: { id: true, storeName: true } },
            items: true,
          },
        },
        address: true,
      },
    });
  }

  /**
   * Restore product stock when order is cancelled.
   */
  private async restoreStock(vendorGroups: any[]) {
    for (const group of vendorGroups) {
      for (const item of group.items || []) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  }

  /**
   * Cancel an order (or specific vendor group within an order).
   * Restores product stock on cancellation.
   */
  async cancel(userId: string, role: string, orderId: string, vendorGroupId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendorGroups: {
          include: { items: true },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Access control
    if (role !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (vendorGroupId) {
      const group = order.vendorGroups.find((g) => g.id === vendorGroupId);
      if (!group) throw new NotFoundException('Vendor group not found');

      if (group.status !== 'PLACED' && group.status !== 'CONFIRMED') {
        throw new BadRequestException('Cannot cancel vendor group at this stage');
      }

      // Restore stock for items in this group
      for (const item of group.items || []) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return this.prisma.orderVendorGroup.update({
        where: { id: vendorGroupId },
        data: { status: 'CANCELLED' },
        include: { items: true },
      });
    }

    // Cancel entire order
    if (order.status !== 'PLACED' && order.status !== 'CONFIRMED') {
      throw new BadRequestException('Cannot cancel order at this stage');
    }

    // Restore stock for all items
    await this.restoreStock(order.vendorGroups);

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        vendorGroups: {
          updateMany: {
            where: { status: { in: ['PLACED', 'CONFIRMED'] } },
            data: { status: 'CANCELLED' },
          },
        },
      },
    });
  }

  /**
   * Get ordered list of status changes with timestamps for an order.
   * Uses the Order's createdAt and updatedAt fields to infer the timeline.
   * For full accuracy, a separate StatusLog model would be needed.
   */
  async getOrderStatusTimeline(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        paymentStatus: true,
        vendorGroups: {
          select: {
            id: true,
            status: true,
          },
        },
        payments: {
          select: { status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    const timeline: Array<{ event: string; timestamp: Date; status: string; groupId?: string }> = [
      {
        event: 'ORDER_PLACED',
        timestamp: order.createdAt,
        status: order.status,
      },
    ];

    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'FAILED') {
      const paymentEvent = order.payments[0];
      timeline.push({
        event: order.paymentStatus === 'PAID' ? 'PAYMENT_CAPTURED' : 'PAYMENT_FAILED',
        timestamp: paymentEvent?.createdAt || order.updatedAt,
        status: order.paymentStatus,
      });
    }

    for (const group of order.vendorGroups) {
      timeline.push({
        event: `VENDOR_GROUP_${group.status}`,
        timestamp: order.updatedAt,
        status: group.status,
        groupId: group.id,
      });
    }

    timeline.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return timeline;
  }

  /**
   * Get vendor-specific orders (for vendor dashboard).
   * Resolves the vendor ID from the authenticated user.
   */
  async findVendorOrders(userId: string, query: OrderQueryDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { vendorId: vendor.id };
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.orderVendorGroup.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNo: true,
              userId: true,
              status: true,
              createdAt: true,
              paymentMethod: true,
            },
          },
          items: {
            include: { product: { select: { id: true, name: true, images: true } } },
          },
        },
        orderBy: { order: { createdAt: 'desc' } },
        skip,
        take: limit,
      }),
      this.prisma.orderVendorGroup.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
