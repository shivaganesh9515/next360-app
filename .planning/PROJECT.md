# Next360 — Organic Marketplace Platform

## Overview

Multi-vendor organic/natural/eco-friendly marketplace platform with three separate storefronts (Organic, Natural, Eco-friendly) under one app ecosystem. **136 screens** across 4 apps + backend API.

## Platform Components

| App | Platform | Tech | Screens |
|-----|----------|------|--------|
| Customer App | Mobile | Expo (React Native) | 43 |
| Delivery Partner App | Mobile | Expo (React Native) | 26 |
| Vendor Dashboard | Web | Next.js 14+ (App Router) | 32 |
| Admin Panel | Web | Next.js 14+ (App Router) | 35 |
| Backend API | Server | NestJS (TypeScript) | — |

---

## Backend Tech Stack (NestJS)

### Core Framework
| Technology | Purpose | Version |
|------------|---------|---------|
| NestJS | Node.js framework (controllers, modules, providers, guards, interceptors, filters) | v10+ |
| TypeScript | Language (strict mode, decorators) | v5+ |
| Express | HTTP adapter (underlying NestJS platform) | v4 |

### Database & ORM
| Technology | Purpose | Config |
|------------|---------|--------|
| Supabase Postgres | Managed PostgreSQL database | Project-based |
| Prisma | ORM with type-safe client, migrations, schema management | v5+ |
| Prisma Client | Auto-generated query builder with full TypeScript types | Generated from schema |

### Authentication & Authorization
| Technology | Purpose | Endpoints |
|------------|---------|-----------|
| Supabase Auth | Email/password signup, login, OTP, magic link, password reset | Server-side admin client |
| Passport.js + JWT | NestJS PassportModule, JwtModule for token validation | Bearer token strategy |
| RolesGuard | Custom NestJS guard reading @Roles() decorator metadata | Route-level access control |
| @CurrentUser() | Custom parameter decorator extracting JWT payload | Controller injection |

### API Architecture
| Pattern | Implementation |
|---------|---------------|
| Module structure | Feature-based: `auth/`, `users/`, `products/`, `orders/`, `payments/`, etc. |
| DTO validation | class-validator + class-transformer decorators |
| Response envelope | Global interceptor: `{ success, data, meta }` |
| Error handling | Global exception filter: consistent `{ statusCode, message, error, timestamp, path, requestId }` |
| Pagination | Standard `{ data, meta: { page, limit, total, totalPages } }` |
| File upload | Multer middleware + Supabase Storage SDK |

### Modules & Endpoints
| Module | Key Endpoints | Consumed By |
|--------|--------------|-------------|
| **Auth** | POST /auth/signup, /login, /verify-otp, /forgot-password, /reset-password, GET /auth/me | All apps |
| **Users** | GET/PATCH /users/me, GET /users (admin), PATCH /users/:id/role | All apps |
| **KYC** | POST /kyc/submit, GET /kyc/status, PATCH /kyc/:id/verify (admin) | Vendor + Delivery apps |
| **Categories** | CRUD /categories with storeType filter | All apps |
| **SubCategories** | CRUD /categories/:id/subcategories | All apps |
| **Brands** | CRUD /brands with storeType filter | All apps |
| **Vendors** | POST /vendors/register, GET /vendors, PATCH /vendors/:id/approve, PATCH /vendors/:id | Vendor + Admin + Customer apps |
| **Products** | CRUD /products with search/filter/pagination, variants | All apps |
| **Upload** | POST /upload/image (multipart) | Vendor + Admin apps |
| **Wishlist** | GET/POST/DELETE /wishlist | Customer app |
| **Reviews** | POST /reviews, GET /products/:id/reviews | Customer + Admin apps |
| **Cart** | CRUD /cart/items with stock validation | Customer app |
| **Addresses** | CRUD /addresses with default toggle | Customer app |
| **Orders** | POST /orders, GET /orders, PATCH /orders/:id/status, POST /orders/:id/cancel | All apps |
| **Payments** | POST /payments/razorpay/order, POST /payments/verify, POST /payments/webhook | Customer app |
| **Commission** | GET /commission/summary, PATCH /commission/pay | Admin app |
| **Coupons** | CRUD /coupons with validation | Vendor + Admin apps |
| **Offers** | CRUD /offers | Vendor + Admin apps |
| **Returns** | POST /returns, PATCH /returns/:id/status | Customer + Vendor + Admin apps |
| **Notifications** | POST /notifications/register, GET /notifications | All apps |
| **AI** | POST /ai/chat, POST /ai/scan, GET /ai/recommendations, GET /ai/health-insights, GET /ai/admin/logs, GET /ai/admin/analytics | Customer + Admin apps |
| **CMS** | CRUD /cms/pages, CRUD /cms/banners | Admin app |
| **Roles** | CRUD /roles, CRUD /permissions | Admin app |
| **Inventory** | GET /inventory, GET /inventory/low-stock, PATCH /products/:id/stock | Vendor + Admin apps |

