---
phase: 04-vendor-dashboard
plan: 05
type: execute
wave: 4
depends_on:
  - 03-core-api-a-03
  - 02-auth-02
files_modified:
  - apps/vendor-dashboard/package.json
  - apps/vendor-dashboard/tsconfig.json
  - apps/vendor-dashboard/next.config.js
  - apps/vendor-dashboard/tailwind.config.ts
  - apps/vendor-dashboard/src/app/layout.tsx
  - apps/vendor-dashboard/src/app/page.tsx
  - apps/vendor-dashboard/src/app/(auth)/login/page.tsx
  - apps/vendor-dashboard/src/app/(auth)/signup/page.tsx
  - apps/vendor-dashboard/src/app/(auth)/otp-verification/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/layout.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/products/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/products/add/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/products/[id]/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/products/[id]/variants/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/categories/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/inventory/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/inventory/low-stock/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/orders/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/orders/[id]/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/orders/returns/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/coupons/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/offers/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/customers/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/analytics/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/analytics/sales/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/analytics/revenue/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/earnings/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/earnings/payouts/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/earnings/transactions/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/store/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/store/edit/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/notifications/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/settings/page.tsx
  - apps/vendor-dashboard/src/app/(dashboard)/support/page.tsx
  - apps/vendor-dashboard/src/lib/api.ts
  - apps/vendor-dashboard/src/lib/auth.tsx
  - apps/vendor-dashboard/src/components/Sidebar.tsx
  - apps/vendor-dashboard/src/components/Header.tsx
  - apps/vendor-dashboard/src/components/StatsCard.tsx
  - apps/vendor-dashboard/src/components/DataTable.tsx
  - apps/vendor-dashboard/src/components/StatusBadge.tsx
  - apps/vendor-dashboard/src/components/ProductForm.tsx
  - apps/vendor-dashboard/src/components/OrderCard.tsx
  - apps/vendor-dashboard/src/types/index.ts
  - packages/shared/src/index.ts
autonomous: false
requirements:
  - VENDOR-01
  - VENDOR-02
  - VENDOR-03
  - VENDOR-04
  - VENDOR-05
  - VENDOR-06
  - VENDOR-07
  - VENDOR-08
  - VENDOR-09
  - VENDOR-10
  - VENDOR-11
  - VENDOR-12
must_haves:
  truths:
    - "Vendor can sign up, complete KYC (business details, bank details, documents), and await approval"
    - "Vendor dashboard shows key metrics: products, orders, revenue, low stock"
    - "Vendor can manage products with images, variants, and stock"
    - "Vendor receives low stock alerts"
    - "Vendor can view and manage orders, returns"
    - "Vendor can create coupons and offers"
    - "Vendor can see customer list"
    - "Vendor can view sales/revenue analytics with charts"
    - "Vendor can see earnings, payout history, and transactions"
    - "Vendor can manage their store profile"
    - "Vendor receives notifications"
  artifacts:
    - path: "apps/vendor-dashboard/src/app/(dashboard)/products/page.tsx"
      provides: "Product listing page"
      min_lines: 40
    - path: "apps/vendor-dashboard/src/app/(dashboard)/layout.tsx"
      provides: "Dashboard layout with sidebar"
    - path: "apps/vendor-dashboard/src/lib/auth.tsx"
      provides: "Auth context/provider"
      contains: "AuthProvider"
    - path: "apps/vendor-dashboard/src/app/(dashboard)/earnings/page.tsx"
      provides: "Earnings and payout tracking"
  key_links:
    - from: "apps/vendor-dashboard/src/lib/api.ts"
      to: "apps/api"
      via: "fetch calls to API endpoints"
    - from: "apps/vendor-dashboard/src/app/(dashboard)/inventory/low-stock/page.tsx"
      to: "apps/api/products"
      via: "GET /products?vendorId=me&stock[lte]=5"
---

