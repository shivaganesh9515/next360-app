# Project State

**Status:** Execution in Progress — Phases 1–4, 8 Complete; 5–7, 9–11 Remaining

## Current Phase
- **Active:** Phase 5 — Customer App A (Storefront) (next)
- **Completed:** Phases 1, 2, 3, 4, 8
- **Remaining:** Phases 5, 6, 7, 9, 10, 11

## Phase Status

| Phase | Status | Plans |
|-------|--------|-------|
| 1 — Foundation | ✅ Complete | 01-PLAN.md |
| 2 — Auth & RBAC | ✅ Complete | 02-PLAN.md |
| 3 — Core API (Products, Cart, Orders prep) | ✅ Complete | 03/04-PLAN.md |
| 4 — Vendor Dashboard (Web) | ✅ Complete | 05-PLAN.md |
| 5 — Customer App A (Storefront) | 🎯 Next | 06-PLAN.md |
| 6 — Customer App B (Cart/Profile) | 🔲 Not Started | 07-PLAN.md |
| 7 — AI Features | 🔲 Not Started | 11-PLAN.md |
| 8 — Orders & Payments | ✅ Complete | 08-PLAN.md |
| 9 — Admin Panel (Web) | 🔲 Not Started | 09-PLAN.md |
| 10 — Delivery App (Mobile) | 🔲 Not Started | 10-PLAN.md |
| 11 — Polish & Launch | 🔲 Not Started | — |

## What's Built

### API (apps/api)
- Health check, Prisma module (global), Auth (Supabase + JWT + RBAC guards)
- Users (profile, KYC upload), Categories (store_type scoped CRUD)
- Vendors (registration, zone auto-assignment, approval workflow)
- Products (vendor-scoped CRUD, search/filter/pagination, image upload to Supabase Storage)
- Upload module (file validation: JPEG/PNG/WebP/GIF, 5MB max, UUID naming)
- Addresses (user ownership, set-default), Cart (add/update/remove/clear)
- Wishlist (add/remove/list/check), Reviews (create/find/delete, rating aggregation)
- Coupons (vendor CRUD + public validate with discount calc)
- Offers (vendor CRUD + public active-offers filtered by storeType)
- Returns (customer create, role-scoped list, admin process)
- Notifications (list, markRead, markAllRead, unreadCount, create)

### Vendor Dashboard (apps/vendor-dashboard)
- Next.js App Router app with 20+ pages
- Auth (login/signup/OTP), Products (CRUD page, category/inventory mgmt)
- Orders listing, returns management, coupons & offers CRUD
- Customers, Analytics (sales/revenue charts), Earnings (payouts/transactions)
- Store profile editing, Notifications, Settings, Support

## What's Missing (Next Phases)
- **Customer Mobile App (Phases 5+6):** Expo React Native storefront with 3 store-type tabs, checkout, profile
- **Admin Panel (Phase 9):** Next.js admin dashboard
- **Delivery App (Phase 10):** Expo delivery partner app
- **AI Features (Phase 7):** Product scanner, recommendations, chat assistant
- **Polish & Launch (Phase 11):** Push notifications, error handling, seed data, deployment

## Git
- Remote: `https://github.com/shivaganesh9515/next360-app.git` (branch: main)
- Git user: shivaganesh9515 (global), Credential Manager has shivaganesh9515 + Shivaganesh-dev
- 7 commits pushed (foundation → API modules)

## Decisions Log

| # | Decision | Value |
|---|----------|-------|
| 1 | Monorepo | Turborepo |
| 2 | Backend | NestJS (TypeScript) |
| 3 | Mobile | Expo (React Native) |
| 4 | Database | Supabase (Postgres) |
| 5 | Auth | Supabase Auth + NestJS JWT |
| 6 | ORM | Prisma |
| 7 | Payments | Razorpay |
| 8 | Storefront Model | 3 separate storefronts (Organic, Natural, Eco-friendly) |
| 9 | Business Model | Multi-vendor marketplace |
| 10 | Delivery | In-house fleet + partner app |
| 11 | Vendor App | Web (Next.js) — dashboard |
| 12 | AI Features | OpenAI/Gemini for product scanner, recommendations, health insights |
| 13 | Maps | React Native Maps + Google Maps API |
| 14 | Push Notifications | Expo Push API + Firebase Cloud Messaging |
| 15 | Plan Numbering | plan 03=Phase 3A, plan 04=Phase 3B, plan 05=Phase 4, plan 06=Phase 5, plan 07=Phase 6, plan 08=Phase 8, plan 11=Phase 7 |

## Blockers

None.
