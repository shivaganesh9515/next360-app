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
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

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

    const mapped = payouts.map((p) => ({
      period:
        p.periodStart && p.periodEnd
          ? `${p.periodStart.toISOString().split('T')[0]} – ${p.periodEnd.toISOString().split('T')[0]}`
          : p.createdAt.toISOString().split('T')[0],
      amount: Number(p.amount),
      status: p.status === 'PROCESSED' || p.status === 'PAID' ? 'PAID' : p.status,
      initiatedAt: p.createdAt.toISOString(),
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    }));

    return mapped;
  }

  async getVendorEarnings(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const wherePaidNonCancelled = {
      vendorId,
      order: {
        paymentStatus: 'PAID' as const,
        status: { notIn: ['CANCELLED', 'REFUNDED'] as const },
      },
    };

    const [todayAgg, monthAgg, lifetimeAgg, paidAgg, unpaidAgg, recentCommissions] =
      await this.prisma.$transaction([
        this.prisma.commission.aggregate({
          where: {
            ...wherePaidNonCancelled,
            createdAt: { gte: startOfToday, lte: now },
          },
          _sum: { orderAmount: true, commissionAmount: true },
          _count: true,
        }),
        this.prisma.commission.aggregate({
          where: {
            ...wherePaidNonCancelled,
            createdAt: { gte: startOfMonth, lte: now },
          },
          _sum: { orderAmount: true, commissionAmount: true },
        }),
        this.prisma.commission.aggregate({
          where: wherePaidNonCancelled,
          _sum: { orderAmount: true, commissionAmount: true },
        }),
        this.prisma.commission.aggregate({
          where: { ...wherePaidNonCancelled, isPaid: true },
          _sum: { orderAmount: true, commissionAmount: true },
        }),
        this.prisma.commission.aggregate({
          where: { ...wherePaidNonCancelled, isPaid: false },
          _sum: { orderAmount: true, commissionAmount: true },
        }),
        this.prisma.commission.findMany({
          where: wherePaidNonCancelled,
          select: {
            orderAmount: true,
            commissionAmount: true,
            isPaid: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ]);

    const toNet = (agg: { orderAmount: any; commissionAmount: any }) =>
      Number(agg.orderAmount || 0) - Number(agg.commissionAmount || 0);

    const historyMap = new Map<string, { amount: number; isPaid: boolean }>();
    for (const c of recentCommissions) {
      const dateStr = c.createdAt.toISOString().split('T')[0];
      const existing = historyMap.get(dateStr);
      const net = Number(c.orderAmount) - Number(c.commissionAmount);
      if (existing) {
        existing.amount += net;
        existing.isPaid = existing.isPaid && c.isPaid;
      } else {
        historyMap.set(dateStr, { amount: net, isPaid: c.isPaid });
      }
    }
    const history = Array.from(historyMap.entries()).map(([date, data]) => ({
      period: date,
      amount: data.amount,
      status: data.isPaid ? 'PAID' : 'PENDING',
    }));

    return {
      todayEarnings: toNet(todayAgg._sum),
      totalEarnings: toNet(lifetimeAgg._sum),
      thisMonth: toNet(monthAgg._sum),
      pending: toNet(unpaidAgg._sum),
      paid: toNet(paidAgg._sum),
      pendingPayout: toNet(unpaidAgg._sum),
      history,
    };
  }

  /**
   * Get vendor transactions — one entry per completed order's vendor group.
   * Each transaction shows only the vendor's net amount (never commission details).
   *
   * Filtered by vendorId for security. Supports pagination and date range.
   * Defaults to today's date range when no dates are provided.
   */
  async getVendorTransactions(
    vendorId: string,
    query: { page?: number; limit?: number; startDate?: string; endDate?: string },
  ) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startFilter: Date;
    let endFilter: Date;

    if (query.startDate || query.endDate) {
      startFilter = query.startDate ? new Date(query.startDate) : startOfToday;
      endFilter = query.endDate ? new Date(query.endDate) : now;
      if (query.endDate) {
        endFilter.setHours(23, 59, 59, 999);
      }
    } else {
      startFilter = startOfToday;
      endFilter = now;
    }

    const where: any = {
      vendorId,
      createdAt: { gte: startFilter, lte: endFilter },
      order: {
        paymentStatus: 'PAID',
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
    };

    const [commissions, total] = await this.prisma.$transaction([
      this.prisma.commission.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNo: true,
              status: true,
              paymentStatus: true,
              paymentMethod: true,
              createdAt: true,
              user: {
                select: { name: true, phone: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.commission.count({ where }),
    ]);

    const transactions = commissions.map((c) => ({
      orderNo: c.order.orderNo,
      customer: c.order.user?.name || 'Customer',
      amount: Number(c.orderAmount) - Number(c.commissionAmount),
      type: c.order.status === 'REFUNDED' ? 'REFUND' : 'SALE',
      date: c.createdAt,
    }));

    return { success: true, data: transactions, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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
