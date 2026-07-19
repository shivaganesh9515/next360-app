import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(userId: string, dto: {
    subject: string;
    description: string;
    orderId?: string;
    priority?: string;
  }) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        description: dto.description,
        orderId: dto.orderId || null,
        priority: dto.priority || 'MEDIUM',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        messages: true,
      },
    });
  }

  async getMyTickets(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: { select: { id: true, name: true, role: true } } },
          },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where: { userId } }),
    ]);

    return {
      data: tickets,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTicketDetail(userId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.userId !== userId) throw new ForbiddenException('Access denied');

    return ticket;
  }

  async addMessage(userId: string, ticketId: string, body: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.userId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.ticketMessage.create({
      data: { ticketId, senderId: userId, body },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
  }

  // ─── Admin Methods ──────────────────────────────────────────────────────

  async getAllTickets(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: { select: { id: true, name: true, role: true } } },
          },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    const statusCounts = await this.prisma.supportTicket.groupBy({
      by: ['status'],
      _count: true,
    });

    return {
      data: tickets,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        statusCounts: statusCounts.map((s) => ({
          status: s.status,
          count: s._count,
        })),
      },
    };
  }

  async adminGetTicketDetail(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async adminReply(adminId: string, ticketId: string, body: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    const message = await this.prisma.ticketMessage.create({
      data: { ticketId, senderId: adminId, body },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    if (ticket.status === 'OPEN') {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return message;
  }

  async updateStatus(ticketId: string, status: TicketStatus) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, role: true } } },
        },
      },
    });
  }

  async assignTicket(ticketId: string, assignedToId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    const assignee = await this.prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!assignee) throw new NotFoundException('Assignee not found');

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId,
        status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, role: true } } },
        },
      },
    });
  }
}
