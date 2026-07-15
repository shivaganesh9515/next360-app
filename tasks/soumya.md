# Soumya — Frontend: apps/vendor-dashboard

Screens are structurally complete (all 8 sidebar sections exist under `src/app/(dashboard)/`, real implementations, not stubs). Two threads of work: dependency/setup gap, and unblocking pages once backend lands.

## Tasks

- [ ] **Add missing dependencies** — `apps/vendor-dashboard/package.json` currently has Tailwind v4 + recharts + lucide, but is missing what CLAUDE.md's stack calls for:
  - `@supabase/supabase-js`
  - `shadcn/ui` (component setup, not just a dep — run their CLI init)
  - Confirm with the team whether zustand/axios are actually needed here or if the existing fetch-based `lib/api.ts` pattern is fine as-is before adding them.

- [ ] **Payouts page** (`earnings/` route) — currently renders empty since `GET /vendors/me/payouts` doesn't exist yet. Blocked on Srinitha — see [s
rinitha.md](./srinitha.md). Once live, wire it up.

- [ ] **Analytics/earnings pages** — same story, blocked on `GET /vendors/me/analytics`, `GET /vendors/me/earnings`, `GET /vendors/me/transactions`, `GET /vendors/me/customers` (Srinitha).

- [ ] **Dashboard KPIs** (new orders count, revenue today, low-stock alerts, pending payout) — check which of these already work vs. which are waiting on the analytics/inventory endpoints above.

## Not blocked — can start now

- shadcn/ui + Supabase client wiring doesn't need the backend work done first.
- Sweep the existing pages (dashboard, orders + `[id]`, products + add/edit, inventory, settings, plus the extras: coupons, offers, categories, customers, notifications, support, store) for UI polish / design-system consistency while waiting on backend.

## Reference

- Screen inventory and business rules (per-vendor order groups, commission model): root `CLAUDE.md` → "Vendor Web — Screen Inventory".
