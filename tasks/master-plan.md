# Next360 — Master Implementation Plan

> Generated: 2026-07-18
> Context: Full end-to-end order flow analysis + CEO strategic review
> 22 tasks across 3 sprints, 3 weeks

---

## SPRINT 1: SHIP-IT BLOCKERS (Week 1)
**Goal: End-to-end order flow actually works with real money**

### 1.1 Wire Razorpay SDK in Customer App
- **Files**: `apps/customer-app/src/screens/cart/CheckoutScreen.tsx`, `apps/customer-app/src/lib/api.ts`
- **What**: Remove `comingSoon: true` from RAZORPAY payment option. Wire up `@razorpay/react-native-razorpay` SDK. Call `createRazorpayOrder()` from backend, receive `order_id`, open checkout, verify signature.
- **Backend**: Already done — `payments.service.ts` has `createRazorpayOrder`, `verifyPayment`, `handleWebhook` all built.
- **Acceptance**: User can place an order with UPI/Card/NetBanking and see payment captured.
- **Priority**: 🔴 P0

### 1.2 Wire Order Status Push Notifications
- **Files**: `apps/api/src/orders/orders.service.ts` (add calls), `apps/api/src/notifications/notifications.service.ts` (verify methods)
- **What**: In `orders.service.ts`:
  - In `create()` — after order created, call `notificationsService.sendOrderStatusNotification(orderId, 'CONFIRMED', userId)`
  - In `updateStatus()` — call `notificationsService.sendOrderStatusNotification()` with the new status
- **Backend notifications**: Already built — `sendOrderStatusNotification()` handles CONFIRMED, PACKED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED with proper titles and bodies.
- **Acceptance**: Customer gets push notification at every order status change.
- **Priority**: 🔴 P0

### 1.3 Add GET /delivery/earnings Endpoint
- **Files**: `apps/api/src/delivery/delivery.controller.ts`, `apps/api/src/delivery/delivery.service.ts`
- **What**: Add `getEarnings(userId, period?)` return `{ today, thisWeek, thisMonth, allTime, totalDeliveries }`. Query `DeliveryAssignment` where `deliveryPartnerId = partner.id AND deliveredAt IS NOT NULL`.
- **Acceptance**: Delivery app earnings screen shows real data instead of empty.
- **Priority**: 🔴 P0

### 1.4 Add POST /delivery-partners/setup Endpoint
- **Files**: `apps/api/src/delivery/delivery.controller.ts`, `apps/api/src/delivery/delivery.service.ts`
- **What**: Create delivery partner profile from vehicle type + zone name. Check zone exists, create `DeliveryPartner` record, link to user.
- **Acceptance**: Vehicle setup screen can successfully onboard a new delivery partner.
- **Priority**: 🔴 P0

### 1.5 Add Vendor New-Order Push Notification
- **Files**: `apps/api/src/orders/orders.service.ts` (in `create()`), `apps/api/src/notifications/notifications.service.ts` (add `sendVendorOrderNotification`)
- **What**: When an order is created with vendor groups, send push notification to each vendor. Need to look up the vendor's push tokens.
- **Acceptance**: Vendor gets instant notification when a customer places an order with their products.
- **Priority**: 🔴 P0

---

## SPRINT 2: TRUST & POLISH (Week 2)
**Goal: App feels trustworthy and complete**

### 2.1 Add Organic Certification Badges
- **Files**: `apps/customer-app/src/screens/product/*`, Prisma schema (add `certifications` field to Product model), API product response
- **What**: 
  - Add `certifications` JSON field to Product model (e.g., `["USDA_ORGANIC", "INDIA_ORGANIC", "FAIR_TRADE"]`)
  - Show certification badges on product cards and product detail sheet
  - Add certification filter to product listing
- **Backend**: Add `certifications` to product response in `products.service.ts`
- **Acceptance**: Products show organic certification badges (USDA Organic, India Organic, etc.) and users can filter by certification.
- **Priority**: 🟠 P1

