# 👋 Hey Srinitha! Your Tasks

## 📥 First: Get Latest Code
Open terminal and run:
```bash
git checkout main
git pull origin main
```

## 📦 Install Dependencies
```bash
cd apps/api
npm install
```

## 🚀 Start Backend
```bash
npm run start:dev
```

---

## ✅ Task 1: DP Earnings Endpoint

**File to edit: `apps/api/src/delivery/delivery.controller.ts`**

Add this endpoint:

```typescript
@Get('earnings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DELIVERY_PARTNER)
async getEarnings(
  @CurrentUser('id') userId: string,
  @Query('period') period?: string, // today, week, month
) {
  return this.deliveryService.calculateEarnings(userId, period);
}
```

**File to edit: `apps/api/src/delivery/delivery.service.ts`**

Add this function:

```typescript
async calculateEarnings(userId: string, period?: string) {
  const partner = await this.prisma.deliveryPartner.findUnique({
    where: { userId },
  });
  if (!partner) throw new NotFoundException('Delivery partner not found');

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      // All time
      startDate = new Date(0);
  }

  const assignments = await this.prisma.deliveryAssignment.findMany({
    where: {
      deliveryPartnerId: partner.id,
      deliveredAt: { gte: startDate, lte: now },
    },
  });

  const totalDeliveries = assignments.length;
  const averagePerDelivery = 50; // ₹50 per delivery (adjust per your pricing)
  const totalEarnings = totalDeliveries * averagePerDelivery;

  return {
    today: period === 'today' ? totalEarnings : undefined,
    thisWeek: period === 'week' ? totalEarnings : undefined,
    thisMonth: period === 'month' ? totalEarnings : undefined,
    allTime: totalEarnings,
    totalDeliveries,
    averagePerDelivery,
  };
}
```

---

## ✅ Task 2: DP Setup Endpoint

**File to edit: `apps/api/src/delivery/delivery.controller.ts`**

Add this endpoint:

```typescript
@Post('partners/setup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DELIVERY_PARTNER)
async setupPartner(
  @CurrentUser('id') userId: string,
  @Body() dto: { vehicleType: string; zoneId: string },
) {
  return this.deliveryService.setupPartner(userId, dto);
}
```

**File to edit: `apps/api/src/delivery/delivery.service.ts`**

Add this function:

```typescript
async setupPartner(userId: string, dto: { vehicleType: string; zoneId: string }) {
  // Check if partner already exists
  const existing = await this.prisma.deliveryPartner.findUnique({
    where: { userId },
  });

  if (existing) {
    // Update existing
    return this.prisma.deliveryPartner.update({
      where: { userId },
      data: {
        vehicleType: dto.vehicleType,
        zoneId: dto.zoneId,
        status: 'AVAILABLE',
      },
    });
  }

  // Create new delivery partner record
  return this.prisma.deliveryPartner.create({
    data: {
      userId,
      vehicleType: dto.vehicleType,
      zoneId: dto.zoneId,
      status: 'AVAILABLE',
    },
  });
}
```

---

## ✅ Task 3: Verify Vendor Approve Endpoint

**File to open and check: `apps/api/src/vendors/vendors.controller.ts`**

The endpoint `POST /vendors/:id/approve` already exists. Just make sure it also:
1. Checks that KYC is VERIFIED before approving
2. Sends notification to vendor

**Edit `apps/api/src/vendors/vendors.service.ts` — find the `approve` function and add KYC check:**

Add this line at the top of the `approve` function (after getting the vendor):
```typescript
// Check KYC is verified
const kyc = await this.prisma.kYC.findUnique({
  where: { userId: vendor.userId },
});
if (!kyc || kyc.status !== 'VERIFIED') {
  throw new BadRequestException('Vendor KYC must be verified before approval');
}
```

Also make sure `import { BadRequestException } from '@nestjs/common';` is at the top of the file (it should already be there).

---

## ✅ Task 4: DP Batch Payouts (Weekly)

Same as Task 4 in Harshitha's tasks — but from the delivery side.

**File to edit: `apps/api/src/delivery/delivery.service.ts`**

Copy this code:

```typescript
async processWeeklyPayouts() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const assignments = await this.prisma.deliveryAssignment.findMany({
    where: {
      deliveredAt: { gte: oneWeekAgo },
    },
    include: { deliveryPartner: true },
  });

  const dpMap = new Map<string, number>();
  for (const a of assignments) {
    const current = dpMap.get(a.deliveryPartnerId) || 0;
    dpMap.set(a.deliveryPartnerId, current + 50); // ₹50 per delivery
  }

  for (const [dpId, amount] of dpMap) {
    await this.prisma.payout.create({
      data: {
        deliveryPartnerId: dpId,
        amount,
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

## ✅ Task 5: Auto-Assignment

**File to edit: `apps/api/src/delivery/delivery.service.ts`**

Add a function that auto-assigns the nearest available DP:

```typescript
async autoAssignDelivery(orderVendorGroupId: string) {
  // Find available delivery partners in the same zone
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
  const otp = String(Math.floor(100000 + Math.random() * 900000));

  const assignment = await this.prisma.deliveryAssignment.create({
    data: {
      orderVendorGroupId,
      deliveryPartnerId: dp.id,
      otp,
    },
  });

  // Mark DP as on delivery
  await this.prisma.deliveryPartner.update({
    where: { id: dp.id },
    data: { status: 'ON_DELIVERY' },
  });

  // Update group status
  await this.prisma.orderVendorGroup.update({
    where: { id: orderVendorGroupId },
    data: { status: 'ASSIGNED_TO_DELIVERY' },
  });

  return assignment;
}
```

---

## 📤 Push Your Changes
```bash
git add .
git commit -m "feat: DP earnings, setup, auto-assignment"
git push origin main
```
