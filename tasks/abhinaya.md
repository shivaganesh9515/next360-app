# 👋 Hey Abhinaya! Your Tasks

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

## ✅ Task 1: Support Ticket System (Backend Only)

**Follow the SAME pattern as brands/categories that you already did!**

### Step 1: Add models to Prisma
Open `prisma/schema.prisma` and add these lines at the end (before the last `}`):

```prisma
model SupportTicket {
  id           String   @id @default(uuid())
  userId       String
  subject      String
  message      String
  category     String   // ORDER_ISSUE, VENDOR_ISSUE, DELIVERY_ISSUE, REFUND, OTHER
  orderId      String?
  status       String   @default("OPEN") // OPEN, ASSIGNED, RESOLVED, CLOSED
  priority     String   @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  assignedToId String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user       User  @relation(fields: [userId], references: [id])
  assignedTo User? @relation("AssignedTickets", fields: [assignedToId], references: [id])
}

model TicketReply {
  id       String   @id @default(uuid())
  ticketId String
  userId   String
  message  String
  createdAt DateTime @default(now())

  ticket Ticket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id])
}
```

Then run:
```bash
npx prisma migrate dev --name add-support-tickets
```

### Step 2: Create the module files

Create folder: `apps/api/src/support/`

**File: `apps/api/src/support/support.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
```

**File: `apps/api/src/support/support.service.ts`** — copy the pattern from `apps/api/src/categories/categories.service.ts`
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: { subject: string; message: string; category?: string; orderId?: string }) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        message: dto.message,
        category: dto.category || 'OTHER',
        orderId: dto.orderId || null,
      },
    });
  }

  async findAll(status?: string, page = 1, limit = 20) {
    const where: any = {};
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
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
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async assign(id: string, assignedToId: string) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { assignedToId, status: 'ASSIGNED' },
    });
  }

  async addReply(ticketId: string, userId: string, message: string) {
    return this.prisma.ticketReply.create({
      data: { ticketId, userId, message },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status },
    });
  }
}
```

**File: `apps/api/src/support/support.controller.ts`** — copy pattern from `apps/api/src/categories/categories.controller.ts`
```typescript
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.supportService.create(userId, dto);
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@Query('status') status?: string) {
    return this.supportService.findAll(status);
  }

  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.supportService.findOne(id);
  }

  @Patch('tickets/:id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async assign(@Param('id') id: string, @Body('adminId') adminId: string) {
    return this.supportService.assign(id, adminId);
  }

  @Post('tickets/:id/reply')
  @UseGuards(JwtAuthGuard)
  async addReply(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('message') message: string,
  ) {
    return this.supportService.addReply(id, userId, message);
  }

  @Patch('tickets/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.supportService.updateStatus(id, status);
  }
}
```

### Step 3: Register in app.module.ts
Open `apps/api/src/app.module.ts` and add `SupportModule`:
```typescript
import { SupportModule } from './support/support.module';
```
Then add `SupportModule` inside the `imports: [...]` array.

---

## ✅ Task 2: Reports Endpoints

**File to create: `apps/api/src/reports/reports.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
```

**File to create: `apps/api/src/reports/reports.service.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(startDate?: string, endDate?: string, page = 1, limit = 20) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vendorGroups: { select: { subtotal: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map(o => ({
        id: o.id, orderNo: o.orderNo, amount: Number(o.totalAmount),
        paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
        status: o.status, createdAt: o.createdAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getRevenueReport(startDate?: string, endDate?: string) {
    const where: any = { paymentStatus: 'PAID' };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const result = await this.prisma.order.aggregate({
      where,
      _sum: { totalAmount: true },
      _count: true,
    });

    return {
      totalRevenue: Number(result._sum.totalAmount || 0),
      totalOrders: result._count,
    };
  }
}
```

**File to create: `apps/api/src/reports/reports.controller.ts`**
```typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getSalesReport(
      startDate, endDate,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getRevenueReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getRevenueReport(startDate, endDate);
  }
}
```

**Register in `app.module.ts`** — add `ReportsModule` same way as above.

---

## ✅ Task 3: Payouts Admin Oversight

**File to edit: `apps/api/src/payouts/`** — add to existing module (or create if not exists)

Add these endpoints (same patterns as above):
- `GET /payouts/vendors` — list vendor payouts
- `GET /payouts/delivery` — list delivery partner payouts
- `GET /payouts` — list all payouts with filters

---

## ✅ Task 4: Remaining Admin Endpoints

Add to existing controllers:
1. **Payments list** → `apps/api/src/payments/payments.controller.ts` → `GET /payments`
2. **Reviews ratings** → `apps/api/src/reviews/reviews.controller.ts` → `GET /reviews/ratings`
3. **Admin analytics** → `apps/api/src/admin/admin.controller.ts` → `GET /admin/analytics`

---

## 📤 Push Your Changes
```bash
git add .
git commit -m "feat: support tickets, reports, payouts endpoints"
git push origin main
```
