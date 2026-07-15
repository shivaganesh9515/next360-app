# Current Status

**Last updated:** 2026-07-15
**Latest commit:** `4b66312` — customer-app phone-OTP auth (Zomato-style) + real backend endpoints
**Git remote:** `https://github.com/shivaganesh9515/next360-app.git` (branch: main)

## Auth model changed (2026-07-15)
Customer-app login is now Zomato-style single phone-number + OTP — no email/password, no separate signup screen. `POST /auth/send-otp` + `POST /auth/verify-otp-login` in `apps/api/src/auth` (verify-otp-login both logs an existing account in and provisions a new one on first verify). `User.phone` is now `@unique`, `User.email` is now optional (migration `20260715133157_user_phone_otp_auth`, not yet applied to any real DB — none exists in this dev environment). Vendor/admin still use the original email+password `login`/`signup` endpoints, untouched. OTP storage is in-memory on the NestJS process (5-min TTL, logged server-side, no SMS gateway wired up) — needs Redis or a DB table before this can run on more than one instance.

Also fixed while wiring this up: customer-app's `api.ts` `request()`/`upload()` weren't unwrapping apps/api's `{ success, data, meta }` response envelope — every real (non-demo-fallback) API call was silently getting the raw envelope instead of its payload. Was masked because a live backend was never actually reachable in dev until now.

**apps/api dependency gap (was blocking any build) is now fixed** — `@nestjs/jwt`, `@nestjs/mapped-types`, `@nestjs/passport`, `passport`, `passport-jwt`, `@supabase/supabase-js`, `class-validator`, `class-transformer`, `dotenv`, `multer` + types all added to `apps/api/package.json`. Verified via `npx nest build`. This was Abhinaya's assigned task in `tasks/abhinaya.md` — closed opportunistically while unblocking the auth work, update that file too.

## Team & Task Division (2026-07-15)
While mobile (customer-app + delivery-app) stays with the primary dev, the rest of the project is now split across a 6-person team. Full assignment detail lives in the root `CLAUDE.md` under "Current Task Division" — **update that section (and this file) whenever an item below closes**, so the whole team's AI stays in sync instead of re-discovering the same gaps.

- **Backend (apps/api)**: Abhinaya (brands/kyc/sub-categories/roles/cms modules + package.json dependency fixes), Srinitha (delivery-partners/zones/disputes modules + vendor analytics/earnings/payouts endpoints), Harshitha (Razorpay Route split-payout automation + inventory module).
- **Frontend (web)**: Soumya (apps/vendor-dashboard — shadcn/ui + Supabase client wiring, then live-data swap once backend lands), Manaswini (apps/admin-panel — same pattern for delivery-partners/zones/disputes/roles/cms/brands/sub-categories pages).
- **Coordinator**: Ashwanth — tracks handoffs between backend module completion and the frontend pages blocked on them.

## What's Done ✅
- All 12 phases complete (foundation → auth → APIs → vendor → customer → admin → delivery → AI → polish)
- All 5 apps build clean (0 TypeScript errors)
- All 38 admin pages fully API-wired
- All 25 vendor pages fully API-wired
- All 20 customer screens fully API-wired
- All 10 delivery screens fully API-wired
- Admin panel audit: 7 fixes committed (critical slug bug, moderation, filters, refunds)
- Safe dependency updates committed (17 packages bumped)
- Design tokens defined, category theming implemented
- Global exception filter, RBAC guards, rate limiting active

## What's Not Done ❌
- **Backend API is incomplete** — admin panel calls 102 routes, only ~60 exist. 40+ endpoint gap.
  - Missing: inventory, delivery-partners, payouts, CMS, brands, sub-categories, roles, zones, reports, admin settings/analytics, ratings aggregation, dashboard KPIs
- **Backend `.env` is placeholder** — Prisma can't connect to real DB, all pages show empty states gracefully
- **No seed data** — no demo products/orders/vendors
- **No CI/CD pipeline** — no GitHub Actions
- **No tests** — zero unit, integration, or E2E tests
- **3 raw `fetch()` calls** in admin panel (reviews, refunds pages) — should use `adminApi`
- **Design system inconsistency** — some admin pages use `gray-*`, newer use `slate-*`
- **Expo SDK 56** has 13 moderate CVEs (uuid/xcode) — needs major upgrade to 57+

## Vulnerability Summary
| Severity | Count | Root Cause | Fix |
|----------|-------|------------|-----|
| High | 2 | multer (via NestJS) | NestJS 12+ upgrade |
| Moderate | 1 | postcss (via Next.js) | Next.js 17+ upgrade |
| Moderate | 13 | uuid/xcode (via Expo) | Expo SDK 57+ upgrade |

## Next Priorities
1. **Wire missing backend modules** — most impactful, unblocks real data flow
2. **Add seed data** — enables demo/testing without real DB
3. **Set up CI/CD** — GitHub Actions for build + lint
4. **Fix 3 raw `fetch()` calls** — quick win, 5 minutes
