---
phase: 05-customer-app-a
plan: 06
type: execute
wave: 4
depends_on:
  - 03-core-api-a-03
files_modified:
  - apps/customer-app/package.json
  - apps/customer-app/tsconfig.json
  - apps/customer-app/app.json
  - apps/customer-app/App.tsx
  - apps/customer-app/src/navigation/AppNavigator.tsx
  - apps/customer-app/src/screens/auth/LoginScreen.tsx
  - apps/customer-app/src/screens/auth/SignupScreen.tsx
  - apps/customer-app/src/screens/storefront/StorefrontScreen.tsx
  - apps/customer-app/src/screens/storefront/ProductListScreen.tsx
  - apps/customer-app/src/screens/storefront/ProductDetailScreen.tsx
  - apps/customer-app/src/components/StoreToggle.tsx
  - apps/customer-app/src/components/ProductCard.tsx
  - apps/customer-app/src/components/CategoryChip.tsx
  - apps/customer-app/src/lib/api.ts
  - apps/customer-app/src/lib/auth.tsx
  - apps/customer-app/src/lib/store.ts
  - apps/customer-app/src/types/index.ts
autonomous: false
requirements:
  - MOBILE-01
  - MOBILE-02
  - MOBILE-03
must_haves:
  truths:
    - "User sees three store tabs: Organic, Natural, Eco-friendly"
    - "Tapping a store tab shows products filtered by that store type"
    - "User can browse products by category"
    - "User can tap a product to see its full details"
    - "User can log in and sign up from the app"
    - "User stays logged in across app restarts"
  artifacts:
    - path: "apps/customer-app/src/components/StoreToggle.tsx"
      provides: "Store toggle component"
      min_lines: 20
    - path: "apps/customer-app/src/screens/storefront/StorefrontScreen.tsx"
      provides: "Main storefront screen"
      min_lines: 50
    - path: "apps/customer-app/src/screens/storefront/ProductDetailScreen.tsx"
      provides: "Product detail view"
    - path: "apps/customer-app/src/navigation/AppNavigator.tsx"
      provides: "Navigation structure"
      contains: "NavigationContainer"
  key_links:
    - from: "apps/customer-app/src/screens/storefront/StorefrontScreen.tsx"
      to: "apps/api/products"
      via: "fetch products from API with storeType filter"
    - from: "apps/customer-app/src/components/StoreToggle.tsx"
      to: "apps/customer-app/src/screens/storefront/StorefrontScreen.tsx"
      via: "onChange handler"
---

<objective>
Build the first half of the customer mobile app — storefront toggle, product browsing, product details, and auth screens.

Purpose: Deliver the core shopping experience — switching between 3 organic stores, browsing products, and seeing details.
Output: Expo React Native app with auth, storefront toggle, category browsing, product listing, and product detail screens.
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
</context>

<ui_reference>
MANDATORY: Open next360-home-preview.html (project root) in a browser before writing any UI code.
This is the locked pixel-perfect reference for ALL Customer App screens.

Design tokens (must match exactly):
  Base bg: #F7F3EA | Text: #1C1B17 | Brass: #C9A66B
  Organic accent: #5C6B4D | Natural: #9B6A3F | Eco: #2F5D62
  Display font: Fraunces (serif) | Body: Inter | Utility: JetBrains Mono
  Card radius: 18px | Pill radius: 999px

Key UI rules:
  - Category switcher = tactile material swatch pills (NOT a tab bar), 200-250ms crossfade on switch
  - Nav = floating pill-shaped bottom bar with 4 items: Home, Products, Fav, Orders
  - Product card tap = opens @gorhom/bottom-sheet at 45% (quick-add), NOT a new screen
  - "View full details" inside sheet = expands to 90% (never navigates away)
  - Inline [+] on card = add 1 unit directly, no sheet (repeat-buyer speed path)
  - Only accent/accentTint/cardBorder change per category — bg, text, brass NEVER change
  - Cart, Checkout, Order Tracking, Profile screens do NOT re-theme (cart spans categories)
  - Zone check screen: graceful block for users outside Hyderabad/Vijayawada service area
</ui_reference>

<tasks>

