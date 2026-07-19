# Soumya — Frontend: apps/vendor-dashboard

Area: `apps/vendor-dashboard`. Next.js 14 App Router + Tailwind + shadcn/ui.

## Status: ✅ All P0 Complete

### Do Now — Completed ✅
- ✅ Analytics sub-routes fixed — both sales and revenue pages call the main `/vendors/me/analytics` endpoint.
- ✅ Store profile edit — uses `GET/PATCH /vendors/my-profile` (resolves via `@CurrentUser`).
- ✅ Dependencies verified — `@supabase/supabase-js` present, shadcn/ui configured, fetch-based API pattern sufficient.
- ✅ Vendor auth: Remember Me, Forgot Password, session expiry, 401 auto-logout
- ✅ UI polish: Slate color palette, transition improvements
- ✅ Orders page: Accept/Reject buttons for PLACED/CONFIRMED, Ready for Pickup for PACKED
- ✅ Order detail: Fixed to use vendor group status endpoint (groupId-based, not admin-only)

### Remaining
- [ ] Payouts page wire-up once all backend endpoints are verified
- [ ] Add Razorpay account linking UI to store profile page
- [ ] End-to-end testing against live backend

## Reference
- API client: `apps/vendor-dashboard/src/lib/api.ts`
- Orders page: `apps/vendor-dashboard/src/app/(dashboard)/orders/page.tsx`
- Order detail: `apps/vendor-dashboard/src/app/(dashboard)/orders/[id]/page.tsx`