### Middleware & Infrastructure
| Feature | Implementation |
|---------|---------------|
| CORS | Enabled with whitelist from env (NEXT_PUBLIC_API_URL origins) |
| Rate limiting | @nestjs/throttler — 10 req/s default, 5 req/min auth, 100 req/min admin |
| Helmet | Security headers middleware |
| Compression | compression middleware for response gzip |
| Request ID | UUID generated per request, logged + returned in response |
| Logging | Global interceptor logging method, URL, status, duration |
| Request size | 1MB limit on JSON bodies, configurable for uploads |

### Integrations
| Service | SDK/Package | Usage |
|---------|-------------|-------|
| Supabase | @supabase/supabase-js | Auth admin client, Storage SDK |
| Razorpay | razorpay npm package | Order creation, payments, refunds, webhooks |
| OpenAI | openai npm package | AI chat, product scan (Vision API), recommendations |
| Google Gemini | @google/generative-ai | Alternative AI provider |
| Expo Push API | HTTPS fetch | Push notifications (Expo Push token) |

### Error Handling Strategy
| Error Type | HTTP Status | Response |
|-----------|-------------|----------|
| Validation errors | 400 | Field-level error messages |
| Auth errors | 401 | Unauthorized — invalid/expired token |
| Permission errors | 403 | Forbidden — insufficient role |
| Not found | 404 | Resource not found with type |
| Conflict | 409 | Duplicate entry (unique constraint) |
| Rate limit | 429 | Too many requests — retry-after header |
| Server error | 500 | Generic message (no internals exposed) |
| Prisma P2002 | 409 | Unique constraint violation |
| Prisma P2025 | 404 | Record not found |
| Prisma P2003 | 400 | Foreign key constraint |

### API Ports
| App | Port |
|-----|------|
| NestJS API | 4000 |
| Vendor Dashboard | 3001 |
| Admin Panel | 3002 |
| Customer App (Expo) | 8081 (dev) |
| Delivery App (Expo) | 8082 (dev) |

---

## Frontend Tech Stack

### Expo Mobile Apps (Customer + Delivery)
| Technology | Purpose |
|------------|---------|
| Expo SDK 52 | React Native framework |
| React Navigation | Navigation (stack, tabs, conditional auth) |
| Zustand | Lightweight state management (cart, auth, delivery) |
| expo-secure-store | Token storage |
| expo-notifications | Push notification handling |
| expo-camera | Product scanner (AI) |
| expo-location | Delivery partner geolocation |
| react-native-maps | Delivery navigation map |
| react-native-reanimated | Animations |
| @supabase/supabase-js | Supabase client (auth from mobile) |

### Next.js Web Apps (Vendor + Admin)
| Technology | Purpose |
|------------|---------|
| Next.js 14+ (App Router) | React framework with server components |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Component library (Button, Card, Table, Dialog, etc.) |
| recharts | Analytics charts (line, bar, pie, donut) |
| lucide-react | Icon library |
| @supabase/supabase-js | Supabase client (auth from web) |
| @supabase/ssr | Server-side auth helpers (Next.js) |

---

