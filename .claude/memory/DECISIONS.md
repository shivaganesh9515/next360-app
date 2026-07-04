# Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Turborepo monorepo** | Single repo for 5 apps, shared types, parallel builds |
| 2 | **NestJS backend** | TypeScript-native, modular, good for complex RBAC |
| 3 | **Expo for mobile** | Cross-platform, fast iteration, OTA updates |
| 4 | **Supabase (Postgres + Auth + Storage + Realtime)** | All-in-one BaaS, avoids Firebase lock-in |
| 5 | **Prisma ORM** | Type-safe, good DX, works with Supabase Postgres |
| 6 | **Razorpay** | India-focused, supports Route (vendor split payouts) |
| 7 | **3 storefronts (Organic/Natural/Eco)** | Products filtered by `storeType` inherited from vendor |
| 8 | **Multi-vendor split** | Order → OrderVendorGroup[] — Swiggy/Zomato cart-split model |
| 9 | **In-house delivery fleet + partner app** | Delivery app with OTP-verified pickup/dropoff |
| 10 | **OpenAI + Gemini** | AI chat, product scanner (vision), recommendations, health insights |
| 11 | **Action-oriented dashboards** | Admin: Pending Actions Queue. Vendor: "What To Do Now". No vanity KPIs. |
| 12 | **Centralized API clients** | `adminApi` + `vendorApi` in `lib/api.ts`, both use `response.text() → JSON.parse()` |
| 13 | **React Navigation (Customer) vs Expo Router (Delivery)** | Customer uses stack+tabs navigation. Delivery uses file-based routing. |
| 14 | **Bottom sheet for product detail** | Customer app never navigates away from list — uses @gorhom/bottom-sheet |
| 15 | **Manual-first MVP** | Vendor/product approval is admin-gated, not automated at launch |
| 16 | **Zone-gated launch** | MVP restricted to Hyderabad + Vijayawada only |

## Design Token Decisions
| Token | Value | Why |
|-------|-------|-----|
| Background | `#F7F3EA` (Raw Cotton) | Fixed across all categories — not re-themed per storefront |
| Text | `#1C1B17` (Near-black bark) | High contrast, earthy feel |
| Brass accent | `#C9A66B` | Prices, premium badges — fixed across categories |
| Display font | Fraunces (slab serif) | Category names, hero text, prices |
| Body font | Inter | Body copy, descriptions |
| Utility font | JetBrains Mono | Weights, units, order IDs |
| Organic accent | `#5C6B4D` (Moss) | Only accent, tint, border swap per category |
| Natural accent | `#9B6A3F` (Clay) | |
| Eco accent | `#2F5D62` (Eucalyptus) | |
| Admin panel | `#1E293B` (blue-gray) | slate-* palette for consistency |
| Delivery app | `#10B981` (green) | sans-only, no Fraunces |
