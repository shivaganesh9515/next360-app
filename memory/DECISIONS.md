# Important Implementation Decisions

> **Last updated:** 2026-08-08

---

## Deployment Strategy Decision (2026-08-08)

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| 36 | **Railway for initial deployment** | Free $5 credit, never sleeps, easy Docker support | Render (sleeps after 15 min - risky for Play Store), Fly.io (good but less familiar), VPS (more setup) |
| 37 | **Migrate to AWS later when scaling** | Industry standard, better at scale, more services | Stay on Railway forever (limited at scale), GCP (less India presence), Azure (more complex) |
| 38 | **Use Supabase for DB + Auth + Realtime** | Already integrated, free tier sufficient | Firebase (Google lock-in), AWS RDS (overkill for now), MongoDB (different paradigm) |
| 39 | **Customer App first, Delivery App second** | Main revenue app, faster time to market | Launch both together (slower, more risk) |

---

## Deployment Architecture

### Phase 1: Railway (Now - Testing & Launch)

| Component | Platform | Cost |
|-----------|----------|------|
| **API (NestJS)** | Railway | $0 (free credit) → $5-20/month |
| **Database (Postgres)** | Supabase | $0 (free tier) |
| **Auth** | Supabase | $0 (free tier) |
| **Realtime** | Supabase | $0 (free tier) |
| **Storage** | Supabase | $0 (free tier) |
| **Redis** | Railway | $0 (included) |
| **Total** | | **$0-20/month** |

### Phase 2: AWS (Later - Scale When Revenue Comes)

| Component | Platform | Cost |
|-----------|----------|------|
| **API (NestJS)** | ECS Fargate | $20-50/month |
| **Database (Postgres)** | RDS or Supabase Pro | $25-50/month |
| **Auth** | Supabase or Cognito | $0-50/month |
| **Cache** | ElastiCache | $15-30/month |
| **Storage** | S3 | $5-10/month |
| **CDN** | CloudFront | $5-20/month |
| **Total** | | **$70-200/month** |

---

## Why Railway First

| Reason | Explanation |
|--------|-------------|
| **Free credit** | $5/month free — enough for testing |
| **Never sleeps** | Always available for Play Store reviewers |
| **Docker support** | Your Dockerfile works out of box |
| **Easy setup** | Detects railway.toml automatically |
| **Quick deploy** | 5 minutes to deploy |
| **Logs** | Easy to debug issues |
| **Migration path** | Same Dockerfile works on AWS later |

---

## Why Migrate to AWS Later

| Reason | Explanation |
|--------|-------------|
| **Scale** | AWS handles millions of users |
| **Services** | Lambda, SQS, SNS, CloudWatch, etc. |
| **Cost at scale** | Cheaper than Railway at high traffic |
| **Compliance** | Better for enterprise customers |
| **Flexibility** | More control over infrastructure |
| **India presence** | Mumbai region for low latency |

---

## Migration Checklist (Future)

When ready to migrate from Railway to AWS:

- [ ] Create AWS account
- [ ] Set up ECS Fargate cluster
- [ ] Create RDS PostgreSQL instance
- [ ] Set up ElastiCache Redis
- [ ] Configure S3 for file storage
- [ ] Set up CloudFront CDN
- [ ] Update DNS to point to AWS
- [ ] Test all endpoints
- [ ] Monitor for 1 week
- [ ] Decommission Railway

---

## Store Compliance Decisions (2026-08-08)

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| 26 | Remove all debug console.log statements | Google Play rejects apps with debug logs visible | Keep logs with __DEV__ check (still visible to reviewers) |
| 27 | Remove push token logging | Security risk — tokens leaked to console | Log only in __DEV__ (still risky in staging builds) |
| 28 | Add production URL validation | Prevent app from running with localhost in production | Silent fallback (confusing for users) |
| 29 | Add Supabase config validation | Prevent app from running with placeholder credentials | Silent failure (auth breaks without warning) |
| 30 | Create legal screens for delivery app | Both stores require privacy policy and terms | Skip delivery app (can't publish) |
| 31 | Add account deletion to delivery app | Google Play requires account deletion capability | Skip (rejection guaranteed) |
| 32 | Add iOS Privacy Manifest | Apple requires privacy manifest since 2024 | Skip (iOS submission blocked) |
| 33 | Standardize Android package name | Consistency with iOS bundle identifier | Keep different names (confusing for users) |
| 34 | Document empty catch blocks | Code clarity, better maintainability | Leave empty (code smell) |

---

## Previous Decisions

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

---

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

---

## Security Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| S1 | Use SecureStore for auth tokens | Native encryption, not AsyncStorage |
| S2 | Remove all console.log in production | Prevent info leakage to users/reviewers |
| S3 | Add URL validation in production | Fail fast if config missing |
| S4 | Add iOS Privacy Manifest | Apple requirement since 2024 |
| S5 | Document empty catch blocks | Code clarity, prevent silent failures |
