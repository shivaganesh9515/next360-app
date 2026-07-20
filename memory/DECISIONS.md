# Important Implementation Decisions

> **Last updated:** 2026-07-20

---

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| 1 | Turborepo monorepo | Single repo, shared types, parallel builds | Nx (complex), standalone repos (harder to manage) |
| 2 | NestJS backend | TypeScript-native, modular, good RBAC | Express (too minimal), Fastify (less ecosystem) |
| 3 | Expo for mobile | Cross-platform, fast iteration, OTA updates | React Native CLI (slower setup), Flutter (different stack) |
| 4 | Supabase (Postgres + Auth + Storage + Realtime) | All-in-one BaaS, avoids Firebase lock-in | Firebase (Google lock-in), AWS Amplify (complex) |
| 5 | Prisma ORM | Type-safe, good DX, works with Supabase | TypeORM (weird API), Drizzle (newer, less proven) |
| 6 | Razorpay | India-focused, supports Route vendor split | Stripe (not India-optimized), PayU (fewer features) |
| 7 | 3 storefronts (Organic/Natural/Eco) | Products filtered by storeType from vendor | Single store (less differentiated), per-vendor theming (complex) |
| 8 | Multi-vendor split (OrderVendorGroup) | Swiggy/Zomato cart-split model | Single-vendor (not scalable), per-item split (complex) |
| 9 | In-house delivery fleet + partner app | OTP-verified pickup/dropoff | Third-party delivery (less control), self-delivery only (limited) |
| 10 | OpenAI + Gemini | AI chat, scanner, recommendations, health | OpenAI only (vendor lock-in), no AI (missed opportunity) |
| 11 | React Navigation (Customer) vs Expo Router (Delivery) | Stack+tabs vs file-based routing | Expo Router for both (less flexible for complex nav), React Nav for both (more boilerplate for Delivery) |
| 12 | Bottom sheet for product detail | Never navigate away from list | Full-screen PDP (navigation overhead), modal (less discoverable) |
| 13 | Manual-first MVP | Admin-gated approval, no automation | Full automation (risky), hybrid (complex) |
| 14 | Zone-gated launch | MVP only Hyderabad + Vijayawada | Pan-India launch (too risky), single city (too limited) |
| 15 | Text-first API client (not response.json()) | Prevents HTML errors crashing parser | response.json() (crashes on HTML), axios (extra dependency) |
| 16 | White bg, Fraunces serif, JetBrains Mono | Earthy, ultra-premium design | Default cream bg (generic), sans-only (lacks character) |
| 17 | Cart never re-themes | A cart can span multiple categories | Re-themed cart (confusing), separate carts per category (complex) |
| 18 | Category swatch selector (NOT tab bar) | Tactile material swatches, not tabs | Tab bar (generic), dropdown (less tactile) |
| 19 | Floating pill-shaped bottom nav | 4 items: Home, All Products, Favorites, Orders | Standard bottom tabs (boring), sidebar (not mobile-friendly) |
| 20 | Bottom sheet 45%/90% snap points | Quick-add at 45%, full details at 90% | Single snap (too rigid), three snaps (over-engineered) |
| 21 | Delivery app: sans-only, no Fraunces | Speed-of-glance over visual richness | Same design as customer (slower for partners), all-serif (hard to read) |
| 22 | Response envelope: { success, data, meta } | Consistent API format across all endpoints | Raw response (inconsistent), wrapped only on errors (confusing) |
| 23 | Global exception filter | Consistent error format, Prisma error mapping | Per-controller error handling (duplication), no mapping (raw Prisma errors) |
| 24 | @Roles() decorator + RolesGuard | Declarative RBAC on controllers/methods | Inline role checks (scattered), middleware-only (less granular) |
| 25 | Zustand for state management | Lightweight, simple, no boilerplate | Redux (too much boilerplate), Context (performance issues) |

## Design Token Decisions

| Token | Value | Usage |
|-------|-------|-------|
| Display font | Fraunces (slab serif) | Category names, hero text, prices |
| Body font | Inter / General Sans | Body copy, descriptions |
| Utility font | JetBrains Mono | Weights, units, order IDs |
| Background | #FFFFFF | White - fixed across all categories |
| Text | #1C1B17 | Near-black bark - fixed |
| Brass | #C9A66B | Prices, premium badges - fixed |
| Organic accent | #5C6B4D (Moss) | Themed (accent/accentTint/cardBorder only) |
| Natural accent | #9B6A3F (Clay) | Themed |
| Eco accent | #2F5D62 (Eucalyptus) | Themed |
