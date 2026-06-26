---
phase: 09-admin-dashboard
plan: 09
type: execute
wave: 6
depends_on:
  - 08-orders-payments-08
  - 02-auth-02
  - 04-vendor-dashboard-05
files_modified:
  - apps/admin-panel/package.json
  - apps/admin-panel/tsconfig.json
  - apps/admin-panel/next.config.js
  - apps/admin-panel/tailwind.config.ts
  - apps/admin-panel/src/app/layout.tsx
  - apps/admin-panel/src/app/page.tsx
  - apps/admin-panel/src/app/login/page.tsx
  - apps/admin-panel/src/app/(dashboard)/layout.tsx
  - apps/admin-panel/src/app/(dashboard)/page.tsx
  - apps/admin-panel/src/app/(dashboard)/users/page.tsx
  - apps/admin-panel/src/app/(dashboard)/users/[id]/page.tsx
  - apps/admin-panel/src/app/(dashboard)/vendors/page.tsx
  - apps/admin-panel/src/app/(dashboard)/vendors/approvals/page.tsx
  - apps/admin-panel/src/app/(dashboard)/vendors/[id]/page.tsx
  - apps/admin-panel/src/app/(dashboard)/delivery-partners/page.tsx
  - apps/admin-panel/src/app/(dashboard)/delivery-partners/approvals/page.tsx
  - apps/admin-panel/src/app/(dashboard)/delivery-partners/[id]/page.tsx
  - apps/admin-panel/src/app/(dashboard)/products/page.tsx
  - apps/admin-panel/src/app/(dashboard)/products/add/page.tsx
  - apps/admin-panel/src/app/(dashboard)/products/edit/[id]/page.tsx
  - apps/admin-panel/src/app/(dashboard)/categories/page.tsx
  - apps/admin-panel/src/app/(dashboard)/categories/sub-categories/page.tsx
  - apps/admin-panel/src/app/(dashboard)/brands/page.tsx
  - apps/admin-panel/src/app/(dashboard)/orders/page.tsx
  - apps/admin-panel/src/app/(dashboard)/orders/[id]/page.tsx
  - apps/admin-panel/src/app/(dashboard)/orders/returns/page.tsx
  - apps/admin-panel/src/app/(dashboard)/orders/refunds/page.tsx
  - apps/admin-panel/src/app/(dashboard)/coupons/page.tsx
  - apps/admin-panel/src/app/(dashboard)/offers/page.tsx
  - apps/admin-panel/src/app/(dashboard)/payments/page.tsx
  - apps/admin-panel/src/app/(dashboard)/payments/vendor-payouts/page.tsx
  - apps/admin-panel/src/app/(dashboard)/payments/delivery-payouts/page.tsx
  - apps/admin-panel/src/app/(dashboard)/inventory/page.tsx
  - apps/admin-panel/src/app/(dashboard)/reviews/page.tsx
  - apps/admin-panel/src/app/(dashboard)/ratings/page.tsx
  - apps/admin-panel/src/app/(dashboard)/ai-logs/page.tsx
  - apps/admin-panel/src/app/(dashboard)/ai-logs/recommendations/page.tsx
  - apps/admin-panel/src/app/(dashboard)/ai-logs/analytics/page.tsx
  - apps/admin-panel/src/app/(dashboard)/reports/sales/page.tsx
  - apps/admin-panel/src/app/(dashboard)/reports/revenue/page.tsx
  - apps/admin-panel/src/app/(dashboard)/cms/pages/page.tsx
  - apps/admin-panel/src/app/(dashboard)/cms/banners/page.tsx
  - apps/admin-panel/src/app/(dashboard)/cms/notifications/page.tsx
  - apps/admin-panel/src/app/(dashboard)/roles/page.tsx
  - apps/admin-panel/src/app/(dashboard)/roles/permissions/page.tsx
  - apps/admin-panel/src/app/(dashboard)/settings/page.tsx
  - apps/admin-panel/src/app/(dashboard)/settings/system/page.tsx
  - apps/admin-panel/src/lib/api.ts
  - apps/admin-panel/src/lib/auth.ts
  - apps/admin-panel/src/components/AdminSidebar.tsx
  - apps/admin-panel/src/components/AdminHeader.tsx
  - apps/admin-panel/src/components/StatsCard.tsx
  - apps/admin-panel/src/components/DataTable.tsx
  - apps/admin-panel/src/components/StatusBadge.tsx
  - packages/shared/src/index.ts
