import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private async findVendorByUserId(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('You need a vendor profile to manage products');
    return vendor;
  }

  async create(userId: string, dto: CreateProductDto) {
    const vendor = await this.findVendorByUserId(userId);

    // Verify category exists
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    return this.prisma.product.create({
      data: {
        vendorId: vendor.id,
        name: dto.name,
        description: dto.description || null,
        categoryId: dto.categoryId,
        subCategoryId: dto.subCategoryId || null,
        brandId: dto.brandId || null,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice || null,
        unit: dto.unit,
        stock: dto.stock,
        images: dto.images || [],
        isActive: dto.isActive ?? true,
      },
      include: {
        category: { select: { name: true } },
        vendor: { select: { storeName: true } },
      },
    });
  }

  async findAll(query: QueryProductsDto) {
    const {
      storeType,
      categoryId,
      vendorId,
      minPrice,
      maxPrice,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (storeType) {
      where.vendor = { storeType };
    }
    if (categoryId) where.categoryId = categoryId;
    if (vendorId) where.vendorId = vendorId;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    } else {
      // By default, show only active products for public browsing
      where.isActive = true;
    }

    const skip = (page - 1) * limit;

    const orderBy: any = {};
    const validSortFields = ['price', 'name', 'createdAt', 'stock'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    orderBy[field] = sortOrder === 'asc' ? 'asc' : 'desc';

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          vendor: { select: { id: true, storeName: true, storeSlug: true } },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true, storeType: true } },
        subCategory: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        vendor: {
          select: {
            id: true,
            storeName: true,
            storeSlug: true,
            logoUrl: true,
            status: true,
          },
        },
        variants: true,
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, avatarUrl: true } } },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(userId: string, productId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    // Verify ownership: vendor owns this product or user is admin
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor || vendor.id !== product.vendorId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== 'ADMIN') {
        throw new ForbiddenException('You can only update your own products');
      }
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: dto,
      include: {
        category: { select: { name: true } },
        vendor: { select: { storeName: true } },
      },
    });
  }

  async remove(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor || vendor.id !== product.vendorId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== 'ADMIN') {
        throw new ForbiddenException('You can only delete your own products');
      }
    }

    // Soft delete
    return this.prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
  }

  async getVendorStats(vendorId: string) {
    const [total, active, inactive] = await Promise.all([
      this.prisma.product.count({ where: { vendorId } }),
      this.prisma.product.count({ where: { vendorId, isActive: true } }),
      this.prisma.product.count({ where: { vendorId, isActive: false } }),
    ]);

    return { total, active, inactive };
  }
}
