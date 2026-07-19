# Srinitha — Backend: Delivery Pipeline + Endpoints

Area: `apps/api`. All tasks are complete. Delivery pipeline was fully implemented across the sprint.

## Status: ✅ All P0 Complete

### P0 — Fulfillment Pipeline ✅
- ✅ `POST /orders/:id/assign` — admin assigns DP to OrderVendorGroup
- ✅ `POST /orders/:id/reject` — DP rejects assignment
- ✅ `POST /orders/:id/verify-pickup` — OTP verification on pickup
- ✅ `POST /orders/:id/deliver` — DP marks delivery complete (added in Phase 1 fix)
- ✅ `PATCH /delivery/location` — DP updates lat/lng
- ✅ `PATCH /delivery/availability` — online/offline toggle
- ✅ `GET /delivery/new-orders` — list available assignments
- ✅ `GET /delivery/active` — list active deliveries
- ✅ `GET /delivery/history` — completed deliveries
- ✅ `POST /delivery/failure` — report failed delivery (DeliveryFailure model)
- ✅ `POST /delivery/setup` — vehicle/zone setup
- ✅ `GET /delivery/earnings` — period-filtered earnings

### P1 — Vendor Endpoints ✅
- ✅ `GET /vendors/me/analytics` — works with /sales and /revenue sub-routes
- ✅ `GET /vendors/me/earnings` — works
- ✅ `GET /vendors/me/transactions` — works
- ✅ `GET /vendors/me/customers` — works
- ✅ `GET /vendors/:id/stats` — works
- ✅ `GET /vendors/me/payouts` — works

### P3 — Future (Unstarted)
- [ ] Delivery partner payouts (weekly batch)
- [ ] Loyalty endpoints
- [ ] Permissions enforcement
- [ ] Caching layer
- [ ] Inventory audit trail
- [ ] Unit tests

## Reference
- Delivery service: `apps/api/src/delivery/delivery.service.ts`
- Delivery controller: `apps/api/src/delivery/delivery.controller.ts`
- DeliveryFailure model in `prisma/schema.prisma`