autonomous: false
requirements:
  - ADMIN-01
  - ADMIN-02
  - ADMIN-03
  - ADMIN-04
  - ADMIN-05
  - ADMIN-06
  - ADMIN-07
  - ADMIN-08
  - ADMIN-09
  - ADMIN-10
  - ADMIN-11
  - ADMIN-12
  - ADMIN-13
  - ADMIN-14
  - ADMIN-15
  - ADMIN-16
  - ADMIN-17
must_haves:
  truths:
    - "Admin can log in with Supabase auth and access the panel"
    - "Admin can manage users (view, suspend, details)"
    - "Admin can manage vendors (approve/reject, details, commission rates)"
    - "Admin can manage delivery partners (approve, KYC, vehicles, documents)"
    - "Admin can manage all products across vendors"
    - "Admin can manage categories, sub-categories, brands"
    - "Admin can manage all orders, returns, refunds"
    - "Admin can manage coupons and offers"
    - "Admin can view payments and process vendor/delivery payouts"
    - "Admin can view and moderate reviews & ratings"
    - "Admin can view AI logs, recommendations, and analytics"
    - "Admin can view sales and revenue reports"
    - "Admin can manage CMS pages, banners, and push notifications"
    - "Admin can manage roles and permissions"
    - "Admin can configure system settings"
  artifacts:
    - path: "apps/admin-panel/src/app/(dashboard)/layout.tsx"
      provides: "Dashboard layout with sidebar navigation"
    - path: "apps/admin-panel/src/app/(dashboard)/vendors/page.tsx"
      provides: "Vendor management table"
    - path: "apps/admin-panel/src/app/(dashboard)/orders/page.tsx"
      provides: "Order management across all vendors"
    - path: "apps/admin-panel/src/app/(dashboard)/payments/vendor-payouts/page.tsx"
      provides: "Vendor payout management"
    - path: "apps/admin-panel/src/app/(dashboard)/ai-logs/page.tsx"
      provides: "AI scanner logs view"
    - path: "apps/admin-panel/src/app/(dashboard)/roles/permissions/page.tsx"
      provides: "Permissions management"
  key_links:
    - from: "apps/admin-panel/src/app/(dashboard)/orders/page.tsx"
      to: "apps/api/orders"
      via: "GET /orders (admin scope)"
    - from: "apps/admin-panel/src/app/(dashboard)/vendors/page.tsx"
      to: "apps/api/vendors"
      via: "PATCH /vendors/:id/status (approve/reject)"
    - from: "apps/admin-panel/src/app/(dashboard)/payments/vendor-payouts/page.tsx"
      to: "apps/api/commission"
      via: "GET /commission/summary, PATCH /commission/pay"
    - from: "apps/admin-panel/src/app/(dashboard)/cms/pages/page.tsx"
      to: "apps/api/cms"
      via: "CRUD CMS pages"
    - from: "apps/admin-panel/src/app/(dashboard)/roles/permissions/page.tsx"
      to: "apps/api/roles"
      via: "CRUD roles and permissions"
---

<objective>
Build the admin panel using Next.js with full platform management — users, vendors, delivery partners, products, orders, payments, CMS, roles/permissions, AI analytics, and reports.

Purpose: Give platform admins complete control over the marketplace with 35 management screens.
Output: Next.js admin panel with login, sidebar navigation, 35 pages across user/vendor/delivery/catalog/orders/payments/AI/reports/CMS/roles/settings sections.
</objective>

