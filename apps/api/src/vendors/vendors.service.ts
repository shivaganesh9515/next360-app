import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { StoreType } from '@prisma/client';

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

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

    await this.prisma.user.updateMany({
      where: { id: userId, role: { not: 'ADMIN' } },
      data: { role: 'VENDOR' },
    });

    const vendor = await this.prisma.vendor.create({
      data: {
        userId,
        storeName: dto.storeName,
        storeSlug: dto.storeSlug,
        description: dto.description || null,
        storeType: dto.storeType,
        zoneId,
        status: 'PENDING',
        // FRD §40 default commission. Set explicitly so the rate does not
        // depend on the DB column default (schema migration to align the
        // column default is tracked separately).
        commissionPct: 15,
      },
    });

    // Send admin alert about new vendor registration
    try {
      await this.notificationsService.sendAdminNewVendorAlert(dto.storeName);
    } catch (error: any) {
      this.logger.error(`Admin new vendor alert failed: ${error.message}`);
    }

    return vendor;
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

  async updateStatus(id: string, status: string, adminId?: string) {
    const vendor = await this.findOne(id);
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      throw new BadRequestException(`Invalid status: ${status}. Must be one of ${validStatuses.join(', ')}`);
    }

    const newStatus = status.toUpperCase();
    const updated = await this.prisma.vendor.update({
      where: { id },
      data: { status: newStatus as any },
    });

    // Audit log: record who changed the status and what changed
    if (adminId) {
      await this.auditService.log({
        adminId,
        action: `${newStatus === 'APPROVED' ? 'APPROVE' : newStatus === 'REJECTED' ? 'REJECT' : 'SUSPEND'}_VENDOR`,
        resource: 'Vendor',
        resourceId: id,
        details: {
          storeName: vendor.storeName,
          oldStatus: vendor.status,
          newStatus,
        },
      });
    }

    // Notify vendor about status changes
    try {
      if (newStatus === 'APPROVED' && vendor.status !== 'APPROVED') {
        await this.notificationsService.sendVendorApprovedNotification(
          vendor.userId,
          vendor.storeName,
        );
      } else if (newStatus === 'REJECTED') {
        await this.notificationsService.sendVendorRejectedNotification(
          vendor.userId,
          vendor.storeName,
        );
      } else if (newStatus === 'SUSPENDED') {
        await this.notificationsService.sendVendorSuspendedNotification(
          vendor.userId,
          vendor.storeName,
        );
      }
    } catch (error: any) {
      this.logger.error(`Vendor status notification failed: ${error.message}`);
    }

    return updated;
  }

  /**
   * Admin dashboard aggregate — returns everything admin needs to review a vendor:
   * profile, KYC documents, performance stats, recent orders, commission info.
   * All queries run in parallel for minimal latency.
   */
  async getAdminDetail(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true, avatarUrl: true, createdAt: true, isActive: true } },
        zone: true,
        _count: { select: { products: true } },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    // Fetch KYC records associated with the vendor's user
    const kyc = await this.prisma.kYC.findUnique({
      where: { userId: vendor.userId },
    });

    const [orderAgg, productAgg, commissionAgg, recentOrders, payoutAgg, monthlyRevenue] =
      await Promise.all([
        // Total orders + revenue
        this.prisma.orderVendorGroup.aggregate({
          where: { vendorId: id },
          _count: true,
          _sum: { subtotal: true },
        }),

        // Product breakdown
        this.prisma.product.groupBy({
          by: ['isApproved', 'isActive'],
          where: { vendorId: id },
          _count: true,
        }),

        // Commission summary
        this.prisma.commission.aggregate({
          where: { vendorId: id },
          _sum: { commissionAmount: true, orderAmount: true },
          _count: true,
        }),

        // Recent orders (last 10 vendor groups)
        this.prisma.orderVendorGroup.findMany({
          where: { vendorId: id },
          include: {
            order: {
              select: {
                id: true, orderNo: true, status: true, paymentStatus: true,
                totalAmount: true, createdAt: true,
                user: { select: { name: true } },
              },
            },
            items: { select: { name: true, quantity: true, priceAtPurchase: true } },
          },
          orderBy: { order: { createdAt: 'desc' } },
          take: 10,
        }),

        // Payout summary
        this.prisma.payout.aggregate({
          where: { vendorId: id },
          _sum: { amount: true },
          _count: true,
        }),

        // Monthly revenue (last 6 months)
        this.prisma.orderVendorGroup.findMany({
          where: {
            vendorId: id,
            order: { status: { notIn: ['CANCELLED', 'REFUNDED'] } },
          },
          select: { subtotal: true, order: { select: { createdAt: true } } },
        }),
      ]);

    // Compute product breakdown
    const productBreakdown: Record<string, number> = {};
    for (const p of productAgg) {
      const key = p.isApproved ? 'approved' : 'pending';
      productBreakdown[key] = (productBreakdown[key] || 0) + p._count;
      if (!p.isActive) {
        productBreakdown['inactive'] = (productBreakdown['inactive'] || 0) + p._count;
      }
    }

    // Compute monthly revenue
    const monthlyMap = new Map<string, { orders: number; revenue: number }>();
    for (const g of monthlyRevenue) {
      const key = g.order.createdAt.toISOString().slice(0, 7);
      const entry = monthlyMap.get(key) || { orders: 0, revenue: 0 };
      entry.orders++;
      entry.revenue += Number(g.subtotal);
      monthlyMap.set(key, entry);
    }
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRevenueArray = Array.from(monthlyMap.entries())
      .filter(([month]) => month >= sixMonthsAgo.toISOString().slice(0, 7))
      .map(([month, data]) => ({ month, orders: data.orders, revenue: data.revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const totalOrders = orderAgg._count;
    const totalRevenue = Number(orderAgg._sum.subtotal || 0);
    const paidPayouts = Number(payoutAgg._sum.amount || 0);
    const totalCommissions = Number(commissionAgg._sum.commissionAmount || 0);
    const totalOrderAmount = Number(commissionAgg._sum.orderAmount || 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      vendor: {
        id: vendor.id,
        storeName: vendor.storeName,
        storeSlug: vendor.storeSlug,
        storeType: vendor.storeType,
        description: vendor.description,
        logoUrl: vendor.logoUrl,
        bannerUrl: vendor.bannerUrl,
        status: vendor.status,
        commissionPct: vendor.commissionPct,
        razorpayAccountId: vendor.razorpayAccountId,
        zone: vendor.zone,
        createdAt: vendor.createdAt,
      },
      owner: vendor.user,
      kyc: kyc || null,
      performance: {
        totalOrders,
        totalRevenue,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        totalProducts: Object.values(productBreakdown).reduce((s, c) => s + c, 0),
        productBreakdown,
        totalCommissions,
        totalOrderAmount,
        netRevenue: totalRevenue - totalCommissions,
        paidPayouts,
        pendingPayouts: totalRevenue - totalCommissions - paidPayouts,
      },
      recentOrders: recentOrders.map((g) => ({
        id: g.id,
        orderId: g.order.id,
        orderNo: g.order.orderNo,
        status: g.order.status,
        paymentStatus: g.order.paymentStatus,
        totalAmount: Number(g.order.totalAmount),
        subtotal: Number(g.subtotal),
        customerName: g.order.user?.name || 'Customer',
        items: g.items,
        createdAt: g.order.createdAt,
      })),
      monthlyRevenue: monthlyRevenueArray,
    };
  }

  async approve(id: string, adminId?: string) {
    const vendor = await this.findOne(id);
    if (vendor.status === 'APPROVED') {
      throw new ConflictException('Vendor is already approved');
    }

    const kyc = await this.prisma.kYC.findUnique({
      where: { userId: vendor.userId },
    });

    if (!kyc || kyc.status !== 'VERIFIED') {
      throw new BadRequestException(
        `Cannot approve vendor: KYC is ${kyc?.status?.toLowerCase() || 'not submitted'}. KYC must be VERIFIED before approval.`,
      );
    }

    const updated = await this.prisma.vendor.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    // Audit log for approval
    if (adminId) {
      this.auditService.log({
        adminId,
        action: 'APPROVE_VENDOR',
        resource: 'Vendor',
        resourceId: id,
        details: { storeName: vendor.storeName, oldStatus: vendor.status, newStatus: 'APPROVED' },
      });
    }

    // Notify vendor that they've been approved
    try {
      await this.notificationsService.sendVendorApprovedNotification(
        vendor.userId,
        vendor.storeName,
      );
    } catch (error: any) {
      this.logger.error(`Vendor approval notification failed: ${error.message}`);
    }

    return updated;
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
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

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

    return payouts.map((p) => ({
      period:
        p.periodStart && p.periodEnd
          ? `${p.periodStart.toISOString().split('T')[0]} – ${p.periodEnd.toISOString().split('T')[0]}`
          : p.createdAt.toISOString().split('T')[0],
      amount: Number(p.amount),
      status: p.status === 'PROCESSED' || p.status === 'PAID' ? 'PAID' : p.status,
      initiatedAt: p.createdAt.toISOString(),
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    }));
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

    // Delivery performance — average time from order creation to delivery
    const deliveredGroups = await this.prisma.orderVendorGroup.findMany({
      where: {
        vendorId,
        status: 'DELIVERED',
        delivery: { isNot: null },
      },
      select: {
        order: { select: { createdAt: true } },
        delivery: { select: { pickedUpAt: true, deliveredAt: true } },
      },
    });

    const deliveryTimes: number[] = [];
    for (const g of deliveredGroups) {
      if (g.delivery?.deliveredAt && g.order?.createdAt) {
        const mins = (g.delivery.deliveredAt.getTime() - g.order.createdAt.getTime()) / 60000;
        if (mins > 0 && mins < 300) deliveryTimes.push(mins); // skip outliers > 5h
      }
    }
    const avgDeliveryMins = deliveryTimes.length > 0
      ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length)
      : null;
    const fastestDelivery = deliveryTimes.length > 0 ? Math.round(Math.min(...deliveryTimes)) : null;
    const slowestDelivery = deliveryTimes.length > 0 ? Math.round(Math.max(...deliveryTimes)) : null;

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
      deliveryPerformance: {
        avgDeliveryMins,
        fastestDelivery,
        slowestDelivery,
        totalDelivered: deliveryTimes.length,
        configuredMin: (await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { deliveryTimeMin: true } }))?.deliveryTimeMin,
        configuredMax: (await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { deliveryTimeMax: true } }))?.deliveryTimeMax,
        configuredLabel: (await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { deliveryLabel: true } }))?.deliveryLabel,
      },
    };
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
        status: { notIn: ['CANCELLED', 'REFUNDED'] as ('CANCELLED' | 'REFUNDED')[] },
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
   * One entry per commission record, showing only the vendor's net amount (never the platform's cut).
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
