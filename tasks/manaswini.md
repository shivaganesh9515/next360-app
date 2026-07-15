# Manaswini — Frontend: apps/admin-panel

Broadest screen coverage of any app (all 10 required screens plus extras), but the most backend-dependent — several pages call APIs that don't exist yet.

## Tasks

- [ ] **Add missing dependencies** — same gap as vendor-dashboard: no `shadcn/ui`, no `@supabase/supabase-js` in `apps/admin-panel/package.json`.

- [ ] **Delivery-partners pages** (`delivery-partners/`, `delivery-partners/approvals`, `delivery-partners/[id]`) — currently effectively static, blocked on Srinitha's `delivery-partners/` module. See [srinitha.md](./srinitha.md).

- [ ] **Zones page** — blocked on Srinitha's `zones/` module.

- [ ] **Disputes page** — blocked on Srinitha's `disputes/` module.

- [ ] **Roles page** — blocked on Abhinaya's `roles/` module. See [abhinaya.md](./abhinaya.md).

- [ ] **CMS page** — blocked on Abhinaya's `cms/` module.

- [ ] **Brands page** — blocked on Abhinaya's `brands/` module (currently dead — DTOs exist but no controller registered).

- [ ] **Sub-categories** (folded into categories page) — blocked on Abhinaya's `sub-categories/` module.

- [ ] **Payouts oversight** (`payments/vendor-payouts`, `delivery-payouts`) — blocked on Harshitha's Razorpay Route work + Srinitha's payout read endpoints.

## Not blocked — can start now

- shadcn/ui + Supabase client wiring.
- Products page (folded product-approvals in — no separate approvals route currently; confirm with the team whether that split is actually needed per CLAUDE.md's spec, which calls for a distinct "Product Approvals" queue with bulk-approve).
- Vendor approvals, all-vendors, orders oversight, ai-logs pages — these hit modules that already exist on the backend (`vendors/`, `orders/`, `ai/`), so should be fully wireable now if not already.

## Reference

- Screen inventory and business rules (COD cap, zone-gating, moderation gates): root `CLAUDE.md` → "Admin Web — Screen Inventory".
