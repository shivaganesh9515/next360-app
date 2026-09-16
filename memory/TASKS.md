# Tasks

> **Last updated:** 2026-07-20

---

## Priority Order

| Priority | Task | Owner | Status |
|----------|------|-------|--------|
| P0 | Fix apps/api/package.json missing deps | Abhinaya | ✅ Done |
| P0 | Build brands/ module | Abhinaya | ✅ Done |
| P0 | Build kyc/ module | Abhinaya | ✅ Done |
| P0 | Build sub-categories/ module | Abhinaya | ✅ Done |
| P0 | Build roles/ module | Abhinaya | ✅ Done |
| P0 | Build cms/ module | Abhinaya | ✅ Done |
| P0 | Build support/ module | Abhinaya | ✅ Done |
| P0 | Build reports/ module | Abhinaya | ✅ Done |
| P0 | Build payouts/ module | Abhinaya | ✅ Done |
| P0 | Admin endpoints (payments, reviews, analytics) | Abhinaya | ✅ Done |
| P0 | Run Prisma migration for support tickets | Abhinaya | ⏳ Blocked (no PostgreSQL) |
| P1 | Vendor analytics/earnings/payouts endpoints | Srinitha | 🔄 Pending |
| P1 | Razorpay Route split-payout automation | Harshitha | 🔄 Pending |
| P1 | Wire shadcn/ui + Supabase in vendor-dashboard | Soumya | 🔄 Pending |
| P1 | Wire shadcn/ui + Supabase in admin-panel | Manaswini | 🔄 Pending |
| P1 | Replace empty-state pages with live data | Soumya+Manaswini | 🔄 Blocked |
| P2 | Add seed data | TBD | ❌ Not started |
| P2 | Set up CI/CD pipeline | TBD | ❌ Not started |
| P2 | Fix 3 raw fetch() calls in admin panel | TBD | ❌ Not started |
| P2 | Fix design system inconsistency (gray vs slate) | TBD | ❌ Not started |
| P3 | Upgrade Expo SDK 57+ | TBD | ❌ Not started |
| P3 | Write unit/integration/E2E tests | TBD | ❌ Not started |

---

## Completed Tasks ✅

### Abhinaya — Backend Modules
- [x] Fix apps/api/package.json - Added missing deps
- [x] brands/ module - CRUD with storeType filter
- [x] kyc/ module - Submit, status, verify (admin)
- [x] sub-categories/ module - CRUD nested under categories
- [x] roles/ module - CRUD roles + permissions
- [x] cms/ module - CRUD pages + banners

### Abhinaya — Round 2 (THIS SESSION)
- [x] **Support Ticket System** — Prisma models (SupportTicket + TicketReply + User relations), support/ module with 7 endpoints (create, list all, my tickets, find one, assign, reply, update status)
- [x] **Reports Endpoints** — reports/ module with GET /reports/sales (paginated, date-filterable) and GET /reports/revenue (aggregate)
- [x] **Payouts Admin Oversight** — payouts/ module with GET /payouts, GET /payouts/vendors, GET /payouts/delivery, GET /payouts/summary, PATCH /payouts/:id/status
- [x] **Remaining Admin Endpoints** — GET /payments (admin list all), GET /reviews/ratings (rating distribution + top-rated), GET /admin/analytics (platform metrics: orders, revenue, users, vendors, products, AOV)

### Loyalty Engine (2026-08-10)
- [x] **Prisma Schema** — Added LoyaltyTier, PointsTransactionType, ReferralStatus enums + 5 new models
- [x] **Loyalty Module** — NestJS module with service + controller (7 API endpoints)
- [x] **Referrals Module** — Referral code generation, validation, reward processing
- [x] **Order Integration** — Auto-award points on purchase, process referral rewards
- [x] **Customer App** — LoyaltyScreen updated to use real API with demo fallback

### Platform / Core (shivaganesh9515)
- [x] Monorepo scaffold (Turborepo + workspaces)
- [x] Prisma schema finalized + migrated (20+ models, 541 lines)
- [x] NestJS backend scaffold with modular architecture (25 modules)
- [x] Auth system (Supabase + JWT + OTP + RBAC with @Roles() decorator)
- [x] Core APIs: categories, products, vendors, cart, orders, payments, addresses, reviews, wishlist, coupons, offers, returns, notifications, upload, ai, commission, seed
- [x] Global exception filter, response interceptor, logging interceptor, rate limiting
- [x] Customer App: 20+ screens, 30+ components, navigation, category theming, pill nav, bottom sheet
- [x] Customer App: Animated bottom-nav transitions, map-based address picker
- [x] Delivery App: 10 screens, auth, delivery management with Expo Router
- [x] Vendor Dashboard: 25 pages, sidebar layout, API client (text-first fetch)
- [x] Admin Panel: 38 pages, sidebar layout, API client (text-first fetch)
- [x] Project documentation: CLAUDE.md, .claude/memory/ (6 files), tasks/ (7 files)

---

## Pending Tasks 🔄

### Srinitha
- delivery-partners/ module - List, status, zone, completed-deliveries, rating, document verification
- zones/ module - Add/edit/activate zones, delivery radius, COD cap enforcement (Rs. 2,000)
- disputes/ module - Refund requests, complaints linked to orders, resolution notes + action
- Vendor analytics endpoints:
  - GET /vendors/me/analytics
  - GET /vendors/me/earnings
  - GET /vendors/me/payouts
  - GET /vendors/me/transactions
  - GET /vendors/me/customers
  - GET /vendors/:id/stats

### Harshitha
- Razorpay Route split-payout automation - Auto-split platform funds to each vendor's Razorpay account
- inventory/ module - GET stock, PATCH update, GET low-stock alerts

### Soumya (Vendor Dashboard)
- Add @supabase/supabase-js + shadcn/ui to vendor-dashboard
- Wire up payouts page (blocked on Srinitha)
- Wire up analytics/earnings pages (blocked on Srinitha)
- Wire up dashboard KPIs (blocked on Srinitha + Harshitha)

### Manaswini (Admin Panel)
- Add @supabase/supabase-js + shadcn/ui to admin-panel
- Wire up delivery-partners pages (blocked on Srinitha)
- Wire up zones page (blocked on Srinitha)
- Wire up disputes page (blocked on Srinitha)
- Wire up roles/brands/cms/sub-categories pages (all unblocked now ✅)
- Wire up payouts oversight (blocked on Harshitha + Srinitha)

---

## Blocked Tasks ⛔

| Task | Blocked On |
|------|-----------|
| Manaswini: delivery-partners pages | Srinitha: delivery-partners module |
| Manaswini: zones page | Srinitha: zones module |
| Manaswini: disputes page | Srinitha: disputes module |
| Manaswini: payouts oversight | Harshitha + Srinitha |
| Soumya: payouts/analytics/earnings pages | Srinitha: vendor analytics endpoints |
| Soumya: dashboard KPIs | Srinitha + Harshitha |

---

## Ashwanth — Coordination Tasks

- [ ] When someone closes an item, confirm downstream frontend task is unblocked
- [ ] Keep CLAUDE.md Current Task Division in sync
- [ ] Keep .claude/memory/STATUS.md in sync
- [ ] Watch overlap: Srinitha /vendors/me/payouts vs Harshitha payout automation
- [ ] Confirm admin product-approvals split (bulk-approve queue vs folded-in page)
