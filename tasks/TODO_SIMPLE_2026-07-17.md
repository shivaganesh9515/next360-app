# What's Left To Do (Simple Version)

This file explains, in plain language, what work is still open on the project. No jargon. Read top to bottom — items are in the order you should do them.

---

## 1. Two branches need to be closed (cleanup, not code)

These are old work branches on GitHub. Someone needs to look at them and close them — no big coding needed.

### Branch: `harshitha`
- **What it has:** Code for two API routes (vendor earnings, vendor transactions).
- **The problem:** Someone else (Srinitha) already built the exact same two routes, and that version is already live on `main`. So this branch is a duplicate.
- **What to do:**
  1. Open `apps/api/src/vendors/vendors.service.ts` on the `harshitha` branch and compare the two methods (`getVendorEarnings`, `getVendorTransactions`) to the same methods on `main`.
  2. If they basically do the same thing → just close the branch. Nothing to merge.
  3. If Harshitha's version does something better → copy just that small improvement into the `main` version by hand. Don't merge the whole branch.
- **Who:** Harshitha or Ashwanth.
- **Time:** About 10 minutes.

### Branch: `manaswini`
- **What it has:** Two new admin pages — a product-approval page and a roles-permission page.
- **The problem:** Both already exist, just built differently, inside pages that are already live on `main` (`products/page.tsx` and `roles/page.tsx` already let you approve products and edit permissions, just not as separate pages).
- **What to do:** Nothing. Just close the branch.
- **Who:** Manaswini or Ashwanth.
- **Time:** 2 minutes.

---

## 2. Biggest real gap: Admin can't see or fix failed vendor payouts

- **What's missing:** Right now, if a vendor's payout fails (money didn't go through), there's no way for an admin to see that or retry it. The vendor can see their own payouts, but admins can't see everyone's.
- **What needs to be built (backend):**
  - A new API route: `GET /admin/payouts` — lists every vendor's payout batches so admin can see which ones failed.
  - A new API route: `PATCH /admin/payouts/:id/retry` — lets admin retry a failed payout.
- **Who:** Whoever owns the payments/vendors backend module next (currently nobody assigned).
- **Why it matters:** Without this, if a vendor doesn't get paid, nobody at Next360 can even see it happened, let alone fix it.

---

## 3. Smaller backend gaps (already known, just listed here so nothing is forgotten)

These API calls exist on the frontend already, but the backend for them doesn't exist yet. Pages using these will show blank or error until backend work happens:

- Admin dashboard summary numbers (`admin dashboard aggregate`)
- Reports section (`/reports/*`)
- Admin settings page (`/admin/settings`)
- Viewing a single user's status
- Ratings summary/aggregate
- Sending notifications from admin

**Who:** Backend team, no rush — not blocking anything critical right now.

---

## 4. Two small, easy fixes (frontend, optional)

- `apps/admin-panel/package.json` is missing two packages that were supposed to be added: `shadcn/ui` and `@supabase/supabase-js`. The vendor-dashboard app already has both set up — just copy the same setup over.
- **Who:** Manaswini or whoever touches admin-panel next.
- **Time:** 15 minutes.

---

## 5. Decisions that need someone to just pick an answer (not code yet)

These aren't bugs — they're open questions blocking future work. Someone (usually Ashwanth, the PM) needs to make a call:

| Question | Why it matters | Needed before |
|---|---|---|
| How do we run tests automatically when code is pushed? (CI/CD) | Right now nobody catches broken code before it's merged. | Should be set up soon — the codebase is getting big (5 apps). |
| Do we have separate dev / staging / production environments? | We're about to test real payments (Razorpay) — that should never happen directly on the live app. | Before real payment testing starts (Phase 4). |
| Which tool do we use to prevent two delivery partners getting the same order at once? (Redis) | Needed so the delivery app doesn't double-assign orders. | Before delivery-partner assignment work (Phase 5). |
| Who is designing the onboarding illustrations? | Customer app onboarding screens need artwork. | Before Phase 4 UI is finalized. |

**Who:** Ashwanth to decide, then assign whoever's free.

---

## Quick Checklist (copy this into a task tracker if you have one)

- [ ] Check `harshitha` branch — close it or port the small improvement
- [ ] Close `manaswini` branch
- [ ] Build `GET /admin/payouts` + retry endpoint
- [ ] Add missing packages to admin-panel
- [ ] Ashwanth: decide CI/CD approach
- [ ] Ashwanth: decide dev/staging/prod setup
- [ ] Ashwanth: decide Redis provider
- [ ] Confirm designer for onboarding illustrations

That's everything currently open. Nothing else is blocking the team right now.
