# Ashwanth — Backend: Admin Endpoints + Security + Support System

> **Area**: `apps/api/src/`
> **Status**: In Progress
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
- `GET /users/:id` — single user detail with address/wishlist/order summary — **Missing**
- `PATCH /users/:id/status` — ban/suspend/activate user — **Missing**

### 2. Support Ticket System (Full Module)
**Files**: `prisma/schema.prisma`, `apps/api/src/support/` (new module)
**What**:
- Add `SupportTicket` model: `id, userId, subject, message, category, orderId?, status (OPEN/ASSIGNED/RESOLVED/CLOSED), priority, assignedToId?, createdAt, updatedAt`
- Add `TicketReply` model: `id, ticketId, userId, message, createdAt`
- `POST /support/tickets` — create ticket (user/customer)
- `GET /support/tickets` — list tickets (admin: all, user: own)
- `GET /support/tickets/:id` — single ticket detail with replies
- `PATCH /support/tickets/:id/assign` — assign to admin
- `POST /support/tickets/:id/reply` — add reply
- `PATCH /support/tickets/:id/status` — resolve/close

### 3. Admin Send Notification
**Files**: `apps/api/src/notifications/notifications.controller.ts`
**What**:
- `POST /notifications` — admin can broadcast a push notification to all users / by role / specific user(s) — **Missing**

---

## 🟠 P1 — Admin Endpoints

### 4. Reports Endpoints
**Files**: `apps/api/src/reports/` (new module)
**What**:
- `GET /reports/sales` — sales report with date range, pagination, CSV export support
- `GET /reports/revenue` — revenue report with platform/vendor breakdown
- **Missing** — No reports routes exist at all

### 5. Payouts Admin Oversight
**Files**: `apps/api/src/payouts/`
**What**:
- `GET /payouts/vendors` — admin cross-vendor payout oversight — **Missing**
- `GET /payouts/delivery` — admin delivery partner payout oversight — **Missing**
- `GET /payouts` — generic payout listing — **Missing**

### 6. Remaining Missing Admin Endpoints
**Files**: Various controllers
**What**:
- `GET /payments` — list all payments with filters — **Missing**
- `GET /reviews/ratings` — ratings aggregate stats — **Missing**
- `GET /admin/analytics` — admin analytics — **Missing**

### 7. Product Approval Endpoint
**Files**: `apps/api/src/products/products.controller.ts`, `products.service.ts`
**What**:
- `PATCH /products/:id/approve` — set `isApproved: true` — **Check if exists, create if not**

---

## 🟠 P1 — Security Hardening

### 8. Security Middleware
**Files**: `apps/api/src/main.ts`, `apps/api/package.json`
**What**:
- [ ] Apply Helmet (`app.use(helmet())` — package may already be installed)
- [ ] Apply ThrottlerGuard globally (file exists in `common/guards/`, not registered)
- [ ] Enable CORS properly for production

### 9. Auth Security
**Files**: `apps/api/src/auth/auth.service.ts`, `common/`
**What**:
- [ ] Fix JWT secret fallback: remove 'next360-dev-secret' fallback, fail fast if env var missing
- [ ] Replace Math.random() for OTP with `crypto.randomInt()`
- [ ] Add refresh token rotation

---

## Implementation Order
1. User detail + status endpoints (small, quick wins)
2. Support Ticket module (critical for operations)
3. Admin send notification endpoint
4. Security hardening (Helmet, ThrottlerGuard)
5. Reports endpoints
6. Payouts admin oversight
7. Remaining missing endpoints
8. Auth security hardening

---

## Reference
- Admin panel API client: `apps/admin-panel/src/lib/api.ts`
- Response envelope format: root `CLAUDE.md`
- Audit module pattern: `apps/api/src/audit/audit.module.ts`
