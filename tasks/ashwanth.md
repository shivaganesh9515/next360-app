# Ashwanth — Backend: Admin Endpoints + Security Hardening

Area: `apps/api`. These are the remaining backend gaps after the main sprint.

## P0 — Missing Admin Endpoints

- [ ] **Admin dashboard aggregate** — `GET /admin/dashboard` — returns order count, GMV, active vendors, pending approvals, partners online. Admin panel calls this on the dashboard page.
- [ ] **Product approval endpoint** — `PATCH /products/:id/approve` — admin can't approve products. `isApproved` defaults to false with no way to set it.
- [ ] **Vendor reject endpoint** — `vendors.service.ts` has `approve()` but no `reject()`. Need method to set status to REJECTED.
- [ ] **Admin reports endpoints** — `GET /reports/sales`, `GET /reports/revenue` — admin panel has report pages calling these.
- [ ] **Admin analytics endpoint** — `GET /admin/analytics` — admin panel analytics page calls this.
- [ ] **Admin payouts endpoints** — `GET /payouts/vendors`, `GET /payouts/delivery` — admin cross-vendor payout oversight.
- [ ] **Admin send notification** — `POST /notifications` — admin broadcast push.
- [ ] **Admin settings endpoint** — `PATCH /admin/settings` — admin settings page calls this.

## P1 — Security Hardening
- [ ] Apply Helmet (`app.use(helmet())` in `main.ts` — package is already installed)
- [ ] Apply ThrottlerGuard globally (file exists in `common/guards/`, not registered)
- [ ] Fix JWT secret fallback: remove `'next360-dev-secret'` fallback, fail fast if env var missing
- [ ] Replace Math.random() for OTP with `crypto.randomInt()`

## Reference
- Response envelope format: root `CLAUDE.md`
- Admin panel API client: `apps/admin-panel/src/lib/api.ts`
