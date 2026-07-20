# 👋 Hey Harshitha! Your Tasks

## 📥 First: Get Latest Code
Open terminal and run each line one by one:
```bash
git checkout main
git pull origin main
cd apps/api
npm install
```

## 🚀 Start Backend
```bash
npm run start:dev
```

---

## 📋 Your Summary — 5 Tasks

| # | Task | Files to touch | Difficulty |
|---|------|---------------|------------|
| 1 | Add orderId to Payout model + migrate | 1 schema edit + 1 migrate | ⭐ Easy |
| 2 | Payment list endpoint with filters | 2 edits (controller + service) | ⭐ Easy |
| 3 | Razorpay refund webhook handler | 1 edit (service) | ⭐⭐ Medium |
| 4 | Delivery partner weekly payouts | 1 edit (service) | ⭐⭐ Medium |
| 5 | Vendor settlement (auto when threshold reached) | 1 edit (service) | ⭐⭐ Medium |

**⏱️ Total time: ~2-3 hours**

**What's already done for you:**
- ✅ Redis + BullMQ running — you can use the queue for background payout jobs
- ✅ PostgreSQL running on port 5433
- ✅ API server can start with `npm run start:dev` from `apps/api/`

---

## ✅ Task 1: Add orderId to Payout Model

**File to edit: `prisma/schema.prisma`**

Find `model Payout {` and add this field inside it (after `deliveryPartner DeliveryPartner?`):
```prisma
orderId String?
```

Then run:
```bash
npx prisma migrate dev --name add-payout-orderid
```

**Then edit: `apps/api/src/payments/payments.service.ts`**

Find the function that creates payouts and add `orderId` to the data object.

---

## ✅ Task 2: Payment List Endpoint

**File to edit: `apps/api/src/payments/payments.controller.ts`**

Add this new endpoint:

```typescript
@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async findAll(
  @Query('status') status?: string,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
  @Query('page') page?: string,
  @Query('limit') limit?: string,
) {
  return this.paymentsService.findAll({
    status,
    startDate,
    endDate,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });
}
```

**File to edit: `apps/api/src/payments/payments.service.ts`**

Add this function:

```typescript
async findAll(filters: {
  status?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}) {
  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  const skip = (filters.page - 1) * filters.limit;
  const [data, total] = await Promise.all([
    this.prisma.payment.findMany({
      where,
      skip,
      take: filters.limit,
      include: { order: { select: { orderNo: true, userId: true, totalAmount: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.payment.count({ where }),
  ]);

  return {
    data,
    meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) },
  };
}
```

---

## ✅ Task 3: Razorpay Refund Webhook

**File to edit: `apps/api/src/payments/payments.service.ts`**

Find the function that handles webhooks (look for `handleWebhook` or similar).

Add handling for `refund.created` and `refund.processed` events:

```typescript
async handleRefundWebhook(event: string, payload: any) {
  const paymentId = payload.payment_id || payload.payment?.id;
  const orderId = payload.order_id;

  if (event === 'refund.created') {
    // Update payment status to REFUNDED
    await this.prisma.payment.updateMany({
      where: { razorpayPaymentId: paymentId },
      data: { status: 'REFUNDED' },
    });
  }

  if (event === 'refund.processed') {
    // Update order status
    await this.prisma.order.updateMany({
      where: { razorpayOrderId: orderId },
      data: { status: 'REFUNDED', paymentStatus: 'REFUNDED' },
    });

    // Restore product stock
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { vendorGroups: { include: { items: true } } },
    });

    if (order) {
      for (const group of order.vendorGroups) {
        for (const item of group.items) {
          await this.prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }

    // Notify customer
    // Use notificationsService.sendRefundCompletedNotification(userId, orderId)
  }
}
```

---

## ✅ Task 4: Delivery Partner Weekly Payouts

**File to edit: `apps/api/src/delivery/delivery.service.ts`**

Add a function that processes weekly payouts:

```typescript
async processWeeklyPayouts() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Find all completed deliveries in the past week
  const assignments = await this.prisma.deliveryAssignment.findMany({
    where: {
      deliveredAt: { gte: oneWeekAgo },
      orderVendorGroup: {
        order: { paymentStatus: 'PAID' },
      },
    },
    include: { deliveryPartner: true },
  });

  // Group by delivery partner
  const dpMap = new Map<string, { count: number; totalAmount: number }>();
  for (const a of assignments) {
    const existing = dpMap.get(a.deliveryPartnerId) || { count: 0, totalAmount: 0 };
    existing.count++;
    existing.totalAmount += 50; // ₹50 per delivery (adjust as needed)
    dpMap.set(a.deliveryPartnerId, existing);
  }

  // Create payout records
  for (const [dpId, data] of dpMap) {
    await this.prisma.payout.create({
      data: {
        deliveryPartnerId: dpId,
        amount: data.totalAmount,
        status: 'PENDING',
        periodStart: oneWeekAgo,
        periodEnd: new Date(),
      },
    });
  }

  return { processed: dpMap.size, totalDeliveries: assignments.length };
}
```

---

## ✅ Task 5: Vendor Settlement Enhancement

**File to edit: `apps/api/src/payments/payments.service.ts`**

Add a function to auto-settle when threshold is reached:

```typescript
async autoSettleVendors(threshold = 1000) {
  // Find all unpaid commissions grouped by vendor
  const unpaidCommissions = await this.prisma.commission.groupBy({
    by: ['vendorId'],
    where: { isPaid: false },
    _sum: { orderAmount: true, commissionAmount: true },
  });

  const results = [];
  for (const c of unpaidCommissions) {
    const totalAmount = Number(c._sum.orderAmount || 0);
    if (totalAmount >= threshold) {
      // Create payout
      const vendor = await this.prisma.vendor.findUnique({ where: { id: c.vendorId } });
      if (vendor?.razorpayAccountId) {
        await this.prisma.payout.create({
          data: {
            vendorId: c.vendorId,
            amount: totalAmount,
            status: 'PROCESSED',
            periodStart: new Date(),
            periodEnd: new Date(),
          },
        });

        // Mark commissions as paid
        await this.prisma.commission.updateMany({
          where: { vendorId: c.vendorId, isPaid: false },
          data: { isPaid: true, paidAt: new Date() },
        });

        results.push({ vendorId: c.vendorId, amount: totalAmount, settled: true });
      }
    }
  }

  return { settled: results.length, vendors: results };
}
```

---

## 📤 Push Your Changes
```bash
git add .
git commit -m "feat: payment list, refund webhooks, payouts"
git push origin main
```

## 🆘 Stuck?
- DM me on Slack — don't spend more than 30 min on any one task
- Run `npx tsc --noEmit` to check for errors before pushing
- The refund webhook needs to be registered in the webhook route — check `payments.controller.ts` for how other webhooks are handled
- For migrations, run `npx prisma migrate dev --name add-payout-orderid`
