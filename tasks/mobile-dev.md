# Mobile Dev — Customer App + Delivery App

> **Area**: `apps/customer-app/` + `apps/delivery-app/`
> **Status**: In Progress
> **Priority**: 🔴 P0 → 🟡 P2

---

## ✅ Already Completed

### Customer App
- [x] Splash → Onboarding (3 slides) → Phone OTP → Main app flow
- [x] Google Login button (UI exists, backend OAuth verification pending)
- [x] Home: Search dock, location popover, category swatches, curated rows, CMS banners
- [x] Product card with vendor name + vendor storefront navigation
- [x] Product detail bottom sheet (2 snap points)
- [x] Cart: Multi-vendor grouping, quantity stepper, mini-cart bar, fly-to-cart animation
- [x] Checkout: Address selection, coupon, payment method, order notes
- [x] Orders: History, detail, tracking (map + timeline), cancellation, return
- [x] Profile: Edit profile, addresses, wishlist, support, loyalty, referral, subscription
- [x] AI screens: Chat, scanner, recommendations, health insights, history
- [x] Search: Full filter modal (store type, category, price range, rating)
- [x] CMS banners wired to backend (`getBanners()` from customerApi)
- [x] AI screen colors fixed to use category theming
- [x] Wishlist count badge in nav
- [x] Telugu/English i18n (29 screens translated, language toggle in Profile)
- [x] All popover animations fixed (no useSafeAreaInsets interpolation)

### Delivery App
- [x] Splash → Phone OTP → Vehicle/Zone setup → KYC
- [x] Home: Online/offline toggle, today's stats
- [x] New orders list with Accept/Reject
- [x] Active delivery: Map-first, status strip, GPS tracking, OTP pickup, call customer
- [x] Delivery complete: Proof photo, earnings summary
- [x] Failed delivery: Reason selection modal, report to backend
- [x] Earnings: Today/Week/Month tabs
- [x] History: Completed deliveries list with stats
- [x] Profile: Details, vehicle, documents, support, version info
- [x] KYC document submission with image upload
- [x] API envelope unwrap fix
- [x] Notification listeners setup

---

## 🔴 P0 — Must Do

### 1. Google Login — Wire Backend OAuth Verification
**Files**: `apps/customer-app/src/screens/auth/PhoneAuthScreen.tsx`, `apps/api/src/auth/auth.controller.ts`, `auth.service.ts`
**What**:
- **Frontend**: Already has "Continue with Google" button UI
- **Backend**: Need `POST /auth/google-login` endpoint that:
  - Receives `{ idToken: string }` from client
  - Verifies token with Google's OAuth2 API
  - Extracts email/name from verified token
  - Upserts user (find by email or create)
  - Returns JWT token
- Install `google-auth-library` in backend
- Wire the button to actually call the backend endpoint

### 2. Delivery Slot at Checkout
**Files**: `prisma/schema.prisma`, `apps/api/src/delivery-slot/` (new module), `apps/customer-app/src/screens/cart/CheckoutScreen.tsx`
**What**:
- New `DeliverySlotConfig` model: `zoneId, dayOfWeek, startTime, endTime, maxOrders, isActive`
- New `DeliverySlotBooking` model: `orderVendorGroupId, slotConfigId, date, timeRange`
- `GET /delivery-slots?zoneId=` — get available slots
- DeliverySlotPicker component in checkout
- Pass `deliverySlotId` in `createOrder` call
- **Without this**: Customer has no ETA promise at checkout

### 3. Wire Order Status Push Notifications
**Files**: `apps/api/src/notifications/notifications.service.ts`, `apps/customer-app/src/lib/notifications.ts`
**What**:
- Verify `sendOrderStatusNotification()` fires at EVERY status transition
- Customer app notification handler registers token on login
- Create in-app notification list screen (NotificationScreen) with:
  - Time-ordered list of notifications
  - Unread indicator (dot)
  - Tap to mark as read
  - Tap notification → navigate to relevant screen (order detail for order notifications)
- Add notification preferences (which events to push)

---

## 🟠 P1 — Should Do

### 4. Loyalty/Tier Screen
**Files**: New screens in `apps/customer-app/src/screens/loyalty/`, `apps/api/src/loyalty/` (new module)
**What**:
- **Blocked on**: Backend loyalty endpoints (currently unassigned)
- 8-tier tree growth: Seed → Seedling → Sapling → Plant → Young Tree → Tree → Mature Tree → Forest
- Points based on order value, progress bar showing next tier
- Tier badge on profile

### 5. Cart Validation Enhancement
**Files**: Checkout screen
**What**:
- Validate stock levels before creating order
- Show warning if items are out of stock
- Auto-remove unavailable items

### 6. Empty/Error/Loading States
**Files**: All screens
**What**:
- Systematic audit: every screen needs loading, empty, error states
- Skeleton loaders (not just spinners)
- Helpful empty messages with CTAs
- Retry buttons on errors

---

## 🟡 P2 — Nice to Have

### 7. Reorder Feature
**Files**: Order history screen
**What**: One-tap repeat of previous order

### 8. Referral Program
**Files**: New screens + new API module
**What**: Share referral code, get credit on referred orders

### 9. In-App Chat (Customer ↔ Vendor)
**Files**: New chat module + screens
**What**: Real-time messaging on each OrderVendorGroup

### 10. Restock Notification
**Files**: Product detail screen
**What**: "Notify me when back in stock" button on out-of-stock products

---

## Implementation Order (Customer App)
1. Google Login backend integration (high visibility)
2. Delivery Slot at checkout (operational necessity)
3. Wire push notifications end-to-end
4. Cart validation enhancement
5. Empty/error/loading states audit

## Implementation Order (Delivery App)
1. Already mostly complete — test against live backend
2. Fix any issues found during E2E testing
3. Verify earnings/history screens with real data (depends on Srinitha's backend)

---

## Reference
- Design tokens: `apps/customer-app/src/constants/theme.ts`
- API pattern: `apps/customer-app/src/lib/api.ts`
- Auth flow: `apps/customer-app/src/lib/auth.ts`
- i18n: `apps/customer-app/src/i18n/`
- Delivery app API: `apps/delivery-app/src/lib/api.ts`
