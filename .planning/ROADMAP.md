# Roadmap — Next360 Organic Marketplace

---

## Phase 1: Foundation ✅

**Goal:** Turborepo monorepo initialized with NestJS backend, Prisma schema for full data model (including new entities), Supabase project connected.

**Requirements:**
- SETUP-01 — Turborepo monorepo with shared TypeScript configs
- SETUP-02 — NestJS app scaffolded with module structure
- SETUP-03 — Supabase project created and connected via Prisma
- SETUP-04 — Full database schema including: Zone, Vendor (with zoneId + razorpayAccountId + VendorStatus), DeliveryPartner (separate model with currentLat/currentLng/status), OrderVendorGroup (multi-vendor split pattern), updated DeliveryAssignment (otp/pickedUpAt/deliveredAt), 9-state OrderStatus enum, plus all other models (brands, wishlist, reviews, coupons, offers, carts, payments, kyc, returns, notifications, ai_logs, cms_pages, roles, permissions)
- SETUP-05 — Prisma migrations run successfully

**Plans:** 1 plan

---

## Phase 2: Authentication & RBAC ✅

**Goal:** User registration/login via Supabase Auth, NestJS validates JWT, full role-based access control (customer, vendor, delivery_partner, admin), OTP verification, forgot password, KYC flows.

**Requirements:**
- AUTH-01 — Supabase Auth integration (email/password, OTP, magic link)
- AUTH-02 — NestJS JWT validation guard
- AUTH-03 — Multi-role system: customer, vendor, delivery_partner, admin
- AUTH-04 — Role-based endpoint protection
- AUTH-05 — Profile management API
- AUTH-06 — OTP verification endpoint (phone + email)
- AUTH-07 — Forgot password / reset password flow
- AUTH-08 — KYC document upload & verification status (vendor + delivery partner)
- AUTH-09 — Approval workflow for vendor/delivery registrations

**Plans:** 1 plan

---

## Phase 3: Core API ✅

**Goal:** Complete CRUD APIs for products, categories, brands, wishlist, reviews, cart, addresses, coupons, offers with store_type filtering.

**Requirements:**
- CORE-01 — Category CRUD (scoped by store_type)
- CORE-02 — Sub-category CRUD
- CORE-03 — Brand CRUD (scoped by store_type)
- CORE-04 — Product CRUD with image upload (Supabase Storage), variants, stock management
- CORE-05 — Product search & filter (by store_type, category, brand, price, rating)
- CORE-06 — Wishlist API (add, remove, list)
- CORE-07 — Reviews & Ratings API (create, list, average rating)
- CORE-08 — Cart API (add, remove, update quantity)
- CORE-09 — Address management API
- CORE-10 — Coupons & Offers API (admin create, customer apply)
- CORE-11 — Vendor profile & product management API
- CORE-12 — Inventory & stock management API (with low stock alerts)
- CORE-13 — Returns/Refunds request API

**Plans:** 2 plans

---

## Phase 4: Vendor Dashboard (Web) ✅

**Goal:** Full Next.js web dashboard for vendors with KYC onboarding, product & inventory management, order management, earnings tracking, and analytics.

**Requirements:**
- VENDOR-01 — Vendor login, signup, OTP verification
- VENDOR-02 — KYC flow (business details, bank details, document upload, approval pending screen)
- VENDOR-03 — Dashboard with key metrics (orders, revenue, products, low stock alerts)
- VENDOR-04 — Product CRUD with image upload, variants, stock management
- VENDOR-05 — Category & inventory management with low stock alerts
- VENDOR-06 — Order listing with status management, order details, returns
- VENDOR-07 — Coupons & offers creation
- VENDOR-08 — Customer list
- VENDOR-09 — Sales & revenue analytics (charts)
- VENDOR-10 — Earnings, payouts history, transactions
- VENDOR-11 — Store profile editing
- VENDOR-12 — Notifications, settings, support

**Plans:** 1 plan

---

## Phase 5: Customer Mobile App — Part A (Storefront & Browsing)

**Goal:** Expo React Native app with storefront toggle, product browsing, search, categories, brands, and product details.

**Requirements:**
- MOBILE-01 — Splash screen & onboarding flow
- MOBILE-02 — Three storefront toggle (Organic/Natural/Eco)
- MOBILE-03 — Home screen with featured products, categories, brands
- MOBILE-04 — Product listing with category/brand/store filter
- MOBILE-05 — Product detail page with image gallery, reviews, variants
- MOBILE-06 — Search with results page
- MOBILE-07 — Categories & brands browsing
- MOBILE-08 — Auth screens (Login, Signup, OTP, Forgot Password)

**Plans:** 1 plan

---

## Phase 6: Customer Mobile App — Part B (Cart, Checkout, Orders, Profile)

**Goal:** Complete customer experience — wishlist, cart, checkout with Razorpay, orders, returns, notifications, offers, profile management.

**Requirements:**
- MOBILE-09 — Wishlist management
- MOBILE-10 — Cart management with coupon application
- MOBILE-11 — Checkout flow (address selection, add address, payment method, Razorpay)
- MOBILE-12 — Payment success screen
- MOBILE-13 — My Orders, Order Details, Track Order
- MOBILE-14 — Return request flow
- MOBILE-15 — Notifications screen
- MOBILE-16 — Offers & Coupons screen
- MOBILE-17 — Profile, Edit Profile, Saved Addresses
- MOBILE-18 — Settings, Help Center, FAQ, Contact Support, About Us, Privacy Policy, Terms & Conditions

**Plans:** 1 plan

---

## Phase 7: AI Features

**Goal:** AI-powered features for the customer app — product scanner, recommendations, health insights, and AI chat assistant.

