# Soumya — Frontend: Vendor Dashboard

> **Area**: `apps/vendor-dashboard/`
> **Status**: Mostly Complete
> **Priority**: 🟠 P1 → 🟡 P2

---

## ✅ Already Completed

### All Pages Exist
- [x] Dashboard with KPIs, recent orders, low-stock alerts
- [x] Products list + add + edit + variants management
- [x] Inventory stock management + low-stock alerts
- [x] Orders list + detail + accept/reject/ready-for-pickup
- [x] Coupons CRUD
- [x] Offers CRUD
- [x] Customers list
- [x] Analytics overview + sales + revenue
- [x] Earnings overview + payouts + transactions
- [x] Store profile (view + edit with working-hours, delivery radius)
- [x] Notifications page
- [x] Settings page
- [x] Support page

### Features
- [x] Vendor auth: Remember Me, Forgot Password, session expiry, 401 auto-logout
- [x] UI polish: Slate color palette, transition improvements
- [x] Orders page: Accept/Reject/Ready for Pickup buttons
- [x] Order detail: Fixed to use vendor group status endpoint (groupId-based)

---

## 🟠 P1 — Remaining Work

### 1. Payouts Page — Wire to Real Backend
**Files**: `apps/vendor-dashboard/src/app/(dashboard)/earnings/payouts/page.tsx`
**What**:
- **Backend exists**: `GET /vendors/me/payouts` (Srinitha's endpoint)
- Verify the payouts page is calling the correct API method
- Fix any response data shape mismatches
- Add payout status badges (PENDING / PROCESSED / FAILED)
- Add payout history with date range filter

### 2. Razorpay Account Linking
**Files**: `apps/vendor-dashboard/src/app/(dashboard)/store/edit/page.tsx`
**What**:
- Add input field for `razorpayAccountId` in store profile edit form
- Add validation: must be a valid Razorpay account ID format (acc_...)
- Add helper text: "Link your Razorpay account to receive instant payouts via Route"
- Backend already accepts this via `updateVendorProfile` DTO

### 3. Auto-Refresh for Orders Page
**Files**: `apps/vendor-dashboard/src/app/(dashboard)/orders/page.tsx`
**What**:
- Add 30-second polling interval to refresh orders list
- Show visual indicator when new orders arrive (pulse animation)
- Optional: browser notification for new orders using Notification API
- Preserve current filters/tabs on refresh

---

## 🟡 P2 — Enhancement

### 4. Export Reports
**Files**: `apps/vendor-dashboard/src/app/(dashboard)/analytics/`
**What**:
- Add "Export CSV" button to analytics pages
- Export sales data, revenue data
- Client-side CSV generation from existing data

### 5. Order Cancellation Reason
**Files**: `apps/vendor-dashboard/src/app/(dashboard)/orders/page.tsx`
**What**:
- When rejecting an order, prompt for cancellation reason
- Send reason to backend via cancel endpoint
- Show reason on order detail page

### 6. Product Bulk Actions
**Files**: `apps/vendor-dashboard/src/app/(dashboard)/products/page.tsx`
**What**:
- Batch status toggle (activate/deactivate multiple products)
- Batch price update

---

## Implementation Order
1. Payouts page wire-up (quick win, backend already exists)
2. Razorpay account linking UI
3. Auto-refresh for orders page
4. Export reports
5. Order cancellation reason
6. Product bulk actions

---

## Reference
- API client: `apps/vendor-dashboard/src/lib/api.ts`
- Orders page: `apps/vendor-dashboard/src/app/(dashboard)/orders/page.tsx`
- Store profile edit: `apps/vendor-dashboard/src/app/(dashboard)/store/edit/page.tsx`
- Earnings payouts: `apps/vendor-dashboard/src/app/(dashboard)/earnings/payouts/page.tsx`
