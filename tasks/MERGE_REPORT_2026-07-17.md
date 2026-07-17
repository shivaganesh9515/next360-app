# Branch Merge Report — 2026-07-17

Scope: web/backend team only (Soumya, Manaswini, Srinitha, Harshitha, Abhinaya, Ashwanth, Samhith).
Mobile apps (customer-app, delivery-app) are the account owner's own track and are **excluded** from this check — those files are currently dirty in the working tree as in-progress work, not team branches, and were left untouched.

## What was merged this pass

**`soumya-vendor-dashboard`** — 1 new commit not yet in `main`:
- `d00fe95` "style: update color palette from gray to slate and enhance UI transitions"
- Touched only `orders/returns/page.tsx` and `store/edit/page.tsx` (vendor-dashboard), cosmetic only.
- Merged cleanly, no conflicts. Now in `main`.

## Branches checked — nothing to merge

| Branch | Status | Detail |
|---|---|---|
| `abhinaya/brands-module` | Fully merged | No commits ahead of `main` |
| `ashwanth` | Fully merged | No commits ahead of `main` (PM/coordinator branch, no code) |
| `samhith` | Fully merged | No commits ahead of `main` |
| `srinitha` | Fully merged | All 4 commits already in `main` |

## Branch intentionally NOT merged — would introduce regressions/duplicates

### `harshitha` — 1 commit ahead, **redundant, do not merge as-is**
Commit `59a0022` "feat(vendors): implement vendor earnings, payouts, and transactions APIs" adds `GET /vendors/me/earnings` and `GET /vendors/me/transactions` to `vendors.controller.ts` / `vendors.service.ts`.

**Problem:** `main` already has both routes (`vendors.controller.ts:65` and `:75`), merged earlier via the `soumya-vendor-dashboard` cherry-pick of Srinitha's work (commit `5250cf6`). Harshitha's branch was cut before that merge and re-implements the same endpoints independently — different method bodies, same routes. A raw `git merge` here would hit real conflicts in both files, and even a clean auto-merge would risk silently replacing the already-tested implementation with an untested duplicate.

**How to fix neatly:**
1. Diff `harshitha`'s `getVendorEarnings`/`getVendorTransactions` against the versions already in `main` — check if Harshitha's has anything the merged version lacks (extra fields, pagination edge cases, date filtering correctness).
2. If no meaningful difference: close the branch, no action needed, tell Harshitha the work is already live (originated from Srinitha's parallel implementation).
3. If Harshitha's version has a genuine improvement: hand-port just that diff into the existing `vendors.service.ts` methods rather than merging the branch wholesale.
4. Do **not** `git merge origin/harshitha` directly — it will fight with existing code.

### `manaswini` — 7 commits ahead, **superseded, do not merge**
Branch touches `vendors`, `orders`, `ai-logs`, `products/approvals` (new page) instead of the 7 pages actually assigned (`delivery-partners`, `zones`, `disputes`, `roles`, `cms`, `brands`, `sub-categories`).

Verified this pass that the branch is genuinely redundant, not just wrong-scope:
- `products/approvals/page.tsx` (new file in the branch) duplicates functionality **already live** in `main`'s `products/page.tsx` — that page has an `approvalFilter` state, inline per-row Approve button, and a confirm dialog wired to `adminApi.updateProductApproval`. A standalone approvals route adds nothing.
- `roles/permissions/page.tsx` (new file in the branch) duplicates functionality **already live** in `main`'s `roles/page.tsx` — permissions are edited inline via checkboxes in the role create/edit modal, not a separate page.
- The assigned 7 pages were confirmed already wired to real `adminApi.*` calls on `main` back on 2026-07-16 (see `MERGE_REPORT_2026-07-16.md` and `tasks/manaswini.md`).

**How to fix neatly:** Nothing to merge. Close/archive the branch. If Manaswini needs new work, reassign — the original 7-page assignment is done and the extra pages she built are duplicate effort.

## Remaining open items (non-mobile, from prior status)

These predate this pass and are still genuinely open — not resolved by any branch:

1. **Vendor payouts oversight (Admin)** — `Payouts Oversight` screen needs a way to view/retry failed Razorpay Route payouts across vendors. No backend support exists for this yet (per `tasks/manaswini.md`). Needs a new admin-facing endpoint, e.g. `GET /admin/payouts` + `PATCH /admin/payouts/:id/retry`, before the Admin Panel screen can be wired.
2. **A few other admin/vendor API calls flagged as real gaps** — see `tasks/manaswini.md` for the specific per-page list; those were confirmed as actual missing backend support, not envelope-unwrapping bugs.
3. **Open Decisions / Risk Register (still unresolved, per CLAUDE.md):**
   - #1 Razorpay Route vendor KYC turnaround — needs scoping in Vendor Web Payouts module.
   - #2 CI/CD for the 5-codebase monorepo — GitHub Actions + Turborepo remote caching, not yet set up.
   - #3 Environment strategy (dev/staging/prod) — undecided; staging needed before real payments go live.
   - #4 Redis for delivery-assignment locking — Upstash vs GCP Memorystore, undecided.
   - #6 Onboarding photography/illustration asset pipeline — blocked on designer hire.

## Suggested next steps

1. Assign someone (Harshitha or Ashwanth) to do the 10-minute diff check on `harshitha`'s branch per the steps above, then close it either way.
2. Close `manaswini` branch — confirmed superseded, no unique value.
3. Pick up the Payouts Oversight backend gap next — it is the largest concrete remaining item with no owner currently.
4. Ashwanth to decide CI/CD and environment strategy (#2, #3) before Phase 4 payment work goes further, since staging is a prerequisite for real Razorpay testing.
