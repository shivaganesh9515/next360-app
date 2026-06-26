# Next360 — Organic Marketplace Platform

## Project Overview
Multi-vendor organic/natural/eco-friendly marketplace with 3 storefronts (Organic, Natural, Eco-friendly). **136 screens** across 4 apps + NestJS backend. **3-person team, 3-month delivery.**

## Team & Apps
| Person | Responsibility | Platform | Tech | Screens |
|--------|--------------|----------|------|---------|
| **You** | Customer App + Delivery App | **Mobile** | Expo (React Native) | **69 screens** |
| Person 2 | Vendor Dashboard | **Web** | Next.js 14+ (App Router) | **32 screens** |
| Person 3 | Admin Panel | **Web** | Next.js 14+ (App Router) | **35 screens** |

## Tech Stack
### Backend (NestJS + TypeScript)
| Layer | Technology |
|-------|-----------|
| Framework | NestJS v10+ (Express) |
| Database | Supabase Postgres |
| ORM | Prisma v5+ |
| Auth | Supabase Auth + Passport JWT |
| Payments | Razorpay (India-focused) |
| Storage | Supabase Storage |
| Real-time | Supabase Realtime |
| AI | OpenAI / Gemini API |
| Validation | class-validator + class-transformer |
| Push | Expo Push API |

### Frontend
| Expo Mobile (Customer + Delivery) | Next.js Web (Vendor + Admin) |
|-----------------------------------|------------------------------|
| React Navigation (stack + tabs) | Next.js 14 App Router |
| Zustand (state management) | Tailwind CSS |
| expo-secure-store (tokens) | shadcn/ui components |
| expo-camera (scanner) | recharts (charts) |
| react-native-maps | lucide-react (icons) |
| @supabase/supabase-js | @supabase/supabase-js |

## Architecture
```
next360-app/
├── apps/
│   ├── api/              # NestJS backend (port 4000)
│   ├── customer-app/     # Expo Customer App (port 8081)
│   ├── delivery-app/     # Expo Delivery App (port 8082)
│   ├── vendor-dashboard/ # Next.js Vendor Dashboard (port 3001)
│   └── admin-panel/      # Next.js Admin Panel (port 3002)
├── packages/
│   └── shared/           # Shared types, constants, utilities
├── prisma/
│   └── schema.prisma     # Database schema (20+ models)
├── .planning/            # Planning docs, phases, sprints
├── CLAUDE.md             # ← YOU ARE HERE
└── turbo.json            # Turborepo pipeline
```

## Backend API (20+ NestJS Modules)
```
auth/          → POST signup, login, verify-otp, forgot-password, reset-password | GET me  
users/         → GET/PATCH me | GET users (admin) | PATCH role/status  
kyc/           → POST submit (documents) | GET status | PATCH verify (admin)  
categories/    → CRUD with storeType filter  
sub-categories/→ CRUD nested under categories  
brands/        → CRUD with storeType filter  
vendors/       → POST register | GET list | PATCH approve | PATCH profile  
products/      → CRUD with search/filter/pagination | variants sub-resource  
cart/          → POST/GET/PATCH/DELETE items with stock validation  
wishlist/      → POST/DELETE items | GET list  
reviews/       → POST create | GET by product with avg rating  
addresses/     → CRUD with default toggle  
orders/        → POST create (from cart) | GET list | PATCH status | POST cancel  
payments/      → POST razorpay-order | POST verify | POST webhook  
commission/    → GET summary | PATCH pay | PATCH vendor-rate  
coupons/       → CRUD with validation (code, type, min order, expiry)  
offers/        → CRUD with date range, storeType  
returns/       → POST request | PATCH approve/reject  
inventory/     → GET stock | PATCH update | GET low-stock  
upload/        → POST image (multipart → Supabase Storage)  
notifications/ → POST register-token | GET list | PATCH read  
ai/            → POST chat | POST scan (image→vision) | GET recommendations | GET health-insights  
cms/           → CRUD pages | CRUD banners  
roles/         → CRUD roles with JSON permissions | CRUD permissions  
seed/          → POST seed-demo-data | POST reset (admin only)  
```

### API Response Format
```json
// Success
{ "success": true, "data": { ... }, "meta": { "timestamp": "...", "requestId": "uuid" } }
// Paginated
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
// Error
{ "statusCode": 400, "message": "Validation failed", "error": "BAD_REQUEST", "timestamp": "...", "path": "/api/products", "requestId": "uuid" }
```

### Prisma Error → HTTP Mapping
| Prisma Error | HTTP | Use Case |
|-------------|------|----------|
| P2002 | 409 | Duplicate email/phone/coupon code |
| P2025 | 404 | Record not found |
| P2003 | 400 | Foreign key violation |

