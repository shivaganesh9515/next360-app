# Ashwanth — Backend: Admin Endpoints + Security + Support System

> **Area**: `apps/api/src/`
> **Status**: ✅ ALL TASKS COMPLETE
> **Priority**: 🔴 P0 → 🟠 P1

---

## ✅ Already Completed

- [x] Admin Dashboard aggregate (`GET /admin/dashboard`) — 13 parallel queries for live KPIs
- [x] Platform Settings (`GET /admin/settings`, `PATCH /admin/settings`) — whitelist-secured field updates
- [x] Audit Log module (`AuditLog` model, `GET /audit-logs`, `GET /audit-logs/summary`)
- [x] Notification: `sendVendorRejectedNotification()` added to NotificationsService
- [x] Vendor detail endpoint (`GET /vendors/:id/detail`) — aggregated KYC, performance, orders, revenue

---

## 🔴 P0 — Missing Admin Endpoints (Must Do First)

### 1. User Detail + Status Endpoints
**Files**: `apps/api/src/users/users.controller.ts`, `users.service.ts`
**What**:
- [x] `GET /users/:id` — single user detail with address/wishlist/order summary — **Implemented**
- [x] `PATCH /users/:id/status` — ban/suspend/activate user — **Implemented**

### 2. Support Ticket System (Full Module)
**Files**: `prisma/schema.prisma`, `apps/api/src/support/` (new module)
**What**:
- [x] Add `SupportTicket` model with `assignedToId` relation — **Implemented**
- [x] Add `TicketMessage` model — **Implemented**
- [x] `POST /support/tickets` — create ticket (user/customer) — **Implemented**
- [x] `GET /support/tickets` — list tickets (admin: all, user: own) — **Implemented**
- [x] `GET /support/tickets/:id` — single ticket detail with replies — **Implemented**
- [x] `PATCH /support/tickets/:id/assign` — assign to admin — **Implemented**
- [x] `POST /support/tickets/:id/reply` — add reply — **Implemented**
- [x] `PATCH /support/tickets/:id/status` — resolve/close — **Implemented**

### 3. Admin Send Notification
**Files**: `apps/api/src/notifications/notifications.controller.ts`
**What**:
- [x] `POST /notifications` — admin can broadcast a push notification to all users / by role / specific user(s) — **Implemented**

---

## 🟠 P1 — Admin Endpoints

### 4. Reports Endpoints
**Files**: `apps/api/src/reports/` (new module)
**What**:
- [x] `GET /reports/sales` — sales report with date range, pagination — **Implemented**
- [x] `GET /reports/revenue` — revenue report with platform/vendor breakdown — **Implemented**
- [x] `GET /reports/sales/csv` — CSV export — **Implemented**
- [x] `GET /reports/revenue/csv` — CSV export — **Implemented**

### 5. Payouts Admin Oversight
**Files**: `apps/api/src/payouts-admin/`
**What**:
- [x] `GET /payouts/vendors` — admin cross-vendor payout oversight — **Implemented**
- [x] `GET /payouts/delivery` — admin delivery partner payout oversight — **Implemented**
- [x] `GET /payouts` — generic payout listing — **Implemented**

### 6. Remaining Missing Admin Endpoints
**Files**: Various controllers
**What**:
- [x] `GET /reviews/ratings` — ratings aggregate stats — **Implemented**
- [x] `GET /admin/analytics` — admin analytics with date range and period — **Implemented**

### 7. Product Approval Endpoint
**Files**: `apps/api/src/products/products.controller.ts`
**What**:
- [x] `PATCH /products/:id/approve` — already existed at line 51 — **Verified**

---

## 🟠 P1 — Security Hardening

### 8. Security Middleware
**Files**: `apps/api/src/main.ts`, `apps/api/package.json`
**What**:
- [x] Helmet applied (`app.use(helmet())`) — **Implemented**
- [x] ThrottlerGuard registered globally as APP_GUARD — **Implemented**
- [x] CORS properly configured for production (env-driven with credentials, maxAge) — **Implemented**

### 9. Auth Security
**Files**: `apps/api/src/auth/auth.service.ts`, `common/`
**What**:
- [x] JWT secret fallback removed — fails fast if env var missing — **Implemented**
- [x] Math.random() for OTP replaced with `crypto.randomInt()` — **Implemented**
- [x] Refresh token rotation implemented — **Implemented** (30-day expiry, reuse detection, token rotation)

---

## Implementation Order
1. ~~User detail + status endpoints~~ ✅
2. ~~Support Ticket module~~ ✅
3. ~~Admin send notification endpoint~~ ✅
4. ~~Security hardening (Helmet, ThrottlerGuard)~~ ✅
5. ~~Reports endpoints~~ ✅
6. ~~Payouts admin oversight~~ ✅
7. ~~Remaining missing endpoints~~ ✅
8. ~~Auth security hardening~~ ✅

---

## Reference
- Admin panel API client: `apps/admin-panel/src/lib/api.ts`
- Response envelope format: root `CLAUDE.md`
- Audit module pattern: `apps/api/src/audit/audit.module.ts`
