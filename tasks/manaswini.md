# Manaswini — Frontend: Admin Panel

> **Area**: `apps/admin-panel/`
> **Status**: In Progress
> **Priority**: 🔴 P0 → 🟡 P2

---

## ✅ Already Completed

### All 35+ Pages Exist
- [x] Dashboard — with live aggregate KPIs from `/admin/dashboard`
- [x] Dashboard sidebar with all nav items configured
- [x] Vendors list + approvals + detail page (with KYC, performance, admin actions)
- [x] Delivery Partners list + approvals + detail page
- [x] Products list + approvals + add + detail page
- [x] Categories + Sub-Categories CRUD
- [x] Brands CRUD
- [x] Orders list + detail + returns + refunds
- [x] Payments transactions + vendor-payouts + delivery-payouts
- [x] Inventory management
- [x] Coupons CRUD
- [x] Offers CRUD
- [x] Reviews + Ratings pages
- [x] AI Logs (chat, recommendations, analytics)
- [x] Reports (sales, revenue)
- [x] CMS (pages, banners, notifications)
- [x] Zones CRUD
- [x] Disputes management
- [x] Roles + Permissions CRUD
- [x] Settings (general) — with live data from PlatformSettings

---

## 🔴 P0 — New Pages Needed

### 1. Audit Logs Page
**Files**: `apps/admin-panel/src/app/(dashboard)/audit-logs/page.tsx`, `apps/admin-panel/src/app/(dashboard)/audit-logs/layout.tsx`
**What**: Build frontend page for the existing Audit Log backend
- **Backend exists**: `GET /audit-logs`, `GET /audit-logs/summary`
- UI: Full-screen paginated table with columns: Timestamp, Admin, Action, Resource, Resource ID, Details, IP
- Filters: Action type dropdown, Resource type dropdown, Date range picker
- Summary widget: Pie chart or bar chart showing top actions today
- Detail expand: Click row to see full Details JSON
- **Design**: Follow existing DataTable pattern used in other pages

### 2. Support Tickets Pages
**Files**: 
- `apps/admin-panel/src/app/(dashboard)/support/page.tsx` — tickets list
- `apps/admin-panel/src/app/(dashboard)/support/[id]/page.tsx` — ticket detail
**What**:
- **Backend pending**: Support module is assigned to Ashwanth (create tickets first if needed)
- Tickets list table: ID, Subject, User, Status, Priority, Date, Assigned To
- Status filter tabs: Open / Assigned / Resolved / All
- Ticket detail: Full thread view with replies, status update, assignee change
- Reply form at bottom with text input + submit

### 3. Add "Audit Logs" and "Support" to Sidebar
**Files**: `apps/admin-panel/src/components/AdminSidebar.tsx`
**What**:
- Add Audit Logs nav item under a new "System" section or standalone
- Add Support nav item with unread ticket count badge

---

## 🟠 P1 — Enhancements

### 4. Bulk Product Approval
**Files**: `apps/admin-panel/src/app/(dashboard)/products/approvals/page.tsx`
**What**:
- Add checkbox column to product approvals table
- "Approve Selected" button in header
- Sends batch PATCH requests to `/products/:id/approve`
- Shows success/failure count after bulk operation

### 5. Wire Payouts Pages to Backend
**Files**: `apps/admin-panel/src/app/(dashboard)/payments/vendor-payouts/page.tsx`, `delivery-payouts/page.tsx`
**What**:
- **Backend pending**: Payouts endpoints assigned to Ashwanth
- When endpoints exist: wire up the data tables with real data
- Add export to CSV button

### 6. Wire Reports Pages to Backend
**Files**: `apps/admin-panel/src/app/(dashboard)/reports/sales/page.tsx`, `reports/revenue/page.tsx`
**What**:
- **Backend pending**: Reports endpoints assigned to Ashwanth
- When endpoints exist: wire up charts and tables with real data
- Add date range picker and export button

### 7. Settings Page — Wire Notification Toggles
**Files**: `apps/admin-panel/src/app/(dashboard)/settings/page.tsx`
**What**:
- Wire the notification preference toggles to PlatformSettings backend (endpoint exists)
- Test save/load cycle

---

## 🟡 P2 — Polish

### 8. End-to-End Testing
**Files**: All pages
**What**:
- Walk through every admin panel page against live backend
- Document what works and what doesn't
- Fix any broken API calls

### 9. Dashboard Enhancement
**Files**: `apps/admin-panel/src/app/(dashboard)/page.tsx`
**What**:
- Add real-time refresh (30s polling)
- Add more KPIs: DAU, conversion rate, avg delivery time

---

## Implementation Order
1. Audit Logs page (backend ready, quick win)
2. Add Audit Logs + Support to sidebar navigation
3. Support Tickets pages (after Ashwanth finishes backend)
4. Bulk product approval
5. Wire pages to backend endpoints as they become available
6. Settings notification toggles
7. E2E testing and polish

---

## Reference
- Sidebar: `apps/admin-panel/src/components/AdminSidebar.tsx`
- API client: `apps/admin-panel/src/lib/api.ts`
- Existing page pattern: `apps/admin-panel/src/app/(dashboard)/vendors/[id]/page.tsx`
- Dashboard component: `apps/admin-panel/src/components/DataTable.tsx`
- Audit Logs API: `adminApi.getAuditLogs()` in api.ts