## Business Rules
- **3 Storefronts:** Products filtered by `storeType` (ORGANIC/NATURAL/ECO_FRIENDLY) — inherited from vendor
- **Order Status Machine:** PLACED → CONFIRMED → PACKED → ASSIGNED_TO_DELIVERY → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED → CANCELLED → REFUNDED
- **Auth Roles:** CUSTOMER | VENDOR | DELIVERY_PARTNER | ADMIN (enforced via @Roles() decorator)
- **Commission:** Per-vendor configurable rate (default 15%), calculated on order placement
- **KYC:** Required for vendors and delivery partners before they can operate
- **Cart:** Unique per (userId + productId), stock-capped, cleared on order placement
- **Payments:** Razorpay for India (INR), COD fallback (capped at ₹2,000 per order) — webhook verifies server-side
- **Razorpay Route:** Funds land in platform account → auto-split payout to each vendor's linked Razorpay account based on subtotal minus commissionPct. Delivery partner payouts are separate (per-delivery fee, batched weekly — NOT through Route)
- **Multi-Vendor Split:** One Order → multiple `OrderVendorGroup` records (one per vendor). Each group is tracked, fulfilled, and delivered independently (Swiggy/Zomato cart-split model)
- **Zone-Gated Launch:** MVP restricted to Hyderabad and Vijayawada only. Outside-zone users get a graceful block screen
- **Manual-First MVP:** Vendor approval, product approval, and order confirmation are admin/vendor-gated — no automation at launch
- **Real-Time Tracking:** Delivery partner app pushes lat/lng periodically → Supabase Realtime relays to customer app. No polling (protects mobile battery)

## Database Models (Prisma)
**Core:** User, Vendor, Zone, Category, SubCategory, Brand, Product, ProductVariant, CartItem, WishlistItem, Review, Address  
**Orders:** Order, OrderVendorGroup, OrderItem, DeliveryAssignment, Payment, ReturnRequest  
**Finance:** Commission, Payout  
**Engagement:** Coupon, Offer, Notification, PushToken  
**AI:** AI_Log, AI_Recommendation  
**Admin:** CMS_Page, Banner, Role, Permission  
**Compliance:** KYC  

### Key Schema Patterns
**Zone model** — every Vendor and DeliveryPartner belongs to a Zone; orders are zone-scoped at MVP.