### 2.2 Add Empty/Error/Loading States to Every Screen
- **Files**: All screen components across customer-app, delivery-app, vendor-dashboard, admin-panel
- **What**: Audit every screen for:
  - Loading → skeleton loaders (not just spinners)
  - Empty → helpful message + CTA ("No orders yet. Start shopping!")
  - Error → retry button with error message
  - Offline → graceful degradation notice
- **Priority**: 🟠 P1

### 2.3 Add Vendor Storefront Page
- **Files**: `apps/customer-app/src/screens/storefront/*` (may already exist), `apps/api/src/vendors/vendors.controller.ts`
- **What**: 
  - `GET /vendors/:id/storefront` endpoint returning vendor info + products + ratings
  - Storefront screen with vendor name, story, certifications, all products
  - Link from product card vendor name
- **Acceptance**: Tapping a vendor name on a product card shows their full storefront.
- **Priority**: 🟠 P1

### 2.4 Add Auto-Refresh to Vendor Dashboard Orders
- **Files**: `apps/vendor-dashboard/src/app/(dashboard)/orders/page.tsx`
- **What**: Add 30-second polling interval to refresh orders list. Show visual indicator when new orders arrive. Optional: browser notification for new orders.
- **Acceptance**: Vendor sees new orders appear automatically without manual refresh.
- **Priority**: 🟠 P1

### 2.5 Fix Number Masking for Delivery Partner Calls
- **Files**: `apps/delivery-app/src/app/delivery/[id].tsx`
- **What**: Replace `Linking.openURL('tel:...')` with masked call via Twilio or similar. Alternatively, use `expo-call` with number masking.
- **Acceptance**: Delivery partner can call customer without seeing their real phone number.
- **Priority**: 🟠 P1

### 2.6 Add Proof of Delivery Photo Capture
- **Files**: `apps/delivery-app/src/app/delivery/[id].tsx`, `apps/api/src/uploads/`
- **What**: On "Mark Delivered", prompt partner to take a photo of the delivered package. Upload to Supabase Storage. Store URL on DeliveryAssignment.
- **Acceptance**: Every delivery requires a photo before marking complete. Photo is visible in admin/order detail.
- **Priority**: 🟠 P1

---

## SPRINT 3: ENGAGEMENT & GROWTH (Week 3)
**Goal: Users come back, invite others, and stay loyal**

### 3.1 Build Reorder Feature
- **Files**: `apps/customer-app/src/screens/profile/OrderHistoryScreen.tsx`, `apps/api/src/orders/orders.service.ts`
- **What**: 
  - Add "Reorder" button to order history items
  - Backend: `POST /orders/:id/reorder` — creates a new draft order from the previous order's items (same products, same quantities)
  - If a product is out of stock, skip it and notify user
- **Acceptance**: One tap repeats a previous order.
- **Priority**: 🟡 P2

### 3.2 Build Subscription/Weekly Box Feature
- **Files**: New subscription Prisma model, `apps/api/src/subscriptions/`, `apps/customer-app/src/screens/subscription/`
- **What**: 
  - Prisma: `SubscriptionBox` model (vendorId, products, frequency, price, nextDeliveryDate)
  - API: CRUD subscriptions, process daily batch for upcoming deliveries
  - UI: Subscribe to a curated weekly box
- **Acceptance**: User can subscribe to a "Weekly Organic Vegetable Box" and it auto-orders every week.
- **Priority**: 🟡 P2

### 3.3 Build Referral Program
- **Files**: `apps/api/src/referrals/`, `apps/customer-app/src/screens/profile/`
- **What**: 
  - Referral code per user
  - Share link via `expo-sharing`
  - On first order by referred user, give referrer ₹100 credit
  - Track referrals in database
- **Acceptance**: User can share a referral link and get credit when friends order.
- **Priority**: 🟡 P2

### 3.4 Build Loyalty Tier Screen
- **Files**: `apps/customer-app/src/screens/loyalty/*`, `apps/api/src/loyalty/`
- **What**: 
  - 8-tier tree growth: Seed → Seedling → Sapling → Plant → Young Tree → Tree → Mature Tree → Forest
  - Points based on order value
  - Progress bar showing next tier
  - Tier badge on profile
  - Backend: Loyalty endpoints (Srinitha task, currently P3)
