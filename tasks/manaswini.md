# Manaswini — Frontend: apps/admin-panel

## Update 2026-07-16: these 7 pages are actually already wired

Good news — all 7 pages below already have real implementations calling `adminApi.*`, not empty-state stubs. They just never got tested against a live backend until now. Connecting a live local backend surfaced (and I fixed) two systemic bugs that were breaking them all silently:

Both fixed and pushed. If you pull latest, all 7 pages below should now show real data against a live backend (see `.claude/memory/STATUS.md` for how to spin one up locally — Docker Postgres + `npm run dev` in `apps/api`).

- [x] **Delivery-partners pages** (`delivery-partners/`, `delivery-partners/approvals`, `delivery-partners/[id]`) — real implementations, calling `getDeliveryPartners`/`getDeliveryPartner`/`updateDeliveryPartnerStatus`, all match real backend routes.
- [x] **Zones page** — full CRUD wired to `getZones`/`createZone`/`updateZone`/`deleteZone`, matches backend. Note: `deliveryRadius`/`codCap` fields in the form aren't actually persisted per-zone (backend returns fixed defaults, no such DB columns exist) — cosmetic gap, not a crash, flagged for whoever owns the Zone schema next.
- [x] **Disputes page** — wired, though it builds disputes from `getReturns`+`getRefunds` rather than the newer dedicated `/disputes` endpoints Srinitha built. Functionally fine (both read the same underlying `ReturnRequest` data) — could be simplified to call `/disputes` directly for less client-side merging, but not urgent.
- [x] **Roles page** — wired to `getRoles`/`createRole`/`updateRole`/`deleteRole`, matches backend. `getPermissions`/`updatePermissions` paths were wrong (fixed in `lib/api.ts` — permissions live on the Role record itself, updated via `PATCH /roles/:id`, not a separate endpoint).
- [x] **CMS page** — wired to `getCMS`/CRUD, matches backend.
- [x] **Brands page** — wired to `getBrands`/CRUD, matches backend.
- [x] **Sub-categories** (`categories/sub-categories`) — wired to `getSubCategories`/`getCategories`/CRUD, matches backend. Had its own instance of the `.data` unwrap bug (different variable names, `subRes`/`catRes` — fixed).

## Still genuinely open

- [ ] **Payouts oversight** (`payments/vendor-payouts`, `delivery-payouts`) — no backend support at all yet (`/payouts/*` routes don't exist; only `/vendors/me/payouts` for a vendor's own view, not admin cross-vendor oversight). Blocked on backend work, not a frontend task right now.
- [ ] **Add missing dependencies** — `shadcn/ui`, `@supabase/supabase-js` still not in `apps/admin-panel/package.json` per the original ask, if that still matters to you (vendor-dashboard has both set up already as a reference).
- [ ] Several other `adminApi.*` calls have zero backend support (admin dashboard aggregate, `/reports/*`, `/admin/settings`, single-user GET/status, product approval, ratings aggregate, notification sending) — all flagged with comments in `lib/api.ts`. Not your task to build the backend for these, just know the pages touching them will show errors/empty until someone does.
>>>>>>> main

## Reference

- Screen inventory and business rules (COD cap, zone-gating, moderation gates): root `CLAUDE.md` → "Admin Web — Screen Inventory".
- Full detail on what's connected/broken: `.claude/memory/STATUS.md`.
