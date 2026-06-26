import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Check if user already reviewed this product
    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    return this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        isVerifiedPurchase: false, // Can be updated via order verification
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async findByProduct(productId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total, aggregate] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.review.count({ where: { productId } }),
      this.prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      averageRating: aggregate._avg.rating
        ? Number(aggregate._avg.rating.toFixed(1))
        : 0,
      ratingsCount: aggregate._count.rating,
    };
  }

  async findByUser(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, name: true, images: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { reviews, count: reviews.length };
  }

  async delete(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.delete({ where: { id: reviewId } });
    return { message: 'Review deleted' };
  }
}
