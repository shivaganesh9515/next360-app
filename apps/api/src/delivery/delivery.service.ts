import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Cron } from '@nestjs/schedule';
import { OrderStatus, DeliveryPartnerStatus } from '@prisma/client';

function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Resolve the DeliveryPartner record from the authenticated user ID.
   * Throws 404 if the user has no delivery partner profile.
   */
  private async getPartnerByUserId(userId: string) {
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { userId },
      include: {
        zone: { select: { id: true, name: true, city: true } },
      },
    });
    if (!partner) {
      throw new NotFoundException('Delivery partner profile not found');
    }
    return partner;
  }

  /**
   * PATCH /delivery/availability
   * Toggle delivery partner online/offline status.
   */
  async updateAvailability(userId: string, isAvailable: boolean) {
    const partner = await this.getPartnerByUserId(userId);

    // Cannot go available if currently on a delivery
    if (isAvailable && partner.status === DeliveryPartnerStatus.ON_DELIVERY) {
      throw new BadRequestException(
        'Cannot go online while on an active delivery',
      );
    }

    const newStatus = isAvailable
      ? DeliveryPartnerStatus.AVAILABLE
      : DeliveryPartnerStatus.OFFLINE;

    return this.prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: { status: newStatus },
      select: {
        id: true,
        status: true,
        currentLat: true,
        currentLng: true,
        updatedAt: true,
      },
    });
  }

  /**
   * PATCH /delivery/location
   * Update the delivery partner's current GPS coordinates.
   */
  async updateLocation(userId: string, lat: number, lng: number) {
    const partner = await this.getPartnerByUserId(userId);

    return this.prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: { currentLat: lat, currentLng: lng },
      select: {
        id: true,
        currentLat: true,
        currentLng: true,
        updatedAt: true,
      },
    });
  }

  /**
   * GET /delivery/new-orders
   * Returns OrderVendorGroups ready for delivery in the partner's zone.
   * These are vendor groups with status CONFIRMED or PACKED that have no DeliveryAssignment.
   */
  async getNewOrders(userId: string, page: number, limit: number) {
    const partner = await this.getPartnerByUserId(userId);
    const skip = (page - 1) * limit;

    // Find vendor groups that:
    // 1. Belong to a vendor in the same zone as the delivery partner
    // 2. Are in READY_FOR_PICKUP status (vendor has explicitly marked it ready)
    // 3. Have no DeliveryAssignment yet
    // Previously also checked CONFIRMED and PACKED — now only READY_FOR_PICKUP
    // ensures the vendor has explicitly signalled readiness before a DP can
    // claim the order (the vendor marks PACKED → READY_FOR_PICKUP first).
    const where = {
      status: { in: [OrderStatus.READY_FOR_PICKUP] },
      vendor: { zoneId: partner.zoneId },
      delivery: null,
    };

    const [groups, total] = await Promise.all([
      this.prisma.orderVendorGroup.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNo: true,
              totalAmount: true,
              paymentMethod: true,
              status: true,
              createdAt: true,
              user: {
                select: { id: true, name: true, phone: true },
              },
              address: {
                select: {
                  id: true,
                  fullAddress: true,
                  city: true,
                  state: true,
                  pincode: true,
                  lat: true,
                  lng: true,
                  label: true,
                },
              },
            },
          },
          vendor: {
            select: {
              id: true,
              storeName: true,
              storeType: true,
            },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, images: true, unit: true },
              },
            },
          },
        },
        orderBy: { order: { createdAt: 'desc' } },
        skip,
        take: limit,
      }),
      this.prisma.orderVendorGroup.count({ where }),
    ]);

    const items = groups.map((g) => this.formatOrderForDelivery(g, 'READY_FOR_DELIVERY'));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * GET /delivery/active
   * Returns orders currently assigned to this delivery partner that are not yet delivered.
   */
  async getActiveDeliveries(userId: string, page: number, limit: number) {
    const partner = await this.getPartnerByUserId(userId);
    const skip = (page - 1) * limit;

    const where = {
      deliveryPartnerId: partner.id,
      deliveredAt: null,
    };

    const [assignments, total] = await Promise.all([
      this.prisma.deliveryAssignment.findMany({
        where,
        include: {
          orderVendorGroup: {
            include: {
              order: {
                select: {
                  id: true,
                  orderNo: true,
                  totalAmount: true,
                  paymentMethod: true,
                  status: true,
                  createdAt: true,
                  user: {
                    select: { id: true, name: true, phone: true },
                  },
                  address: {
                    select: {
                      id: true,
                      fullAddress: true,
                      city: true,
                      state: true,
                      pincode: true,
                      lat: true,
                      lng: true,
                      label: true,
                    },
                  },
                },
              },
              vendor: {
                select: {
                  id: true,
                  storeName: true,
                  storeType: true,
                },
              },
              items: {
                include: {
                  product: {
                    select: { id: true, name: true, images: true, unit: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.deliveryAssignment.count({ where }),
    ]);

    const items = assignments.map((a) => {
      const formatted = this.formatOrderForDelivery(
        a.orderVendorGroup,
        a.pickedUpAt ? 'IN_TRANSIT' : 'PICKED_UP',
      );
      formatted.deliveryAssignment = {
        id: a.id,
        otp: a.otp,
        assignedAt: a.assignedAt,
        pickedUpAt: a.pickedUpAt,
        deliveredAt: a.deliveredAt,
      };
      return formatted;
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * GET /delivery/history
   * Returns completed deliveries for this partner.
   */
  async getDeliveryHistory(userId: string, page: number, limit: number) {
    const partner = await this.getPartnerByUserId(userId);
    const skip = (page - 1) * limit;

    const where = {
      deliveryPartnerId: partner.id,
      deliveredAt: { not: null },
    };

    const [assignments, total] = await Promise.all([
      this.prisma.deliveryAssignment.findMany({
        where,
        include: {
          orderVendorGroup: {
            include: {
              order: {
                select: {
                  id: true,
                  orderNo: true,
                  totalAmount: true,
                  paymentMethod: true,
                  status: true,
                  createdAt: true,
                  user: {
                    select: { id: true, name: true, phone: true },
                  },
                  address: {
                    select: {
                      id: true,
                      fullAddress: true,
                      city: true,
                      state: true,
                      pincode: true,
                      lat: true,
                      lng: true,
                      label: true,
                    },
                  },
                },
              },
              vendor: {
                select: {
                  id: true,
                  storeName: true,
                  storeType: true,
                },
              },
              items: {
                include: {
                  product: {
                    select: { id: true, name: true, images: true, unit: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { deliveredAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.deliveryAssignment.count({ where }),
    ]);

    const items = assignments.map((a) => {
      const formatted = this.formatOrderForDelivery(
        a.orderVendorGroup,
        'DELIVERED',
      );
      formatted.deliveryAssignment = {
        id: a.id,
        assignedAt: a.assignedAt,
        pickedUpAt: a.pickedUpAt,
        deliveredAt: a.deliveredAt,
      };
      return formatted;
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Format an OrderVendorGroup into the flat shape the delivery app expects.
   */
  private formatOrderForDelivery(group: any, deliveryStatus: string) {
    const order = group.order;
    const totalEarnings = group.items.reduce(
      (sum: number, item: any) =>
        sum + Number(item.priceAtPurchase) * item.quantity,
      0,
    );

    return {
      id: group.id,
      orderId: order.id,
      orderNumber: order.orderNo,
      status: deliveryStatus,
      total: Number(order.totalAmount),
      subtotal: Number(group.subtotal),
      deliveryFee: 40,
      totalEarnings,
      createdAt: order.createdAt,
      paymentMethod: order.paymentMethod,
      user: order.user
        ? { name: order.user.name, phone: order.user.phone }
        : null,
      address: order.address
        ? {
            id: order.address.id,
            fullAddress: order.address.fullAddress,
            city: order.address.city,
            state: order.address.state,
            pincode: order.address.pincode,
            lat: order.address.lat,
            lng: order.address.lng,
            label: order.address.label,
          }
        : null,
      vendor: group.vendor,
      items: group.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        priceAtPurchase: Number(item.priceAtPurchase),
        product: item.product,
      })),
      deliveryAssignment: null as any,
    };
  }

  /**
   * POST /orders/:id/assign
   * Admin assigns a delivery partner to an OrderVendorGroup. Finds the first
   * unassigned vendor group in the order that falls within the partner's zone.
   */
  async assignOrder(orderId: string, deliveryPartnerId: string) {
    // Find the delivery partner
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { id: deliveryPartnerId },
      include: {
        zone: { select: { id: true, name: true, city: true } },
      },
    });
    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }

    // Find the order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendorGroups: {
          include: {
            vendor: { select: { id: true, storeName: true, zoneId: true } },
            items: true,
          },
        },
        address: true,
        user: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Find the first vendor group that:
    // 1. Is in READY_FOR_PICKUP status (vendor has explicitly marked it)
    // 2. Belongs to a vendor in the partner's zone
    // 3. Has no existing DeliveryAssignment
    const eligibleGroup = order.vendorGroups.find(
      (g: any) =>
        g.status === OrderStatus.READY_FOR_PICKUP &&
        g.vendor.zoneId === partner.zoneId &&
        !g.delivery,
    );

    if (!eligibleGroup) {
      throw new BadRequestException(
        'No delivery assignments available for this order in your zone',
      );
    }

    const otp = generateOtp();

    // Create assignment and update statuses in a transaction
    const assignment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.deliveryAssignment.create({
        data: {
          orderVendorGroupId: eligibleGroup.id,
          deliveryPartnerId: partner.id,
          otp,
        },
        include: {
          orderVendorGroup: {
            include: {
              order: {
                select: {
                  id: true,
                  orderNo: true,
                  totalAmount: true,
                  paymentMethod: true,
                  createdAt: true,
                  user: { select: { id: true, name: true, phone: true } },
                  address: {
                    select: {
                      fullAddress: true,
                      city: true,
                      state: true,
                      pincode: true,
                      lat: true,
                      lng: true,
                    },
                  },
                },
              },
              vendor: { select: { id: true, storeName: true } },
              items: true,
            },
          },
        },
      });

      // Update vendor group status to ASSIGNED_TO_DELIVERY
      await tx.orderVendorGroup.update({
        where: { id: eligibleGroup.id },
        data: { status: OrderStatus.ASSIGNED_TO_DELIVERY },
      });

      // Update delivery partner status to ON_DELIVERY
      await tx.deliveryPartner.update({
        where: { id: partner.id },
        data: { status: DeliveryPartnerStatus.ON_DELIVERY },
      });

      return created;
    });

    return {
      id: assignment.id,
      otp: assignment.otp,
      assignedAt: assignment.assignedAt,
      orderVendorGroupId: assignment.orderVendorGroupId,
      status: 'ASSIGNED',
      order: {
        id: assignment.orderVendorGroup.order.id,
        orderNumber: assignment.orderVendorGroup.order.orderNo,
        total: Number(assignment.orderVendorGroup.order.totalAmount),
        user: assignment.orderVendorGroup.order.user,
        address: assignment.orderVendorGroup.order.address,
      },
      vendor: assignment.orderVendorGroup.vendor,
    };
  }

  /**
   * POST /orders/:id/reject
   * Decline or release a delivery assignment.
   * If the partner was assigned but hasn't picked up yet, release the assignment.
   * If the partner was never assigned, this is a no-op.
   */
  async rejectOrder(userId: string, orderId: string) {
    const partner = await this.getPartnerByUserId(userId);

    // Find the order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendorGroups: {
          include: { items: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Find a vendor group in this order assigned to this partner that hasn't been picked up
    const assignedGroupIds = order.vendorGroups
      .filter((g: any) => g.delivery?.deliveryPartnerId === partner.id)
      .map((g: any) => g.id);

    if (assignedGroupIds.length === 0) {
      // Not assigned to this partner — no-op
      return { message: 'Order rejected', success: true };
    }

    // Find the assignment that hasn't been picked up yet
    const assignment = await this.prisma.deliveryAssignment.findFirst({
      where: {
        orderVendorGroupId: { in: assignedGroupIds },
        deliveryPartnerId: partner.id,
        pickedUpAt: null,
      },
    });

    if (!assignment) {
      // Already picked up — cannot reject
      throw new BadRequestException(
        'Cannot reject an order that has already been picked up',
      );
    }

    // Remove assignment and revert vendor group status
    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryAssignment.delete({
        where: { id: assignment.id },
      });

      await tx.orderVendorGroup.update({
        where: { id: assignment.orderVendorGroupId },
        data: { status: OrderStatus.CONFIRMED },
      });

      // Check if partner has any other active deliveries
      const activeCount = await tx.deliveryAssignment.count({
        where: {
          deliveryPartnerId: partner.id,
          pickedUpAt: null,
        },
      });

      if (activeCount === 0) {
        await tx.deliveryPartner.update({
          where: { id: partner.id },
          data: { status: DeliveryPartnerStatus.AVAILABLE },
        });
      }
    });

    return { message: 'Order rejected', success: true };
  }

  /**
   * POST /orders/:id/verify-pickup
   * Verify the pickup OTP for an assigned delivery. On success, marks the
   * assignment as picked up and updates the vendor group status.
   */
  async verifyPickup(userId: string, orderId: string, otp: string) {
    const partner = await this.getPartnerByUserId(userId);

    // Find the order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendorGroups: {
          include: { items: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Find the delivery assignment for this partner on this order
    const vendorGroupIds = order.vendorGroups.map((g: any) => g.id);

    const assignment = await this.prisma.deliveryAssignment.findFirst({
      where: {
        orderVendorGroupId: { in: vendorGroupIds },
        deliveryPartnerId: partner.id,
        pickedUpAt: null,
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        'No pending delivery assignment found for this order',
      );
    }

    // Verify OTP
    if (assignment.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Mark as picked up and update status
    const updated = await this.prisma.$transaction(async (tx) => {
      const a = await tx.deliveryAssignment.update({
        where: { id: assignment.id },
        data: { pickedUpAt: new Date() },
      });

      await tx.orderVendorGroup.update({
        where: { id: assignment.orderVendorGroupId },
        data: { status: OrderStatus.PICKED_UP },
      });

      return a;
    });

    return {
      message: 'Pickup verified successfully',
      pickedUpAt: updated.pickedUpAt,
    };
  }

  /**
   * POST /orders/:id/deliver
   * Mark a delivery as complete. Sets deliveredAt and updates the vendor group status.
   */
  async completeDelivery(userId: string, orderId: string) {
    const partner = await this.getPartnerByUserId(userId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendorGroups: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const vendorGroupIds = order.vendorGroups.map((g: any) => g.id);

    const assignment = await this.prisma.deliveryAssignment.findFirst({
      where: {
        orderVendorGroupId: { in: vendorGroupIds },
        deliveryPartnerId: partner.id,
        deliveredAt: null,
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        'No active delivery assignment found for this order',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Validate vendor group is in PICKED_UP status before marking delivered
      const group = await tx.orderVendorGroup.findUnique({
        where: { id: assignment.orderVendorGroupId },
      });
      if (group?.status !== OrderStatus.PICKED_UP) {
        throw new BadRequestException(
          `Cannot deliver: vendor group is in ${group?.status} status, expected ${OrderStatus.PICKED_UP}`,
        );
      }

      const a = await tx.deliveryAssignment.update({
        where: { id: assignment.id },
        data: { deliveredAt: new Date() },
      });

      await tx.orderVendorGroup.update({
        where: { id: assignment.orderVendorGroupId },
        data: { status: OrderStatus.DELIVERED },
      });

      // Check if ALL vendor groups in the order are delivered → update
      // the order-level status to DELIVERED and paymentStatus to PAID
      // (for COD).  Razorpay orders already have paymentStatus = PAID
      // from the payment capture webhook.
      const allGroups = await tx.orderVendorGroup.findMany({
        where: { orderId },
        select: { status: true },
      });
      const allDelivered = allGroups.every(
        (g: any) => g.status === OrderStatus.DELIVERED,
      );
      if (allDelivered) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.DELIVERED,
            paymentStatus: 'PAID',
          },
        });
      }

      // Check if partner has more active deliveries
      const activeCount = await tx.deliveryAssignment.count({
        where: {
          deliveryPartnerId: partner.id,
          deliveredAt: null,
        },
      });

      if (activeCount === 0) {
        await tx.deliveryPartner.update({
          where: { id: partner.id },
          data: { status: DeliveryPartnerStatus.AVAILABLE },
        });
      }

      return a;
    });

    // Send delivery complete notification to the delivery partner
    try {
      await this.notificationsService.sendDeliveryCompletedNotification(
        partner.userId,
        orderId,
      );
    } catch (error: any) {
      this.logger.error(`Delivery complete notification failed: ${error.message}`);
    }

    // Send order delivered notification to the customer
    try {
      await this.notificationsService.sendOrderStatusNotification(
        orderId,
        'DELIVERED',
        order.userId,
      );
    } catch (error: any) {
      this.logger.error(`Order delivered notification failed: ${error.message}`);
    }

    return {
      message: 'Delivery completed',
      deliveredAt: updated.deliveredAt,
    };
  }

  /**
   * POST /delivery/failure
   * Report a failed delivery attempt (customer unavailable, wrong address, etc.).
   * Records the failure reason, releases the assignment, and reverts the vendor
   * group status so it can be reassigned. The admin reviews the failure record
   * and decides next steps.
   */
  async reportFailure(
    userId: string,
    orderId: string,
    reason: string,
    details?: string,
  ) {
    const partner = await this.getPartnerByUserId(userId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { vendorGroups: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const vendorGroupIds = order.vendorGroups.map((g: any) => g.id);

    const assignment = await this.prisma.deliveryAssignment.findFirst({
      where: {
        orderVendorGroupId: { in: vendorGroupIds },
        deliveryPartnerId: partner.id,
        deliveredAt: null,
      },
    });
    if (!assignment) {
      throw new NotFoundException('No active delivery assignment found');
    }

    // Create failure record, release assignment, revert status — in a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryFailure.create({
        data: {
          deliveryAssignmentId: assignment.id,
          reason,
          details: details || null,
        },
      });

      // Release the assignment
      await tx.deliveryAssignment.delete({
        where: { id: assignment.id },
      });

      // Revert vendor group to READY_FOR_PICKUP so it can be reassigned
      await tx.orderVendorGroup.update({
        where: { id: assignment.orderVendorGroupId },
        data: { status: OrderStatus.READY_FOR_PICKUP },
      });

      // Mark partner available if no other active deliveries
      const activeCount = await tx.deliveryAssignment.count({
        where: {
          deliveryPartnerId: partner.id,
          deliveredAt: null,
        },
      });
      if (activeCount <= 1) {
        await tx.deliveryPartner.update({
          where: { id: partner.id },
          data: { status: DeliveryPartnerStatus.AVAILABLE },
        });
      }
    });

    return { message: 'Delivery failure reported', reason };
  }

  /**
   * GET /delivery/earnings
   * Calculate earnings for a delivery partner across all time windows.
   * Returns today, thisWeek, thisMonth, allTime, totalDeliveries, averagePerDelivery.
   */
  async getEarnings(userId: string, period?: 'today' | 'week' | 'month') {
    const partner = await this.getPartnerByUserId(userId);
    const DELIVERY_FEE = 40;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const buildWhere = (deliveredFrom?: Date) => ({
      deliveryPartnerId: partner.id,
      deliveredAt: deliveredFrom
        ? { gte: deliveredFrom, not: null }
        : { not: null },
    });

    const computeEarnings = (assignments: any[]) => {
      const itemTotal = assignments.reduce((sum, a) => {
        const groupTotal = a.orderVendorGroup.items.reduce(
          (s: number, item: any) => s + Number(item.priceAtPurchase) * item.quantity,
          0,
        );
        return sum + groupTotal;
      }, 0);
      return itemTotal + assignments.length * DELIVERY_FEE;
    };

    const include = {
      orderVendorGroup: {
        select: {
          items: {
            select: { priceAtPurchase: true, quantity: true },
          },
        },
      },
    };

    if (period) {
      const dateMap: Record<string, Date> = {
        today: startOfToday,
        week: startOfWeek,
        month: startOfMonth,
      };
      const filtered = await this.prisma.deliveryAssignment.findMany({
        where: buildWhere(dateMap[period]),
        include,
      });

      const totalDeliveries = filtered.length;
      const earnings = computeEarnings(filtered);
      return {
        earnings,
        totalDeliveries,
        averagePerDelivery: totalDeliveries > 0 ? earnings / totalDeliveries : 0,
        period,
      };
    }

    const [todayDeliveries, weekDeliveries, monthDeliveries, allDeliveries] =
      await Promise.all([
        this.prisma.deliveryAssignment.findMany({
          where: buildWhere(startOfToday),
          include,
        }),
        this.prisma.deliveryAssignment.findMany({
          where: buildWhere(startOfWeek),
          include,
        }),
        this.prisma.deliveryAssignment.findMany({
          where: buildWhere(startOfMonth),
          include,
        }),
        this.prisma.deliveryAssignment.findMany({
          where: buildWhere(),
          include,
        }),
      ]);

    const today = computeEarnings(todayDeliveries);
    const thisWeek = computeEarnings(weekDeliveries);
    const thisMonth = computeEarnings(monthDeliveries);
    const allTime = computeEarnings(allDeliveries);
    const totalDeliveries = allDeliveries.length;

    return {
      today,
      thisWeek,
      thisMonth,
      allTime,
      totalDeliveries,
      averagePerDelivery: totalDeliveries > 0 ? allTime / totalDeliveries : 0,
    };
  }

  /**
   * Weekly batch payout for Delivery Partners.
   * Processes completed deliveries that have not yet been included in a payout,
   * groups them by partner, calculates totals, and creates one Payout per partner.
   * Runs automatically every Monday at 00:05 AM.
   */
  @Cron('5 0 * * 1')
  async processWeeklyPayouts() {
    const DELIVERY_FEE = 40;
    const now = new Date();

    // Default: last week (Mon 00:00 → Sun 23:59:59.999)
    const endOfLastWeek = new Date(now);
    endOfLastWeek.setDate(now.getDate() - now.getDay());
    endOfLastWeek.setHours(0, 0, 0, 0);
    endOfLastWeek.setMilliseconds(endOfLastWeek.getMilliseconds() - 1);

    const startOfLastWeek = new Date(endOfLastWeek);
    startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
    startOfLastWeek.setHours(0, 0, 0, 0);

    // Fetch all completed deliveries in the period
    const completedAssignments = await this.prisma.deliveryAssignment.findMany({
      where: {
        deliveredAt: { gte: startOfLastWeek, lte: endOfLastWeek },
      },
      include: {
        orderVendorGroup: {
          select: {
            vendorId: true,
            items: {
              select: { priceAtPurchase: true, quantity: true },
            },
          },
        },
      },
    });

    if (completedAssignments.length === 0) {
      return { periodStart: startOfLastWeek, periodEnd: endOfLastWeek, payouts: [] };
    }

    // Collect unique partner IDs
    const partnerIds = [...new Set(completedAssignments.map((a) => a.deliveryPartnerId))];

    // Fetch existing payouts for these partners in this period to exclude already-paid deliveries
    const existingPayouts = await this.prisma.payout.findMany({
      where: {
        deliveryPartnerId: { in: partnerIds },
        periodStart: startOfLastWeek,
        periodEnd: endOfLastWeek,
      },
      select: { deliveryPartnerId: true },
    });

    const paidPartnerIds = new Set(existingPayouts.map((p) => p.deliveryPartnerId));

    // Filter out partners who already have a payout for this period
    const unpaidPartnerIds = partnerIds.filter((id) => !paidPartnerIds.has(id));

    if (unpaidPartnerIds.length === 0) {
      return { periodStart: startOfLastWeek, periodEnd: endOfLastWeek, payouts: [] };
    }

    // Filter assignments to only unpaid partners
    const eligibleAssignments = completedAssignments.filter((a) =>
      unpaidPartnerIds.includes(a.deliveryPartnerId),
    );

    // Group by partner
    const partnerGroups = new Map<string, typeof eligibleAssignments>();
    for (const a of eligibleAssignments) {
      const list = partnerGroups.get(a.deliveryPartnerId) || [];
      list.push(a);
      partnerGroups.set(a.deliveryPartnerId, list);
    }

    // Create payout for each partner
    const payouts = await this.prisma.$transaction(
      Array.from(partnerGroups.entries()).map(([partnerId, assignments]) => {
        const itemTotal = assignments.reduce((sum, a) => {
          const groupTotal = a.orderVendorGroup.items.reduce(
            (s: number, item: any) => s + Number(item.priceAtPurchase) * item.quantity,
            0,
          );
          return sum + groupTotal;
        }, 0);

        const totalAmount = itemTotal + assignments.length * DELIVERY_FEE;

        return this.prisma.payout.create({
          data: {
            deliveryPartnerId: partnerId,
            amount: totalAmount,
            status: 'PENDING',
            periodStart: startOfLastWeek,
            periodEnd: endOfLastWeek,
          },
          select: {
            id: true,
            deliveryPartnerId: true,
            amount: true,
            status: true,
            periodStart: true,
            periodEnd: true,
            createdAt: true,
          },
        });
      }),
    );

    return {
      periodStart: startOfLastWeek,
      periodEnd: endOfLastWeek,
      payouts,
    };
  }

  /**
   * POST /delivery/setup
   * Set up a delivery partner profile for the first time.
   * Creates a DeliveryPartner record linked to the authenticated user.
   */
  async setupPartner(userId: string, vehicleType: string, zoneName: string) {
    // Check if partner already has a profile
    const existing = await this.prisma.deliveryPartner.findUnique({
      where: { userId },
      include: { zone: { select: { id: true, name: true } } },
    });
    if (existing) {
      // If zone name changed, look up the new zone
      let zoneId = existing.zoneId;
      if (zoneName && (existing.zone?.name !== zoneName)) {
        const newZone = await this.prisma.zone.findFirst({
          where: { name: { equals: zoneName, mode: 'insensitive' }, isActive: true },
        });
        if (!newZone) {
          throw new NotFoundException(
            `Zone "${zoneName}" not found. Available zones: Hyderabad, Vijayawada`,
          );
        }
        zoneId = newZone.id;
      }
      // Update existing profile instead
      return this.prisma.deliveryPartner.update({
        where: { id: existing.id },
        data: { vehicleType, zoneId },
        select: {
          id: true,
          vehicleType: true,
          status: true,
        },
      });
    }

    // Find the zone by name
    const zone = await this.prisma.zone.findFirst({
      where: { name: { equals: zoneName, mode: 'insensitive' }, isActive: true },
    });

    if (!zone) {
      throw new NotFoundException(
        `Zone "${zoneName}" not found. Available zones: Hyderabad, Vijayawada`,
      );
    }

    // Create the delivery partner profile
    return this.prisma.deliveryPartner.create({
      data: {
        userId,
        vehicleType,
        zoneId: zone.id,
        status: DeliveryPartnerStatus.OFFLINE,
      },
      include: {
        zone: { select: { id: true, name: true, city: true } },
      },
    });
  }
}
