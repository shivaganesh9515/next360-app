---
phase: 10-delivery-app
plan: 10
type: execute
wave: 5
depends_on:
  - 01-foundation-01
  - 02-auth-02
  - 08-orders-payments-08
files_modified:
  - apps/delivery-app/package.json
  - apps/delivery-app/tsconfig.json
  - apps/delivery-app/app.json
  - apps/delivery-app/App.tsx
  - apps/delivery-app/src/navigation/AppNavigator.tsx
  - apps/delivery-app/src/screens/LoginScreen.tsx
  - apps/delivery-app/src/screens/NewOrdersScreen.tsx
  - apps/delivery-app/src/screens/ActiveDeliveriesScreen.tsx
  - apps/delivery-app/src/screens/OrderDetailScreen.tsx
  - apps/delivery-app/src/screens/DeliveryHistoryScreen.tsx
  - apps/delivery-app/src/screens/ProfileScreen.tsx
  - apps/delivery-app/src/components/OrderCard.tsx
  - apps/delivery-app/src/components/DeliveryMap.tsx
  - apps/delivery-app/src/lib/api.ts
  - apps/delivery-app/src/lib/supabase.ts
  - apps/delivery-app/src/store/authStore.ts
  - apps/delivery-app/src/store/deliveryStore.ts
  - packages/shared/src/index.ts
autonomous: false
requirements:
  - DELIVERY-01
  - DELIVERY-02
  - DELIVERY-03
  - DELIVERY-04
  - DELIVERY-05
must_haves:
  truths:
    - "Delivery partner can log in and see available new orders (full-screen modal, 30-sec countdown)"
    - "Delivery partner can accept or reject a new order"
    - "Delivery partner confirms pickup with OTP (matches DeliveryAssignment.otp)"
    - "Delivery partner updates OrderVendorGroup status through: ASSIGNED_TO_DELIVERY → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED"
    - "Active delivery screen is map-first, single evolving screen — bottom nav hidden during active delivery"
    - "Delivery partner's lat/lng pushed to API periodically → Supabase Realtime relays to customer app"
    - "Delivery partner can view their earnings and delivery history"
    - "Online/Offline toggle is the dominant element on home screen (DeliveryPartner.status update)"
  artifacts:
    - path: "apps/delivery-app/src/screens/NewOrdersScreen.tsx"
      provides: "New orders feed with accept/reject"
    - path: "apps/delivery-app/src/screens/ActiveDeliveriesScreen.tsx"
      provides: "Active deliveries with status updates"
    - path: "apps/delivery-app/src/screens/OrderDetailScreen.tsx"
      provides: "Order info, customer details, navigation actions"
    - path: "apps/delivery-app/src/components/DeliveryMap.tsx"
      provides: "Map view showing delivery route"
  key_links:
    - from: "apps/delivery-app/src/screens/NewOrdersScreen.tsx"
      to: "apps/api/orders/:id/assign"
      via: "PATCH /orders/:id/assign with deliveryPartnerId"
    - from: "apps/delivery-app/src/screens/ActiveDeliveriesScreen.tsx"
      to: "apps/api/orders/:id/status"
      via: "PATCH /orders/:id/status (delivery updates)"
    - from: "apps/delivery-app/src/screens/ProfileScreen.tsx"
      to: "apps/api/delivery/earnings"
      via: "GET /delivery/earnings"
---

<objective>
Build the Expo-based delivery partner app with order feed, accept/reject workflow, delivery status updates, and earnings tracking.

Purpose: Enable in-house delivery fleet to receive new orders, navigate to customer locations, and manage deliveries in real-time.
Output: Expo delivery partner app with login, new orders feed, active deliveries, map view, delivery history, and earnings.
</objective>

<execution_context>
@C:/Users/gunny/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/gunny/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-foundation-01-SUMMARY.md
@.planning/phases/02-auth/02-auth-02-SUMMARY.md
@.planning/phases/08-orders-payments/08-orders-payments-08-SUMMARY.md

