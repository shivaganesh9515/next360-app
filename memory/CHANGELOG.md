# Changelog

> **Last updated:** 2026-07-20

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
- apps/api/package.json - Added missing dependencies (@nestjs/jwt, passport-jwt, etc.)

**Commit fac4979:**
- apps/customer-app/src/navigation/AppNavigator.tsx - Tab transition animations

**Commit c6399e9:**
- apps/customer-app/src/components/AddressMapPicker.tsx - Map-based picker
- apps/customer-app/src/components/AddressMapPicker.web.tsx - Web variant

**Commits a4b95d7 / b8310dc / 4ce5121:**
- tasks/ - Created 7 task files (abhinaya.md, ashwanth.md, harshitha.md, manaswini.md, README.md, soumya.md, srinitha.md)
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

---

## 2026-07-20

### New Documentation
- memory/ - Created 14 documentation files for project reference
  - PROJECT_CONTEXT.md, CURRENT_STATUS.md, TASKS.md, FOLDER_STRUCTURE.md
  - BACKEND_FLOW.md, FRONTEND_FLOW.md, DATABASE.md, API_REFERENCE.md
  - CHANGELOG.md, DECISIONS.md, ERRORS.md, NEXT_STEPS.md, AI_HANDOFF.md
