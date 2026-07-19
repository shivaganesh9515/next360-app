# Soumya — Frontend: apps/vendor-dashboard

Screens are structurally complete (all 8 sidebar sections exist under `src/app/(dashboard)/`, real implementations, not stubs). Two threads of work: dependency/setup gap, and unblocking pages once backend lands.

## Tasks

- [x] **Fix analytics sub-routes** — `getSalesAnalytics` and `getRevenueAnalytics` in `lib/api.ts` call `/vendors/me/analytics/sales` and `/vendors/me/analytics/revenue` which don't exist. The main `/vendors/me/analytics` endpoint works fine. Fix the sub-routes to either use the main endpoint or remove the separate calls. ✅ Already fixed — both sales and revenue pages call `vendorApi.getAnalytics(period)` which hits the main endpoint.

- [x] **Verify store profile edit** — calls `GET/PATCH /vendors/me` with literal `"me"` as vendor ID. Backend may 404. Test against live backend, report if broken (backend owns the fix). ✅ Fixed — `store/page.tsx` uses `getMyProfile()`, `store/edit/page.tsx` uses `getMyProfile()` + `updateMyProfile()` which hit `GET/PATCH /vendors/my-profile` (resolves via `@CurrentUser`).

- [x] **Add missing dependencies** — `apps/vendor-dashboard/package.json` currently has Tailwind v4 + recharts + lucide, but is missing what CLAUDE.md's stack calls for:
  - `@supabase/supabase-js` ✅ already in package.json (`^2.110.5`)
  - `shadcn/ui` ✅ CLI installed, `components.json` configured, 13 components in `src/components/ui/`
  - Confirm with the team whether zustand/axios are actually needed here or if the existing fetch-based `lib/api.ts` pattern is fine as-is before adding them. ✅ Confirmed — neither zustand nor axios are imported anywhere; fetch-based `lib/api.ts` pattern is sufficient.

- [x] **Payouts page** (`earnings/payouts/`) — was blocked on `GET /vendors/me/payouts`. ✅ **Done** — `earnings/payouts/page.tsx` calls `vendorApi.getPayouts()` which hits `/vendors/me/payouts`. Backend endpoint now available after Harshitha's merge.

- [x] **Analytics/earnings/transactions/customers pages** — was blocked on backend endpoints. ✅ **Done** — All pages already wired up with API calls:
  - `analytics/page.tsx` → `vendorApi.getAnalytics('30d')` → `GET /vendors/me/analytics`
  - `analytics/sales/page.tsx` → `vendorApi.getAnalytics(period)` → `GET /vendors/me/analytics`
  - `analytics/revenue/page.tsx` → `vendorApi.getAnalytics(period)` → `GET /vendors/me/analytics`
  - `earnings/page.tsx` → `vendorApi.getEarnings()` → `GET /vendors/me/earnings`
  - `earnings/transactions/page.tsx` → `vendorApi.getTransactions()` → `GET /vendors/me/transactions`
  - `customers/page.tsx` → `vendorApi.getCustomers()` → `GET /vendors/me/customers`

- [x] **Dashboard KPIs** (new orders count, revenue today, low-stock alerts, pending payout). ✅ **Done** — `page.tsx` calls `vendorApi.getProducts()`, `getOrders()`, `getEarnings()`, `getAnalytics('30d')` and computes all 4 KPIs from live data.

## Reference

- Screen inventory and business rules (per-vendor order groups, commission model): root `CLAUDE.md` → "Vendor Web — Screen Inventory".
