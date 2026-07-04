import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      return { message: 'Notification not found' };
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    return { message: 'Marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }

  async create(
    userId: string,
    title: string,
    body: string,
    type = 'SYSTEM',
    data?: any,
  ) {
    return this.prisma.notification.create({
      data: { userId, title, body, type, data: data ?? undefined },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  // Push notification methods
  async registerPushToken(userId: string, expoPushToken: string) {
    // Check if token already exists
    const existing = await this.prisma.pushToken.findFirst({
      where: { userId, token: expoPushToken },
    });
    if (existing) {
      return { message: 'Push token already registered' };
    }
    await this.prisma.pushToken.create({
      data: { userId, token: expoPushToken, platform: 'unknown' },
    });
    return { message: 'Push token registered successfully' };
  }

  async unregisterPushToken(userId: string) {
    await this.prisma.pushToken.deleteMany({
      where: { userId },
    });
    return { message: 'Push token unregistered successfully' };
  }

  async sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    try {
      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: expoPushToken,
          sound: 'default',
          title,
          body,
          data: data || {},
        }),
      });

      const result = (await response.json()) as { errors?: unknown[] };
      if (result.errors) {
        this.logger.error(`Push notification failed: ${JSON.stringify(result.errors)}`);
        return false;
      }
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Push notification error: ${message}`);
      return false;
    }
  }

  async sendOrderStatusNotification(
    orderId: string,
    status: string,
    userId: string,
    storeName?: string,
  ) {
    const pushTokens = await this.prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (!pushTokens.length) return false;

    let title = 'Order Update';
    let body = '';

    switch (status) {
      case 'CONFIRMED':
        title = 'Order Confirmed!';
        body = `Your order #${orderId.slice(0, 8)} has been confirmed.`;
        break;
      case 'PACKED':
        title = 'Order Packed';
        body = `Your order #${orderId.slice(0, 8)} is being prepared at ${storeName || 'the store'}.`;
        break;
      case 'OUT_FOR_DELIVERY':
        title = 'Out for Delivery';
        body = `Your order #${orderId.slice(0, 8)} is out for delivery!`;
        break;
      case 'DELIVERED':
        title = 'Order Delivered!';
        body = `Order #${orderId.slice(0, 8)} delivered. Enjoy your products!`;
        break;
      case 'CANCELLED':
        title = 'Order Cancelled';
        body = `Order #${orderId.slice(0, 8)} has been cancelled.`;
        break;
      default:
        return false;
    }

    // Send to all registered tokens for this user
    const results = await Promise.all(
      pushTokens.map(({ token }) =>
        this.sendPushNotification(token, title, body, {
          orderId,
          status,
          screen: 'OrderDetail',
        })
      ),
    );
    return results.some(Boolean);
  }

  async sendNewOrderNotification(
    deliveryPartnerToken: string,
    orderId: string,
    storeName: string,
    storeType: string,
  ) {
    return this.sendPushNotification(
      deliveryPartnerToken,
      'New Delivery Available!',
      `Order #${orderId.slice(0, 8)} from ${storeName} (${storeType})`,
      {
        orderId,
        screen: 'NewOrders',
      },
    );
  }

  async getAllPushTokens(role?: string) {
    const where: any = {};
    if (role) {
      where.user = { role };
    }
    
    const tokens = await this.prisma.pushToken.findMany({
      where,
      include: { user: { select: { id: true, role: true } } },
    });
    
    return tokens.map(t => ({ userId: t.user.id, token: t.token, role: t.user.role }));
  }
}
