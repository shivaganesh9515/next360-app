# Ashwanth — Backend: Admin Endpoints + Security Hardening

Area: `apps/api`. You own all admin-facing endpoints and global security fixes.

## P0 — Missing Admin Endpoints

- [ ] **Fix store profile `/vendors/me` bug** — vendor dashboard calls `GET/PATCH /vendors/me` with literal string `"me"` as vendor ID. Backend has no special-case for this. Add route handler that resolves the current user's vendor from JWT token.

- [ ] **Product approval endpoint** — `PATCH /products/:id/approve` — admin can't approve products. `isApproved` defaults to `false` with no way to set it to `true`.

- [ ] **Vendor reject endpoint** — `vendors.service.ts` has `approve()` but no `reject()`. Add reject method that sets vendor status to REJECTED.

- [ ] **Admin dashboard aggregate** — `GET /admin/dashboard` — returns order count, GMV, active vendors, pending approvals, partners online.

- [ ] **Admin reports endpoints** — `GET /reports/sales`, `GET /reports/revenue` — admin panel has report pages that call these.

- [ ] **Admin analytics endpoint** — `GET /admin/analytics` — admin panel analytics page calls this.

- [ ] **Admin payouts endpoints** — `GET /payouts/vendors`, `GET /payouts/delivery` — admin cross-vendor payout oversight.

- [ ] **Admin send notification** — `POST /notifications` — admin broadcast push notifications.

- [ ] **Admin settings endpoint** — `PATCH /admin/settings` — admin settings page calls this.

## P1 — Security Hardening

- [ ] **Apply Helmet** — `helmet` is installed but never imported. Add `app.use(helmet())` in `main.ts`.

- [ ] **Apply throttler guard globally** — `ThrottlerGuard` exists in `common/guards/` but is never registered. Add as global guard in `app.module.ts`.

- [ ] **Fix JWT secret fallback** — `auth.module.ts` line 14 falls back to `'next360-dev-secret'`. Remove fallback, fail fast if `JWT_SECRET` env var is missing.

- [ ] **Replace Math.random() for OTP** — `auth.service.ts` uses `Math.random()` for OTP generation. Replace with `crypto.randomInt()` for cryptographic security.

## Reference

- Response envelope format: root `CLAUDE.md`
- Existing module patterns: `apps/api/src/categories/`, `apps/api/src/vendors/`
- Admin panel API client: `apps/admin-panel/src/lib/api.ts` (has comments documenting every missing endpoint)
