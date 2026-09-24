import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Cron } from '@nestjs/schedule';
import {
  Prisma,
  OrderStatus,
  DeliveryPartnerStatus,
} from '@prisma/client';

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

const AUTO_ASSIGN_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Shared shape used for the delivery app's order cards (pool, active, history,
// post-accept). Everything the UI needs — customer, address, vendor, items —
// is nested under the OrderVendorGroup.
const DELIVERY_INCLUDE = {
  order: {
    select: {
      id: true,
      orderNo: true,
      totalAmount: true,
      paymentMethod: true,
      paymentStatus: true,
      status: true,
      createdAt: true,
      userId: true,
      user: { select: { id: true, name: true, phone: true } },
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
      zoneId: true,
    },
  },
  items: {
    include: {
      product: { select: { id: true, name: true, images: true, unit: true } },
    },
  },
} satisfies Prisma.OrderVendorGroupInclude;

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
   * Resolve the vendor group a delivery operation refers to.
   *
   * The delivery app keys its whole flow on the vendor group id (each card in
   * the pool/active/history lists IS a group), so the preferred path treats
   * `orderOrGroupId` as a group id directly. As a fallback it also accepts a
   * legacy order id and resolves it to the group assigned to this partner
   * within that order.
   */
  private async getGroupContext(userId: string, orderOrGroupId: string) {
    const partner = await this.getPartnerByUserId(userId);

    const group = await this.prisma.orderVendorGroup.findUnique({
      where: { id: orderOrGroupId },
      include: DELIVERY_INCLUDE,
    });
    if (group) {
      return { partner, group, assignment: null as any };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderOrGroupId },
      select: { id: true, vendorGroups: { select: { id: true } } },
    });
    if (!order) {
      throw new NotFoundException('Delivery not found');
    }

    const assignment = await this.prisma.deliveryAssignment.findFirst({
      where: {
        orderVendorGroupId: { in: order.vendorGroups.map((g) => g.id) },
        deliveryPartnerId: partner.id,
      },
      include: { orderVendorGroup: { include: DELIVERY_INCLUDE } },
    });
    if (!assignment) {
      throw new NotFoundException('No delivery assignment found for this partner');
    }

    return { partner, group: assignment.orderVendorGroup, assignment };
  }

  /**
   * POST /orders/:id/accept
   * Delivery-partner accept. Claims a READY_FOR_PICKUP group from the delivery
   * pool, creates the assignment, and moves the group to ACCEPTED. Reject
   * simply leaves it in the pool for another partner.
   */
  async acceptOrder(userId: string, orderVendorGroupId: string) {
    const partner = await this.getPartnerByUserId(userId);

    const group = await this.prisma.orderVendorGroup.findUnique({
      where: { id: orderVendorGroupId },
      include: DELIVERY_INCLUDE,
    });

    if (!group) throw new BadRequestException('This request is no longer available');
    if (group.vendor.zoneId !== partner.zoneId) {
      throw new BadRequestException('This request is outside your zone');
    }

    // Two paths share this action:
    //  - Pool pull: partner claims a READY_FOR_PICKUP group (auto-assign may have
    //    skipped it) and creates the assignment on accept.
    //  - Pushed confirm: auto-assign already created the assignment and set the
    //    group to ASSIGNED_TO_DELIVERY — accept just confirms it (PDF accept).
    if (group.status === OrderStatus.READY_FOR_PICKUP) {
      if (partner.status !== DeliveryPartnerStatus.AVAILABLE) {
        throw new BadRequestException('You must be online to accept deliveries');
      }
      const taken = await this.prisma.deliveryAssignment.findFirst({
        where: { orderVendorGroupId: group.id },
      });
      if (taken) {
        throw new BadRequestException('This request has already been taken');
      }

      const otp = generateOtp();

      await this.prisma.$transaction(async (tx) => {
        await tx.deliveryAssignment.create({
          data: {
            orderVendorGroupId: group.id,
            deliveryPartnerId: partner.id,
            otp,
          },
        });

        await tx.orderVendorGroup.update({
          where: { id: group.id },
          data: { status: OrderStatus.ACCEPTED },
        });

        await tx.deliveryPartner.update({
          where: { id: partner.id },
          data: { status: DeliveryPartnerStatus.ON_DELIVERY },
        });
      });

      const formatted = this.formatOrderForDelivery(group, OrderStatus.ACCEPTED);
      return { ...formatted, otp };
    }

    if (group.status === OrderStatus.ASSIGNED_TO_DELIVERY) {
      const assignment = await this.prisma.deliveryAssignment.findFirst({
        where: { orderVendorGroupId: group.id },
      });
      if (!assignment) {
        throw new BadRequestException('This request is no longer assigned');
      }
      if (assignment.deliveryPartnerId !== partner.id) {
        throw new BadRequestException('This request was assigned to another partner');
      }

      await this.prisma.orderVendorGroup.update({
        where: { id: group.id },
        data: { status: OrderStatus.ACCEPTED },
      });

      const formatted = this.formatOrderForDelivery(group, OrderStatus.ACCEPTED);
      return { ...formatted, otp: assignment.otp };
    }

    throw new BadRequestException('This request is no longer available');
  }

  /**
   * POST /orders/:id/start-pickup
   * ACCEPTED -> GOING_TO_PICKUP. The partner taps "Start Pickup" to begin the
   * route to the vendor.
   */
  async startPickup(userId: string, id: string) {
    const { group } = await this.getGroupContext(userId, id);
    return this.advanceGroup(
      group.id,
      OrderStatus.ACCEPTED,
      OrderStatus.GOING_TO_PICKUP,
      `Cannot start pickup: vendor group is in ${group.status} status`,
    );
  }

  /**
   * POST /orders/:id/arrived-pickup
   * GOING_TO_PICKUP -> ARRIVED_AT_PICKUP. Partner has reached the vendor.
   */
  async arrivedAtPickup(userId: string, id: string) {
    const { group } = await this.getGroupContext(userId, id);
    return this.advanceGroup(
      group.id,
      OrderStatus.GOING_TO_PICKUP,
      OrderStatus.ARRIVED_AT_PICKUP,
      `Cannot mark arrived: vendor group is in ${group.status} status`,
    );
  }

  /**
   * POST /orders/:id/arrived-customer
   * OUT_FOR_DELIVERY -> ARRIVED_AT_CUSTOMER. Partner has reached the drop.
   */
  async arrivedAtCustomer(userId: string, id: string) {
    const { group } = await this.getGroupContext(userId, id);
    return this.advanceGroup(
      group.id,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.ARRIVED_AT_CUSTOMER,
      `Cannot mark arrived: vendor group is in ${group.status} status`,
    );
  }

  /**
   * Shared guard for the forward-only arrival transitions.
   */
  private async advanceGroup(
    groupId: string,
    expected: OrderStatus,
    next: OrderStatus,
    errorMessage: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.orderVendorGroup.findUnique({
        where: { id: groupId },
      });
      if (group?.status !== expected) {
        throw new BadRequestException(errorMessage);
      }
      await tx.orderVendorGroup.update({
        where: { id: groupId },
        data: { status: next },
      });
      return { message: `Status updated to ${next}`, orderVendorGroupId: groupId };
    });
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
        include: DELIVERY_INCLUDE,
        orderBy: { order: { createdAt: 'desc' } },
        skip,
        take: limit,
      }),
      this.prisma.orderVendorGroup.count({ where }),
    ]);

    const items = groups.map((g) =>
      this.formatOrderForDelivery(g, 'READY_FOR_PICKUP'),
    );

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
          orderVendorGroup: { include: DELIVERY_INCLUDE },
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
        a.orderVendorGroup.status || 'ACCEPTED',
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
          orderVendorGroup: { include: DELIVERY_INCLUDE },
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

    if (partner.status !== DeliveryPartnerStatus.AVAILABLE) {
      throw new BadRequestException(
        'Delivery partner must be AVAILABLE to receive assignments',
      );
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
   * Auto-assign the nearest available Delivery Partner to an OrderVendorGroup
   * that is in READY_FOR_PICKUP status. Uses haversine distance from the
   * delivery address to each partner's last known GPS coordinates.
   * If no partner is available, schedules a fallback retry after AUTO_ASSIGN_TIMEOUT_MS.
   */
  async autoAssign(orderVendorGroupId: string) {
    const group = await this.prisma.orderVendorGroup.findUnique({
      where: { id: orderVendorGroupId },
      include: {
        order: {
          select: {
            id: true,
            orderNo: true,
            totalAmount: true,
            paymentMethod: true,
            createdAt: true,
            address: { select: { lat: true, lng: true } },
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        vendor: { select: { id: true, storeName: true, zoneId: true } },
        delivery: true,
      },
    });

    if (!group) {
      this.logger.warn(`Auto-assign: OrderVendorGroup ${orderVendorGroupId} not found`);
      return null;
    }

    if (group.status !== OrderStatus.READY_FOR_PICKUP) {
      this.logger.warn(`Auto-assign: Group ${orderVendorGroupId} is ${group.status}, not READY_FOR_PICKUP`);
      return null;
    }

    if (group.delivery) {
      this.logger.warn(`Auto-assign: Group ${orderVendorGroupId} already has a DeliveryAssignment`);
      return null;
    }

    const orderAddress = group.order.address;
    if (!orderAddress?.lat == null|| !orderAddress?.lng == null) {
      this.logger.warn(`Auto-assign: Order ${group.order.id} has no delivery coordinates`);
      this.scheduleAutoAssignment(orderVendorGroupId);
      return null;
    }

    const availablePartners = await this.prisma.deliveryPartner.findMany({
      where: {
        zoneId: group.vendor.zoneId,
        status: DeliveryPartnerStatus.AVAILABLE,
        currentLat: { not: null },
        currentLng: { not: null },
      },
      select: {
        id: true,
        userId: true,
        currentLat: true,
        currentLng: true,
      },
    });

    if (availablePartners.length === 0) {
      this.logger.warn(`Auto-assign: No available DPs in zone ${group.vendor.zoneId} for group ${orderVendorGroupId}`);
      this.scheduleAutoAssignment(orderVendorGroupId);
      return null;
    }

    const partnersWithDistance = availablePartners
      .filter((p) => p.currentLat != null && p.currentLng != null)
      .map((p) => ({
        ...p,
        distance: haversineDistance(
          orderAddress.lat!,
          orderAddress.lng!,
          p.currentLat!,
          p.currentLng!,
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

      if (partnersWithDistance.length === 0) {
        this.logger.warn(
          `Auto-assign: No delivery partners with valid coordinates found`,
        );
        this.scheduleAutoAssignment(orderVendorGroupId);
        return null;
      }
    const nearest = partnersWithDistance[0];
    const otp = generateOtp();

    const assignment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.deliveryAssignment.create({
        data: {
          orderVendorGroupId: group.id,
          deliveryPartnerId: nearest.id,
          otp,
        },
      });

      await tx.orderVendorGroup.update({
        where: { id: group.id },
        data: { status: OrderStatus.ASSIGNED_TO_DELIVERY },
      });

      await tx.deliveryPartner.update({
        where: { id: nearest.id },
        data: { status: DeliveryPartnerStatus.ON_DELIVERY },
      });

      return created;
    });

    this.logger.log(
      `Auto-assigned DP ${nearest.id} (${nearest.distance.toFixed(1)}km) to group ${orderVendorGroupId}`,
    );

    return {
      id: assignment.id,
      otp: assignment.otp,
      assignedAt: assignment.assignedAt,
      orderVendorGroupId: group.id,
      status: 'AUTO_ASSIGNED',
      partner: { id: nearest.id, distance: nearest.distance },
      order: {
        id: group.order.id,
        orderNumber: group.order.orderNo,
        total: Number(group.order.totalAmount),
        user: group.order.user,
        address: group.order.address,
      },
      vendor: group.vendor,
    };
  }

  /**
   * Schedule a delayed auto-assign retry for an OrderVendorGroup.
   * After AUTO_ASSIGN_TIMEOUT_MS, if the group is still in READY_FOR_PICKUP
   * with no assignment, autoAssign will be called again. If still no DP is
   * available, the order remains in READY_FOR_PICKUP for manual assignment.
   */
  private scheduleAutoAssignment(orderVendorGroupId: string) {
    setTimeout(async () => {
      try {
        const group = await this.prisma.orderVendorGroup.findUnique({
          where: { id: orderVendorGroupId },
          select: { status: true, delivery: true },
        });

        if (!group) return;
        if (group.status !== OrderStatus.READY_FOR_PICKUP) return;
        if (group.delivery) return;

        this.logger.log(`Auto-assign fallback: retrying for group ${orderVendorGroupId}`);
        await this.autoAssign(orderVendorGroupId);
      } catch (error: any) {
        this.logger.error(`Auto-assign fallback failed for group ${orderVendorGroupId}: ${error.message}`);
      }
    }, AUTO_ASSIGN_TIMEOUT_MS);
  }

  /**
   * POST /orders/:id/reject
   * Decline a delivery request. Before acceptance the request was never
   * assigned to this partner, so the server treats it as a pool dismissal
   * (no-op) — the order stays READY_FOR_PICKUP for other partners. After an
   * accept, reject releases the assignment and returns the order to the pool.
   */
  async rejectOrder(userId: string, orderOrGroupId: string) {
    const partner = await this.getPartnerByUserId(userId);

    // Accepts either the group id (app's flow) or a legacy order id.
    const assignment = await this.prisma.deliveryAssignment.findFirst({
      where: {
        deliveryPartnerId: partner.id,
        pickedUpAt: null,
        OR: [
          { orderVendorGroupId: orderOrGroupId },
          { orderVendorGroup: { orderId: orderOrGroupId } },
        ],
      },
    });

    // No assignment yet — this was a pool dismissal (mentor's flow: reject
    // simply leaves the order available to other partners).
    if (!assignment) {
      return { message: 'Order rejected', success: true };
    }

    // Release the assignment and return the order to the delivery pool
    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryAssignment.delete({
        where: { id: assignment.id },
      });

      await tx.orderVendorGroup.update({
        where: { id: assignment.orderVendorGroupId },
        data: { status: OrderStatus.READY_FOR_PICKUP },
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
   * Verify the pickup OTP against the vendor's shared pickup code. On success,
   * marks the assignment as picked up (ARRIVED_AT_PICKUP -> PICKED_UP).
   */
  async verifyPickup(userId: string, orderOrGroupId: string, otp: string) {
    const { partner, group, assignment } = await this.getGroupContext(
      userId,
      orderOrGroupId,
    );

    const target = assignment ?? (await this.prisma.deliveryAssignment.findFirst({
      where: {
        orderVendorGroupId: group.id,
        deliveryPartnerId: partner.id,
        pickedUpAt: null,
      },
    }));

    if (!target) {
      throw new NotFoundException(
        'No pending delivery assignment found for this order',
      );
    }

    if (group.status !== OrderStatus.ARRIVED_AT_PICKUP &&
        group.status !== OrderStatus.GOING_TO_PICKUP) {
      throw new BadRequestException(
        `Cannot verify pickup: vendor group is in ${group.status} status. Reach the pickup point first.`,
      );
    }

    // Verify OTP (vendor shares this 6-digit code with the partner)
    if (target.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const a = await tx.deliveryAssignment.update({
        where: { id: target.id },
        data: { pickedUpAt: new Date() },
      });

      await tx.orderVendorGroup.update({
        where: { id: target.orderVendorGroupId },
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
   * POST /orders/:id/start-transit
   * Move a picked-up delivery onto the road: PICKED_UP -> OUT_FOR_DELIVERY.
   */
  async startTransit(userId: string, orderOrGroupId: string) {
    const { partner, group, assignment } = await this.getGroupContext(
      userId,
      orderOrGroupId,
    );

    const target = assignment ?? (await this.prisma.deliveryAssignment.findFirst({
      where: {
        orderVendorGroupId: group.id,
        deliveryPartnerId: partner.id,
        pickedUpAt: { not: null },
        deliveredAt: null,
      },
    }));

    if (!target) {
      throw new NotFoundException(
        'No picked-up delivery assignment found for this order',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.orderVendorGroup.findUnique({
        where: { id: target.orderVendorGroupId },
      });
      if (current?.status !== OrderStatus.PICKED_UP) {
        throw new BadRequestException(
          `Cannot start transit: vendor group is in ${current?.status} status, expected ${OrderStatus.PICKED_UP}`,
        );
      }

      await tx.orderVendorGroup.update({
        where: { id: target.orderVendorGroupId },
        data: { status: OrderStatus.OUT_FOR_DELIVERY },
      });

      return target;
    });

    try {
      await this.notificationsService.sendOrderStatusNotification(
        group.order.id,
        'OUT_FOR_DELIVERY',
        group.order.userId,
      );
    } catch (error: any) {
      this.logger.error(`Transit notification failed: ${error.message}`);
    }

    return {
      message: 'Delivery out for delivery',
      orderVendorGroupId: updated.orderVendorGroupId,
    };
  }

  /**
   * POST /orders/:id/deliver
   * Mark a delivery as complete. Accepts ARRIVED_AT_CUSTOMER (full PDF flow)
   * and OUT_FOR_DELIVERY (direct confirm) -> DELIVERED.
   */
  async completeDelivery(userId: string, orderOrGroupId: string) {
    const { partner, group, assignment } = await this.getGroupContext(
      userId,
      orderOrGroupId,
    );

    const target = assignment ?? (await this.prisma.deliveryAssignment.findFirst({
      where: {
        orderVendorGroupId: group.id,
        deliveryPartnerId: partner.id,
        deliveredAt: null,
      },
    }));

    if (!target) {
      throw new NotFoundException(
        'No active delivery assignment found for this order',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.orderVendorGroup.findUnique({
        where: { id: target.orderVendorGroupId },
      });
      if (
        current?.status !== OrderStatus.OUT_FOR_DELIVERY &&
        current?.status !== OrderStatus.ARRIVED_AT_CUSTOMER
      ) {
        throw new BadRequestException(
          `Cannot deliver: vendor group is in ${current?.status} status, expected ${OrderStatus.OUT_FOR_DELIVERY} or ${OrderStatus.ARRIVED_AT_CUSTOMER}. Start transit and reach the customer first.`,
        );
      }

      const a = await tx.deliveryAssignment.update({
        where: { id: target.id },
        data: { deliveredAt: new Date() },
      });

      await tx.orderVendorGroup.update({
        where: { id: target.orderVendorGroupId },
        data: { status: OrderStatus.DELIVERED },
      });

      // Check if ALL vendor groups in the order are delivered → update
      // the order-level status to DELIVERED. paymentStatus is touched only
      // for COD (cash collected on delivery); Razorpay orders are already
      // PAID via webhook, and FAILED/REFUNDED must never be overwritten.
      const allGroups = await tx.orderVendorGroup.findMany({
        where: { orderId: group.order.id },
        select: { status: true },
      });
      const allDelivered = allGroups.every(
        (g: any) => g.status === OrderStatus.DELIVERED,
      );
      if (allDelivered) {
        const parentData: any = { status: OrderStatus.DELIVERED };
        if (
          group.order.paymentMethod === 'COD' &&
          group.order.paymentStatus !== 'REFUNDED'
        ) {
          parentData.paymentStatus = 'PAID';
        }
        await tx.order.update({
          where: { id: group.order.id },
          data: parentData,
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
        group.order.id,
      );
    } catch (error: any) {
      this.logger.error(`Delivery complete notification failed: ${error.message}`);
    }

    // Send order delivered notification to the customer
    try {
      await this.notificationsService.sendOrderStatusNotification(
        group.order.id,
        'DELIVERED',
        group.order.userId,
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
    orderOrGroupId: string,
    reason: string,
    details?: string,
  ) {
    const { partner, group, assignment } = await this.getGroupContext(
      userId,
      orderOrGroupId,
    );

    const target = assignment ?? (await this.prisma.deliveryAssignment.findFirst({
      where: {
        orderVendorGroupId: group.id,
        deliveryPartnerId: partner.id,
        deliveredAt: null,
      },
    }));
    if (!target) {
      throw new NotFoundException('No active delivery assignment found');
    }

    // Create failure record, release assignment, revert status — in a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryFailure.create({
        data: {
          deliveryAssignmentId: target.id,
          reason,
          details: details || null,
        },
      });

      // Release the assignment
      await tx.deliveryAssignment.delete({
        where: { id: target.id },
      });

      // Revert vendor group to READY_FOR_PICKUP so it can be reassigned
      await tx.orderVendorGroup.update({
        where: { id: target.orderVendorGroupId },
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
   * Delivery-partner earnings, keyed by delivery fee (Rs per completed
   * delivery). Returns today / thisWeek / thisMonth / allTime in rupees so the
   * app can render without currency math of its own.
   */
  async getEarnings(userId: string, period?: 'today' | 'week' | 'month') {
    const partner = await this.getPartnerByUserId(userId);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedDeliveries = await this.prisma.deliveryAssignment.findMany({
      where: {
        deliveryPartnerId: partner.id,
        deliveredAt: { not: null },
      },
      select: { deliveredAt: true },
    });

    const deliveryFee = 40; // Rs per completed delivery
    const countSince = (start: Date) =>
      completedDeliveries.filter(
        (a) => a.deliveredAt && a.deliveredAt >= start,
      ).length;

    const today = countSince(todayStart);
    const thisWeek = countSince(weekStart);
    const thisMonth = countSince(monthStart);
    const allTime = completedDeliveries.length;

    return {
      today: today * deliveryFee,
      thisWeek: thisWeek * deliveryFee,
      thisMonth: thisMonth * deliveryFee,
      allTime: allTime * deliveryFee,
      totalDeliveries: allTime,
      deliveryFeeEarnings: allTime * deliveryFee,
      deliveryFee,
      period: period || 'all',
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

    // Default: last week (Mon 00:00 - Sun 23:59:59.999)
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
   * GET /delivery/dashboard
   * Dashboard glance-stats for the partner's home screen.
   */
  async getDashboardStats(userId: string) {
    const partner = await this.getPartnerByUserId(userId);

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const [activeCount, newPoolCount, deliveredToday, deliveredAll] =
      await Promise.all([
        this.prisma.deliveryAssignment.count({
          where: { deliveryPartnerId: partner.id, deliveredAt: null },
        }),
        this.prisma.orderVendorGroup.count({
          where: {
            status: OrderStatus.READY_FOR_PICKUP,
            vendor: { zoneId: partner.zoneId },
            delivery: null,
          },
        }),
        this.prisma.deliveryAssignment.count({
          where: {
            deliveryPartnerId: partner.id,
            deliveredAt: { gte: todayStart },
          },
        }),
        this.prisma.deliveryAssignment.count({
          where: {
            deliveryPartnerId: partner.id,
            deliveredAt: { not: null },
          },
        }),
      ]);

    return {
      newOrders: newPoolCount,
      active: activeCount,
      deliveredToday,
      deliveredAll,
      isAvailable: partner.status !== DeliveryPartnerStatus.OFFLINE,
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

  /**
   * POST /delivery/process-payouts — manual trigger of the same weekly payout
   * run the Monday cron performs (see processWeeklyPayouts above).
   */
  async triggerWeeklyPayouts() {
    return this.processWeeklyPayouts();
  }

  /**
   * POST /delivery/auto-assign/:orderVendorGroupId
   * Automatically assign a delivery to the nearest available DP in the same zone.
   */
  async autoAssignDelivery(orderVendorGroupId: string) {
    const group = await this.prisma.orderVendorGroup.findUnique({
      where: { id: orderVendorGroupId },
      include: { vendor: true },
    });
    if (!group) throw new NotFoundException('Order vendor group not found');

    const availableDps = await this.prisma.deliveryPartner.findMany({
      where: {
        zoneId: group.vendor.zoneId,
        status: 'AVAILABLE',
      },
      orderBy: { updatedAt: 'asc' },
      take: 1,
    });

    if (availableDps.length === 0) {
      return { message: 'No available delivery partners' };
    }

    const dp = availableDps[0];
    const otp = crypto.randomInt(100000, 999999).toString();

    const assignment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.deliveryAssignment.create({
        data: { orderVendorGroupId, deliveryPartnerId: dp.id, otp },
      });

      await tx.deliveryPartner.update({
        where: { id: dp.id },
        data: { status: 'ON_DELIVERY' },
      });

      await tx.orderVendorGroup.update({
        where: { id: orderVendorGroupId },
        data: { status: 'ASSIGNED_TO_DELIVERY' },
      });

      return created;
    });

    return assignment;
  }
}