- **Acceptance**: User can see their tree tier, progress, and how to advance.
- **Priority**: 🟡 P2

### 3.5 Add Restock Notification API Endpoint
- **Files**: `apps/api/src/products/products.controller.ts`, `apps/api/src/notifications/`
- **What**: `POST /products/:id/notify-restock` — subscribe user, `DELETE` — unsubscribe. When stock goes from 0 → >0, send push to all subscribers.
- **Acceptance**: Customer can "Notify me when back in stock" on out-of-stock products and gets a push when restocked.
- **Priority**: 🟡 P2

### 3.6 Add In-App Chat (Customer ↔ Vendor)
- **Files**: New `apps/api/src/chat/` module, `apps/customer-app/src/screens/chat/`, Supabase Realtime channel
- **What**: 
  - Real-time messaging via Supabase Realtime
  - Chat between customer and vendor on each OrderVendorGroup
  - Messages include text + photos
  - Notifications for new messages
- **Acceptance**: Customer can message vendor about order substitutions/issues.
- **Priority**: 🟡 P2

---

## INFRASTRUCTURE & BAU TASKS (Ongoing)

| # | Task | Priority | Notes |
|---|------|----------|-------|
| I1 | Set up CI/CD pipeline (GitHub Actions) | 🟠 P1 | Run lint, typecheck, build on PR + push to main |
| I2 | Add error monitoring (Sentry) | 🟠 P1 | Blocked on tool choice decision |
| I3 | Add admin dashboard KPIs | 🟠 P1 | DAU, conversion rate, avg delivery time, revenue per vendor |
| I4 | Delivery partner weekly batch payout | 🟡 P2 | Cron job processes all undelivered payouts, creates batch payment |
| I5 | Zone serviceability check at browse time | 🟡 P2 | Filter out-of-zone vendor products from customer view |
| I6 | Environment setup (dev/staging/prod) | 🟠 P1 | Risk register item #3 |

---

## HOW TO TRACK PROGRESS

When each task is completed, mark it as [x] and the agent will verify:
1. TypeScript compiles for the affected app(s)
2. Code review passes
3. The flow actually works (test against live backend)

---

## QUICK REFERENCE: EXISTING BACKEND ENDPOINTS STATUS

| Endpoint | Status | Used By |
|----------|--------|---------|
| `POST /orders` | ✅ Built | Customer App (create) |
| `GET /orders` | ✅ Built | Customer App (list), Admin (all) |
| `GET /orders/vendor` | ✅ Built | Vendor Dashboard |
| `POST /orders/:id/cancel` | ✅ Built | Customer App |
| `PATCH /orders/:id/status` | ✅ Built | Vendor/Admin status advance |
| `POST /orders/:id/assign` | ✅ Built | Admin → Delivery Partner |
| `POST /orders/:id/reject` | ✅ Built | Delivery Partner reject |
| `POST /orders/:id/verify-pickup` | ✅ Built | Delivery OTP verify |
| `POST /payments/razorpay-order` | ✅ Built | Creates Razorpay order |
| `POST /payments/verify` | ✅ Built | Verifies signature |
| `POST /payments/webhook` | ✅ Built | Razorpay webhook |
| `PATCH /delivery/availability` | ✅ Built | Toggle online/offline |
| `PATCH /delivery/location` | ✅ Built | GPS push |
| `GET /delivery/new-orders` | ✅ Built | Available deliveries |
| `GET /delivery/active` | ✅ Built | Active deliveries |
| `GET /delivery/history` | ✅ Built | Completed deliveries |
| **`GET /delivery/earnings`** | 🔴 MISSING | Delivery App earnings |
| **`POST /delivery-partners/setup`** | 🔴 MISSING | Vehicle/zone setup |
| `POST /notifications/register` | ✅ Built | Push token register |
| `GET /notifications` | ✅ Built | List notifications |
| `POST /kyc/submit` | ✅ Built | KYC document submission |
| `GET /kyc/status` | ✅ Built | KYC status check |
