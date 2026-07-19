# Soumya — Frontend: apps/vendor-dashboard

Screens are structurally complete (all 8 sidebar sections exist under `src/app/(dashboard)/`, real implementations, not stubs). Two threads of work: dependency/setup gap, and unblocking pages once backend lands.

## Tasks

- [x] **Fix analytics sub-routes** — `getSalesAnalytics` and `getRevenueAnalytics` in `lib/api.ts` call `/vendors/me/analytics/sales` and `/vendors/me/analytics/revenue` which don't exist. The main `/vendors/me/analytics` endpoint works fine. Fix the sub-routes to either use the main endpoint or remove the separate calls. ✅ Already fixed — both sales and revenue pages call `vendorApi.getAnalytics(period)` which hits the main endpoint.

- [x] **Verify store profile edit** — calls `GET/PATCH /vendors/me` with literal `"me"` as vendor ID. Backend may 404. Test against live backend, report if broken (backend owns the fix). ✅ Fixed — `store/page.tsx` uses `getMyProfile()`, `store/edit/page.tsx` uses `getMyProfile()` + `updateMyProfile()` which hit `GET/PATCH /vendors/my-profile` (resolves via `@CurrentUser`).

- [x] **Add missing dependencies** — `apps/vendor-dashboard/package.json` currently has Tailwind v4 + recharts + lucide, but is missing what CLAUDE.md's stack calls for:
  - `@supabase/supabase-js` ✅ already in package.json (`^2.110.5`)
  - `shadcn/ui` ✅ CLI installed, `components.json` configured, 13 components in `src/components/ui/`
  - Confirm with the team whether zustand/axios are actually needed here or if the existing fetch-based `lib/api.ts` pattern is fine as-is before adding them. ✅ Confirmed — neither zustand nor axios are imported anywhere; fetch-based `lib/api.ts` pattern is sufficient.

- [ ] **Payouts page** (`earnings/` route) — was blocked on `GET /vendors/me/payouts`. ✅ **Now unblocked** — backend endpoints merged from Harshitha's branch. `GET /vendors/me/payouts` exists. Still needs: wire up the earnings page UI.

- [ ] **Analytics/earnings pages** — was blocked on `GET /vendors/me/analytics`, `GET /vendors/me/earnings`, `GET /vendors/me/transactions`, `GET /vendors/me/customers`. ✅ **Now unblocked** — all 4 endpoints exist on the merged branch. Still needs: wire up the UI pages.

- [ ] **Dashboard KPIs** (new orders count, revenue today, low-stock alerts, pending payout). ✅ **Now unblocked** — analytics and inventory endpoints available. Still needs: connect dashboard cards to live data.

## Ready to start

- Wire up payouts, analytics, earnings, transactions, customers pages to the now-available backend endpoints.
- Connect dashboard KPIs to analytics and inventory data.
- UI polish / design-system consistency on existing pages.

## Backend endpoints now available (from Harshitha's merge)

| Endpoint | Service Method |
|----------|---------------|
| `GET /vendors/me/payouts` | `vendorsService.getVendorPayouts()` |
| `GET /vendors/me/analytics` | `vendorsService.getAnalytics()` |
| `GET /vendors/me/earnings` | `vendorsService.getVendorEarnings()` |
| `GET /vendors/me/transactions` | `vendorsService.getVendorTransactions()` |
| `GET /vendors/me/customers` | `vendorsService.getCustomers()` |
| `GET /inventory`, `PATCH /inventory/:id`, `GET /inventory/low-stock` | `inventory/` module |

## Reference

- Screen inventory and business rules (per-vendor order groups, commission model): root `CLAUDE.md` → "Vendor Web — Screen Inventory".
