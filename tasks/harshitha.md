# Harshitha — Backend: Payments + Money Integrity

Area: `apps/api`. All P0 items are complete.

## Status: ✅ All P0 Complete

### P0 — Money Integrity ✅
- ✅ **Returns → refund pipeline** — `returns.service.ts.process()` calls `paymentsService.initiateRefund()` for Razorpay orders, updates order to REFUNDED, restores stock. Auth guards added, proper DTOs used.
- ✅ **COD commission** — Commission calculated on order creation for COD orders (via `commissionService.calculateCommissions()` after create).
- ✅ **Offers wiring** — Offer validation and discount calculation in order creation flow (similar to coupon logic).
- ✅ **Razorpay Route split-payouts** — On `payment.captured` webhook, creates transfers to each vendor's linked Razorpay account, records Payout records.

### P1 — Payment Fields ✅
- ✅ `razorpayAccountId` whitelisted in vendor update DTO

### Remaining Gaps (Unassigned)
- [ ] Payout model needs `orderId` column for exact dedup (currently uses 5-min time window heuristic)
- [ ] Delivery partner payouts (separate from Route — per-delivery fee, batched weekly)
- [ ] Refund webhook handling from Razorpay

## Reference
- Payments service: `apps/api/src/payments/payments.service.ts`
- Returns service: `apps/api/src/returns/returns.service.ts`
- Commission service: `apps/api/src/commission/commission.service.ts`