<ui_rules>
DELIVERY APP DESIGN — deliberately different from Customer App:
  - Sans-serif only (NO Fraunces) — reads faster at a glance
  - One fixed palette, NO category theming
  - Big tap targets, minimal scroll, ONE primary action per screen
  - Dense info-first cards, status-color-coded
  - NO bottom sheets — partner needs full information immediately
  - NO nav during active delivery — bottom nav disappears entirely
  - NO onboarding carousel — straight to earning
  - Incoming assignment = FULL-SCREEN modal with 30-sec countdown (not a card)
  - Active delivery = single evolving screen, content changes with state, never re-navigates
  - Primary colors: functional status colors (green=available, orange=on delivery, gray=offline)
</ui_rules>
@.planning/phases/05-customer-app-a/05-customer-app-a-06-SUMMARY.md
@.planning/phases/06-customer-app-b/06-customer-app-b-07-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Delivery app scaffold — Expo app, auth, navigation, shared components</name>
  <files>
    apps/delivery-app/package.json
    apps/delivery-app/tsconfig.json
    apps/delivery-app/app.json
    apps/delivery-app/App.tsx
    apps/delivery-app/src/navigation/AppNavigator.tsx
    apps/delivery-app/src/screens/LoginScreen.tsx
    apps/delivery-app/src/screens/ProfileScreen.tsx
    apps/delivery-app/src/lib/api.ts
    apps/delivery-app/src/lib/supabase.ts
    apps/delivery-app/src/store/authStore.ts
    apps/delivery-app/src/store/deliveryStore.ts
    apps/delivery-app/src/components/OrderCard.tsx
    packages/shared/src/index.ts
  </files>
  <action>
    Scaffold the Expo delivery partner app with auth, navigation, and core infrastructure:

    1. Initialize delivery app in apps/delivery-app:
       - package.json: expo (~52), react-native, @supabase/supabase-js, @supabase/ssr, zustand, expo-router (file-based navigation), react-native-maps (for map), @react-navigation/bottom-tabs
       - app.json: name "Next360 Delivery", slug "next360-delivery", icon, splash screen
       - tsconfig.json extending Expo's base config
       - Refer to customer app (apps/customer-app) for patterns — mirror the auth and API structure

    2. Create src/lib/supabase.ts:
       - Supabase client for Expo (same pattern as customer app)
       - Use process.env.EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

    3. Create src/lib/api.ts:
       - Fetch wrapper similar to customer app
       - Base URL from process.env.EXPO_PUBLIC_API_URL
       - Auth token from supabase session
       - api.get(), api.post(), api.patch() with typed responses
       - Error handling with toast/alerts

    4. Create src/store/authStore.ts:
       - Zustand store for auth state
       - State: user, session, profile, isLoading, isAuthenticated
       - Actions: signIn(email, password), signOut(), loadSession(), loadProfile()
       - Profile must have role = 'DELIVERY_PARTNER' — reject login if wrong role
       - Persist session to AsyncStorage

    5. Create src/store/deliveryStore.ts:
       - Zustand store for delivery state
       - State: newOrders[], activeDeliveries[], deliveryHistory[], earnings, isLoading
       - Actions:
         - fetchNewOrders() — GET /orders?status=READY_FOR_DELIVERY&assignedTo=null
         - fetchActiveDeliveries() — GET /orders?deliveryPartnerId=me&status=in(PICKED_UP,IN_TRANSIT)
         - fetchDeliveryHistory() — GET /orders?deliveryPartnerId=me&status=DELIVERED
         - acceptOrder(orderId) — PATCH /orders/:id/assign { deliveryPartnerId }
         - rejectOrder(orderId) — PATCH /orders/:id/decline
         - updateDeliveryStatus(orderId, status) — PATCH /orders/:id/status
         - fetchEarnings() — GET /delivery/earnings

    6. Create App.tsx (or _layout.tsx with expo-router):
       - Auth state check -> show LoginScreen or AppNavigator
       - Supabase auth state listener (onAuthStateChange)
       - Loading splash while checking session
       - NavigationContainer (or expo-router)

    7. Create src/navigation/AppNavigator.tsx:
       - Bottom tab navigator with 4 tabs:
         - 📋 New Orders (bell icon, badge count) -> NewOrdersScreen
         - 🚚 Active (truck icon) -> ActiveDeliveriesScreen
         - 📜 History (clock icon) -> DeliveryHistoryScreen
         - 👤 Profile (person icon) -> ProfileScreen
       - Tab bar styling: white background, primary color for active tab, badge on New Orders
       - Stack navigator wrapping each tab for push screens (OrderDetail from New Orders and Active)

    8. Create LoginScreen.tsx:
       - Clean login screen with delivery partner branding
       - Phone/email + password input
       - "Delivery Partner Login" title
       - Error states, loading spinner
       - On success: validate role is DELIVERY_PARTNER -> navigate to tabs
       - On role mismatch: show "This account is not registered as a delivery partner" error

    9. Create ProfileScreen.tsx:
       - Profile card: name, email, phone, avatar
       - Today's stats: deliveries completed, earnings, distance covered
       - Overall stats: total deliveries, total earnings
       - Logout button
       - App version info

    10. Create components/OrderCard.tsx:
        - Reusable card for displaying order info
        - Fields: order number, customer name, delivery address, item count, total, estimated delivery time, distance
        - Props: order data, onPress, actions (optional action buttons)
        - States: default, highlighted (for new), dimmed (for history)
        - Compact and expanded variants

    Design: Professional delivery app theme — green/blue brand colors, card-based UI, large touch targets, dark mode support

    11. Update packages/shared/src/index.ts with delivery order types:
        - DeliveryOrder (extends order with delivery-specific fields)
        - DeliveryEarnings, DeliveryStat, DeliveryHistoryItem
  </action>
  <verify>
    Check app builds with `npx expo start`.
    Verify login screen renders and authenticates.
    Verify tab navigation renders 4 tabs (New Orders, Active, History, Profile).
    Verify auth store rejects non-DELIVERY_PARTNER roles.
  </verify>
  <done>
    Delivery app scaffold with auth, navigation, state management, and shared components is complete.
  </done>
