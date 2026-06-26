---
phase: 07-customer-app-b
plan: 07
type: execute
wave: 6
depends_on:
  - 05-customer-app-a-06
  - 03-core-api-b-04
  - 08-orders-payments-08
files_modified:
  - apps/customer-app/src/navigation/AppNavigator.tsx
  - apps/customer-app/src/screens/cart/CartScreen.tsx
  - apps/customer-app/src/screens/cart/CheckoutScreen.tsx
  - apps/customer-app/src/screens/cart/OrderConfirmationScreen.tsx
  - apps/customer-app/src/screens/profile/ProfileScreen.tsx
  - apps/customer-app/src/screens/profile/OrderHistoryScreen.tsx
  - apps/customer-app/src/screens/profile/AddressListScreen.tsx
  - apps/customer-app/src/screens/profile/AddAddressScreen.tsx
  - apps/customer-app/src/components/CartItem.tsx
  - apps/customer-app/src/components/AddressCard.tsx
  - apps/customer-app/src/components/OrderSummaryCard.tsx
  - apps/customer-app/src/lib/api.ts
  - apps/customer-app/src/lib/cartStore.ts
  - apps/customer-app/src/types/index.ts
autonomous: false
requirements:
  - MOBILE-04
  - MOBILE-05
  - MOBILE-06
must_haves:
  truths:
    - "User can view their cart with items, quantities, and total"
    - "User can adjust item quantities or remove items from cart"
    - "User can proceed to checkout and select a delivery address"
    - "User can place an order and see a confirmation screen"
    - "User can view their profile with order history"
    - "User can manage saved addresses"
    - "Cart badge shows item count on tab bar"
  artifacts:
    - path: "apps/customer-app/src/screens/cart/CartScreen.tsx"
      provides: "Cart view with items and totals"
      min_lines: 80
    - path: "apps/customer-app/src/screens/cart/CheckoutScreen.tsx"
      provides: "Checkout flow with address selection and order placement"
      min_lines: 100
    - path: "apps/customer-app/src/screens/profile/ProfileScreen.tsx"
      provides: "User profile with navigation to orders and addresses"
    - path: "apps/customer-app/src/screens/profile/OrderHistoryScreen.tsx"
      provides: "Order history list"
    - path: "apps/customer-app/src/lib/cartStore.ts"
      provides: "Cart state management (Zustand or context)"
    - path: "apps/customer-app/src/screens/cart/OrderConfirmationScreen.tsx"
      provides: "Post-order confirmation screen"
  key_links:
    - from: "apps/customer-app/src/screens/cart/CartScreen.tsx"
      to: "apps/api/cart"
      via: "fetch/update/delete cart items via GET/PATCH/DELETE"
    - from: "apps/customer-app/src/screens/profile/AddressListScreen.tsx"
      to: "apps/api/addresses"
      via: "fetch/update/delete addresses via GET/POST/PATCH/DELETE"
    - from: "apps/customer-app/src/screens/cart/CheckoutScreen.tsx"
      to: "apps/api/orders"
      via: "POST /orders to create order"
    - from: "apps/customer-app/src/screens/profile/OrderHistoryScreen.tsx"
      to: "apps/api/orders"
      via: "GET /orders to list user orders"
    - from: "apps/customer-app/src/lib/cartStore.ts"
      to: "apps/customer-app/src/navigation/AppNavigator.tsx"
      via: "cart badge count"
---

<objective>
Complete the customer mobile app with cart management, checkout flow, order placement, and user profile screens.

Purpose: Deliver the complete customer experience — add to cart, checkout with address selection, place orders, view order history, and manage profile.
Output: Cart screen, checkout flow, order confirmation, profile screen, order history, and address management screens.
</objective>

