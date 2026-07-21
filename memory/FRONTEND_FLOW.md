# Frontend Flow

> **Last updated:** 2026-07-20

---

## Customer App (apps/customer-app/)

### Stack
- Expo SDK 56 (React Native 0.85)
- React Navigation (stack + tabs)
- Zustand (state management)
- expo-secure-store (auth tokens)
- @gorhom/bottom-sheet (product detail)
- react-native-maps (address picker, tracking)

### Login Flow
1. Splash Screen -> Animated logo, auto-check stored token
2. Onboarding (3 slides - one per category: Organic/Natural/Eco-Friendly)
3. Phone Auth (OTP) -> Enter phone -> Receive OTP -> Verify
4. Zone Check -> Select location -> If outside service area, show block screen
5. Home Screen -> Token in SecureStore, auto-attached to all API calls

### Navigation Structure
RootStack
  SplashScreen (initial)
  OnboardingScreen
  AuthStack
    LoginScreen, SignupScreen
    VerificationCodeScreen (OTP)
    ForgotPasswordScreen, ResetPasswordScreen
  MainTabs (floating pill bottom nav)
    Home (HomeScreen)
    All Products (ProductListScreen)
    Favorites (WishlistScreen)
    Orders (OrderHistoryScreen)
  CartScreen, CheckoutScreen, OrderConfirmationScreen
  OrderDetailScreen, OrderTrackingScreen
  ProfileScreen, AddressListScreen, AddAddressScreen, EditProfileScreen
  SearchScreen, SelectLocationScreen, NotificationsScreen, SupportScreen
  PromosScreen
  AiAssistantScreen, AiRecommendationsScreen, AiProductScannerScreen
  AiHealthInsightsScreen, AiChatHistoryScreen

### Key Components (30+)
ProductCard, QuantityStepper, CategoryBadge, StoreToggle
ExpandingSearchDock, StaggerFadeIn, Shimmer
ErrorBoundary, ErrorState, AuthTextField, BigButton
AddressMapPicker, LocationPopover, NotificationsPopover, ProfileAvatarPopover
BottomSheetContent, cartSheet, flyToCart, productSheet

### State Management (Zustand)
| Store | Key State |
|-------|-----------|
| authStore | user, token, isAuthenticated |
| cartStore | items, addItem, removeItem, updateQuantity, total |
| storeStore | selectedCategory, products |
| zoneStore | currentZone, isInServiceArea |
| notificationsStore | notifications, unreadCount |

### Design Token System

**Fixed (never re-themed):**
- Background: #FFFFFF (white)
- Text: #1C1B17 (near-black bark)
- Brass accent: #C9A66B (prices, premium badges)
- Display font: Fraunces (slab serif)
- Body font: Inter
- Utility font: JetBrains Mono

**Per-category theming (swap only):**
| Category | Accent | Accent Tint | Card Border |
|----------|--------|-------------|-------------|
| Organic | #5C6B4D | #EDF0E8 | rgba(92,107,77,0.3) |
| Natural | #9B6A3F | #F4ECE3 | rgba(155,106,63,0.3) |
| Eco-Friendly | #2F5D62 | #E7EEEE | rgba(47,93,98,0.3) |

### Cart Flow
1. Product card: Inline + stepper adds 1 directly (repeat-buyer speed path)
2. Bottom sheet: Tap card -> 45% snap (quick-add) or 90% snap (full details)
3. Cart: Grouped by vendor, stock-capped on (userId + productId)
4. Checkout: Per-vendor breakdown, address select, Razorpay payment
5. Order confirmation -> Live tracking (map + timeline)

---

## Delivery App (apps/delivery-app/)

### Stack
- Expo SDK 56, Expo Router (file-based routing)
- Zustand (authStore, deliveryStore)
- Design: Speed-of-glance, sans-only, one primary action per screen

### Key Differences from Customer App
- No Fraunces serif (sans-only for faster reading)
- No category theming (one fixed green #10B981 palette)
- No bottom sheets (partner needs full info immediately)
- No onboarding carousel
- Nav disappears during active delivery

### Routes
_layout.tsx (Root)
  index.tsx (Splash)
  (auth)/login.tsx (Phone OTP, no onboarding)
  (tabs)/_layout.tsx
    (tabs)/index.tsx (Home/Availability Toggle + today glance-stats)
    (tabs)/new-orders.tsx (Available orders list)
    (tabs)/earnings.tsx (Today/Week/Month tabs, flat list)
    (tabs)/history.tsx (Flat delivery history list)
    (tabs)/profile.tsx (Name, vehicle, zone, document status, support)
  delivery/[id].tsx (Active delivery - map first, state changes content)

---

## Vendor Dashboard (apps/vendor-dashboard/)

**Stack:** Next.js 14 App Router, Tailwind CSS 4, recharts, lucide-react
**Layout:** Sidebar + Header (25 pages)
**Port:** 3001
**Auth:** lib/auth.tsx, tokens in localStorage
**API:** lib/api.ts with text-first fetch pattern (response.text() -> JSON.parse())

---

## Admin Panel (apps/admin-panel/)

**Stack:** Next.js 14 App Router, Tailwind CSS, lucide-react
**Layout:** AdminSidebar + AdminHeader (38 pages)
**Port:** 3002
**Auth:** lib/auth.tsx, tokens in localStorage as admin_token + admin_user
**API:** lib/api.ts with text-first fetch pattern

### Critical API Client Pattern

**Never use response.json()** - HTML error responses crash the parser.
