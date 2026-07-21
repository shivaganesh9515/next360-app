# AI Handoff Document

> **Last updated:** 2026-07-20
> **Purpose:** Complete handoff so any AI model can continue the work without asking for previous context.

---

## Current Branch

**Branch:** abhinaya/brands-module
**Base Branch:** main
**Latest Commit:** 9b8ed2e - feat(api): complete Abhinaya's 5 modules - brands, kyc, sub-categories, roles, cms

## Remote Repository

- **URL:** https://github.com/shivaganesh9515/next360-app.git
- **Branches:** main, abhinaya/brands-module, ashwanth, harshitha, samhith

## Current State

All 12 build phases are complete. The project has 5 apps:
1. apps/api - NestJS backend (27 modules, 23 existing, 4 pending)
2. apps/customer-app - Expo mobile (20+ screens, 30+ components)
3. apps/delivery-app - Expo mobile (10 screens)
4. apps/vendor-dashboard - Next.js web (25 pages)
5. apps/admin-panel - Next.js web (38 pages)

### What Was Just Completed

**Abhinaya** finished 5 backend modules:
- brands/ - CRUD with storeType filter
- kyc/ - Submit documents, get status, admin verify
- sub-categories/ - CRUD nested under categories
- roles/ - CRUD roles with JSON permissions + permissions CRUD
- cms/ - CRUD CMS pages + banners
- Also fixed apps/api/package.json with all missing dependencies

## Files Modified (Most Recent)

### New Files:
- apps/api/src/brands/ - Full module (controller, service, module, DTOs)
- apps/api/src/kyc/ - Full module (controller, service, module, DTOs)
- apps/api/src/sub-categories/ - Full module (controller, service, module, DTOs)
- apps/api/src/roles/ - Full module (controller, service, module, DTOs)
- apps/api/src/cms/ - Full module (controller, service, module, DTOs)

### Modified Files:
- apps/api/src/app.module.ts - Registered 5 new modules
- apps/api/package.json - Added @nestjs/jwt, passport-jwt, etc.

## Files to Modify Next

### Priority 1 - Srinitha Modules:
- Create apps/api/src/delivery-partners/ (controller, service, module, DTOs)
- Create apps/api/src/zones/ (controller, service, module, DTOs)
- Create apps/api/src/disputes/ (controller, service, module, DTOs)
- Add vendor analytics endpoints to apps/api/src/vendors/vendors.controller.ts
- Register all in app.module.ts

### Priority 2 - Harshitha Modules:
- Add Razorpay Route payout logic to apps/api/src/payments/
- Create apps/api/src/inventory/ (controller, service, module, DTOs)
- Register in app.module.ts

### Priority 3 - Frontend Wiring:
- apps/vendor-dashboard/package.json - Add @supabase/supabase-js, shadcn/ui
- apps/admin-panel/package.json - Add @supabase/supabase-js, shadcn/ui
- apps/admin-panel/src/app/(dashboard)/brands/ - Wire to API (UNBLOCKED)
- apps/admin-panel/src/app/(dashboard)/roles/ - Wire to API (UNBLOCKED)
- apps/admin-panel/src/app/(dashboard)/cms/ - Wire to API (UNBLOCKED)
- apps/admin-panel/src/app/(dashboard)/categories/sub-categories/ - Wire to API (UNBLOCKED)

## Pending Work Summary

### Backend
| Module | Owner | Status |
|--------|-------|--------|
| delivery-partners/ | Srinitha | Not started |
| zones/ | Srinitha | Not started |
| disputes/ | Srinitha | Not started |
| Vendor analytics | Srinitha | Not started |
| Razorpay Route payouts | Harshitha | Not started |
| inventory/ | Harshitha | Not started |

### Frontend
| Task | Owner | Blocked On |
|------|-------|-----------|
| shadcn/ui + Supabase in vendor-dashboard | Soumya | Not blocked |
| shadcn/ui + Supabase in admin-panel | Manaswini | Not blocked |
| Wire brands/roles/cms/sub-categories | Manaswini | UNBLOCKED (Abhinaya done) |
| Wire delivery-partners/zones/disputes | Manaswini | Srinitha |
| Wire payouts/analytics/earnings | Soumya | Srinitha + Harshitha |

## Things That Should Never Be Changed

1. **Monorepo structure** - Turborepo with apps/* and packages/*
2. **NestJS modular architecture** - Feature modules with DTOs
3. **API response envelope** - { success, data, meta } format
4. **Text-first fetch** - Never use response.json(), always text() then JSON.parse()
5. **StoreType inheritance** - Products inherit from vendor, not their own field
6. **OrderVendorGroup pattern** - Order -> Groups -> Items (never flatten)
7. **Design tokens** - White bg #FFFFFF, Fraunces, Inter, JetBrains Mono
8. **Category theming** - Only accent/accentTint/cardBorder swap, rest is fixed
9. **Cart never re-themes** - Cart/Checkout use default theme (spans categories)
10. **Delivery sans-only** - No Fraunces, no bottom sheets, one action per screen
11. **Customer uses React Navigation** - Delivery uses Expo Router
12. **Razorpay Route for vendors only** - Delivery partners paid separately (weekly)
13. **Manual-first MVP** - No automation for vendor/product approval
14. **Zone-gating** - MVP only Hyderabad + Vijayawada

## Current Blockers

1. Backend .env is placeholder - no real Supabase credentials
2. Backend not running - all frontend pages show empty states gracefully
3. Srinitha/Harshitha modules not started - no real blocks, just need to build
4. Soumya blocked on Srinitha for live data on analytics/earnings/payouts
5. Manaswini blocked on Srinitha for delivery-partners/zones/disputes live data

## How to Resume Development

1. Read this file + CLAUDE.md + .claude/memory/* for full context
2. Pull latest: git checkout main && git pull origin main
3. Create feature branch: git checkout -b yourname/task-name
4. Work on highest-priority pending task (see NEXT_STEPS.md)
5. Never use response.json() - always text-first fetch
6. Use existing modules as templates (e.g., categories/ for CRUD patterns)
7. Update TASKS.md + CURRENT_STATUS.md when tasks change
8. Commit, push, open PR into main
