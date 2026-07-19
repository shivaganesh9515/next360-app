import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InventoryQueryDto, LowStockQueryDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: InventoryQueryDto, vendorId?: string) {
    const where: any = {};

    if (vendorId) {
      where.vendorId = vendorId;
    } else if (query.vendorId) {
      where.vendorId = query.vendorId;
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          stock: true,
          unit: true,
          isActive: true,
          vendor: { select: { id: true, storeName: true } },
          category: { select: { id: true, name: true } },
          variants: {
            select: {
              id: true,
              name: true,
              sku: true,
              stock: true,
              price: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
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

  async updateStock(productId: string, quantity: number, userRole: string, userVendorId?: string) {
    if (!Number.isInteger(quantity)) {
      throw new BadRequestException('Stock quantity must be an integer');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    if (quantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    if (userRole === 'VENDOR' && product.vendorId !== userVendorId) {
      throw new ForbiddenException('You can only update stock for your own products');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { stock: quantity },
      select: {
        id: true,
        name: true,
        stock: true,
        unit: true,
      },
    });

    // Send low stock notification if below threshold
    const LOW_STOCK_THRESHOLD = 10;
    if (updated.stock <= LOW_STOCK_THRESHOLD && updated.stock > 0) {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: product.vendorId },
      });
      if (vendor) {
        this.notificationsService
          .sendLowStockNotification(vendor.userId, updated.name, updated.stock, LOW_STOCK_THRESHOLD)
          .catch(() => {});
      }
    } else if (updated.stock === 0) {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: product.vendorId },
      });
      if (vendor) {
        this.notificationsService
          .sendOutOfStockNotification(vendor.userId, updated.name)
          .catch(() => {});
      }
    }

    return updated;
  }

  async getLowStock(query: LowStockQueryDto, vendorId?: string) {
    const threshold = query.threshold || 10;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      stock: { lt: threshold },
      isActive: true,
    };

    if (vendorId) {
      where.vendorId = vendorId;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          stock: true,
          unit: true,
          vendor: { select: { id: true, storeName: true } },
        },
        orderBy: { stock: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
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