<execution_context>
@C:/Users/gunny/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/gunny/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-foundation-01-SUMMARY.md
@.planning/phases/02-auth/02-auth-02-SUMMARY.md
@.planning/phases/04-vendor-dashboard/04-vendor-dashboard-05-SUMMARY.md
@.planning/phases/08-orders-payments/08-orders-payments-08-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Admin dashboard scaffold — Next.js app, login, sidebar layout, shared components</name>
  <files>
    apps/admin-dashboard/package.json
    apps/admin-dashboard/tsconfig.json
    apps/admin-dashboard/next.config.js
    apps/admin-dashboard/tailwind.config.ts
    apps/admin-dashboard/src/app/layout.tsx
    apps/admin-dashboard/src/app/page.tsx
    apps/admin-dashboard/src/app/login/page.tsx
    apps/admin-dashboard/src/app/(dashboard)/layout.tsx
    apps/admin-dashboard/src/app/(dashboard)/page.tsx
    apps/admin-dashboard/src/lib/api.ts
    apps/admin-dashboard/src/lib/auth.ts
    apps/admin-dashboard/src/components/AdminSidebar.tsx
    apps/admin-dashboard/src/components/AdminHeader.tsx
    apps/admin-dashboard/src/components/StatsCard.tsx
    apps/admin-dashboard/src/components/DataTable.tsx
    apps/admin-dashboard/src/components/StatusBadge.tsx
  </files>
  <action>
    Scaffold the admin Next.js app with authentication, layout, and reusable components:

    1. Initialize admin dashboard app:
       - Set up apps/admin-dashboard as a Next.js 14+ app (refer to Plan 05 vendor-dashboard for patterns)
       - package.json: next, react, react-dom, @supabase/supabase-js, @supabase/ssr, recharts (for analytics charts), tailwindcss, typescript
       - tsconfig.json with path aliases (@/ -> src/)
       - tailwind.config.ts with brand colors (same as vendor dashboard for consistency)

    2. Create src/lib/auth.ts:
       - Supabase server client for admin auth
       - isAdmin() check: verifies user.role === 'admin' via getUser() + profile lookup
       - protectAdminRoute() helper: redirects to /login if not authenticated or not admin
       - loginWithEmail(email, password) -> Supabase signIn, verify admin role
       - logout() -> signOut, redirect to /login

    3. Create src/lib/api.ts:
       - Fetch wrapper with admin auth token from Supabase session
       - Base URL: process.env.NEXT_PUBLIC_API_URL (e.g., http://localhost:4000)
       - Error handling: 401 -> redirect to login, 403 -> show forbidden
       - Helper methods: api.get(), api.post(), api.patch(), api.delete() with typed responses

    4. Create src/app/login/page.tsx:
       - Clean centered login card
       - Email + password fields with validation
       - "Admin Login" title with lock icon
       - Error message display
       - Loading state on submit
       - On success: redirect to / (dashboard home)
       - On failure: show error (invalid credentials or not admin)

    5. Create src/app/layout.tsx (root):
       - Import globals.css with Tailwind directives
       - Metadata: title "Next360 Admin", viewport, favicon

    6. Create src/app/(dashboard)/layout.tsx:
       - Responsive sidebar + header layout
       - AdminSidebar component (collapsible on mobile)
       - AdminHeader component (user info, logout button)
       - Main content area
       - protectAdminRoute() check inside layout
       - Breadcrumbs optional

    7. Create AdminSidebar.tsx:
       - Logo/brand at top: "Next360 Admin"
       - Navigation links with active state (highlight current):
         - 📊 Overview (/) — analytics dashboard home
         - 🏪 Vendors (/vendors) — vendor approvals and management
         - 👥 Users (/users) — user management
         - 📦 Orders (/orders) — all orders
         - 💰 Commissions (/commissions) — commission reports
         - 🏷️ Categories (/categories) — category management
       - Icons: use simple emoji or lucide-react icons
       - Bottom: user info + logout

    8. Create AdminHeader.tsx:
       - Page title (passed as prop or from route)
       - User avatar circle + name
       - Logout button
       - Mobile menu toggle

    9. Create reusable components:
       - StatsCard: icon, label, value, trend (up/down arrow + percentage change), nice gradient accent
       - DataTable: generic table with headers, rows, sortable columns, pagination, search bar
       - StatusBadge: colored pill for order status / vendor status

    10. Create src/app/(dashboard)/page.tsx (Overview/Dashboard Home):
        - 4 StatsCards at top: Total Revenue (today), Active Orders, Total Vendors, Total Users
        - Simple bar chart (last 7 days orders) using recharts
        - Recent orders list (last 5)
        - Recent vendor registrations (last 5)

    Design: Clean, professional admin theme — dark sidebar, white content area, brand accent colors, data-dense tables
  </action>
  <verify>
    Check dashboard layout renders sidebar with navigation links.
    Verify login page authenticates and redirects to dashboard.
    Check StatsCard, DataTable, StatusBadge components render correctly.
    Verify dashboard home shows stats and recent data.
  </verify>
  <done>
    Admin dashboard scaffold with auth, layout, navigation, and reusable components is complete.
  </done>
</task>

<task type="auto">
  <name>Task 2: Vendor management + user management + category management pages</name>
  <files>
    apps/admin-dashboard/src/app/(dashboard)/vendors/page.tsx
    apps/admin-dashboard/src/app/(dashboard)/vendors/[id]/page.tsx
    apps/admin-dashboard/src/app/(dashboard)/users/page.tsx
    apps/admin-dashboard/src/app/(dashboard)/categories/page.tsx
    apps/admin-dashboard/src/lib/api.ts
  </files>
  <action>
    Build vendor management, user management, and category management pages:

    1. Create src/app/(dashboard)/vendors/page.tsx:
       - Table of all vendors (use DataTable component)
       - Columns: Store Name, Owner Name, Email, Store Type (badge), Status (approve/reject/pending badge), Products Count, Joined Date, Actions
       - Search: search by store name, email, owner
       - Filter: by status (ALL, PENDING, APPROVED, REJECTED, SUSPENDED), by store_type
       - Pagination
       - Action buttons per row:
         - "Approve" (green) — PATCH /vendors/:id/status { status: "APPROVED" }
         - "Reject" (red) — PATCH /vendors/:id/status { status: "REJECTED" }
         - "Suspend" (orange) — PATCH /vendors/:id/status { status: "SUSPENDED" }
       - Confirmation dialog for each action
       - Row click -> /vendors/:id detail page
       - Pending vendors highlighted/shown first
       - Empty state: "No vendors found"

    2. Create src/app/(dashboard)/vendors/[id]/page.tsx:
       - Vendor detail view:
         - Store info card (name, description, storeType, status, logo)
         - Owner info (name, email, phone)
         - Commission rate (editable field with save button)
         - Bank details (placeholder for future)
         - Products count
         - Recent orders from this vendor
         - Activity log
       - Action buttons: Approve/Reject/Suspend (contextual based on current status)
       - Loading skeleton

    3. Create src/app/(dashboard)/users/page.tsx:
       - Table of all platform users
       - Columns: Name, Email, Phone, Role (badge), Status, Orders Count, Joined Date
       - Search by name, email, phone
       - Filter by role (ALL, CUSTOMER, VENDOR, DELIVERY_PARTNER, ADMIN)
       - Filter by status (ACTIVE, SUSPENDED)
       - Pagination
       - Action: "Suspend User" / "Activate User" button with confirmation
         - PATCH /users/:id/status { status: "SUSPENDED" | "ACTIVE" }
       - Row expands to show user details (or modal)
       - Empty state

    4. Create src/app/(dashboard)/categories/page.tsx:
       - Table of categories
       - Columns: Name, Slug, Store Type (badge), Parent Category, Products Count, Active Status, Actions
       - Filter by store_type
       - "Add Category" button -> inline form or modal
         - Fields: name, slug (auto-generated), storeType, parentId (optional, dropdown)
       - Inline edit: click name to edit, auto-save on blur
       - Toggle active/inactive
       - Delete with confirmation (only if no products)
       - Drag to reorder (optional, can skip for now)

    5. Update src/lib/api.ts with admin-specific methods:
       - getVendors(filters), getVendor(id), updateVendorStatus(id, status), updateVendorCommissionRate(id, rate)
       - getUsers(filters), updateUserStatus(id, status)
       - getCategories(filters), createCategory(data), updateCategory(id, data), deleteCategory(id)

    Design patterns (follow vendor dashboard):
    - Server components where possible, client components for interactivity
    - Use fetch with revalidation for data freshness
    - Toast notifications for success/error actions
    - Confirmation dialogs for destructive actions
  </action>
  <verify>
    Check vendors page lists all vendors with approve/reject/suspend actions.
    Check vendor detail page shows info and commission rate editor.
    Check users page lists all users with role badges and suspend/activate.
    Check categories page has CRUD with store type filter.
  </verify>
  <done>
    Vendor management, user management, and category management pages are complete.
  </done>
</task>

<task type="auto">
  <name>Task 3: Orders management + Commission reports + Analytics dashboard</name>
  <files>
    apps/admin-dashboard/src/app/(dashboard)/orders/page.tsx
    apps/admin-dashboard/src/app/(dashboard)/orders/[id]/page.tsx
    apps/admin-dashboard/src/app/(dashboard)/commissions/page.tsx
    apps/admin-dashboard/src/app/(dashboard)/analytics/page.tsx
    apps/admin-dashboard/src/lib/api.ts
  </files>
  <action>
    Build order management, commission reports, and analytics pages:

    1. Create src/app/(dashboard)/orders/page.tsx:
       - Table of ALL orders across the platform
       - Columns: Order #, Customer, Vendor(s), Items Count, Total, Payment Method, Payment Status, Order Status, Date, Actions
       - Search: by order number, customer name, vendor name
       - Filters:
         - Status: ALL, PENDING, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
         - Store type: ALL, ORGANIC, NATURAL, ECO_FRIENDLY
         - Date range: today, last 7 days, last 30 days, custom
         - Payment method: ALL, COD, RAZORPAY
       - Pagination with page size selector
       - Sortable columns (by date, total, status)
       - Action per row: "Update Status" dropdown
       - Row click -> /orders/:id detail page
       - Export to CSV button (optional, can use simple download)

    2. Create src/app/(dashboard)/orders/[id]/page.tsx:
       - Full order detail view
       - Order info card: order number, date, status (with StatusBadge), payment method, payment status
       - Customer info card: name, email, phone, delivery address
       - Order items list: image, name, vendor, qty, price, line total
       - Price breakdown: subtotal, delivery fee, platform fee, total
       - Status timeline: vertical timeline showing each status change with timestamp
       - Status update controls: dropdown to change status (respecting valid transitions)
       - Invoice section: download/print invoice (data display for now)
       - Action buttons: Cancel Order (with reason), Refund (if paid)
       - Loading skeleton

    3. Create src/app/(dashboard)/commissions/page.tsx:
       - Summary cards at top:
         - Total Platform Commission (this month)
         - Total Paid
         - Total Pending
         - Number of Vendors
       - Commission table:
         - Columns: Vendor Name, Store Type, Commission Rate, Total Sales, Platform Commission, Vendor Earnings, Status (PAID/PENDING), Actions
         - Search by vendor name
         - Filter by status (ALL, PAID, PENDING), date range
       - "Mark as Paid" button per row or batch select + "Pay Selected"
         - Confirmation dialog: "Pay ₹X,XXX to Vendor Name?"
       - Per-vendor detail view (expandable or modal):
         - List of orders with commission breakdown
         - Total earnings, pending amount, paid amount
       - Export to CSV

    4. Create src/app/(dashboard)/analytics/page.tsx:
       - Date range selector (Last 7 days, Last 30 days, Last 90 days, This Year)
       - Top row — 4 metric cards:
         - Gross Merchandise Value (GMV) — total order value
         - Total Orders
         - Active Customers (users who placed an order in period)
         - Active Vendors (vendors with at least 1 order)
       - Revenue over time — line chart (daily GMV for selected period)
         - Using recharts LineChart
       - Orders by status — pie/donut chart
       - Orders by store type — bar chart (Organic vs Natural vs Eco)
       - Top selling products — ranked list with image, name, units sold, revenue
       - Top vendors by GMV — ranked list
       - Customer acquisition — new users per day (line chart)
       - All charts: responsive, tooltips, consistent styling

    5. Update src/lib/api.ts with:
       - getOrders(filters), getOrder(id), updateOrderStatus(id, status), cancelOrder(id, reason)
       - getCommissionSummary(filters), getCommissionVendorDetail(vendorId, filters), markAsPaid(ids)
       - getAnalytics(dateRange) — returns aggregated analytics data

    Design: Data-dense, professional — charts use brand colors, tables are sortable/filterable, consistent spacing
  </action>
  <verify>
    Check orders page lists all orders with filters and status update.
    Check order detail page shows full information and status timeline.
    Check commissions page shows summary cards and payout workflow.
    Check analytics page renders charts and metric cards with date range selector.
  </verify>
  <done>
    Order management, commission reports, and analytics dashboard pages are complete. Admin dashboard is feature-complete.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Admin dashboard app — login, sidebar layout, vendor management, user management, order management, commissions, analytics, category management</what-built>
  <how-to-verify>
    1. Start admin dashboard: `cd apps/admin-dashboard && npm run dev`
    2. Visit http://localhost:3001 (or whatever port)
    3. Verify redirect to /login when not authenticated
    4. Log in with admin credentials (must have admin role in DB)
    5. Dashboard home loads with stats cards (revenue, orders, vendors, users)
    6. Navigate to Vendors page — see vendor list with approve/reject/suspend actions
    7. Click a vendor — see detail page with commission rate editor
    8. Navigate to Users page — see user list, try suspend/activate
    9. Navigate to Categories page — add/edit/delete a category
    10. Navigate to Orders page — see all orders, filter by status, update an order status
    11. Navigate to Commissions page — see summary cards, mark a payout as paid
    12. Navigate to Analytics page — see charts with date range selector
    13. Test logout flow
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
1. Admin login works with Supabase auth + admin role check
2. Sidebar navigation renders all pages with active state
3. Vendor approve/reject/suspend works
4. User suspend/activate works
5. Order management shows all orders, status updates work
6. Commission summary shows correct data, payouts markable
7. Analytics charts render with correct data
8. DataTable supports search, filter, pagination, sort
9. All states handled: loading, empty, error, success
</verification>

<success_criteria>
- Admin can manage vendors (approve/reject), users (suspend), categories (CRUD)
- Admin can view and manage all orders with status updates
- Admin can view commission reports and process payouts
- Admin can view platform analytics with charts
- Admin dashboard is feature-complete
</success_criteria>

<output>
After completion, create `.planning/phases/09-admin-dashboard/09-admin-dashboard-09-SUMMARY.md`
</output>
