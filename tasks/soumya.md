# Soumya — Frontend: apps/vendor-dashboard

Area: `apps/vendor-dashboard`. Next.js 14 App Router + Tailwind + shadcn/ui.

## Do Now (No Dependencies)

- [ ] **Fix analytics sub-routes** — `getSalesAnalytics` and `getRevenueAnalytics` in `lib/api.ts` call `/vendors/me/analytics/sales` and `/vendors/me/analytics/revenue` which don't exist. The main `/vendors/me/analytics` endpoint works fine. Fix the sub-routes to either use the main endpoint or remove the separate calls.

- [ ] **Verify store profile edit** — calls `GET/PATCH /vendors/me` with literal `"me"` as vendor ID. Backend may 404. Test against live backend, report if broken (backend owns the fix).

- [ ] **Add Razorpay account linking UI** — store profile page needs a field for vendors to link their Razorpay account ID. Currently no such field exists in the UI. Backend also needs to whitelist `razorpayAccountId` in vendor update DTO (Srinitha's task).

- [ ] **Test all dashboard pages against live backend** — walk through every sidebar page, document what breaks or shows empty. Especially: dashboard KPIs, orders, products, inventory, coupons, offers, customers, notifications, settings, support.

## Blocked on Backend

- [ ] **Low stock push notification** — inventory page exists, low-stock alert endpoint exists, but no push notification is sent to vendor when stock drops below threshold. Needs backend notification trigger.

- [ ] **Payouts page** — `earnings/payouts` route calls `GET /vendors/me/payouts` — verify this works now (was Harshitha's addition). If it works, just verify UI renders correctly.

## Reference

- Screen inventory: root `CLAUDE.md` → "Vendor Web — Screen Inventory"
- Sidebar structure: `apps/vendor-dashboard/src/components/Sidebar.tsx`
- API client: `apps/vendor-dashboard/src/lib/api.ts`
