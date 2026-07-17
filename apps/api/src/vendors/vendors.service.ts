import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { StoreType } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async register(userId: string, dto: CreateVendorDto) {
    const existing = await this.prisma.vendor.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('User already has a vendor profile');
    }

    const slugExists = await this.prisma.vendor.findUnique({ where: { storeSlug: dto.storeSlug } });
    if (slugExists) {
      throw new ConflictException('Store slug is already taken');
    }

    // Find a zone for this vendor (default to first active zone or create one)
    let zoneId = dto.zoneId;
    if (!zoneId) {
      const defaultZone = await this.prisma.zone.findFirst({ where: { isActive: true } });
      if (!defaultZone) {
        // Create a default zone if none exists
        const zone = await this.prisma.zone.create({
          data: { name: 'Default Zone', city: 'Default', isActive: true },
        });
        zoneId = zone.id;
      } else {
        zoneId = defaultZone.id;
      }
    }

    // Update user role to VENDOR
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'VENDOR' },
    });

    return this.prisma.vendor.create({
      data: {
        userId,
        storeName: dto.storeName,
        storeSlug: dto.storeSlug,
        description: dto.description || null,
        storeType: dto.storeType,
        zoneId,
        status: 'PENDING',
      },
    });
  }

  async findAll(storeType?: StoreType, isApproved?: boolean) {
    const where: any = {};
    if (storeType) where.storeType = storeType;
    if (isApproved !== undefined) where.status = isApproved ? 'APPROVED' : 'PENDING';

    return this.prisma.vendor.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        zone: { select: { name: true, city: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, avatarUrl: true } },
        zone: true,
        _count: { select: { products: true } },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(id: string, dto: UpdateVendorDto, requestingUserId: string) {
    const vendor = await this.findOne(id);

    // Only vendor owner or admin can update
    if (vendor.userId !== requestingUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
      if (!user || user.role !== 'ADMIN') {
        throw new ForbiddenException('You can only update your own vendor profile');
      }
    }

    return this.prisma.vendor.update({ where: { id }, data: dto });
  }

  async approve(id: string) {
    const vendor = await this.findOne(id);
    return this.prisma.vendor.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async getStorefrontVendors(storeType: StoreType) {
    return this.prisma.vendor.findMany({
      where: { storeType, status: 'APPROVED' },
      include: {
        user: { select: { name: true, avatarUrl: true } },
        _count: { select: { products: true } },
      },
    });
  }

  async getVendorProducts(vendorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { vendorId },
        skip,
        take: limit,
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where: { vendorId } }),
    ]);

    return {
      data: products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getVendorByUserId(userId: string) {
    return this.prisma.vendor.findUnique({
      where: { userId },
      include: { zone: true },
    });
  }

  async getVendorPayouts(vendorId: string) {
    const payouts = await this.prisma.payout.findMany({
      where: { vendorId },
      select: {
        id: true,
        amount: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        paidAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return payouts.map((p) => ({ ...p, initiatedAt: p.createdAt }));
  }

  async getAnalytics(vendorId: string) {
    const where = { vendorId };

    const [orderGroups, statusCounts, monthlyRevenue, recentOrders, productCounts] =
      await Promise.all([
        this.prisma.orderVendorGroup.findMany({
          where: { vendorId, order: { status: { notIn: ['CANCELLED', 'REFUNDED'] } } },
          select: { subtotal: true, status: true, order: { select: { createdAt: true } } },
        }),
        this.prisma.orderVendorGroup.groupBy({
          by: ['status'],
          where: { vendorId },
          _count: true,
        }),
        this.prisma.orderVendorGroup.findMany({
          where: { vendorId, order: { status: { notIn: ['CANCELLED', 'REFUNDED'] } } },
          select: { subtotal: true, order: { select: { createdAt: true } } },
        }),
        this.prisma.orderVendorGroup.findMany({
          where: { vendorId },
          include: {
            order: { select: { id: true, orderNo: true, status: true, createdAt: true } },
            items: { select: { name: true, priceAtPurchase: true, quantity: true } },
          },
          orderBy: { order: { createdAt: 'desc' } },
          take: 10,
        }),
        this.prisma.product.groupBy({
          by: ['isApproved'],
          where,
          _count: true,
        }),
      ]);

    const totalOrders = orderGroups.length;
    const totalRevenue = orderGroups.reduce(
      (sum, g) => sum + Number(g.subtotal),
      0,
    );
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const monthlyMap = new Map<string, { orders: number; revenue: number }>();
    for (const g of monthlyRevenue) {
      const key = g.order.createdAt.toISOString().slice(0, 7);
      const entry = monthlyMap.get(key) || { orders: 0, revenue: 0 };
      entry.orders++;
      entry.revenue += Number(g.subtotal);
      monthlyMap.set(key, entry);
    }

    const orderStatusBreakdown: Record<string, number> = {};
    for (const s of statusCounts) {
      orderStatusBreakdown[s.status] = s._count;
    }

    const productStatusBreakdown: Record<string, number> = {};
    for (const p of productCounts) {
      productStatusBreakdown[p.isApproved ? 'approved' : 'pending'] = p._count;
    }

    const uniqueCustomerIds = new Set(
      (
        await this.prisma.orderVendorGroup.findMany({
          where: { vendorId },
          select: {
            order: { select: { userId: true } },
          },
        })
      ).map((g) => g.order.userId),
    );

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      orderStatusBreakdown,
      productStatusBreakdown,
      totalCustomers: uniqueCustomerIds.size,
      recentOrders: recentOrders.map((g) => ({
        id: g.order.id,
        orderNo: g.order.orderNo,
        status: g.order.status,
        subtotal: g.subtotal,
        items: g.items,
        createdAt: g.order.createdAt,
      })),
      monthlyRevenue: Array.from(monthlyMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };
  }

  async getEarnings(vendorId: string) {
    const commissions = await this.prisma.commission.findMany({
      where: { vendorId },
      select: { commissionAmount: true, isPaid: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalEarnings = commissions.reduce(
      (sum, c) => sum + Number(c.commissionAmount),
      0,
    );
    const paidEarnings = commissions
      .filter((c) => c.isPaid)
      .reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const pendingEarnings = totalEarnings - paidEarnings;

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { commissionPct: true },
    });

    return {
      totalEarnings,
      paidEarnings,
      pendingEarnings,
      commissionRate: vendor?.commissionPct ?? 10,
      totalOrders: commissions.length,
    };
  }

  async getTransactions(vendorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [groups, total] = await Promise.all([
      this.prisma.orderVendorGroup.findMany({
        where: { vendorId },
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
              user: { select: { id: true, name: true, email: true } },
            },
          },
          items: { select: { name: true, priceAtPurchase: true, quantity: true } },
        },
        orderBy: { order: { createdAt: 'desc' } },
        skip,
        take: limit,
      }),
      this.prisma.orderVendorGroup.count({ where: { vendorId } }),
    ]);

    const items = groups.map((g) => ({
      id: g.id,
      orderId: g.order.id,
      orderNo: g.order.orderNo,
      subtotal: g.subtotal,
      paymentMethod: g.order.paymentMethod,
      paymentStatus: g.order.paymentStatus,
      orderStatus: g.order.status,
      customer: g.order.user,
      items: g.items,
      createdAt: g.order.createdAt,
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCustomers(vendorId: string) {
    const orderGroups = await this.prisma.orderVendorGroup.findMany({
      where: { vendorId },
      select: {
        subtotal: true,
        order: {
          select: {
            userId: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { order: { createdAt: 'desc' } },
    });

    const customerMap = new Map<
      string,
      {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
        totalOrders: number;
        totalSpent: number;
        lastOrderDate: Date;
      }
    >();

    for (const g of orderGroups) {
      const u = g.order.user;
      if (!u) continue;
      const existing = customerMap.get(u.id);
      if (existing) {
        existing.totalOrders++;
        existing.totalSpent += Number(g.subtotal);
        if (g.order.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = g.order.createdAt;
        }
      } else {
        customerMap.set(u.id, {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          totalOrders: 1,
          totalSpent: Number(g.subtotal),
          lastOrderDate: g.order.createdAt,
        });
      }
    }

    return Array.from(customerMap.values()).sort(
      (a, b) => b.totalSpent - a.totalSpent,
    );
  }

  async getVendorStats(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        user: { select: { id: true, email: true, name: true } },
        zone: { select: { id: true, name: true, city: true } },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const [orderGroups, productCounts, payoutSummary] = await Promise.all([
      this.prisma.orderVendorGroup.findMany({
        where: { vendorId },
        select: { subtotal: true, status: true, order: { select: { status: true } } },
      }),
      this.prisma.product.groupBy({
        by: ['isApproved', 'isActive'],
        where: { vendorId },
        _count: true,
      }),
      this.prisma.payout.aggregate({
        where: { vendorId },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalOrders = orderGroups.length;
    const totalRevenue = orderGroups
      .filter((g) => !['CANCELLED', 'REFUNDED'].includes(g.order.status))
      .reduce((sum, g) => sum + Number(g.subtotal), 0);

    const productBreakdown: Record<string, number> = {};
    for (const p of productCounts) {
      const key = p.isApproved ? 'approved' : 'pending';
      productBreakdown[key] = (productBreakdown[key] || 0) + p._count;
    }

    return {
      vendor: {
        id: vendor.id,
        storeName: vendor.storeName,
        storeType: vendor.storeType,
        status: vendor.status,
        commissionPct: vendor.commissionPct,
        user: vendor.user,
        zone: vendor.zone,
      },
      totalOrders,
      totalRevenue,
      totalProducts: productCounts.reduce((s, p) => s + p._count, 0),
      productBreakdown,
      totalPayouts: payoutSummary._count,
      totalPayoutAmount: Number(payoutSummary._sum.amount ?? 0),
    };
  }
}
