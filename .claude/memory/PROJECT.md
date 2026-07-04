# Next360 — Project Overview

**What:** Multi-vendor organic/natural/eco-friendly marketplace  
**Scope:** 136 screens across 4 apps + NestJS backend  
**Team:** 3 people, 3-month delivery  
**Status:** All 12 phases complete. UI fully built. Backend has placeholder `.env`.

## Team

| Person | Apps | Platform | Tech |
|--------|------|----------|------|
| You (Tech Lead) | Customer App + Delivery App | Mobile (Expo) | React Native, React Navigation, Zustand |
| Person 2 | Vendor Dashboard | Web | Next.js App Router, Tailwind, recharts |
| Person 3 | Admin Panel | Web | Next.js App Router, Tailwind, shadcn/ui |

## Tech Stack

### Backend
- **NestJS** v11 (Express) on port 4000
- **Prisma** v6 with Supabase Postgres
- **Supabase** for auth, storage, realtime
- **Razorpay** for payments (India, INR)
- **OpenAI / Gemini** for AI features
- **Expo Push API** for push notifications

### Frontend (Mobile)
- **Expo SDK 56** (React Native 0.85)
- **React Navigation** (Customer), **Expo Router** (Delivery)
- **Zustand** for state, **expo-secure-store** for tokens
- **@gorhom/bottom-sheet** for product detail
- **react-native-maps** for live tracking

### Frontend (Web)
- **Next.js 14** App Router
- **Tailwind CSS 4** + **shadcn/ui**
- **recharts** for dashboards
- **lucide-react** for icons

## Business Model
- **3 Storefronts:** Organic, Natural, Eco-friendly (filtered by `storeType`)
- **Multi-vendor:** One order → multiple `OrderVendorGroup` records (Swiggy/Zomato split)
- **Zone-gated:** MVP limited to Hyderabad + Vijayawada
- **Manual-first:** Vendor/product approval is admin-gated, not automated
- **Commission:** Per-vendor configurable (default 15%)

## Key Files
- `CLAUDE.md` — full project spec (314 lines, canonical reference)
- `.planning/STATE.md` — execution state, all phases tracked
- `.planning/ROADMAP.md` — sprint plan
- `prisma/schema.prisma` — 541 lines, 20+ models
- `apps/*/src/lib/api.ts` — centralized API clients
