# Current Status

**Last updated:** 2026-07-16
**Git remote:** `https://github.com/shivaganesh9515/next360-app.git` (branch: main)

## Local backend is now actually running (2026-07-16)
For the first time, this project has a real, live backend anyone can connect to in dev:
- Dedicated Docker Postgres container `next360-app-db` (NOT the older `next360-ecom-db-1` container that's a different, unrelated project — don't touch that one) on host port **5433** (5432 was already occupied by both a native Windows Postgres 18 service and that other container — don't reuse 5432 for this project).
- `DATABASE_URL` in root `.env` points at it, migrations applied, seed data loaded.
- `apps/api` runs via `npm run dev` (NestJS watch mode) on `http://localhost:4000`, all modules registered and responding with real seeded data.
- `apps/vendor-dashboard` (`npx next dev -p 3001`) and `apps/admin-panel` (`npm run dev`, already configured for port 3002) both point at it via their default `NEXT_PUBLIC_API_URL` fallback — no `.env` needed, they run in-browser on this machine so `localhost:4000` just works directly (unlike the phone, which needs `adb reverse` for USB testing).
- **Known issue**: someone hand-edited the already-applied `20260714132826_init` migration file after the fact (added Zone's `createdAt`/`updatedAt` directly to the historical file instead of a new migration) — this breaks `prisma migrate dev`'s shadow-database diffing. Worked around locally via `prisma db push` (syncs schema directly, bypasses migration replay) — the migration history itself is still corrupted and should get properly cleaned up (squash/regenerate) before this matters for a real deploy.

## Team branches merged (2026-07-16)
A separate session/agent verified and merged the whole 6-person team's branches into `main` — commits `9d3a463..9cf102a`. Full detail in `tasks/MERGE_REPORT_2026-07-16.md`. Short version:
- **Merged**: Abhinaya (brands/kyc/sub-categories/roles/cms — done in full), Harshitha (Razorpay Route split payouts + inventory — done in full, bonus `/vendors/me/payouts`), Srinitha (delivery-partners/zones/disputes modules done; vendor analytics/earnings/transactions/customers/`:id/stats` endpoints from her task list **still not built**), Soumya (vendor-dashboard shadcn/ui + Supabase wiring — done).
- **Not merged**: Manaswini's branch went off-scope (touched vendors/orders/ai-logs/products-approvals instead of her assigned 7 admin-panel pages: delivery-partners/zones/disputes/roles/cms/brands/sub-categories). Those 7 pages are still empty-state even though the backend modules for them now work.
- I (this session) then fixed a merge-conflict I hit in `app.module.ts` (additive, trivial) and a corrupted migration (see above), and connected all 3 frontends to the now-live backend — found and fixed real bugs neither vendor-dashboard nor admin-panel had ever been tested against a live API for:
  - Both had the same response-envelope bug customer-app had (`{success, data, meta}` never unwrapped in `request()`/`upload()`) — fixed in both.
  - Vendor signup posted to `/auth/register` (doesn't exist, only `/auth/signup` does) and never sent `role`, so every vendor signup would've silently created a `CUSTOMER` account — fixed.
  - ~15 `adminApi.*` calls in `apps/admin-panel/src/lib/api.ts` pointed at nonexistent routes — fixed the ones with a real corresponding backend route (wrong path/shape), left inline comments flagging the ones with **zero backend support**: admin dashboard aggregate, `/reports/*`, `/payouts/*` (admin cross-vendor oversight — only `/vendors/me/payouts` exists), `/admin/settings`, single-user GET/status, product approval, ratings aggregate, notification sending.

## Auth model changed (2026-07-15)
Customer-app login is now Zomato-style single phone-number + OTP — no email/password, no separate signup screen. `POST /auth/send-otp` + `POST /auth/verify-otp-login` in `apps/api/src/auth` (verify-otp-login both logs an existing account in and provisions a new one on first verify). `User.phone` is `@unique`, `User.email` is optional. Vendor/admin still use the original email+password `login`/`signup` endpoints, untouched. OTP storage is in-memory on the NestJS process (5-min TTL, logged server-side, no SMS gateway wired up) — needs Redis or a DB table before this can run on more than one instance.

## Team & Task Division
Full assignment detail lives in root `CLAUDE.md` under "Current Task Division" — **update that section (and this file) whenever an item below closes**.

- **Backend (apps/api)**: Abhinaya's and Harshitha's tasks are done. **Srinitha**: still needs `/vendors/me/analytics`, `/vendors/me/earnings`, `/vendors/me/transactions`, `/vendors/me/customers`, `/vendors/:id/stats`.
- **Frontend (web)**: Soumya's vendor-dashboard task is done. **Manaswini**: still needs to wire the 7 admin-panel pages listed above to the now-live backend modules — this is the biggest concrete gap left in the whole project right now.
- **Coordinator**: Ashwanth.

## Next Priorities
1. Wire the 7 empty-state admin-panel pages (Manaswini's task, redirect or reassign)
2. Srinitha's remaining vendor analytics/earnings endpoints
3. Clean up the corrupted `init` migration (squash/regenerate migration history)
4. Set up CI/CD — still no GitHub Actions
5. Still no tests — zero unit/integration/E2E across the whole project
