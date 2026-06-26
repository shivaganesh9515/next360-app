import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReturnDto, ProcessReturnDto } from './dto/return.dto';

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReturnDto) {
    // Verify order exists and belongs to user
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('Only delivered orders can be returned');
    }

    // Check if return already exists
    const existing = await this.prisma.returnRequest.findFirst({
      where: { orderId: dto.orderId, userId },
    });
    if (existing) {
      throw new BadRequestException('Return request already exists for this order');
    }

    return this.prisma.returnRequest.create({
      data: {
        orderId: dto.orderId,
        userId,
        reason: dto.reason,
        refundAmount: order.totalAmount,
      },
      include: { order: true },
    });
  }

  async findAll(userId: string, role: string) {
    const where: any = {};

    // Customers see only their returns
    if (role === 'CUSTOMER') {
      where.userId = userId;
    }

    return this.prisma.returnRequest.findMany({
      where,
      include: {
        order: { select: { id: true, orderNo: true, totalAmount: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ret = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          select: { id: true, orderNo: true, totalAmount: true, status: true },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!ret) throw new NotFoundException('Return request not found');
    return ret;
  }

  async process(id: string, dto: ProcessReturnDto) {
    const ret = await this.findOne(id);

    if (ret.status !== 'PENDING') {
      throw new BadRequestException(`Return is already ${ret.status.toLowerCase()}`);
    }

    return this.prisma.returnRequest.update({
      where: { id },
      data: {
        status: dto.status,
        refundAmount: dto.refundAmount ?? ret.refundAmount,
      },
    });
  }
}
