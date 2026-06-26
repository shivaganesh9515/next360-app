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
}
