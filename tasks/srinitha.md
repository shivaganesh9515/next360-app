# Srinitha — Backend: Delivery Pipeline + Missing Endpoints

> **Area**: `apps/api/src/`
> **Status**: Mostly Complete
> **Priority**: 🔴 P0 → 🟡 P2

---

## ✅ Already Completed

### Delivery Pipeline
- [x] `POST /orders/:id/assign` — admin assigns DP to OrderVendorGroup
- [x] `POST /orders/:id/reject` — DP rejects assignment
- [x] `POST /orders/:id/verify-pickup` — OTP verification on pickup
- [x] `POST /orders/:id/deliver` — DP marks delivery complete
- [x] `PATCH /delivery/location` — DP updates lat/lng
- [x] `PATCH /delivery/availability` — online/offline toggle
- [x] `GET /delivery/new-orders` — list available assignments
- [x] `GET /delivery/active` — list active deliveries
- [x] `GET /delivery/history` — completed deliveries
- [x] `POST /delivery/failure` — report failed delivery
- [x] `POST /delivery/setup` — vehicle/zone setup

### Vendor Endpoints
- [x] `GET /vendors/me/analytics` with /sales and /revenue sub-routes
- [x] `GET /vendors/me/earnings` — works
- [x] `GET /vendors/me/transactions` — works
- [x] `GET /vendors/me/customers` — works
- [x] `GET /vendors/:id/stats` — works
- [x] `GET /vendors/me/payouts` — works

---

## 🔴 P0 — Missing Endpoints

### 1. GET /delivery/earnings — Delivery Partner Earnings
**Files**: `apps/api/src/delivery/delivery.controller.ts`, `delivery.service.ts`
**What**:
- Endpoint: `GET /delivery/earnings?period=today|week|month`
- Return: `{ today, thisWeek, thisMonth, allTime, totalDeliveries, averagePerDelivery }`
- Query: `DeliveryAssignment` where `deliveryPartnerId = partner.id AND deliveredAt IS NOT NULL`
- **Impact**: Delivery app earnings screen shows empty without this

### 2. POST /delivery-partners/setup — Profile Setup
**Files**: `apps/api/src/delivery/delivery.controller.ts`, `delivery.service.ts`
**What**:
- Endpoint: `POST /delivery-partners/setup`
- Body: `{ vehicleType, zoneId }`
- Creates `DeliveryPartner` record linked to user, sets status to AVAILABLE
- **Impact**: Delivery app vehicle setup screen can't onboard new partners

### 3. POST /vendors/:id/approve — Vendor Approval Fix
**Files**: `apps/api/src/vendors/vendors.controller.ts`, `vendors.service.ts`
**What**:
- Verify the approve endpoint works end-to-end
- Add validation: verify KYC is VERIFIED before approving vendor
- Add notification to vendor on approval

---

## 🟠 P1 — Enhancement

### 4. Delivery Partner Batch Payouts (Weekly)
**Files**: `apps/api/src/delivery/delivery.service.ts`
**What**:
- Weekly cron job processes all undelivered delivery payouts
- Creates batch payout per delivery partner
- Separate from vendor Route payouts

### 5. Auto-Assignment Optimization
**Files**: `apps/api/src/delivery/delivery.service.ts`
**What**:
- Auto-assign nearest available DP when order is READY_FOR_PICKUP
- Fallback to manual assignment if no DP available within N minutes

---

## 🟡 P2 — Future

### 6. Delivery Partner KYC Verification Webhook
**Files**: `apps/api/src/delivery-partners/`
**What**: Notify DP when KYC is approved/rejected

### 7. Delivery Zone Management Enhancement
**Files**: `apps/api/src/zones/`
**What**: Add serviceable pincode list per zone

---

## Implementation Order
1. GET /delivery/earnings (DP app is blocked on this)
2. POST /delivery-partners/setup (DP setup flow is blocked on this)
3. Vendor approve endpoint verification
4. DP batch payouts
5. Auto-assignment optimization

---

## Reference
- Delivery service: `apps/api/src/delivery/delivery.service.ts`
- Delivery controller: `apps/api/src/delivery/delivery.controller.ts`
- DeliveryFailure model: `prisma/schema.prisma`
- Delivery app API client: `apps/delivery-app/src/lib/api.ts`