<execution_context>
@C:/Users/gunny/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/gunny/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/05-customer-app-a/05-customer-app-a-06-SUMMARY.md
@.planning/phases/03-core-api-b/03-core-api-b-04-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Cart screen + cart state management + badge integration</name>
  <files>
    apps/customer-app/src/screens/cart/CartScreen.tsx
    apps/customer-app/src/components/CartItem.tsx
    apps/customer-app/src/lib/cartStore.ts
    apps/customer-app/src/lib/api.ts
    apps/customer-app/src/navigation/AppNavigator.tsx
    apps/customer-app/src/types/index.ts
  </files>
  <action>
    Build the cart screen with state management, item display, and tab badge:

    1. Create src/lib/cartStore.ts using Zustand:
       - State: items[], isLoading, error
       - Actions: fetchCart(), addItem(productId, qty), updateQuantity(itemId, qty), removeItem(itemId), clearCart()
       - Each action calls the corresponding API endpoint from Plan 04's cart API
       - After each mutation, refetch cart to get server-side totals
       - Expose computed values: totalItems, subtotal, total
       - Persist to AsyncStorage for offline access (optional, can skip for now)

    2. Update src/lib/api.ts — add cart API methods:
       - getCart(), addToCart(productId, quantity), updateCartItem(itemId, quantity), removeCartItem(itemId), clearCart()

    3. Create src/components/CartItem.tsx:
       - Product image (small square thumbnail)
       - Product name, unit label
       - Price per unit
       - Quantity stepper: minus button | quantity display | plus button
         - Calls updateQuantity on change (debounced or on blur)
       - Line total (price × qty)
       - Remove button (trash icon) with confirmation
       - Swipe-to-delete bonus (optional)
       - Divider between items

    4. Create src/screens/cart/CartScreen.tsx:
       - Header: "Cart" with back button
       - If empty: EmptyState component with illustration, "Your cart is empty" message, "Start Shopping" button -> navigates to Storefront
       - If has items:
         - Scrollable list of CartItem components
         - Each with quantity controls
         - Pull-to-refresh
       - Bottom summary bar (sticky):
         - Subtotal, delivery charge (if applicable), total
         - "Proceed to Checkout" button (large, brand color)
           - Disabled if any item is out of stock
           - Shows item count: "Proceed to Checkout (3 items)"
       - Loading state: skeleton for cart items
       - Error state: retry button
       - Empty state illustration

    5. Update AppNavigator.tsx:
       - Ensure CartScreen is accessible from bottom tab
       - Pass cart badge count on the cart tab icon (red badge with item count)
       - Cart tab should show badge number from cartStore.totalItems

    6. CartItem animations: subtle fade/scale when quantity changes using LayoutAnimation or Animated API

    Design: Cart should feel native iOS/Android — standard list with trailing swipe actions, sticky bottom bar
  </action>
  <verify>
    Check CartScreen.tsx renders cart items with quantity controls.
    Check cartStore.ts has fetch/update/remove/clear actions.
    Check tab bar has badge showing item count.
    Check empty state renders when no items.
  </verify>
  <done>
    Cart screen with state management, quantity controls, totals, and tab badge is complete.
  </done>
</task>

