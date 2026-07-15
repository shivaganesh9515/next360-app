# Srinitha — Backend: delivery-partners / zones / disputes + vendor analytics endpoints

Area: `apps/api`. These have zero backend support today despite the admin-panel already having full screens built for all three (they're currently calling into nothing).

## Tasks

- [ ] **`delivery-partners/` module** — Prisma has `DeliveryPartner`, `DeliveryAssignment`. Needs: list, status, zone, completed-deliveries count, rating, document verification (KYC-gated per CLAUDE.md business rules), plus whatever the admin-panel's `delivery-partners/`, `delivery-partners/approvals`, `delivery-partners/[id]` pages already expect — check `apps/admin-panel/src/app/(dashboard)/delivery-partners/**` for the exact shape each page needs before designing the DTO.

- [ ] **`zones/` module** — Prisma has `Zone`. Add/edit/activate zones, delivery radius, COD cap enforcement (₹2,000 rule per CLAUDE.md). MVP is Hyderabad + Vijayawada only — zone-gating logic for signup/checkout should live here or be called from here.

- [ ] **`disputes/` module** — refund requests and complaints linked to specific orders, resolution notes + action. Check `apps/admin-panel/src/app/(dashboard)/disputes/**` for the expected shape.

- [ ] **Vendor analytics/earnings/payouts endpoints** — `apps/vendor-dashboard/src/lib/api.ts` calls these, none exist yet in `vendors.controller.ts`:
  - `GET /vendors/me/analytics`
  - `GET /vendors/me/earnings`
  - `GET /vendors/me/payouts`
  - `GET /vendors/me/transactions`
  - `GET /vendors/me/customers`
  - `GET /vendors/:id/stats`

## Reference

- Response envelope format and Prisma error → HTTP mapping: see root `CLAUDE.md`.
- Coordinate with Harshitha — payouts data (`/vendors/me/payouts`) overlaps with her Razorpay Route payout work; confirm who owns the payout *read* endpoint vs. the payout *automation* before duplicating work.