<objective>
Build the vendor dashboard — a comprehensive Next.js web app where vendors manage all aspects of their organic store: products, inventory, orders, returns, promotions, customers, analytics, earnings, and store profile.

Purpose: Give vendors a full-featured web interface to run their organic store on the platform — from onboarding/KYC through daily operations and analytics.
Output: Next.js vendor dashboard with 32 pages across auth, KYC, products, inventory, orders, promotions, customers, analytics, earnings, store, and settings.
</objective>

<execution_context>
@C:/Users/gunny/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/gunny/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-foundation-01-SUMMARY.md
@.planning/phases/02-auth/02-auth-02-SUMMARY.md
@.planning/phases/03-core-api-a/03-core-api-a-03-SUMMARY.md
@.planning/PROJECT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scaffold vendor dashboard — Next.js app with auth, KYC, sidebar layout, shared components</name>
  <files>
    apps/vendor-dashboard/package.json
    apps/vendor-dashboard/tsconfig.json
    apps/vendor-dashboard/next.config.js
    apps/vendor-dashboard/tailwind.config.ts
    apps/vendor-dashboard/src/app/layout.tsx
    apps/vendor-dashboard/src/app/page.tsx
    apps/vendor-dashboard/src/app/(auth)/login/page.tsx
    apps/vendor-dashboard/src/app/(auth)/signup/page.tsx
    apps/vendor-dashboard/src/app/(auth)/otp-verification/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/layout.tsx
    apps/vendor-dashboard/src/app/(dashboard)/page.tsx
    apps/vendor-dashboard/src/lib/api.ts
    apps/vendor-dashboard/src/lib/auth.tsx
    apps/vendor-dashboard/src/components/Sidebar.tsx
    apps/vendor-dashboard/src/components/Header.tsx
    apps/vendor-dashboard/src/components/StatsCard.tsx
    apps/vendor-dashboard/src/components/DataTable.tsx
    apps/vendor-dashboard/src/components/StatusBadge.tsx
  </files>
  <action>
    Scaffold the vendor dashboard Next.js app with authentication, layout, and reusable components:

    1. Initialize next app:
       - apps/vendor-dashboard as Next.js 14+ app with TypeScript, Tailwind CSS
       - package.json: next, react, react-dom, @supabase/supabase-js, recharts (for charts), tailwindcss, shadcn/ui, lucide-react (icons)
       - tsconfig.json with path aliases (@/ -> src/)
       - tailwind.config.ts with organic/earthy brand colors (greens, browns, warm tones)

    2. Create src/lib/auth.tsx:
       - Auth context with provider (stores JWT in localStorage)
       - Methods: login(email, password), signup(data), verifyOtp(otp), logout(), isAuthenticated, user
       - On mount: check localStorage for token, fetch /auth/me to validate
       - Redirect to /login if not authenticated; redirect to /onboarding if KYC not complete; redirect to /dashboard if authenticated + KYC done

    3. Create src/lib/api.ts:
       - Fetch wrapper with auth token from localStorage
       - Base URL: NEXT_PUBLIC_API_URL env var
       - Methods: api.get(), api.post(), api.patch(), api.delete()
       - Specific methods: products (CRUD + stock), orders (list, detail, status), analytics, earnings, coupons, offers, customers, store profile, notifications

    4. Create auth pages:
       - Login page (/login): email + password form, "Sign In" button, "Create Account" link, error handling, loading state
       - Signup page (/signup): name, email, phone, password, confirm password, "Create Account" button, OTP option
       - OTP Verification page (/otp-verification): 6-digit OTP input, verify button, resend timer

    5. Create dashboard layout with sidebar + header:
       - Sidebar navigation with sections (icons + labels):
         - 📊 Dashboard (/)
         - 📦 Products (/products) — expandable sub-menu: All Products, Add Product, Categories
         - 📋 Inventory (/inventory) — expandable: Stock Management, Low Stock Alerts
         - 🛒 Orders (/orders) — expandable: All Orders, Returns
         - 🏷️ Promotions (/coupons, /offers)
         - 👥 Customers (/customers)
         - 📈 Analytics (/analytics) — expandable: Sales, Revenue
         - 💰 Earnings (/earnings) — expandable: Payouts, Transactions
         - 🏪 Store Profile (/store)
         - 🔔 Notifications (/notifications)
         - ⚙️ Settings (/settings)
         - ❓ Support (/support)
       - Header: store name, user avatar + name, notification bell with badge, logout button
       - Mobile-responsive: collapsible sidebar, hamburger menu

    6. Create reusable components:
       - StatsCard: icon, label, value, trend indicator, gradient accent
       - DataTable: generic sortable table with headers, pagination, search, filters
       - StatusBadge: colored pill for order/vendor/product status

    7. Create dashboard home page (/dashboard):
       - 4 StatsCards: Total Products, Active Orders, Revenue (month), Low Stock Items
       - Recent orders list (last 5)
       - Low stock alerts section
       - Quick actions: Add Product, View Orders, View Earnings

    8. Wire up KYC/onboarding redirect:
       - After signup, if vendor hasn't completed KYC → redirect to KYC pages (handled in Phase 2 backend)
       - KYC pages: Business Details (/onboarding/business), Bank Details (/onboarding/bank), Document Upload (/onboarding/documents), Approval Pending (/onboarding/pending)
  </action>
  <verify>
    Check dashboard layout renders sidebar with all navigation links.
    Verify login/signup/OTP pages render.
    Check DataTable, StatsCard, StatusBadge components render correctly.
    Verify dashboard home shows metrics and recent data.
  </verify>
  <done>
    Vendor dashboard scaffolded with auth, KYC flow, sidebar layout (12 nav sections), and reusable components.
  </done>