**Requirements:**
- AI-01 — AI Assistant chat interface (customer app)
- AI-02 — AI Product Scanner (camera-based product identification)
- AI-03 — AI Recommendations (personalized product suggestions)
- AI-04 — AI Health Insights (dietary suggestions based on products)
- AI-05 — AI Chat History
- AI-06 — Admin AI Scanner Logs
- AI-07 — Admin AI Recommendations management
- AI-08 — Admin AI Analytics dashboard

**Plans:** 1 plan

---

## Phase 8: Orders & Payments

**Goal:** Full order lifecycle with multi-vendor split, Razorpay payment + Route payout, commission tracking, returns/refunds.

**Requirements:**
- ORDER-01 — Order creation splits cart into OrderVendorGroup records (one per vendor); COD capped at ₹2,000
- ORDER-02 — 9-state status machine on OrderVendorGroup: PLACED→CONFIRMED→PACKED→ASSIGNED_TO_DELIVERY→PICKED_UP→OUT_FOR_DELIVERY→DELIVERED→CANCELLED→REFUNDED
- ORDER-03 — Razorpay single payment for full order total with Route auto-split to vendor linked accounts
- ORDER-04 — Webhook triggers per-vendor group status updates on payment events
- ORDER-05 — Admin commission calculation & tracking per vendor group
- ORDER-06 — Vendor & Delivery Partner payouts (Razorpay Route for vendors; weekly batch for delivery partners)
- ORDER-07 — Order history & detail API (exposes vendorGroups with items)
- ORDER-08 — Invoice generation
- ORDER-09 — Returns & Refunds management (request, approve, process)
- ORDER-10 — Coupon/Offer application logic

**Plans:** 1 plan

---

## Phase 9: Admin Panel (Web)

**Goal:** Full Next.js admin panel with user/vendor/delivery management, catalog, orders, payments, CMS, roles/permissions, reports, and analytics.

**Requirements:**
- ADMIN-01 — Admin login & protected layout
- ADMIN-02 — User management (list, details, suspend)
- ADMIN-03 — Vendor management (approvals, details, commission rates)
- ADMIN-04 — Delivery partner management (approvals, KYC, documents)
- ADMIN-05 — Product management (CRUD across all vendors)
- ADMIN-06 — Category, Sub-category & Brand management
- ADMIN-07 — Order management across all vendors + returns & refunds
- ADMIN-08 — Coupons & Offers management
- ADMIN-09 — Payments dashboard (vendor payouts, delivery payouts)
- ADMIN-10 — Inventory oversight
- ADMIN-11 — Reviews & Ratings moderation
- ADMIN-12 — AI logs, recommendations, analytics
- ADMIN-13 — Reports (sales, revenue)
- ADMIN-14 — CMS Pages & Banners management
- ADMIN-15 — Push notifications management
- ADMIN-16 — Roles & Permissions management
- ADMIN-17 — Settings & System Configuration

**Plans:** 1 plan

---

## Phase 10: Delivery Partner App (Mobile)

**Goal:** Expo delivery partner app with KYC onboarding, real-time order feed, navigation/maps, earnings, incentives, and delivery management.

**Requirements:**
- DELIVERY-01 — Splash screen, login, signup, OTP verification
- DELIVERY-02 — KYC flow (KYC verification, vehicle details, bank details, approval pending)
- DELIVERY-03 — Dashboard with key stats
- DELIVERY-04 — Available orders listing & acceptance
- DELIVERY-05 — Order detail, pickup details, delivery details
- DELIVERY-06 — Navigation map with turn-by-turn directions
- DELIVERY-07 — Active delivery tracking & delivery confirmation
- DELIVERY-08 — Real-time status updates (picked up, in transit, delivered)
- DELIVERY-09 — Completed & cancelled deliveries history
- DELIVERY-10 — Earnings, payout history, incentives
- DELIVERY-11 — Profile, documents, vehicle information
- DELIVERY-12 — Notifications, settings, support

**Plans:** 1 plan

---

## Phase 11: Polish & Launch

**Goal:** Push notifications, error handling, edge cases, production readiness.

**Requirements:**
- POLISH-01 — Push notifications (customer, vendor, delivery via Expo Push API + FCM)
- POLISH-02 — Error boundaries & graceful error handling across all apps
- POLISH-03 — Loading states & empty states across all apps
- POLISH-04 — Performance optimization (lazy loading, caching, bundle size)
- POLISH-05 — Production deployment configuration
- POLISH-06 — Seed data for all entities (users, vendors, products, orders, etc.)

**Plans:** 1 plan

---

## Summary

| Phase | Plans | Requirements | Status |
|-------|-------|-------------|--------|
| 1 — Foundation | 1 | 5 | ✅ Complete |
| 2 — Auth & RBAC | 1 | 9 | ✅ Complete |
| 3 — Core API | 2 | 13 | ✅ Complete |
| 4 — Vendor Dashboard (Web) | 1 | 12 | ✅ Complete |
| 5 — Customer App A (Storefront) | 1 | 8 | 🔲 Pending |
| 6 — Customer App B (Cart/Profile) | 1 | 10 | 🔲 Pending |
| 7 — AI Features | 1 | 8 | 🔲 Pending |
| 8 — Orders & Payments | 1 | 8 | 🎯 Next |
| 9 — Admin Panel (Web) | 1 | 17 | 🔲 Pending |
| 10 — Delivery App (Mobile) | 1 | 12 | 🔲 Pending |
| 11 — Polish & Launch | 1 | 6 | 🔲 Pending |
| **Total** | **12 plans** | **108 requirements** | **4/11 Complete** |
