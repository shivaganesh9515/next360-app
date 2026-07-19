# Harshitha — Backend: Payments + Money Integrity + Financial Operations

> **Area**: `apps/api/src/`
> **Status**: In Progress
> **Priority**: 🔴 P0 → 🟡 P2

---

## ✅ Already Completed

- [x] Returns → refund pipeline (`returns.service.ts.process()` → `paymentsService.initiateRefund()`)
- [x] COD commission auto-calculation on order creation
- [x] Offers wiring into order creation (discount calculation)
- [x] Razorpay Route split-payouts on `payment.captured` webhook
- [x] `razorpayAccountId` whitelisted in vendor update DTO

---

## 🔴 P0 — Money Integrity

### 1. Payout Model — Add orderId for Exact Dedup
**Files**: `prisma/schema.prisma`, Payout service
**What**:
- Add `orderId` column to `Payout` model (currently missing — dedup uses 5-min time window heuristic)
- Update payout creation logic to use orderId for exact dedup instead of time window
- **Risk**: Duplicate payout risk on webhook retries beyond the 5-min window

### 2. Payment List Route
**Files**: `apps/api/src/payments/payments.controller.ts`
**What**:
- `GET /payments` — list all payments with filters (status, date range, vendor) — **Missing**
- Admin panel calls this on the payments/transactions page

### 3. Razorpay Refund Webhook Handling
**Files**: `apps/api/src/payments/payments.service.ts`
**What**:
- Handle `refund.created`, `refund.processed` webhook events from Razorpay
- Update order status, restore stock automatically
- Currently refunds are initiated manually but no webhook confirmation

---

## 🟠 P1 — Financial Operations

### 4. Delivery Partner Weekly Payouts
**Files**: `apps/api/src/delivery/delivery.service.ts`, `apps/api/src/payments/`
**What**:
- Batch process undelivered delivery partner payouts weekly
- Separate from Razorpay Route (per-delivery fee, batched)
- Create Payout records for delivery partners

### 5. Vendor Settlement Enhancement
**Files**: `apps/api/src/payments/payments.service.ts`
**What**:
- Add settlement tracking: when was a vendor last paid, minimum settlement amount
- Auto-settlement trigger when threshold reached

---

## 🟡 P2 — Polish

### 6. Payment Analytics
**Files**: `apps/api/src/payments/`
**What**:
- Payment success/failure rate by gateway
- Average settlement time
- Revenue by payment method (COD vs Online)

---

## Implementation Order
1. Add orderId to Payout model + migration
2. Create GET /payments list endpoint
3. Wire Razorpay refund webhook handlers
4. Delivery partner weekly payouts
5. Vendor settlement enhancement

---

## Reference
- Payments service: `apps/api/src/payments/payments.service.ts`
- Returns service: `apps/api/src/returns/returns.service.ts`
- Commission service: `apps/api/src/commission/commission.service.ts`
- Payout model: `prisma/schema.prisma` → model Payout
