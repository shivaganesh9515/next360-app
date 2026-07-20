import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string, page = 1, limit = 20) {
    const where: any = {};
    if (status) where.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.payout.findMany({
        where, skip, take: limit,
        include: {
          vendor: { select: { id: true, storeName: true } },
          deliveryPartner: { select: { id: true, vehicleType: true, user: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.payout.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findVendorPayouts(vendorId?: string, status?: string, page = 1, limit = 20) {
    const where: any = { vendorId: { not: null } };
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.payout.findMany({
        where, skip, take: limit,
        include: { vendor: { select: { id: true, storeName: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.payout.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findDeliveryPayouts(page = 1, limit = 20) {
    const where = { deliveryPartnerId: { not: null } };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.payout.findMany({
        where, skip, take: limit,
        include: { deliveryPartner: { select: { id: true, vehicleType: true, user: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.payout.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.payout.update({
      where: { id },
      data: { status, paidAt: status === "PAID" ? new Date() : undefined },
    });
  }

  async getSummary() {
    const [vendorPayouts, deliveryPayouts] = await Promise.all([
      this.prisma.payout.aggregate({
        where: { vendorId: { not: null } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payout.aggregate({
        where: { deliveryPartnerId: { not: null } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);
    return {
      vendorPayouts: { total: Number(vendorPayouts._sum.amount || 0), count: vendorPayouts._count },
      deliveryPayouts: { total: Number(deliveryPayouts._sum.amount || 0), count: deliveryPayouts._count },
    };
  }
}
