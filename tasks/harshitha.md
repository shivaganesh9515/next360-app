# Harshitha — Backend: Razorpay Route payouts + inventory module

Area: `apps/api`. Payments/Razorpay integration is already real (order create, signature verify, webhook handling for `payment.captured`/`payment.failed`, refunds) — you're extending it, not building it from scratch.

## Tasks

- [ ] **Razorpay Route split-payout automation** — per CLAUDE.md's "Razorpay Route" business rule: funds land in the platform account, then need to auto-split payout to each vendor's linked Razorpay account based on `subtotal - commissionPct`. This logic doesn't exist yet. Delivery partner payouts are separate (per-delivery fee, batched weekly, NOT through Route) — don't conflate the two.
  - Coordinate with Srinitha before starting — she owns `GET /vendors/me/payouts` (the read endpoint); confirm the split between "read payout history" and "trigger/automate payout" so you're not duplicating.

- [ ] **`inventory/` module** — no dedicated stock endpoints exist beyond raw product fields (`Product.stock` etc. presumably updated via the product controller directly). Build: `GET` stock, `PATCH` update, `GET` low-stock — per CLAUDE.md's module list. Vendor-dashboard's Inventory screen and admin's low-stock alerts need this.

## Reference

- Prisma models: `Payment`, `Commission`, `Payout`, `Product`/`ProductVariant` (for stock).
- Response envelope format and Prisma error → HTTP mapping: see root `CLAUDE.md`.
- Webhook verification must stay server-side per existing convention — don't trust client-supplied payment status.
