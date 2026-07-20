# Folder Structure

> **Last updated:** 2026-07-20

---

## Root Structure



---

## Backend - apps/api/ (25 feature modules + prisma/ + common/)

### Existing Modules:
| Module | Description | Owner |
|--------|------------|-------|
| addresses/ | CRUD addresses | Core |
| ai/ | Chat, scan, recommendations | Core |
| auth/ | Supabase + JWT + OTP + RBAC | Core |
| brands/ | CRUD brands w/ storeType filter | Abhinaya |
| cart/ | CRUD cart items | Core |
| categories/ | CRUD categories | Core |
| cms/ | CRUD pages + banners | Abhinaya |
| commission/ | Summary, pay, rates | Core |
| common/ | Filters, guards, interceptors | Core |
| coupons/ | CRUD coupons | Core |
| health/ | Health check | Core |
| kyc/ | Submit, status, verify | Abhinaya |
| notifications/ | Push tokens, list, read | Core |
| offers/ | CRUD offers | Core |
| orders/ | Create, list, status, cancel | Core |
| payments/ | Razorpay order/verify/webhook | Core |
| prisma/ | Prisma service (NestJS wrapper) | Core |
| products/ | CRUD products + variants | Core |
| returns/ | Request, approve/reject | Core |
| reviews/ | Create, get by product | Core |
| roles/ | CRUD roles + permissions | Abhinaya |
| seed/ | Seed data, reset | Core |
| sub-categories/ | CRUD sub-categories | Abhinaya |
| upload/ | Image to Supabase Storage | Core |
| users/ | Profile CRUD | Core |
| vendors/ | Register, list, approve | Core |
| wishlist/ | Add/remove/list | Core |

### Missing Modules:| Module | Owner | Status |
|--------|-------|--------|
| delivery-partners/ | Srinitha | Pending |
| zones/ | Srinitha | Pending |
| disputes/ | Srinitha | Pending |
| inventory/ | Harshitha | Pending |
| Razorpay Route payouts | Harshitha | Pending |

---

## Frontend - Customer App (apps/customer-app/)
**Stack:** Expo SDK 56, React Native 0.85, React Navigation, Zustand
**Port:** 8081

| Directory | Key Files |
|-----------|-----------|
| src/components/ | 30+ components (ProductCard, QuantityStepper, etc.) |
| src/constants/ | theme.ts (design tokens), zones.ts |
| src/lib/ | api.ts, auth.tsx, store.tsx, supabase.ts, etc. |
| src/navigation/ | AppNavigator.tsx (stack + tabs) |
| src/screens/ai/ | Assistant, ChatHistory, HealthInsights, Scanner, Recommendations |
| src/screens/auth/ | Login, Signup, VerificationCode, ForgotPassword, ResetPassword |
| src/screens/cart/ | CartScreen, CheckoutScreen, OrderConfirmationScreen |
| src/screens/home/ | HomeScreen |
| src/screens/onboarding/ | SplashScreen, OnboardingScreen |
| src/screens/profile/ | Profile, OrderHistory, OrderDetail, OrderTracking, Addresses |
| src/screens/search/ | SearchScreen |
| src/screens/storefront/ | ProductListScreen |
| src/screens/wishlist/ | WishlistScreen |

---

## Frontend - Delivery App (apps/delivery-app/)
**Stack:** Expo SDK 56, Expo Router, Zustand
**Port:** 8082

| Route | Purpose |
|-------|---------|
| (auth)/login.tsx | Phone OTP login |
| (tabs)/index.tsx | Home/Availability Toggle |
| (tabs)/earnings.tsx | Today/Week/Month tabs |
| (tabs)/history.tsx | Delivery history |
| (tabs)/profile.tsx | Profile |
| delivery/[id].tsx | Active delivery screen |

---

## Frontend - Vendor Dashboard (apps/vendor-dashboard/)
**Stack:** Next.js 14, App Router, Tailwind CSS, recharts
**Port:** 3001

25 pages across 14 routes.

---

## Frontend - Admin Panel (apps/admin-panel/)
**Stack:** Next.js 14, App Router, Tailwind CSS
**Port:** 3002

38 pages across 24 routes.

---

## Database - prisma/
- schema.prisma - 541 lines, 20+ models
- seed.ts - Seed script
- migrations/20260714132826_init/ - Initial migration

## Shared - packages/
- packages/shared/ - Shared types, constants, utilities
- packages/eslint-config/ - ESLint configuration
- packages/tsconfig/ - TypeScript configurations

## Important Ports
| App | Port |
|-----|------|
| API (NestJS) | 4000 |
| Customer App (Expo) | 8081 |
| Delivery App (Expo) | 8082 |
| Vendor Dashboard (Next.js) | 3001 |
| Admin Panel (Next.js) | 3002 |