**OrderVendorGroup** — the single most critical pattern. Links one Order to one vendor's portion:
```
Order → OrderVendorGroup[] → OrderItem[]
                           → DeliveryAssignment (one per group, not per order)
```
Each `OrderVendorGroup` has its own `status` (tracks that vendor's fulfilment independently).

**DeliveryAssignment** — includes `otp` (verified on pickup), `pickedUpAt`, `deliveredAt` timestamps.

**DeliveryPartner** — tracks `currentLat`/`currentLng` (updated periodically for live tracking) and `status` (OFFLINE / AVAILABLE / ON_DELIVERY).

## 3-Month Sprint Plan
### Sprint 1 (Month 1) — Foundation + APIs + App Scaffolds
- **Person 2:** Monorepo + NestJS + Prisma + Core APIs (Categories, Brands, Products, Vendors, Orders, Payments) + scaffold Vendor Dashboard
- **Person 3:** Auth module (Supabase + JWT + RBAC + OTP + KYC) + Core APIs (Cart, Addresses, Wishlist, Reviews, Coupons, Offers, Returns, CMS, Roles) + scaffold Admin Panel
- **You:** Scaffold both Expo apps (navigation, auth screens, API clients, 30+ reusable components)

### Sprint 2 (Month 2) — All Apps in Parallel
- **You:** **Customer App — 43 screens** (onboarding → storefront → cart → checkout → orders → profile → settings)
- **Person 2:** **Vendor Dashboard — 32 pages** (KYC → products → inventory → orders → analytics → earnings → store profile)
- **Person 3:** **Admin Panel — 35 pages** (users → vendors → delivery → products → orders → payments → CMS → roles)

### Sprint 3 (Month 3) — Delivery App + AI + Polish
- **You:** **Delivery App — 26 screens** (auth → KYC → available orders → navigation → active delivery → history → earnings) + **AI — 5 screens** (chat, scanner, recommendations, health insights, history)
- **Person 2:** Error boundaries, loading/empty states, performance optimization, production build
- **Person 3:** Global error handling, rate limiting, CI/CD pipeline, seed data, admin AI screens, deploy

## Key Conventions
- **Monorepo:** Turborepo with `apps/*` and `packages/*` workspaces
- **NestJS:** Feature modules, DTOs with class-validator, guards for RBAC
- **Expo:** Expo SDK 52, React Navigation, Zustand for state, SecureStore for tokens
- **Next.js:** App Router, shadcn/ui, Tailwind CSS, server + client components
- **API Ports:** 4000 (API), 3001 (Vendor), 3002 (Admin), 8081/8082 (Expo dev)
- **All API responses** wrapped in `{ success, data, meta }` envelope
- **All errors** go through global exception filter (consistent format)
- **Auth tokens** stored in SecureStore (Expo) / localStorage (Next.js) — auto-attached to API calls

## Customer App — UI/UX Decisions

### Design Language
Earthy, ultra-premium. NOT the generic AI-default (cream + thin serif + terracotta). Grounded in real organic-farming material.

### Design Tokens
```ts
export const categoryThemes = {
  ORGANIC:     { accent: '#5C6B4D', accentTint: '#EDF0E8', cardBorder: 'rgba(92,107,77,0.3)' },
  NATURAL:     { accent: '#9B6A3F', accentTint: '#F4ECE3', cardBorder: 'rgba(155,106,63,0.3)' },
  ECO_FRIENDLY:{ accent: '#2F5D62', accentTint: '#E7EEEE', cardBorder: 'rgba(47,93,98,0.3)' },
} as const;

export const baseTokens = {
  background: '#F7F3EA', // Raw Cotton — fixed across all categories
  text:       '#1C1B17', // Near-black bark — fixed
  brass:      '#C9A66B', // Prices, premium badges — fixed
};
```

| Token | Value | Usage |
|-------|-------|-------|
| Display font | Fraunces (slab serif) | Category names, hero text, prices |
| Body font | Inter / General Sans | Body copy, descriptions |
| Utility font | JetBrains Mono | Weights, units, order IDs |

### Theming Rule
Only `accent`, `accentTint`, and `cardBorder` swap per category. Background, body text, and brass price accent are always fixed. Cart, Checkout, Order Tracking, Profile — **never re-theme** (a cart can span multiple categories).

### Category Switcher
NOT a tab bar — a tactile **material swatch selector**. Three textured swatches (moss fibre, clay grain, eucalyptus weave) crossfade their accent across the screen in 200–250ms on selection.

### Navigation
Floating pill-shaped bottom nav — 4 items: **Home, All Products, Favorites, Orders**. Search lives in a persistent top bar on Home / All Products / Search Results (not in the nav).

### Product Card → Bottom Sheet (PDP)
Never navigate away from the list. Use `@gorhom/bottom-sheet` with two snap points:
- **45% snap** — quick-add (photo, price, unit, qty stepper, Add to Cart)
- **90% snap** — full details (description, more images, vendor link, reviews)
- Inline `[+]` stepper on the card → adds 1 unit directly, no sheet (repeat-buyer speed path)

### Screen Inventory (Customer App)
| Flow | Screen |
|------|--------|
| Entry & Auth | Splash, Onboarding (3 slides — one per category), Phone Auth (OTP), Zone Check (graceful block if outside service area) |
| Home & Discovery | Home (greeting, search, swatch toggle, banners, curated rows, catalog grid), Category Feed, Search Results, Vendor Storefront |
| Product & Cart | Product Detail (bottom sheet), Cart (grouped by vendor), Empty Cart |
| Checkout & Orders | Address Select/Add, Order Review (per-vendor breakdown), Razorpay Checkout, Order Confirmation, Live Tracking (map + timeline), Order History / Detail / Review |
| Profile | Profile, Addresses, Wishlist, Support, Settings (Telugu/English toggle) |

## Delivery Partner App — UI/UX Decisions

### Design Departure (intentional)
Speed-of-glance over visual richness. Partner is often moving, one-handed, time-pressured.

| Dimension | Customer App | Delivery App |
|-----------|-------------|--------------|
| Typography | Fraunces display serif | Sans-only — reads faster at a glance |
| Color | 3-category re-theming | One fixed palette, no theming |
| Interaction | Bottom sheets, scroll-heavy | Big tap targets, minimal scroll, one primary action per screen |
| Cards | Herbarium, generous whitespace | Dense, info-first, status-color-coded |

### Explicitly Excluded Patterns
- **No bottom sheets** — partner needs full information immediately
- **No category theming** — zero functional payoff
- **No onboarding carousel** — wasted friction
- **No nav during active delivery** — bottom nav disappears entirely while on an active delivery

### Screen Inventory (Delivery App)
| Screen | Purpose |
|--------|---------|
| Splash → Phone OTP | No onboarding — straight to earning |
| Vehicle/Zone Setup | First-time only |
| Home / Availability Toggle | Dominant Online/Offline control + today's glance-stats |
| Incoming Assignment | Full-screen modal, 30-second countdown, Accept/Reject |
| Active Delivery | Map-first; state changes content — never re-navigates |
| Delivery Complete | Brief confirmation, auto-returns to Home |
| Earnings | Today/Week/Month tabs, flat number-first list, no charts |
| History | Same flat-list pattern as Earnings |
| Profile | Name, vehicle, zone, document status, support, logout |

## Vendor Web — Screen Inventory
Operational tool. Fixed sidebar, dense tables, desktop-first. No theming, no Fraunces, no bottom sheets.

**Sidebar:** Dashboard | Orders | Products | Inventory | Payouts | Settings

| Screen | Purpose |
|--------|---------|
| Dashboard | New orders count, revenue today, low-stock alerts, pending payout |
| Orders Queue | Tabs: New / Preparing / Ready / Completed — mirrors `OrderVendorGroup.status` |
| Order Detail | Items, customer zone (not full address), single status-advance action |
| Products | Table: image, name, category, price, stock, active toggle |
| Add/Edit Product | Sets `isApproved: false` on submit — shows "Pending approval" badge |
| Inventory | Stock levels, inline quick-edit, low-stock flagged red |
| Payouts | Razorpay Route payout history — read-only ledger |
| Settings | Business name, GST, zone, Razorpay account linking, password |

## Admin Web — Screen Inventory
Highest information density. Job: gatekeep quality, oversee, resolve disputes. Use shadcn/ui data-table and dialog patterns — density and speed over delight.

**Sidebar:** Dashboard | Vendors | Products | Orders | Delivery Partners | Zones | Payouts | Disputes | Settings

| Screen | Purpose |
|--------|---------|
| Dashboard | Total orders today, GMV, active vendors, pending approvals, partners online |
| Vendor Approvals | Review business details, GST doc → Approve/Reject with stored reason |
| Product Approvals | Queue of `isApproved: false` products — bulk-approve checkbox required from day one |
| All Vendors | Table: name, zone, status, product count, rating, commission % |
| All Products | Cross-vendor catalog view for moderation — admin does not edit product data |
| Orders Oversight | Every order, every vendor — for dispute resolution, not day-to-day fulfilment |
| Delivery Partners | List, status, zone, completed deliveries, rating, document verification |
| Zones | Add/edit/activate zones, delivery radius, COD cap enforcement (₹2,000 rule) |
| Payouts Oversight | All vendor payout batches; manual override/retry for failed Razorpay Route payouts |
| Disputes | Refund requests and complaints linked to specific orders, resolution notes + action |

## Build Phases (6-Phase Sequence)
| Phase | Scope | Unblocks |
|-------|-------|---------|
| 0 | Prisma schema finalized + migrated; shared packages scaffolded | All subsequent work |
| 1 | API core: auth, catalog, cart, order creation (no payment yet) | Vendor onboarding |
| 2 | Vendor Web: onboarding + catalog management | Vendors can list products |
| 3 | Admin Web: vendor approval flow | Phase 2 vendors go live |
| 4 | Customer App: browse → cart → checkout (Razorpay here) | First real orders |
| 5 | Delivery App + assignment module + real-time tracking | End-to-end fulfilment |
| 6 | Notifications (WhatsApp/SMS), reviews, analytics | Retention + post-launch |

## Open Decisions / Risk Register
| # | Item | Action |
|---|------|--------|
| 1 | Razorpay Route vendor KYC flow | Scope as sub-module in Vendor Web Payouts; budget extra time for Razorpay verification turnaround |
| 2 | CI/CD for 5-codebase monorepo | GitHub Actions + Turborepo remote caching before Phase 1 merges pile up |
| 3 | Environment strategy (dev/staging/prod) | Decide before Phase 1; staging needed before Phase 4 (real payments) |
| 4 | Redis for delivery assignment locking | Confirm Upstash Redis or GCP Memorystore before Phase 5 |
| 5 | Wishlist — Phase 4 or Phase 6? | Decision needed |
| 6 | Onboarding photography/illustrations | Confirm asset pipeline before Phase 4 UI build |

## File Structure
```
.planning/               → All planning docs (PROJECT, ROADMAP, STATE, SPRINTS, phase plans)
CLAUDE.md                → This file — project memory for AI agents
next360-home-preview.html → FINAL UI/UX reference — Customer App Home screen (open in browser)
```

## UI Reference
`next360-home-preview.html` is the **final, locked visual reference** for the Customer App. Open it in a browser to see:
- Live category re-theming (All / Organic / Natural / Eco-Friendly swatch toggle)
- Exact design tokens in action (Raw Cotton bg, Fraunces serif, JetBrains Mono, brass prices)
- Floating pill nav, herbarium product cards, banner layout, curated bundle cards

All UI decisions for the Customer App must match or extend this reference. Do not deviate from the token values, font choices, or layout patterns without explicit instruction.
