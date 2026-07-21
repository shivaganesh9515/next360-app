import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(startDate?: string, endDate?: string, page = 1, limit = 20) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vendorGroups: { select: { subtotal: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map(o => ({
        id: o.id, orderNo: o.orderNo, amount: Number(o.totalAmount),
        paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
        status: o.status, createdAt: o.createdAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getRevenueReport(startDate?: string, endDate?: string) {
    const where: any = { paymentStatus: 'PAID' };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const result = await this.prisma.order.aggregate({
      where,
      _sum: { totalAmount: true },
      _count: true,
    });

    return {
      totalRevenue: Number(result._sum.totalAmount || 0),
      totalOrders: result._count,
    };
  }
}
