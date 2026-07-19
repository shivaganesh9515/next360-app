# Manaswini — Frontend: apps/admin-panel

Area: `apps/admin-panel`. Next.js 14 App Router + Tailwind + shadcn/ui.

## Status: Mostly Complete

### Completed ✅
- ✅ Merge completed — branch merged to main
- ✅ Dispures wiring fixed — now calls correct `/disputes` endpoints
- ✅ Admin 401 token cleanup — `localStorage.removeItem('admin_token')` in 401 handler
- ✅ 4 missing sidebar pages created: `/reports/sales`, `/reports/revenue`, `/settings/system`, `/products/add`
- ✅ All 7 assigned pages tested against live backend (delivery-partners, zones, disputes, roles, cms, brands, sub-categories)

### Still Open
- [ ] Wire settings page notification toggles to `PATCH /admin/settings` (waiting on backend)
- [ ] Bulk product approval (checkboxes + bulk action) — backend endpoint exists (`PATCH /products/:id/approve`) but may need a batch endpoint
- [ ] End-to-end testing of all admin pages against live backend

## Reference
- Sidebar: `apps/admin-panel/src/components/AdminSidebar.tsx`
- API client: `apps/admin-panel/src/lib/api.ts`
