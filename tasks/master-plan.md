# Next360 — Master Implementation Plan

> **Updated**: July 19, 2026
> **Overall**: ~88% Complete
> **Team**: 5 members across Backend + Frontend + Mobile

---

## Team Assignments Overview

| Person | Area | Priority | Key Deliverables |
|--------|------|----------|-----------------|
| **Ashwanth** | Backend Admin + Security | 🔴 P0 | User/Support/Payouts endpoints, Helmet/ThrottlerGuard |
| **Harshitha** | Backend Payments | 🔴 P0 | Payout orderId, Payment list, Refund webhooks |
| **Srinitha** | Backend Delivery | 🔴 P0 | DP earnings, DP setup, Batch payouts |
| **Soumya** | Vendor Dashboard | 🟠 P1 | Payouts wire-up, Razorpay linking, Auto-refresh |
| **Manaswini** | Admin Panel | 🔴 P0 | Audit Logs page, Support pages, Bulk approvals |
| **Mobile Team** | Customer + Delivery Apps | 🔴 P0 | Google Login, Delivery Slot, Push notifications |

---

## Dependencies Map

```
  Backend (Ashwanth + Harshitha + Srinitha)
          |
          ├── Admin endpoints ready ──────► Manaswini (Admin Panel pages)
          ├── Reports/Payouts ready ──────► Manaswini (wire up pages)
          ├── Payouts backend ready ──────► Soumya (wire up page)
          ├── Support tickets ready ──────► Manaswini (build UI)
          ├── DP earnings/setup ready ────► Mobile Team (test DP app)
          │
          ├── Google Auth endpoint ───────► Mobile Team
          ├── Delivery slot endpoints ────► Mobile Team
          └── Notification events ───────► Mobile Team
```

**No-dependency work** (can start immediately):
- Ashwanth: User detail/status, Security hardening
- Manaswini: Audit Logs page
- Soumya: Razorpay linking UI, Auto-refresh
- Mobile Team: Push notification handling, Test against live backend

---

## 🔴 P0 — Ship-Blocking (Complete Now)

### Ashwanth — Backend Admin + Security
**File**: `tasks/ashwanth.md`
**Included in**:
1. User detail + status endpoints
2. Support Ticket system (full module)
3. Admin send notification endpoint
4. Security hardening (Helmet, ThrottlerGuard)
5. Reports endpoints
6. Payouts admin oversight
7. Remaining admin endpoints (payments list, ratings, analytics)
8. Auth security (JWT secret, OTP, refresh token)

### Harshitha — Backend Payments
**File**: `tasks/harshitha.md`
**Included in**:
1. Payout model — add orderId column
2. Payment list route (GET /payments)
3. Razorpay refund webhook handling
4. Delivery partner weekly payouts
5. Vendor settlement enhancement

### Srinitha — Backend Delivery
**File**: `tasks/srinitha.md`
**Included in**:
1. GET /delivery/earnings (DP earnings endpoint)
2. POST /delivery-partners/setup (profile setup endpoint)
3. Vendor approve endpoint verification
4. DP batch payouts
5. Auto-assignment optimization

### Mobile Team — Customer + Delivery Apps
**File**: `tasks/mobile-dev.md`
**Included in**:
1. Google Login backend integration
2. Delivery slot at checkout
3. Wire push notifications end-to-end
4. Cart validation enhancement
5. Empty/error/loading states audit

---

## 🟠 P1 — MVP Complete

### Soumya — Vendor Dashboard
**File**: `tasks/soumya.md`
**Included in**:
1. Payouts page wire-up (backend exists)
2. Razorpay account linking UI in store profile
3. Auto-refresh for orders page
4. Export reports
5. Order cancellation reason
6. Product bulk actions

### Manaswini — Admin Panel
**File**: `tasks/manaswini.md`
**Included in**:
1. Audit Logs page (backend exists)
2. Support Tickets pages (after Ashwanth completes backend)
3. Add sidebar nav items
4. Bulk product approval
5. Wire pages to backend (payouts, reports)
6. Settings notification toggles
7. E2E testing

---

## 🟡 P2 — Engagement & Growth

1. Reward points / wallet system
2. In-app chat (Customer ↔ Vendor)
3. Reorder feature
4. Referral program
5. Restock notifications
6. Subscription/weekly box feature

---

## Current Completion by Area

| Area | Completion | Status |
|------|:----------:|--------|
| Backend API | ~92% | 27 modules, audit + settings added |
| Customer App | ~85% | All screens, some flows need wire-up |
| Vendor Dashboard | ~80% | All pages, payouts need backend wire |
| Admin Panel | ~83% | All pages, audit/support pages pending |
| Delivery App | ~75% | Core flow works, earnings endpoint missing |
| Database | ~97% | 30 models (added AuditLog + PlatformSettings) |
| Security | ~45% | JWT + RBAC + audit logs, missing Helmet/CSRF |
| Infrastructure | ~30% | No Redis/CI/CD/monitoring |

---

## How to Track Progress

Each team member updates their task file as they complete items.
Completed items should be marked `[x]` and verified by:
1. TypeScript compiles for affected app(s)
2. Code review passes
3. Feature works against live backend (where applicable)
