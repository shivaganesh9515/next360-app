# Mobile Dev — Customer App + Delivery App

Area: `apps/customer-app` and `apps/delivery-app`. Expo React Native apps.

## Customer App

### Do Now (No Dependencies)

- [ ] **Fix CMS banner wiring** — add `getBanners()` to `customerApi` in `apps/customer-app/src/lib/api.ts`, call it on `HomeScreen`, replace `HERO_PLACEHOLDER_IMAGE` with real banners from backend. Backend endpoint `GET /cms/banners` already exists.

- [ ] **Fix AI screen hardcoded color** — all 5 AI screens (`AiAssistantScreen`, `AiProductScannerScreen`, `AiRecommendationsScreen`, `AiHealthInsightsScreen`, `AiChatHistoryScreen`) use hardcoded `#2A7A4B`. Replace with `getStoreAccent()` from `src/constants/theme.ts` to match the category theming system.

- [ ] **Add wishlist count to nav bar** — expose wishlist count from context/store to the floating pill bottom nav bar as a badge.

- [ ] **Telugu/English i18n** — install `i18next` + `react-i18next`, create translation files (`en.json`, `te.json`), add language context/provider, add toggle in Profile/Settings screen, wrap all hardcoded strings across ~30 screens. ~200+ strings to extract and translate.

### Blocked on Backend

- [ ] **Loyalty/tier screen** — new screen with 8 tree-growth stages (Seed → Seedling → Sapling → Plant → Young Tree → Tree → Mature Tree → Forest), tier badge, progress bar. Blocked on: backend loyalty endpoints (Srinitha task #20).

- [ ] **Test all screens end-to-end** — walk through every screen against live backend, document what breaks. Do after tasks 1-4 are done.

## Delivery App

### Do Now (No Dependencies)

- [ ] **Fix envelope unwrap bug** — `apps/delivery-app/src/lib/api.ts` line 39 returns raw `response.json()` without unwrapping the `{success, data, meta}` envelope. Add the same unwrap logic the other 3 apps have. This is a 5-minute fix that unblocks everything else.

- [ ] **Test KYC submission flow** — screen exists at `kyc-documents.tsx`, backend `POST /kyc/submit` and `GET /kyc/status` already exist. Verify end-to-end.

### Blocked on Backend

- [ ] **Test vehicle setup flow** — screen exists at `vehicle-setup.tsx`. Blocked on: backend `POST /delivery-partners/setup` (Srinitha task #11).

- [ ] **Test incoming assignment modal** — `IncomingAssignmentModal.tsx` exists. Blocked on: backend delivery assignment pipeline (Srinitha task #1) + realtime table name fix (Srinitha task #2).

- [ ] **Test active delivery flow** — `delivery/[id].tsx` exists (OTP verify, location push, mark delivered). Blocked on: backend delivery assignment pipeline (Srinitha task #1).

- [ ] **Test earnings page** — `earnings.tsx` calls `GET /delivery/earnings` which doesn't exist. Blocked on: backend delivery earnings endpoint (Srinitha task #8).

- [ ] **Test history page** — `history.tsx` exists. No backend dependency, verify it works.

## Reference

- Screen inventory: root `CLAUDE.md` → "Customer App — UI/UX Decisions" and "Delivery Partner App — UI/UX Decisions"
- Design tokens: `apps/customer-app/src/constants/theme.ts`
- API patterns: `apps/customer-app/src/lib/api.ts`, `apps/delivery-app/src/lib/api.ts`
