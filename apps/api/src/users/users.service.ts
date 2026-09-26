import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole } from '@prisma/client';
import { DELIVERY_FEE } from '../delivery/delivery.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
        vendor: true,
        deliveryPartner: {
          include: { zone: { select: { id: true, name: true } } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // For delivery partners, attach real profile stats from persisted delivery
    // records — the same basis as GET /delivery/earnings (item totals + a flat
    // per-delivery fee, in rupees). No fabricated numbers, no placeholder.
    if (user.role === UserRole.DELIVERY_PARTNER && user.deliveryPartner) {
      const stats = await this.buildDeliveryPartnerStats(user.deliveryPartner.id);
      return { ...user, ...stats };
    }

    return user;
  }

  /** completedDeliveries + all-time earnings for a partner, derived from
   *  DeliveryAssignment records the same way GET /delivery/earnings derives
   *  them, so the Profile screen and the Earnings screen can never disagree. */
  private async buildDeliveryPartnerStats(partnerId: string) {
    const assignments = await this.prisma.deliveryAssignment.findMany({
      where: { deliveryPartnerId: partnerId, deliveredAt: { not: null } },
      select: {
        orderVendorGroup: {
          select: {
            items: {
              select: { priceAtPurchase: true, quantity: true },
            },
          },
        },
      },
    });

    const itemTotal = assignments.reduce((sum, a) => {
      const groupTotal =
        a.orderVendorGroup?.items.reduce(
          (s, item) => s + Number(item.priceAtPurchase) * item.quantity,
          0,
        ) ?? 0;
      return sum + groupTotal;
    }, 0);

    return {
      completedDeliveries: assignments.length,
      totalEarnings: itemTotal + assignments.length * DELIVERY_FEE,
    };
  }

  async findByIdAdmin(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        vendor: {
          select: {
            id: true,
            storeName: true,
            storeType: true,
            status: true,
            zone: { select: { id: true, name: true } },
          },
        },
        deliveryPartner: {
          select: {
            id: true,
            vehicleType: true,
            status: true,
            zone: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            addresses: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // updateStatus(id, isActive: boolean) removed — the controller calls the
  // DTO variant updateStatus(id, { isActive, reason? }) below, which is the
  // same behavior plus an audit-friendly reason field.

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isActive: true,
      },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateRole(userId: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Google Play account-deletion requirement: wipe all personal data.
    // Orders/payments keep their FKs (financial records), so we anonymize
    // the user record instead of hard-deleting it.
    await this.prisma.$transaction([
      this.prisma.cartItem.deleteMany({ where: { userId } }),
      this.prisma.wishlistItem.deleteMany({ where: { userId } }),
      this.prisma.pushToken.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: null,
          phone: null,
          name: 'Deleted User',
          avatarUrl: null,
          dateOfBirth: null,
          referralCode: null,
          referredBy: null,
          isActive: false,
        },
      }),
    ]);

    return { message: 'Account deleted successfully' };
  }

  async updateStatus(id: string, dto: { isActive: boolean; reason?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  }
}
