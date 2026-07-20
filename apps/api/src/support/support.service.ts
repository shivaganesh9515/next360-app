import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: { subject: string; message: string; category?: string; orderId?: string }) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        message: dto.message,
        category: dto.category || "OTHER",
        orderId: dto.orderId || null,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async findAll(status?: string, page = 1, limit = 20) {
    const where: any = {};
    if (status) where.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where, skip, take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        replies: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket;
  }

  async assign(id: string, assignedToId: string) {
    const ticket = await this.findOne(id);
    return this.prisma.supportTicket.update({
      where: { id },
      data: { assignedToId, status: "ASSIGNED" },
    });
  }

  async addReply(ticketId: string, userId: string, message: string) {
    return this.prisma.ticketReply.create({
      data: { ticketId, userId, message },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status },
    });
  }

  async getMyTickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      include: { replies: { take: 1, orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "desc" },
    });
  }
}
