# 👋 Hey Ashwanth! Your Tasks

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

## 📋 Your Summary — 3 Tasks

| # | Task | Files to touch | Difficulty |
|---|------|---------------|------------|
| 1 | User detail + status endpoints | 1 new file + 2 edits | ⭐ Easy |
| 2 | Admin send notification endpoint | 1 edit | ⭐ Easy |
| 3 | Install Helmet for security | 1 edit + 1 npm command | ⭐ Easy |

**⏱️ Total time: ~1 hour**

**What's already done for you:**
- ✅ Redis + BullMQ running — you can use the queue for notifications
- ✅ SMS/Email providers ready — call `this.smsService` or `this.emailService`
- ✅ `crypto.randomInt()` — already fixed, you can skip that task

---

## ✅ Task 1: User Detail & Status (for Admin)

**File to create:**
1. `apps/api/src/users/dto/update-status.dto.ts`

**Files to edit:**
1. `apps/api/src/users/users.controller.ts` — add 2 new endpoints
2. `apps/api/src/users/users.service.ts` — add 2 new functions

### Copy this code:

**1. Create file: `apps/api/src/users/dto/update-status.dto.ts`**
```typescript
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserStatusDto {
  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  reason?: string;
}
```

**2. In `users.controller.ts` — add after the `updateRole` endpoint:**
```typescript
@Get(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async getUserById(@Param('id') id: string) {
  return this.usersService.findById(id);
}

@Patch(':id/status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async updateUserStatus(
  @Param('id') id: string,
  @Body() dto: UpdateUserStatusDto,
) {
  return this.usersService.updateStatus(id, dto);
}
```

**3. In `users.service.ts` — add after `updateRole` function:**
```typescript
import { UpdateUserStatusDto } from './dto/update-status.dto';

async updateStatus(id: string, dto: UpdateUserStatusDto) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundException('User not found');

  return this.prisma.user.update({
    where: { id },
    data: { isActive: dto.isActive },
    select: {
      id: true, email: true, name: true, role: true, isActive: true,
    },
  });
}
```

---

## ✅ Task 2: Admin Send Notification

**File to edit:**
1. `apps/api/src/notifications/notifications.controller.ts`

### Add this endpoint at the end:

```typescript
@Post('send')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async sendNotification(
  @Body() dto: { userId: string; title: string; body: string; type?: string; data?: any },
) {
  return this.notificationsService.notify(
    dto.userId,
    dto.title,
    dto.body,
    dto.type || 'ADMIN',
    dto.data,
  );
}
```

---

## ✅ Task 3: Security Hardening

**File to edit:**
1. `apps/api/src/main.ts`

### Find this line and add below it:

Look for `app.enableCors({` — it's already there. No change needed for CORS.

**Install Helmet:**
```bash
npm install helmet
```

**In `main.ts` — add after `app.setGlobalPrefix('api')`:**
```typescript
import helmet from 'helmet';

// Add this:
app.use(helmet());
```

---

## 📤 Push Your Changes
```bash
git add .
git commit -m "feat: user detail/status endpoints, security hardening"
git push origin main
```

## 🆘 Stuck?
- DM me on Slack — don't spend more than 20 min on any one task
- If the backend crashes, check `npm install` first
- If `helmet` install fails, just skip it and tell me