<task type="auto">
  <name>Task 1: Scaffold Expo app + auth screens + navigation + shared types + API client</name>
  <files>
    apps/customer-app/package.json
    apps/customer-app/tsconfig.json
    apps/customer-app/app.json
    apps/customer-app/App.tsx
    apps/customer-app/babel.config.js
    apps/customer-app/src/navigation/AppNavigator.tsx
    apps/customer-app/src/lib/api.ts
    apps/customer-app/src/lib/auth.tsx
    apps/customer-app/src/lib/store.ts
    apps/customer-app/src/types/index.ts
    apps/customer-app/src/screens/auth/LoginScreen.tsx
    apps/customer-app/src/screens/auth/SignupScreen.tsx
  </files>
  <action>
    Scaffold the Expo customer app with navigation, auth, and API client:

    1. Create Expo project:
       ```
       cd apps && npx create-expo-app@latest customer-app --template blank-typescript
       ```
       
    2. Install dependencies:
       - @react-navigation/native, @react-navigation/bottom-tabs, @react-navigation/native-stack
       - react-native-screens, react-native-safe-area-context
       - @supabase/supabase-js (for direct auth from mobile)
       - expo-secure-store (for token storage)
       - react-native-toast-message (for toasts)
       - react-native-vector-icons or @expo/vector-icons

    3. Configure app.json:
       - App name: "Next360" (or configurable)
       - Scheme: next360
       - Splash screen config
       - Platform settings for iOS/Android

    4. Create src/types/index.ts:
       - Same interface types as vendor dashboard (reuse from @next360/shared-types if possible, otherwise duplicate)
       - Product, Category, User, StoreType enums, CartItem, Address, Order types

    5. Create src/lib/api.ts:
       - Axios or fetch-based API client
       - Base URL from env: EXPO_PUBLIC_API_URL
       - Auto-attach Authorization: Bearer token from SecureStore
       - Methods for: auth (login, signup, getMe), products (list, get), categories (list), cart (get, add, update, remove), addresses (CRUD), orders (create, list, get)

    6. Create src/lib/auth.tsx:
       - AuthContext with provider wrapping the entire app
       - On mount: check expo-secure-store for token, validate via /auth/me
       - signIn(email, password): calls API login, stores token in SecureStore
       - signUp(email, password, name): calls API signup, stores token
       - signOut(): clears token, navigates to login
       - Exposes: user, isAuthenticated, isLoading

    7. Create src/lib/store.ts:
       - StoreType context: currently selected store type (ORGANIC | NATURAL | ECO_FRIENDLY)
       - Persists to AsyncStorage
       - Components consume this to filter products

    8. Create navigation:
       - AppNavigator.tsx: conditional rendering based on auth state
       - AuthStack: LoginScreen, SignupScreen
       - MainTabs: Bottom tab navigation with tabs:
         - Home (storefront)
         - Cart (placeholder for Part 2)
         - Profile (placeholder for Part 2)
       - StorefrontStack: StorefrontScreen → ProductListScreen → ProductDetailScreen

    9. Auth screens:
       - LoginScreen: email + password + "Sign In" button + "Create Account" link
         - "Sign in with OTP" button (calls supabase magic link if implementing)
         - Error handling with toast
         - Loading state
         - Keyboard-aware scroll view
       - SignupScreen: name + email + password + confirm password + "Create Account" button
         - Role selection? (defaults to CUSTOMER)
         - Phone optional
         - Loading state
         - On success, auto-login and navigate to storefront

    10. App.tsx: wraps with AuthProvider, NavigationContainer, Toast
  </action>
  <verify>
    Check App.tsx exists and wraps with AuthProvider + NavigationContainer.
    Check AppNavigator.tsx has conditional auth/main stacks.
    Check auth screens render email/password inputs.
  </verify>
  <done>
    Expo customer app scaffolded with auth, navigation, store toggle context, and API client.
  </done>
</task>