## Storefront Toggle

The app features a primary toggle switching between three separate storefronts:
- **Organic** — organic food & grocery products
- **Natural** — natural personal care & wellness products
- **Eco-friendly** — eco-friendly home & lifestyle products

Each storefront has its own vendors, categories, brands, and inventory. Products inherit `store_type` from their vendor.

## Business Model

- **Multi-vendor marketplace**: Vendors list products, platform facilitates orders + delivery
- **Delivery**: In-house fleet + delivery partner app
- **Payments**: Razorpay with platform commission
- **Commission**: Per-vendor configurable rates (default 15%), automated payouts
- **Target market**: India (Razorpay)

---

## Screen Inventory (Total: 136)

### Customer App (43 screens)
| Category | Screens |
|----------|--------|
| **Auth & Onboarding** | Splash, Onboarding, Login, Signup, OTP Verification, Forgot Password |
| **Home & Browse** | Home, Search, Search Results, Categories, Category Products, Product Details, Brands, Brand Details |
| **Storefronts** | Organic Products, Natural Products, Eco-Friendly Products |
| **Shopping** | Wishlist, Cart, Checkout, Address Selection, Add Address, Payment Method, Payment Success |
| **Orders** | My Orders, Order Details, Track Order, Return Request |
| **Engagement** | Notifications, Offers & Coupons |
| **AI Features** | AI Assistant, AI Product Scanner, AI Recommendations, AI Health Insights, AI Chat History |
| **Profile** | Profile, Edit Profile, Saved Addresses, Settings, Help Center, FAQ, Contact Support, About Us, Privacy Policy, Terms & Conditions |

### Vendor Dashboard (32 screens)
| Category | Screens |
|----------|--------|
| **Auth & KYC** | Vendor Login, Vendor Signup, OTP Verification, KYC Verification, Business Details, Bank Details, Approval Pending |
| **Dashboard** | Dashboard |
| **Products** | Products, Add Product, Edit Product, Product Details, Product Variants |
| **Catalog** | Categories, Inventory, Stock Management, Low Stock Alerts |
| **Orders** | Orders, Order Details, Returns |
| **Promotions** | Coupons, Offers |
| **Customers** | Customers |
| **Analytics** | Analytics, Sales Analytics, Revenue Analytics |
| **Finance** | Earnings, Payouts, Transactions |
| **Store** | Store Profile, Edit Store Profile |
| **System** | Notifications, Settings, Support |

### Delivery Partner App (26 screens)
| Category | Screens |
|----------|--------|
| **Auth & KYC** | Splash, Login, Signup, OTP Verification, KYC Verification, Vehicle Details, Bank Details, Approval Pending |
| **Dashboard** | Dashboard |
| **Deliveries** | Available Orders, Order Details, Pickup Details, Delivery Details |
| **Navigation** | Navigation Map, Active Delivery, Delivery Confirmation |
| **History** | Completed Deliveries, Cancelled Deliveries |
| **Finance** | Earnings, Payout History, Incentives |
| **Profile** | Profile, Documents, Vehicle Information |
| **System** | Notifications, Settings, Support |

### Admin Panel (35 screens)
| Category | Screens |
|----------|--------|
| **Dashboard** | Dashboard |
| **Users** | Users, User Details |
| **Vendors** | Vendors, Vendor Approvals, Vendor Details |
| **Delivery** | Delivery Partners, Delivery Partner Approvals, Delivery Partner Details |
| **Catalog** | Products, Add Product, Edit Product, Categories, Sub Categories, Brands |
| **Orders** | Orders, Order Details, Returns, Refunds |
| **Promotions** | Coupons, Offers |
| **Payments** | Payments, Vendor Payouts, Delivery Payouts |
| **Operations** | Inventory, Reviews, Ratings |
| **AI** | AI Scanner Logs, AI Recommendations, AI Analytics |
| **Reports** | Reports, Sales Reports, Revenue Reports |
| **Content** | CMS Pages, Banners, Notifications |
| **Admin** | Roles, Permissions, Settings, System Configuration |
