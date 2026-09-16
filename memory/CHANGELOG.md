# Changelog

> **Last updated:** 2026-08-08

---

## 2026-08-08

### Deployment Strategy Decision

**Decision:** Railway for initial deployment, AWS later when scaling.

**Rationale:**
- Railway: Free $5 credit, never sleeps, easy Docker support
- AWS: Better at scale, more services, industry standard

**Cost:**
- Phase 1 (Railway): $0-20/month
- Phase 2 (AWS): $70-200/month (when revenue comes)

**Files Updated:**
- memory/DECISIONS.md - Added decisions 36-39
- memory/NEXT_STEPS.md - Added Railway deployment steps
- memory/CURRENT_STATUS.md - Added deployment strategy

---

### Store Compliance & Security Fixes

**Security Fixes (Critical):**
- Removed debug console.log statements from NotificationsPopover.tsx, LocationPopover.tsx, ExpandingSearchDock.tsx
- Removed push token security leak from notifications.ts
- Added production URL validation in api.ts to prevent localhost fallback
- Added Supabase config validation in supabase.ts to prevent placeholder fallback
- Added comments to empty catch blocks for better code clarity

**Delivery App Legal Compliance:**
- Created LegalScreens.tsx with PrivacyPolicyScreen and TermsOfServiceScreen
- Created privacy-policy.tsx and terms-of-service.tsx route files
- Added account deletion functionality to profile.tsx
- Added legal links to login.tsx
- Added navigation routes in _layout.tsx

**iOS Privacy Manifest:**
- Added ios.privacyManifest to apps/customer-app/app.json
- Added ios.privacyManifest to apps/delivery-app/app.json
- Both declare: Name, Phone, Email, Location, Photos data collection
- Both declare: FileTimestamp, DiskSpace, SystemBootTime API reasons
- Both set NSPrivacyTracking: false

**Android Package Name:**
- Standardized customer app from com.shivaganesh.gajavelli.next360 to com.next360.customer

**EAS Configuration:**
- Updated apps/customer-app/eas.json with clearer API URL placeholder
- Updated apps/delivery-app/eas.json with clearer API URL placeholder

**Files Changed:**
```
apps/customer-app/src/components/NotificationsPopover.tsx
apps/customer-app/src/components/LocationPopover.tsx
apps/customer-app/src/components/ExpandingSearchDock.tsx
apps/customer-app/src/lib/notifications.ts
apps/customer-app/src/lib/api.ts
apps/customer-app/src/lib/supabase.ts
apps/customer-app/src/i18n/index.ts
apps/customer-app/src/screens/profile/ReferralScreen.tsx
apps/customer-app/src/screens/promos/PromosScreen.tsx
apps/customer-app/app.json
apps/customer-app/eas.json
apps/delivery-app/src/components/LegalScreens.tsx (NEW)
apps/delivery-app/src/app/privacy-policy.tsx (NEW)
apps/delivery-app/src/app/terms-of-service.tsx (NEW)
apps/delivery-app/src/app/(tabs)/profile.tsx
apps/delivery-app/src/app/(auth)/login.tsx
apps/delivery-app/src/app/_layout.tsx
apps/delivery-app/app.json
apps/delivery-app/eas.json
memory/DECISIONS.md
memory/NEXT_STEPS.md
memory/CURRENT_STATUS.md
memory/CHANGELOG.md
memory/ERRORS.md
```

**Validation:**
- TypeScript compilation: ✅ No errors
- JSON validation: ✅ All files valid

---

## 2026-07-20

### Previous Changes

- Added Prisma migration for zone pincodes
- Updated team task files
- Created memory documentation files
- Fixed admin panel syntax errors
- Integrated Supabase SSR for admin panel

---

## 2026-07-15

### Commits (reverse chronological)

| Date | Commit | Author | Message | Branch |
|------|--------|--------|---------|--------|
| 2026-07-15 | 9b8ed2e | Baddam Abhinaya Reddy | feat(api): complete Abhinaya's 5 modules - brands, kyc, sub-categories, roles, cms | abhinaya/brands-module |
| 2026-07-15 | fac4979 | shivaganesh9515 | feat(customer-app): animate bottom-nav tab transitions | main |
| 2026-07-15 | c6399e9 | shivaganesh9515 | feat(customer-app): map-based address picker | main |
| 2026-07-15 | 2ca369a | shivaganesh9515 | docs: simplify tasks/README.md into a step-by-step onboarding guide | main |
| 2026-07-15 | a4b95d7 | shivaganesh9515 | docs: add tasks/ folder with per-person task files | main |
| 2026-07-15 | b8310dc | shivaganesh9515 | docs: add 6-person team task division to CLAUDE.md and memory | main |
| 2026-07-15 | 2854032 | shivaganesh9515 | chore: gitignore .planning and .github/workflows; customer-app feature work | main |
| 2026-07-15 | 4ce5121 | shivaganesh9515 | docs: add project memory folder (.claude/memory/) - 6 files | main |
| 2026-07-15 | d6f8084 | shivaganesh9515 | chore(deps): safe patch updates | main |
| 2026-07-14 | various | shivaganesh9515 | feat: complete all phases - full-stack marketplace with 4 apps + API | main |
| 2026-06-26 | various | shivaganesh.gajavelli | Initial project setup, Turbo repo scaffold | main |

### Files Changed (Recent Commits)

**Commit 9b8ed2e (Abhinaya):**
- apps/api/src/app.module.ts - Registered brands, kyc, sub-categories, roles, cms modules
- apps/api/src/brands/ - Full CRUD module (controller, service, module, DTOs)
- apps/api/src/kyc/ - Full module (submit, status, verify)
- apps/api/src/sub-categories/ - CRUD nested under categories
- apps/api/src/roles/ - CRUD roles + permissions
- apps/api/src/cms/ - CRUD pages + banners
- apps/api/package.json - Added missing dependencies

**Commit fac4979:**
- apps/customer-app/src/navigation/AppNavigator.tsx - Tab transition animations

**Commit c6399e9:**
- apps/customer-app/src/components/AddressMapPicker.tsx - Map-based picker
- apps/customer-app/src/components/AddressMapPicker.web.tsx - Web variant

**Commits a4b95d7 / b8310dc / 4ce5121:**
- tasks/ - Created 7 task files
- .claude/memory/ - Created 6 documentation files
- CLAUDE.md - Updated with Current Task Division section

---

## Previous Work (Phases 1-11)

### Phase 1 - Foundation
- Turborepo monorepo setup
- Prisma schema (20+ models) + initial migration

### Phase 2-3 - Backend Core
- NestJS backend with 27 module structure
- Core APIs: auth, categories, products, vendors, cart, orders, payments
- Global exception filter, RBAC guards, rate limiting, response interceptor

### Phase 4-7 - App Buildout
- Customer App: 20+ screens, 30+ components, navigation, theming
- Delivery App: 10 screens, auth, delivery management
- Vendor Dashboard: 25 pages, sidebar layout
- Admin Panel: 38 pages, sidebar layout

### Phase 8-11 - AI + Polish
- AI features: chat, scanner, recommendations, health insights
- Design system: 3 category themes, pill nav, bottom sheet PDP
- Address picker, animated transitions, error handling
