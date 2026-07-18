# Manaswini — Frontend: apps/admin-panel

Area: `apps/admin-panel`. Next.js 14 App Router + Tailwind + shadcn/ui.

## Do Now (No Dependencies)

- [ ] **Merge existing branch** — your branch has `/roles/permissions` and `/cms/notifications` page implementations + dispute wiring fix. Merge to main. Coordinate with Ashwanth for review.

- [ ] **Fix dispute wiring** — currently builds disputes from `getReturns+getRefunds` merge instead of the dedicated `/disputes` module that Srinitha built. Once branch is merged, verify disputes page calls the correct endpoints.

- [ ] **Fix admin 401 token cleanup** — on 401 response, `admin_token` is not cleared from `localStorage`. Users get stuck in a loop. Add `localStorage.removeItem('admin_token')` to the 401 handler in `lib/api.ts`.

- [ ] **Create 4 missing sidebar pages** — sidebar links to these but page files don't exist:
  - `/reports/sales` — sales reports page
  - `/reports/revenue` — revenue reports page
  - `/settings/system` — system settings page
  - `/products/add` — add product page

## Blocked on Backend

- [ ] **Wire settings page toggles** — notification toggles are `readOnly`. Wire to `PATCH /admin/settings` once backend implements it (Srinitha task).

- [ ] **Add bulk product approval checkbox** — CLAUDE.md requires bulk-approve from day one. Current UI is single-item. Needs backend `PATCH /products/:id/approve` (Srinitha task) plus UI for multi-select + bulk action.

- [ ] **Test all admin pages against live backend** — walk through every sidebar page. Especially: dashboard aggregate, vendor approvals, product approvals, orders, payments, payouts, reports, analytics, CMS, zones, disputes, roles, settings.

## Reference

- Screen inventory: root `CLAUDE.md` → "Admin Web — Screen Inventory"
- Sidebar structure: `apps/admin-panel/src/components/AdminSidebar.tsx`
- API client: `apps/admin-panel/src/lib/api.ts` (has comments documenting every missing backend endpoint)
