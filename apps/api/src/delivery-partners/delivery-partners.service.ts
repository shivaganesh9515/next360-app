import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryPartnerStatus } from '@prisma/client';

@Injectable()
export class DeliveryPartnersService {
  constructor(private prisma: PrismaService) {}

  private readonly statusMap: Record<string, DeliveryPartnerStatus> = {
    SUSPENDED: DeliveryPartnerStatus.OFFLINE,
    OFFLINE: DeliveryPartnerStatus.OFFLINE,
    AVAILABLE: DeliveryPartnerStatus.AVAILABLE,
    ON_DELIVERY: DeliveryPartnerStatus.ON_DELIVERY,
  };

  private readonly userSelect = {
    id: true,
    email: true,
    name: true,
    phone: true,
    avatarUrl: true,
  };

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }) {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      const mappedStatus = this.statusMap[status];
      if (mappedStatus) {
        where.status = mappedStatus;
      }
    }

    const [partners, total] = await Promise.all([
      this.prisma.deliveryPartner.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              ...this.userSelect,
              kyc: { select: { id: true, status: true, documentType: true } },
            },
          },
          zone: { select: { id: true, name: true, city: true } },
          _count: {
            select: {
              assignments: { where: { deliveredAt: { not: null } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deliveryPartner.count({ where }),
    ]);

    const mapped = partners.map((p) => ({
      id: p.id,
      userId: p.userId,
      user: p.user,
      vehicleType: p.vehicleType,
      zone: p.zone,
      status: p.status,
      currentLat: p.currentLat,
      currentLng: p.currentLng,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      completedDeliveries: p._count.assignments,
      rating: null,
    }));

    return {
      items: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            ...this.userSelect,
            kyc: {
              select: {
                id: true,
                status: true,
                documentType: true,
                documentNumber: true,
                submittedAt: true,
                verifiedAt: true,
              },
            },
          },
        },
        zone: true,
        _count: {
          select: {
            assignments: { where: { deliveredAt: { not: null } } },
          },
        },
      },
    });

    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }

    return {
      id: partner.id,
      userId: partner.userId,
      user: partner.user,
      vehicleType: partner.vehicleType,
      zone: partner.zone,
      status: partner.status,
      currentLat: partner.currentLat,
      currentLng: partner.currentLng,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
      completedDeliveries: partner._count.assignments,
      rating: null,
    };
  }

  async updateStatus(id: string, status: string) {
    const partner = await this.prisma.deliveryPartner.findUnique({ where: { id } });
    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }

    const mappedStatus = this.statusMap[status];
    if (!mappedStatus) {
      throw new BadRequestException(
        `Invalid status: ${status}. Valid statuses: OFFLINE, AVAILABLE, ON_DELIVERY`,
      );
    }

    return this.prisma.deliveryPartner.update({
      where: { id },
      data: { status: mappedStatus },
      include: {
        user: { select: this.userSelect },
        zone: { select: { id: true, name: true, city: true } },
      },
    });
  }
}