</task>

<task type="auto">
  <name>Task 2: Product, Inventory, and Category management pages</name>
  <files>
    apps/vendor-dashboard/src/app/(dashboard)/products/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/products/add/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/products/[id]/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/products/[id]/variants/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/categories/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/inventory/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/inventory/low-stock/page.tsx
    apps/vendor-dashboard/src/components/ProductForm.tsx
    apps/vendor-dashboard/src/components/ProductTable.tsx
  </files>
  <action>
    Build product, inventory, and category management pages:

    1. Products List page (/products):
       - DataTable: Image, Name, SKU, Price, Stock, Status, Category, Variants count, Actions
       - Search by name, filter by status/category/store_type
       - Bulk actions: activate/deactivate selected
       - "Add Product" button → /products/add
       - Row click → /products/[id] edit page
       - Pagination (20 per page)
       - Empty state: "No products yet. Create your first product!"

    2. Add Product page (/products/add):
       - ProductForm component: Name, Description, Category (dropdown), Brand (dropdown), Price, Compare-at Price, Unit, Stock, SKU
       - Multi-image upload with preview (drag-to-reorder, remove)
       - Variants section: add variant rows (name, price, stock, SKU)
       - SEO section: meta title, meta description (optional)
       - Active toggle
       - Validation: name required, price > 0, stock >= 0
       - Submit → POST /products, toast "Product created", redirect to product list

    3. Edit Product page (/products/[id]):
       - Same ProductForm pre-filled with existing data
       - PATCH on submit, toast "Product updated"
       - Delete button with confirmation dialog
       - Variants management: add/edit/remove variants

    4. Product Variants page (/products/[id]/variants):
       - Table of variants: Name, Price, Stock, SKU, Actions
       - Add variant form (inline or modal)
       - Quick edit: inline stock/price updates

    5. Categories page (/categories):
       - List of categories the vendor's products belong to (read-only view)
       - Filter by store_type
       - Shows: Category name, product count, sub-categories count

    6. Inventory page (/inventory):
       - Table: Product Image, Name, SKU, Current Stock, Low Stock Threshold, Status
       - Search by product name
       - Quick stock update: inline edit with save button
       - "Update Stock" modal for bulk updates

    7. Low Stock Alerts page (/inventory/low-stock):
       - Filtered view of products with stock <= threshold (default 5)
       - Highlighted cards: Product name, image, current stock, "Restock" button
       - "Mark as Restocked" with quantity input
       - Empty state: "All products are well-stocked! 🎉" with green checkmark
       - Auto-refresh on page focus

    All pages use shadcn/ui components: Button, Input, Card, Badge, Dialog, Select, Toast, Skeleton
    All pages handle loading, empty, and error states
  </action>
  <verify>
    Check products list page has search, filter, pagination.
    Check ProductForm handles multi-image upload.
    Check inventory page has inline stock editing.
    Check low stock page shows alerts with restock button.
  </verify>
  <done>
    Product management (CRUD + variants), inventory tracking, and low stock alerts are complete.
  </done>
