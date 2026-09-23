# My Tasks

## Role
PM/Coordinator + Backend Developer (Admin Endpoints + Security + Support System)

## Task List (from tasks/ashwanth.md)

### P0 — Critical (blocks teammates)
1. **Security Hardening** — Helmet, ThrottlerGuard, JWT secret, OTP randomness
2. **User Admin Endpoints** — GET /users/:id, PATCH /users/:id/status
3. **Admin Notification Broadcast** — POST /notifications (broadcast to role/all)
4. **Support Module** — New Prisma models + CRUD (needs migration)

### P1 — Important (unblocks admin panel pages)
5. **Reports Module** — GET /reports/sales, GET /reports/revenue
6. **Payouts Admin Oversight** — GET /payouts/vendors, GET /payouts/delivery

### Already Done (no action needed)
- `PATCH /vendors/:id/status` — exists at vendors.controller.ts:146
- `PATCH /products/:id/approve` — exists at products.controller.ts:51
- Vendor detail with enriched data — exists at vendors.controller.ts (getAdminDetail)

## Impact
- Phases 1-5 unblock Manaswini's 5 admin panel pages
- Phase 5 unblocks Soumya's payouts page
- Phase 6 is independent (support system)
