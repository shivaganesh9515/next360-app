# Current Status

> **Last updated:** 2026-08-08
> **Current branch:** main
> **Latest changes:** Store compliance fixes + deployment strategy
> **Git remote:** https://github.com/shivaganesh9515/next360-app.git

## Current Phase

**Phase 13 — Store Submission & Launch** (NEW)

Previous 12 build phases complete. Now focused on fixing Google Play rejection issues and preparing for App Store submission.

## Deployment Strategy

| Phase | Platform | Cost | Status |
|-------|----------|------|--------|
| **Phase 1** | Railway | $0 (free credit) | 🔄 Ready to deploy |
| **Phase 2** | Railway | $5-20/month | After launch |
| **Phase 3** | AWS | $70-200/month | When scaling |

**Decision:** Use Railway for now, migrate to AWS later when revenue comes.

---

## What's Done ✅

### Backend (apps/api) — 28 Feature Modules

**Core (19):** Auth, Users, Categories, Vendors, Products, Cart, Wishlist, Reviews, Addresses, Orders, Payments, Commission, Coupons, Offers, Returns, Notifications, AI, Upload, Seed

**Previously built by remote team:** Inventory, DeliveryPartners, Zones, Disputes, Delivery, Admin, Audit, DeliverySlot, Queue, Sms, Email, Sentry

**Abhinaya Round 1 (5):** Brands, KYC, Sub-categories, Roles, CMS

**Abhinaya Round 2 (4 new):**
- ✅ Support Tickets — Prisma models (SupportTicket + TicketReply), support/ module with 7 endpoints
- ✅ Reports — reports/ module with GET /reports/sales and GET /reports/revenue
- ✅ Payouts Admin Oversight — payouts/ module with 5 endpoints
- ✅ Remaining Admin Endpoints — GET /payments, GET /reviews/ratings, GET /admin/analytics

### Frontend — Customer App (20+ screens)
- All screens built: onboarding, auth, home, search, product list, cart, checkout
- Orders, profile, wishlist, AI (chat, scanner, recommendations, health)

### Frontend — Delivery App (10 screens)
- Splash, login, setup, home, incoming assignment, active delivery, etc.

### Frontend — Vendor Dashboard (25 pages) + Admin Panel (38 pages)
- All pages structurally complete, some waiting on backend endpoints

---

## Store Compliance Fixes (2026-08-08) ✅

### Google Play Rejection Issues Fixed

| Issue | Status | Files Changed |
|-------|--------|---------------|
| **Debug console.log statements** | ✅ Fixed | NotificationsPopover.tsx, LocationPopover.tsx, ExpandingSearchDock.tsx |
| **Push token security leak** | ✅ Fixed | notifications.ts |
| **API URL localhost fallback** | ✅ Fixed | api.ts (added validation) |
| **Supabase placeholder fallback** | ✅ Fixed | supabase.ts (added validation) |
| **Empty catch blocks** | ✅ Fixed | i18n/index.ts, ReferralScreen.tsx, PromosScreen.tsx |

### Delivery App Legal Compliance (NEW)

| Requirement | Status | Files Created/Modified |
|-------------|--------|----------------------|
| **Privacy Policy Screen** | ✅ Created | LegalScreens.tsx, privacy-policy.tsx |
| **Terms of Service Screen** | ✅ Created | LegalScreens.tsx, terms-of-service.tsx |
| **Account Deletion** | ✅ Added | profile.tsx |
| **Legal Links on Login** | ✅ Added | login.tsx |
| **Navigation Routes** | ✅ Added | _layout.tsx |

### iOS Privacy Manifest (NEW)

| App | Status | File |
|-----|--------|------|
| Customer App | ✅ Added | app.json (ios.privacyManifest) |
| Delivery App | ✅ Added | app.json (ios.privacyManifest) |