</task>

<task type="auto">
  <name>Task 3: Orders, Customers, Promotions, Analytics, Earnings, Store, and Settings pages</name>
  <files>
    apps/vendor-dashboard/src/app/(dashboard)/orders/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/orders/[id]/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/orders/returns/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/coupons/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/offers/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/customers/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/analytics/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/analytics/sales/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/analytics/revenue/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/earnings/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/earnings/payouts/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/earnings/transactions/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/store/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/store/edit/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/notifications/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/settings/page.tsx
    apps/vendor-dashboard/src/app/(dashboard)/support/page.tsx
    apps/vendor-dashboard/src/components/OrderTable.tsx
    apps/vendor-dashboard/src/components/OrderDetail.tsx
    apps/vendor-dashboard/src/components/OrderStatusBadge.tsx
    apps/vendor-dashboard/src/components/EarningsChart.tsx
  </files>
  <action>
    Build remaining pages — orders, customers, promotions, analytics, earnings, store, notifications, settings, support:

    1. Orders List (/orders):
       - DataTable: Order #, Customer, Items, Total, Status, Payment, Date
       - Status badges: Pending (yellow), Confirmed (blue), Preparing (purple), Out for Delivery (orange), Delivered (green), Cancelled (red), Returned (gray)
       - Filter by status, date range
       - Search by order number, customer name
       - Click row → /orders/[id] detail
       - Export to CSV

    2. Order Detail (/orders/[id]):
       - Order info card: order #, date, status badge, payment status
       - Customer info: name, phone, delivery address
       - Items list: image, product name, qty, price, line total
       - Price breakdown: subtotal, delivery fee, platform fee, total
       - Status timeline: vertical timeline with timestamps
       - Status update dropdown (validated transitions)
       - Return/refund section (if applicable)

    3. Returns (/orders/returns):
       - Table of return requests: Order #, Customer, Item, Reason, Status, Date
       - Filter by status: PENDING, APPROVED, REJECTED
       - Action: Approve/Reject with reason modal

    4. Coupons (/coupons):
       - DataTable: Code, Discount Type, Value, Min Order, Usage Limit, Expires, Status
       - "Create Coupon" button → inline form: code, type (percentage/fixed), value, min order, max discount, usage limit, expiry date
       - Toggle active/inactive
       - Delete with confirmation

    5. Offers (/offers):
       - Similar to coupons but store-wide: title, description, discount type/value, date range, store_type
       - Create/Edit/Delete/Toggle

    6. Customers (/customers):
       - Table of customers who ordered from this vendor: Name, Email, Phone, Orders Count, Total Spent, Last Order
       - Search by name/email/phone
       - Click → customer detail modal: order history, total spent, contact info

    7. Analytics (/analytics):
       - Summary cards: Total Revenue, Total Orders, Avg Order Value, Top Product
       - Sales over time: line chart (recharts) — 7 days, 30 days, 90 days, 1 year
       - Orders by status: donut chart
       - Top products: ranked list with sales count

    8. Sales Analytics (/analytics/sales):
       - Daily sales chart (bar chart)
       - Orders by hour (heatmap, optional)
       - Sales by category (pie chart)
       - Comparison with previous period

    9. Revenue Analytics (/analytics/revenue):
       - Revenue trend (line chart)
       - Revenue by product (horizontal bar chart)
       - Platform fees vs vendor earnings breakdown
       - Month-over-month growth

    10. Earnings (/earnings):
        - Summary: Total earnings, This Month, Pending, Paid
        - Earning over time (line chart)
        - Breakdown table: Order #, Amount, Commission, Net Earnings, Status, Date

    11. Payouts (/earnings/payouts):
        - Table of payouts: Period, Amount, Status (PENDING/PAID), Initiated Date, Paid Date
        - Filter by status

    12. Transactions (/earnings/transactions):
        - Full transaction log: Order #, Customer, Amount, Type (sale/refund/payout), Status, Date
        - Search, filter, pagination

    13. Store Profile (/store):
        - View store info: name, slug, description, logo, banner, store_type, commission rate
        - Edit button → /store/edit

    14. Edit Store Profile (/store/edit):
        - Form: store name, description, logo upload, banner upload
        - Submit → PATCH /vendors/:id

    15. Notifications (/notifications):
        - List of notifications: icon, title, body, time, read/unread
        - Mark as read, mark all as read
        - Tap → navigate to relevant section

    16. Settings (/settings):
        - Notification preferences (toggles)
        - Password change
        - Store hours (optional)
        - Language preference (optional)

    17. Support (/support):
        - FAQ section (expandable accordion)
        - Contact form: subject, message, attach screenshot
        - Previous support tickets (if implemented)

    All pages: loading skeletons, empty states, error states, toast notifications
  </action>
  <verify>
    Check orders list has filters and status badges.
    Check order detail page has status timeline and update controls.
    Check analytics pages render charts.
    Check earnings/payouts show financial data.
    Check store profile has edit capability.
    Check notifications list renders.
  </verify>
  <done>
    All vendor dashboard pages (orders, customers, promotions, analytics, earnings, store, notifications, settings, support) are complete.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Vendor Dashboard web app (Next.js) — 32 screens</what-built>
  <how-to-verify>
    1. Start: `cd apps/vendor-dashboard && npm run dev`
    2. Open http://localhost:3001
    3. Verify redirect to /login when not authenticated
    4. Sign up as a new vendor
    5. Complete OTP verification
    6. Complete KYC flow (Business → Bank → Documents → Approval Pending)
    7. Log in and see Dashboard with metrics
    8. Products → Add Product with image upload + variants
    9. Verify product appears in listing
    10. Inventory → update stock, see low stock alerts
    11. Orders → view orders, tap one for detail, update status
    12. Coupons → create a coupon code
    13. Analytics → view sales and revenue charts
    14. Earnings → view earnings, payouts, transactions
    15. Store Profile → edit store info
    16. Notifications → view notifications
    17. Settings → update preferences
    18. Test logout
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
1. Auth flow (signup → OTP → KYC → dashboard) works end-to-end
2. Product CRUD with variants and image upload works
3. Inventory management with stock updates and low stock alerts works
4. Order listing, detail, status updates, and returns work
5. Coupon/offer creation and management works
6. Analytics charts render with correct data
7. Earnings and payout tracking shows correct financial data
8. Store profile editing works
9. Sidebar navigation covers all 12 sections
10. All states handled: loading, empty, error, success
</verification>

<success_criteria>
- Vendor can complete full onboarding (KYC) and manage their store
- Vendor can manage entire product catalog with variants and inventory
- Vendor can process orders and returns
- Vendor can create promotions (coupons/offers)
- Vendor can view analytics and track earnings
- Vendor dashboard is feature-complete with 32 screens
</success_criteria>

<output>
After completion, create `.planning/phases/04-vendor-dashboard/04-vendor-dashboard-05-SUMMARY.md`
</output>
