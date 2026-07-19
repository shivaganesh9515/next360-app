# Implementation Plan

## Phase 1 — Security Hardening (30 min)
**No teammate impact. Pure config/middleware changes.**

| Step | File | Change |
|------|------|--------|
| 1.1 | `apps/api/` | Run `npm install helmet` |
| 1.2 | `apps/api/src/main.ts` | Add `import helmet from 'helmet'`, add `app.use(helmet())` before CORS |
| 1.3 | `apps/api/src/app.module.ts` | Add `APP_GUARD` provider for `ThrottlerGuard` |
| 1.4 | `apps/api/src/auth/auth.module.ts:15` | Remove `fallback: 'next360-dev-secret'`, require env var |
| 1.5 | `apps/api/src/auth/auth.service.ts:140` | Replace `Math.floor(100000 + Math.random() * 900000)` with `crypto.randomInt(100000, 999999)` |
| 1.6 | `apps/api/src/delivery/delivery.service.ts:13` | Same Math.random() → crypto.randomInt() fix |

## Phase 2 — User Admin Endpoints (45 min)
**Unblocks Manaswini's user detail page.**

| Step | File | Change |
|------|------|--------|
| 2.1 | `apps/api/src/users/dto/update-status.dto.ts` | **New** — `@IsIn(['true','false']) isActive: string` |
| 2.2 | `apps/api/src/users/users.service.ts` | Add `findByIdAdmin(id)` (reuse findById select), add `updateStatus(id, isActive)` |
| 2.3 | `apps/api/src/users/users.controller.ts` | Add `GET ':id'` (admin-guarded), add `PATCH ':id/status'` (admin-guarded) |

## Phase 3 — Admin Notification Broadcast (30 min)
**Unblocks Manaswini's notifications page.**

| Step | File | Change |
|------|------|--------|
| 3.1 | `apps/api/src/notifications/dto/broadcast-notification.dto.ts` | **New** — `title`, `body`, `type?`, `targetRole?` |
| 3.2 | `apps/api/src/notifications/notifications.service.ts` | Add `broadcast(dto)` method |
| 3.3 | `apps/api/src/notifications/notifications.controller.ts` | Add `POST '/'` (admin-guarded) |

## Phase 4 — Reports Module (1 hr)
**Unblocks Manaswini's reports page.**

| Step | File | Change |
|------|------|--------|
| 4.1 | `apps/api/src/reports/reports.module.ts` | **New** — imports PrismaModule |
| 4.2 | `apps/api/src/reports/reports.service.ts` | **New** — getSalesReport, getRevenueReport |
| 4.3 | `apps/api/src/reports/reports.controller.ts` | **New** — GET /reports/sales, GET /reports/revenue |
| 4.4 | `apps/api/src/app.module.ts` | Add ReportsModule to imports |

## Phase 5 — Payouts Admin Oversight (1 hr)
**Unblocks Soumya's payouts page + Manaswini's payouts page.**

| Step | File | Change |
|------|------|--------|
| 5.1 | `apps/api/src/payouts-admin/payouts-admin.module.ts` | **New** — imports PrismaModule |
| 5.2 | `apps/api/src/payouts-admin/payouts-admin.service.ts` | **New** — getVendorPayouts, getDeliveryPayouts |
| 5.3 | `apps/api/src/payouts-admin/payouts-admin.controller.ts` | **New** — GET /payouts/vendors, GET /payouts/delivery |
| 5.4 | `apps/api/src/app.module.ts` | Add PayoutsAdminModule to imports |

## Phase 6 — Support Module (2 hr)
**Independent. Needs Prisma migration.**

| Step | File | Change |
|------|------|--------|
| 6.1 | `prisma/schema.prisma` | Add SupportTicket, TicketMessage, TicketStatus enum |
| 6.2 | Run migration | `npx prisma migrate dev --name add-support-ticket` |
| 6.3 | `apps/api/src/support/support.module.ts` | **New** |
| 6.4 | `apps/api/src/support/support.service.ts` | **New** — CRUD + status transitions |
| 6.5 | `apps/api/src/support/support.controller.ts` | **New** — customer + admin routes |
| 6.6 | `apps/api/src/app.module.ts` | Add SupportModule to imports |

## Execution Order
```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
```
All phases are independent. Can be executed in any order or parallel.
