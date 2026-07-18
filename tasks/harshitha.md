# Harshitha — Backend: Payments + Money Integrity

Area: `apps/api`. Razorpay integration is already real (order create, signature verify, webhook handling, refunds, Route split-payout, inventory) — you're fixing money-related bugs and gaps.

## P0 — Money Integrity

- [ ] **Fix returns → refund pipeline** — when admin approves a return in `returns.service.ts` `process()`, it only updates status. Must also: call `paymentsService.initiateRefund()` to refund via Razorpay, update order status to `REFUNDED`, restore product stock. Also fix: add auth guards to `findOne()` and `findRefunds()` endpoints (currently public), replace `@Body() dto: any` with proper `ProcessReturnDto`.

- [ ] **Fix COD commission** — commission is only calculated on Razorpay `payment.captured` webhook. COD orders skip it entirely. Add commission calculation to order creation flow for COD orders (in `orders.service.ts` after order is created with status CONFIRMED).

- [ ] **Fix offers wiring** — offers have full CRUD but `orders.service.ts` never looks them up during checkout. Add offer validation and discount calculation to the order creation flow (similar to how coupons work).

## P1 — Payment Fields

- [ ] **Whitelist `razorpayAccountId`** — vendor update DTO doesn't whitelist this field, so even if the UI existed, saving it would be rejected.

## Reference

- Your previous work: `apps/api/src/inventory/` (done), `apps/api/src/payments/payments.service.ts` (Route split-payout done)
- Response envelope format: root `CLAUDE.md`
- Prisma models: `Payment`, `Commission`, `Payout`, `ReturnRequest`, `Offer`
