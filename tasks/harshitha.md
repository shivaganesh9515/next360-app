# Harshitha — Backend: Razorpay Route payouts + inventory module

Area: `apps/api`. Payments/Razorpay integration is already real (order create, signature verify, webhook handling for `payment.captured`/`payment.failed`, refunds) — you're extending it, not building it from scratch.

## Tasks

- [x] **`inventory/` module** — built and available. Endpoints: `GET /inventory`, `PATCH /inventory/:id`, `GET /inventory/low-stock`. ✅ **Done** — merged into `soumya-vendor-dashboard` on 2026-07-19.

- [/] **Razorpay Route split-payout automation** — `razorpayAccountId` whitelisted in vendor DTO, vendor payouts read endpoint built (`GET /vendors/me/payouts`). The auto-split payout *trigger/automation* logic may still need work — confirm scope with team.

## Delivered in this merge

Beyond the assigned tasks, Harshitha's branch also included:
- ✅ Commission calculation for COD orders (`commission.service.ts`)
- ✅ Returns refund pipeline (`returns/` module)
- ✅ Offers applied during checkout
- ✅ Vendor earnings/transactions/payouts analytics endpoints
- ✅ Brands module, CMS module, KYC module, Sub-categories module
- ✅ Zones module + Delivery partners module (overlapping with Srinitha's scope)
- ✅ Zomato-style phone-OTP login (auth enhancement)

## Reference

- Prisma models: `Payment`, `Commission`, `Payout`, `Product`/`ProductVariant` (for stock).
- Response envelope format and Prisma error → HTTP mapping: see root `CLAUDE.md`.
- Webhook verification must stay server-side per existing convention — don't trust client-supplied payment status.