<task type="auto">
  <name>Task 2: Checkout flow + order confirmation screen</name>
  <files>
    apps/customer-app/src/screens/cart/CheckoutScreen.tsx
    apps/customer-app/src/screens/cart/OrderConfirmationScreen.tsx
    apps/customer-app/src/components/AddressCard.tsx
    apps/customer-app/src/components/OrderSummaryCard.tsx
    apps/customer-app/src/lib/api.ts
    apps/customer-app/src/navigation/AppNavigator.tsx
  </files>
  <action>
    Build checkout flow with address selection and order placement:

    1. Update src/lib/api.ts — add order methods:
       - createOrder(items[], addressId, paymentMethod, notes?): POST /orders
       - getOrders(): GET /orders (for order history)
       - getOrder(id): GET /orders/:id

    2. Create src/components/AddressCard.tsx:
       - Compact address display: fullName, phone, street, area, city, pincode
       - Type badge: HOME/WORK/OTHER
       - Radio button for selection (in checkout)
       - Edit/delete buttons (in address management view)

    3. Create src/components/OrderSummaryCard.tsx:
       - Order items summary (image + name + qty + line total)
       - Subtotal
       - Delivery fee
       - Platform fee (if applicable)
       - Total (bold, larger)
       - Payment method display

    4. Create src/screens/cart/CheckoutScreen.tsx (multi-section, scrollable):
       - Section 1: Delivery Address
         - Shows selected address card or "Add Address" prompt
         - Tappable to open AddressListScreen to select
         - If no addresses exist, show prompt to add one
       - Section 2: Order Items
         - Compact list of items being ordered (name, qty, line total)
         - Tappable to go back to cart
       - Section 3: Payment Method
         - Radio buttons: "Pay Online (Razorpay)" / "Cash on Delivery"
         - For now: COD is default, Razorpay option (integration in Plan 08)
       - Section 4: Order Notes
         - Optional text input for delivery instructions
       - Section 5: Price Breakdown (OrderSummaryCard)
         - Subtotal, delivery, total
       - Bottom sticky button: "Place Order — ₹XXX"
         - Loading state while placing order
         - Disabled if no address selected
       - On place order:
         - Call POST /orders with addressId, items, paymentMethod, notes
         - If COD: navigate to OrderConfirmationScreen
         - If Razorpay: trigger payment flow (integrate with Razorpay SDK once Plan 08 is done — for now, default to COD)

    5. Create src/screens/cart/OrderConfirmationScreen.tsx:
       - Success animation (checkmark or celebratory illustration)
       - Order number displayed prominently
       - "Your order has been placed!" message
       - Estimated delivery time
       - "Track Order" button (placeholder for now)
       - "Continue Shopping" button -> navigates to Storefront
       - "View Orders" button -> navigates to OrderHistory
       - Back button disabled (prevents going back to checkout)

    6. Update AppNavigator.tsx to include CheckoutScreen and OrderConfirmationScreen in the stack

    States to handle:
    - Loading: skeleton placeholders during initial load
    - Empty: no addresses (show prompt to add)
    - Error: failed to place order (show error with retry)
    - Edge cases: items go out of stock during checkout (show warning)
  </action>
  <verify>
    Check CheckoutScreen.tsx has address selection + order summary + place order button.
    Check OrderConfirmationScreen.tsx shows order number and success state.
    Verify place order calls POST /orders API.
    Check address selection flow works.
  </verify>
  <done>
    Checkout flow with address selection, order placement, and confirmation screen is complete.
  </done>
</task>