</task>

<task type="auto">
  <name>Task 2: New orders feed + accept/reject + order detail + map component</name>
  <files>
    apps/delivery-app/src/screens/NewOrdersScreen.tsx
    apps/delivery-app/src/screens/ActiveDeliveriesScreen.tsx
    apps/delivery-app/src/screens/OrderDetailScreen.tsx
    apps/delivery-app/src/components/DeliveryMap.tsx
  </files>
  <action>
    Build the core delivery workflow screens:

    1. Create NewOrdersScreen.tsx:
       - Real-time feed of orders ready for delivery (status = READY_FOR_DELIVERY, no assigned partner)
       - Use Supabase Realtime subscription to listen for new orders:
         - Subscribe to orders channel: INSERT on orders with status = 'READY_FOR_DELIVERY'
         - Play notification sound / vibrate on new order
       - FlatList of OrderCard components
       - Each card shows:
         - Order number, customer name, address (truncated), item count, total
         - Distance from current location (if available) — use geolocation
         - Estimated delivery fee/earnings for this order
         - Time since order was placed (e.g., "5 mins ago")
         - Timer-like indicator showing how long order has been waiting
       - Two action buttons on each card:
         - ✅ "Accept" (green, prominent) -> acceptOrder(orderId) -> refresh lists
         - ❌ "Reject" (red, subtle) -> rejectOrder(orderId) -> refresh lists
       - Confirmation dialog on accept: "Accept delivery for Order #XYZ?"
       - Empty state: "No new orders available" with pull-to-refresh
       - Loading state with skeleton cards
       - Sound/vibration alert when new order arrives
       - Sorted by oldest first (FIFO)
       - Pull to refresh

    2. Create ActiveDeliveriesScreen.tsx:
       - List of the delivery partner's active deliveries (PICKED_UP, IN_TRANSIT)
       - Sectioned: "To Pick Up" (status = READY_FOR_DELIVERY, assigned to me) and "In Transit" (IN_TRANSIT)
       - Each OrderCard shows:
         - Current status with StatusBadge
         - Progress indicator: Picked Up -> In Transit -> Delivered
         - Customer address, estimated delivery time
         - Contact customer button (opens phone dialer)
       - Tap card -> OrderDetailScreen
       - Button "Mark as Picked Up" (on READY_FOR_DELIVERY orders)
       - Button "Mark as Delivered" (on IN_TRANSIT orders)
         - Confirmation: "Confirm delivery to [customer name]?"
         - After confirm: update status to DELIVERED, show success modal
       - Empty state: "No active deliveries"
       - Pull to refresh + real-time subscription for status changes

    3. Create OrderDetailScreen.tsx:
       - Full order information screen
       - Top: order number, status badge, placed time
       - Customer info section:
         - Name, phone (with "Call" button), delivery address (with "Navigate" button)
       - Order items list: item name, quantity, price each
       - Vendor info: store name, address
       - Price breakdown: subtotal, delivery fee, total
       - Delivery fee display (how much the partner earns)
       - Action buttons (contextual):
         - "Mark as Picked Up" (if status = READY_FOR_DELIVERY)
         - "Mark as Delivered" (if status = IN_TRANSIT)
         - "Navigate to Customer" (opens Google Maps / Apple Maps with address)
         - "Call Customer" (opens phone dialer)
       - DeliveryMap component showing route from vendor to customer
       - Loading and error states

    4. Create DeliveryMap.tsx component:
       - Uses react-native-maps (or expo-maps)
       - Shows two markers: vendor location and customer location
       - Polyline route between them (using directions API or straight line approximation)
       - Zoom to fit both markers
       - Current location marker (delivery partner's location)
       - Props: vendorLat, vendorLng, customerLat, customerLng, partnerLat, partnerLng
       - Loading state while map loads
       - Fallback: "Map unavailable" message with address text
       - Style: cozy markers, brand-colored route line, info callout on marker tap

    States across all screens:
    - Loading: skeleton cards or spinner
    - Error: retry banner with message
    - Empty: illustration + message + action
    - Success: toast/modal on action completion
    - Network offline: banner at top

    Real-time strategy:
    - Supabase Realtime channel for orders table
    - Subscribe on screen focus, unsubscribe on blur
    - Use deliveryStore to manage state updates
  </action>
  <verify>
    Check NewOrdersScreen shows available orders with accept/reject buttons.
    Check ActiveDeliveriesScreen shows assigned orders with pickup/delivery actions.
    Check OrderDetailScreen shows full order info with map and action buttons.
    Check DeliveryMap component renders markers and route.
    Verify accept order assigns delivery partner and moves order to active.
  </verify>
  <done>
    Core delivery workflow screens (new orders, active deliveries, order detail, map) are complete.
  </done>
</task>

<task type="auto">
  <name>Task 3: Delivery history + earnings + real-time updates + profile</name>
  <files>
    apps/delivery-app/src/screens/DeliveryHistoryScreen.tsx
    apps/delivery-app/src/screens/ProfileScreen.tsx
    apps/delivery-app/src/store/deliveryStore.ts
    apps/delivery-app/src/lib/api.ts
  </files>
  <action>
    Build delivery history, earnings tracking, and enhance profile/real-time features:

    1. Enhance DeliveryHistoryScreen.tsx:
       - List of completed deliveries (status = DELIVERED)
       - Sectioned by date: "Today", "Yesterday", "This Week", "Older"
       - Each card shows:
         - Order number, customer name, date/time
         - Delivery fee earned (highlighted)
         - Distance (if tracked)
         - Time taken (delivered_at - picked_up_at)
       - Summary header:
         - Total deliveries this period
         - Total earnings this period
         - Average delivery time
       - Date range filter: Today, This Week, This Month, All Time
       - FlatList with pull-to-refresh
       - Empty state: "No delivery history yet"
       - Tap card -> OrderDetailScreen (read-only mode, no action buttons)

    2. Enhance ProfileScreen.tsx:
       - Profile header with avatar, name, role
       - Stats cards row:
         - Total Deliveries
         - Total Earnings
         - Rating (placeholder, future)
         - On-time rate (%)
       - Earnings breakdown section:
         - This Week: ₹X,XXX
         - This Month: ₹X,XXX
         - All Time: ₹X,XXX
       - Recent activity feed (last 5 deliveries with status and time)
       - Availability toggle: "Available for Deliveries" switch
         - PATCH /delivery/availability { isAvailable: bool }
         - When OFF: stop receiving new order notifications
       - Settings section:
         - Notification preferences (toggle)
         - Account info (display-only)
         - App version
       - Logout button with confirmation

    3. Create src/lib/api.ts delivery methods:
       - getNewOrders() — GET /orders?status=READY_FOR_DELIVERY&assignedTo=null
       - acceptOrder(orderId) — PATCH /orders/:id/assign { deliveryPartnerId: current_user_id }
       - rejectOrder(orderId) — PATCH /orders/:id/decline (adds to rejection log)
       - updateDeliveryStatus(orderId, status, data?) — PATCH /orders/:id/status
       - getActiveDeliveries() — GET /orders?deliveryPartnerId=me&status=in(PICKED_UP,IN_TRANSIT)
       - getDeliveryHistory(params) — GET /orders?deliveryPartnerId=me&status=DELIVERED&page=N&limit=20
       - getEarnings(params) — GET /delivery/earnings?period=week|month|all
       - setAvailability(isAvailable) — PATCH /delivery/availability

    4. Real-time subscription management:
       - In store/deliveryStore.ts: set up Supabase Realtime channel
       - Subscribe to orders INSERT where status = 'READY_FOR_DELIVERY'
       - Subscribe to orders UPDATE where delivery_partner_id = current user
       - Auto-refresh lists on relevant events
       - Clean up subscriptions on logout
       - Play notification on new order (use expo-notifications or Expo Audio)

    5. Notification handling:
       - Request notification permissions on first launch
       - Show local notification when new order arrives (while app is foregrounded)
       - Use expo-notifications for local push notifications
       - Navigate to NewOrders tab on notification tap
       - Background notification support (optional for this phase)

    Design patterns:
    - Consistent card-based UI across all screens
    - Green accent color for money/earnings displays
    - Smooth transitions between screens
    - All monetary values formatted with ₹ symbol
  </action>
  <verify>
    Check DeliveryHistoryScreen shows completed deliveries sectioned by date.
    Check ProfileScreen shows stats, earnings breakdown, and availability toggle.
    Verify real-time new order notifications appear.
    Verify earnings API returns correct data.
  </verify>
  <done>
    Delivery history, earnings tracking, and real-time notification features are complete. Delivery partner app is feature-complete.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Delivery partner Expo app — login, new orders feed with accept/reject, active deliveries with status updates, order detail with map, delivery history, earnings, real-time notifications</what-built>
  <how-to-verify>
    1. Start delivery app: `cd apps/delivery-app && npx expo start`
    2. Open on device/emulator
    3. Login screen appears — log in as a DELIVERY_PARTNER user
    4. Login succeeds, tabs appear with 4 tabs
    5. New Orders tab shows available orders with Accept/Reject buttons
    6. Accept an order — it moves to Active Deliveries tab
    7. Active Deliveries shows the order with "Mark as Picked Up" action
    8. Tap order -> OrderDetailScreen with customer info, items, and map markers
    9. "Navigate" button opens maps app with address
    10. Mark as Picked Up -> status updates, "Mark as Delivered" appears
    11. Mark as Delivered -> order moves to History
    12. History tab shows completed deliveries sectioned by date
    13. Profile tab shows stats, earnings breakdown, availability toggle
    14. Toggle availability on/off
    15. Test real-time: (from admin) create order -> new order appears on New Orders tab
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
1. Delivery partner auth with role validation works
2. New orders appear in real-time with accept/reject flow
3. Status updates (Picked Up, In Transit, Delivered) propagate correctly
4. Order detail shows full info with map and navigation actions
5. Delivery history is sectioned by date with earnings
6. Profile shows accurate stats and availability toggle works
7. Real-time subscriptions keep lists current
</verification>

<success_criteria>
- Delivery partner can receive, accept, and complete orders
- Delivery partner can track active deliveries and update status
- Delivery partner can view earnings and delivery history
- Delivery partner receives real-time notifications
</success_criteria>

<output>
After completion, create `.planning/phases/10-delivery-app/10-delivery-app-10-SUMMARY.md`
</output>