Both manifests declare:
- Collected data types (Name, Phone, Email, Location, Photos)
- Required API reasons (FileTimestamp, DiskSpace, SystemBootTime)
- No tracking enabled

### Android Package Name Standardization

| App | Before | After |
|-----|--------|-------|
| Customer App | com.shivaganesh.gajavelli.next360 | com.next360.customer |
| Delivery App | com.next360.delivery | com.next360.delivery (unchanged) |

### EAS Configuration Updated

| File | Change |
|------|--------|
| apps/customer-app/eas.json | Updated API URL placeholder to `YOUR-RAILWAY-URL-OR-OTHER-HOST` |
| apps/delivery-app/eas.json | Updated API URL placeholder to `YOUR-RAILWAY-URL-OR-OTHER-HOST` |

---

## Deployment Files Ready ✅

| File | Status | Purpose |
|------|--------|---------|
| `apps/api/Dockerfile` | ✅ Ready | Multi-stage Docker build |
| `railway.toml` | ✅ Ready | Railway configuration |
| `.dockerignore` | ✅ Ready | Keeps image small |
| `DEPLOYMENT_GUIDE.md` | ✅ Ready | Step-by-step guide |

---

## What's Still Needed ❌ (Manual Steps)

### Critical (Blocks Submission)

| Task | Status | Why | Time |
|------|--------|-----|------|
| **Push code to GitHub** | ❌ Not done | Railway needs code | 5 min |
| **Deploy API to Railway** | ❌ Not done | App needs real backend | 25 min |
| **Add environment variables** | ❌ Not done | API needs config | 10 min |
| **Update eas.json with real URL** | ❌ Placeholder | App crashes without backend | 5 min |
| **Rebuild app** | ❌ Not done | Need new AAB | 30 min |
| **Deploy marketing site** | ❌ Not done | Privacy policy URL must be live | 30 min |
| **Capture screenshots** | ❌ Not done | Both stores require 4-6 screenshots | 1 hour |
| **Create developer accounts** | ❌ Not done | $25 (Google) / $99/year (Apple) | 5 min |
| **Fill Play Console questionnaires** | ❌ Not done | Data Safety, Privacy Labels | 1 hour |

### Should Fix

| Task | Status | Why |
|------|--------|-----|
| Add Sentry crash reporting | ❌ Not done | Better error tracking |
| Upgrade Expo SDK to 57+ | ❌ Not done | Fixes 13 moderate CVEs |
| Add unit tests | ❌ Not done | Quality assurance |

---

## Vulnerabilities

| Severity | Count | Fix |
|----------|-------|-----|
| High | 2 | NestJS 12+ upgrade |
| Moderate | 1 | Next.js 17+ upgrade |
| Moderate | 13 | Expo SDK 57+ upgrade |

---

## Team Status

| Person | Status | Notes |
|--------|--------|-------|
| **You (Samhith)** | Active | Working on deployment |
| **Abhinaya** | Quit | Sent resignation email |
| **Srinitha** | Unknown | Last seen working on vendor analytics |
| **Harshitha** | Unknown | Last seen working on Razorpay |
| **Soumya** | Unknown | Last seen working on vendor-dashboard |
| **Manaswini** | Unknown | Last seen working on admin-panel |

---

## Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Railway (free credit) | $0 | First month |
| Railway (after) | $5-20 | Monthly |
| Supabase (free tier) | $0 | Monthly |
| EAS Build | $0 | Per build |
| Google Play Developer | $25 | One-time |
| Apple Developer | $99 | Yearly |
| **Total to launch** | **$25-45** | First month |

---

## Timeline

| Phase | Duration |
|-------|----------|
| Deploy to Railway | 1 day |
| Update app config | 1 hour |
| Rebuild app | 30 min |
| Test on phone | 1-2 hours |
| Capture screenshots | 1 hour |
| Fill Play Console | 1 hour |
| Submit for review | 3-7 days |
| **Total** | **~1-2 weeks** |
