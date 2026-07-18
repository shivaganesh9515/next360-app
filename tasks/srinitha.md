# Srinitha — Backend: Delivery Pipeline + Endpoints

Area: `apps/api`. All tasks have no dependencies — can start immediately.

## P0 — Fulfillment Pipeline (Critical Path)

- [ ] **Delivery assignment pipeline** — build the entire flow:
  - `POST /orders/:id/assign` — admin assigns delivery partner to an OrderVendorGroup
  - `POST /orders/:id/reject` — delivery partner rejects assignment
  - `POST /orders/:id/verify-pickup` — OTP verification on pickup
  - `PATCH /delivery/location` — delivery partner updates lat/lng
  - `PATCH /delivery/availability` — online/offline toggle
  - `GET /delivery/new-orders` — list available assignments for partner
  - `GET /delivery/active` — list active deliveries for partner
  - `GET /delivery/history` — completed deliveries for partner
  - This is the single biggest gap in the project — no order can reach the customer once packed without this.

- [ ] **Fix realtime channel table name** — delivery app subscribes to Supabase `postgres_changes` on table `orders` (lowercase). Verify this matches actual Supabase table name (Prisma generates lowercase plural). If wrong, the new-order push will never fire.

## P1 — Delivery Endpoints

- [ ] **Add delivery earnings endpoint** — `GET /delivery/earnings` — delivery app's earnings screen calls this, it doesn't exist.

- [ ] **Delivery partner registration** — `POST /delivery-partners/setup` — delivery app can't onboard new partners. Needs to create DeliveryPartner record from vehicle/zone data.

## P1 — Vendor Endpoints (Verify & Fill Gaps)

These were originally assigned and partially done. Verify which exist and fill gaps:

- [ ] `GET /vendors/me/analytics` — verify it works, add sub-routes `/sales` and `/revenue` if missing
- [ ] `GET /vendors/me/earnings` — verify it works
- [ ] `GET /vendors/me/transactions` — verify it works
- [ ] `GET /vendors/me/customers` — verify it works
- [ ] `GET /vendors/:id/stats` — verify it works

## P3 — Future

- [ ] **Delivery partner payouts** — weekly batch logic for delivery partner earnings (per-delivery fee, batched weekly, NOT through Razorpay Route)
- [ ] **Loyalty endpoints** — tiers, points, progress tracking
- [ ] **Permissions enforcement** — `PermissionGuard` doesn't exist. `Role.permissions` JSON is never checked.
- [ ] **Caching layer** — Redis or in-memory cache for product listings, categories, CMS
- [ ] **Inventory audit trail** — log stock changes with what/when/why
- [ ] **No tests** — add unit tests for critical paths (orders, payments, auth)

## Reference

- Response envelope format: root `CLAUDE.md`
- Existing module patterns: `apps/api/src/categories/`, `apps/api/src/vendors/`
- Prisma schema: `prisma/schema.prisma` (551 lines, 27 models)