<task type="auto">
  <name>Task 3: Profile screen + order history + address management</name>
  <files>
    apps/customer-app/src/screens/profile/ProfileScreen.tsx
    apps/customer-app/src/screens/profile/OrderHistoryScreen.tsx
    apps/customer-app/src/screens/profile/AddressListScreen.tsx
    apps/customer-app/src/screens/profile/AddAddressScreen.tsx
    apps/customer-app/src/navigation/AppNavigator.tsx
    apps/customer-app/src/lib/api.ts
  </files>
  <action>
    Build profile screen with order history and address management:

    1. Create src/screens/profile/ProfileScreen.tsx:
       - Header: user avatar (initials circle), name, email, phone
       - Menu list (iOS Settings-style or Android list):
         - "My Orders" -> OrderHistoryScreen
         - "My Addresses" -> AddressListScreen
         - "Payment Methods" -> placeholder (future)
         - "Settings" -> placeholder (notifications, preferences)
         - "About" -> app version, contact
         - "Sign Out" -> confirm dialog -> clears token -> navigates to Login
       - Clean, native-feeling design
       - Pull-to-refresh (refreshes user profile from API)

    2. Create src/screens/profile/OrderHistoryScreen.tsx:
       - Header: "My Orders"
       - List of orders, sorted by date (newest first)
       - Each order card shows:
         - Order ID (truncated: #ORD-XXXX)
         - Order date
         - Status badge with color: Confirmed (blue), Preparing (orange), Out for Delivery (purple), Delivered (green), Cancelled (red)
         - Item count
         - Total amount
         - First item thumbnail
       - Tap -> navigate to OrderDetailScreen (placeholder or expandable section)
       - Pull-to-refresh
       - Infinite scroll pagination
       - Empty state: "No orders yet" illustration + "Start Shopping" button
       - Loading skeleton while fetching

    3. Create src/screens/profile/AddressListScreen.tsx:
       - Header: "My Addresses" + Add button (+ icon)
       - List of saved addresses using AddressCard component
       - Each card shows:
         - Full name + phone
         - Full address (street, area, city, pincode)
         - Default badge if isDefault
         - Swipe actions: edit / delete (with confirmation)
       - "Add New Address" button at bottom
       - Empty state: "No addresses saved" + "Add Address" button
       - Pull-to-refresh

    4. Create src/screens/profile/AddAddressScreen.tsx:
       - Form with labeled fields:
         - Full Name (required)
         - Phone (required, 10-digit validation)
         - Street / Building (required)
         - Area / Locality (required)
         - City (required)
         - State (dropdown or picker)
         - Pincode (required, 6-digit validation)
         - Landmark (optional)
         - Address Type: HOME | WORK | OTHER (segmented control)
         - "Set as default" toggle
       - Validation: all required fields, pincode format, phone format
       - "Save Address" button (bottom, prominent)
       - Loading state on save
       - Reuse for edit mode (pre-fill fields if editing)

    5. Update AppNavigator.tsx with Profile stack routes

    API notes:
    - AddressListScreen calls GET /addresses, DELETE /addresses/:id
    - AddAddressScreen calls POST /addresses or PATCH /addresses/:id
    - OrderHistoryScreen calls GET /orders, GET /orders/:id
    - Profile data comes from AuthContext (user object from /auth/me)
  </action>
  <verify>
    Check ProfileScreen.tsx has menu items for orders and addresses.
    Check OrderHistoryScreen.tsx lists orders with status badges.
    Check AddressListScreen.tsx shows addresses with edit/delete.
    Check AddAddressScreen.tsx has all form fields with validation.
    Check sign out clears token and navigates to login.
  </verify>
  <done>
    Profile screen with order history, address management, and sign-out is complete. Customer app is feature-complete.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Customer mobile app — cart, checkout, order confirmation, profile, order history, address management</what-built>
  <how-to-verify>
    1. Start the app: `cd apps/customer-app && npx expo start`
    2. Open on device/simulator
    3. Log in with an existing account
    4. Browse products, add a few to cart from different storefronts
    5. Tap Cart tab — see items with quantities, totals at bottom
    6. Adjust quantity — see total update
    7. Tap "Proceed to Checkout"
    8. Select or add a delivery address
    9. Add optional order notes
    10. Tap "Place Order"
    11. See Order Confirmation screen with order number
    12. Go to Profile tab — see user info
    13. Tap "My Orders" — see the placed order with status
    14. Tap "My Addresses" — see saved address, edit it, add new one
    15. Verify empty states show correctly (clear cart, delete addresses)
    16. Test sign out flow
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
1. Cart screen shows items with quantities and real-time totals
2. Quantity adjustments call API and update correctly
3. Empty cart shows appropriate empty state
4. Checkout flow captures address, generates order, shows confirmation
5. Order history displays placed orders with status
6. Address CRUD works from profile
7. Profile shows user info and sign out works
8. Tab badge updates with cart item count
9. Loading/empty/error states handled throughout
</verification>

<success_criteria>
- Complete shopping flow works: browse → add to cart → checkout → confirm order
- Profile management works: view orders, manage addresses, sign out
- Empty and loading states are handled throughout
- Customer mobile app is feature-complete (Phase 5 done)
</success_criteria>

<output>
After completion, create `.planning/phases/07-customer-app-b/07-customer-app-b-07-SUMMARY.md`
</output>
