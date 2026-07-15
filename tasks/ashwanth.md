# Ashwanth — Coordination

You're the PM/coordinator across the backend (Abhinaya, Srinitha, Harshitha) and frontend (Soumya, Manaswini) tracks. You're not expected to write the modules/pages yourself — your job is making sure the handoffs actually happen.

## What to track

Every frontend task in [soumya.md](./soumya.md) and [manaswini.md](./manaswini.md) that says "blocked on X" is waiting on a specific backend task in [abhinaya.md](./abhinaya.md), [srinitha.md](./srinitha.md), or [harshitha.md](./harshitha.md). The dependency map:

| Backend item | Unblocks |
|---|---|
| Abhinaya: `brands/` module | Manaswini: admin brands page |
| Abhinaya: `kyc/` module | (no direct frontend page yet — verify one is needed) |
| Abhinaya: `sub-categories/` module | Manaswini: admin sub-categories |
| Abhinaya: `roles/` module | Manaswini: admin roles page |
| Abhinaya: `cms/` module | Manaswini: admin CMS page + customer-app's hero banner (flagged separately, mobile side) |
| Abhinaya: `package.json` deps fix | Everyone's local `apps/api` builds |
| Srinitha: `delivery-partners/` module | Manaswini: admin delivery-partners pages |
| Srinitha: `zones/` module | Manaswini: admin zones page |
| Srinitha: `disputes/` module | Manaswini: admin disputes page |
| Srinitha: vendor analytics/earnings/transactions/customers endpoints | Soumya: vendor-dashboard analytics/earnings pages |
| Harshitha: Razorpay Route payout automation | Soumya + Manaswini: payouts pages (read side depends on Srinitha too — watch for overlap, flagged in both their files) |
| Harshitha: `inventory/` module | Soumya: vendor inventory page; Manaswini: admin low-stock alerts |

## Ongoing responsibilities

- [ ] When someone closes an item in their file, confirm the downstream frontend task actually got unblocked (not just "backend says done").
- [ ] Keep root `CLAUDE.md` → "Current Task Division" and `.claude/memory/STATUS.md` in sync with what's actually closed — those are the two files anyone (including AI assistants) will check first for current state. Don't let this `tasks/` folder drift out of sync with those.
- [ ] Watch the two flagged overlap risks explicitly: (1) Srinitha's `/vendors/me/payouts` read endpoint vs. Harshitha's payout automation — make sure they've agreed on the split before both build something. (2) Admin panel's product-approvals — CLAUDE.md specs a distinct bulk-approve queue; current admin panel folds it into the products page. Confirm with Manaswini whether that's an intentional deviation or a gap.
