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

// Valid order status transitions (status machine)
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

function generateOrderNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `N360-${timestamp}-${random}`;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an order from the user's current cart.
   * Groups items by vendor, creates OrderVendorGroup records,
   * clears cart on success.
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

      // Calculate discount
      const subtotal = cartItems.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0,
      );

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

    // Calculate totals
    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );
    const totalAmount = Math.max(0, subtotal - discountAmount);

    // Create order with vendor groups and items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNo: generateOrderNo(),
          userId,
          addressId: dto.addressId,
          totalAmount,
          paymentMethod: dto.paymentMethod,
          status: 'PLACED',
          notes: dto.notes || null,
          vendorGroups: {
            create: Array.from(vendorGroups.entries()).map(([vendorId, items]) => ({
              vendorId,
              subtotal: items.reduce(
                (sum, item) => sum + Number(item.product.price) * item.quantity,
                0,
              ),
              status: 'PLACED',
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
   * Get a single order by ID.
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

    return order;
  }

  /**
   * Update order status (status machine with validation).
   * ADMIN and VENDOR can update status for their relevant orders/vendor groups.
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
          include: { vendor: true },
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

      // Validate status transition
      if (!VALID_TRANSITIONS[group.status]?.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from ${group.status} to ${dto.status}`,
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
    // Only ADMIN can update the main order status (or vendor for their groups)
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update order status');
    }

    // Validate transition
    if (!VALID_TRANSITIONS[order.status]?.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status as OrderStatus,
        paymentStatus: dto.status === 'DELIVERED' ? 'PAID' : order.paymentStatus,
      },
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
   * Cancel an order (or specific vendor group within an order).
   */
  async cancel(userId: string, role: string, orderId: string, vendorGroupId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendorGroups: true,
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

      return this.prisma.orderVendorGroup.update({
        where: { id: vendorGroupId },
        data: { status: 'CANCELLED' },
      });
    }

    // Cancel entire order
    if (order.status !== 'PLACED' && order.status !== 'CONFIRMED') {
      throw new BadRequestException('Cannot cancel order at this stage');
    }

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