<task type="auto">
  <name>Task 2: Storefront screen with store toggle + product listing + category filter + product detail</name>
  <files>
    apps/customer-app/src/screens/storefront/StorefrontScreen.tsx
    apps/customer-app/src/screens/storefront/ProductListScreen.tsx
    apps/customer-app/src/screens/storefront/ProductDetailScreen.tsx
    apps/customer-app/src/components/StoreToggle.tsx
    apps/customer-app/src/components/ProductCard.tsx
    apps/customer-app/src/components/CategoryChip.tsx
    apps/customer-app/src/components/LoadingSkeleton.tsx
    apps/customer-app/src/components/EmptyState.tsx
  </files>
  <action>
    Build storefront UI with store toggle, product browsing, and product detail:

    1. StoreToggle component:
       - Three pill-buttons: "Organic" | "Natural" | "Eco-friendly"
       - Active one is filled/highlighted, others are outlined
       - Each has a small icon/emoji for visual distinction
       - Animated smooth horizontal scroll on small screens
       - On change: updates StoreType context, refreshes products

    2. StorefrontScreen (main landing screen):
       - Header: App logo/name + greeting (e.g., "Good morning, User!")
       - StoreToggle at top (always visible)
       - Category chips (horizontal scroll): "All" + categories for selected store
         - CategoryChip component: pill with icon + name
         - Tapping a chip filters products by that category
       - Product grid: 2-column flat list
         - Pull-to-refresh
         - Infinite scroll pagination (load more on reach end)
         - Each item: ProductCard component
         - Loading skeleton placeholders while fetching
         - Empty state illustration when no products match filter
       - Floating search icon → navigates to search (future feature, show coming soon)

    3. ProductCard component:
       - Product image (square, aspect ratio 1:1, rounded corners)
       - Product name (max 2 lines)
       - Price (formatted INR)
       - Compare-at price strikethrough if on sale
       - Unit label (e.g., "per kg", "per dozen")
       - Favorite/heart icon (placeholder for wishlist)
       - Tap → navigate to ProductDetailScreen

    4. ProductListScreen (when navigating from category/featured):
       - Title: Category name
       - Same grid layout
       - Sort dropdown: "Price: Low to High", "Price: High to Low", "Newest"
       - Filter results by price range (future: modal with min/max inputs)

    5. ProductDetailScreen:
       - Hero image (full-width, with pagination dots for multiple images)
       - Back button
       - Product name (large font)
       - Rating/reviews row (placeholder for future)
       - Price display with compare-at price
       - Unit info
       - Description section (expandable)
       - Category badge
       - Vendor name (tappable → future vendor page)
       - Quantity selector (minus/plus buttons, min 1)
       - "Add to Cart" button (large, prominent, brand color)
         - If already in cart, shows "Update Cart" with current quantity
       - Stock indicator: "In Stock (X available)" or "Out of Stock" (disabled button)
       - Loading state: skeleton loader
       - Error state: retry button
    
    6. Design approach:
       - Clean, modern UI with organic/green theme
       - White background, green accents for Organic, teal for Natural, brown for Eco-friendly
       - Safe area insets respected
       - iOS large titles where appropriate
       - Tab bar with custom active styling

    7. Use @expo/vector-icons (Ionicons or MaterialCommunityIcons) for icons
  </action>
  <verify>
    Check StoreToggle.tsx has 3 store options.
    Check StorefrontScreen.tsx has category chips + 2-column product grid.
    Check ProductDetailScreen.tsx has image, name, price, add to cart button.
  </verify>
  <done>
    Customer storefront with store toggle, category browsing, product grid, and product detail screen is complete.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Customer mobile app — storefront + browsing + auth</what-built>
  <how-to-verify>
    1. Start the app:
       ```
       cd apps/customer-app && npx expo start
       ```
    2. Open on device/simulator via Expo Go
    3. See the auth screen (login/signup)
    4. Create an account or log in
    5. After login, see the storefront with 3 store toggle buttons
    6. Tap "Organic" → see products filtered for organic store
    7. Tap a category chip → products filtered by that category
    8. Tap a product → see product detail with image, price, description
    9. Verify pull-to-refresh works on product list
    10. Verify infinite scroll loads more products
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
1. Auth flow (signup → login → token persistence) works
2. Store toggle correctly filters products by store type
3. Category chips filter products
4. Product detail screen loads and displays correctly
5. Pull-to-refresh and infinite scroll work
6. Loading/empty/error states display appropriately
</verification>

<success_criteria>
- Customer can browse products across 3 storefronts
- Category filtering works
- Product detail with Add to Cart button renders
- Auth works end-to-end
- Ready for Part 2 (Cart + Checkout + Profile)
</success_criteria>

<output>
After completion, create `.planning/phases/05-customer-app-a/05-customer-app-a-06-SUMMARY.md`
</output>
