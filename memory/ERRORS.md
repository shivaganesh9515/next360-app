# Errors Encountered

> **Last updated:** 2026-07-20

---

| Error | Root Cause | Solution | Date |
|-------|-----------|----------|------|
| npm install fails | Cross-workspace peer conflicts | Always use --legacy-peer-deps | Ongoing |
| expo install fails | Wrong Expo SDK versions | Use npx expo install --check | Ongoing |
| Prisma can't connect | .env is placeholder | Need real Supabase credentials | Ongoing |
| response.json() crashes | HTML error pages | Use response.text() -> JSON.parse() | Fixed |
| Admin reviews/refunds crash | Raw fetch() not adminApi | Migrate to adminApi | Known |
| Bottom nav jarring | No tab switch animation | Added animated transitions | Fixed |
| Address picker missing | No map-based selection | Built AddressMapPicker | Fixed |
| Delivery app missing babel | Expo Router requires it | Added babel.config.js | Fixed |
| Notifications not in nav | Wired but not registered | Added to tab navigator | Fixed |
| Admin root page conflict | Two page.tsx files | Deleted root page.tsx | Fixed |
| Sidebar missing links | No Zones + Disputes | Added links to sidebar | Fixed |
| AI Logs duplicate layout | Wrapped incorrectly | Fixed layout + adminApi | Fixed |
| npm missing NestJS deps | package.json incomplete | Added all missing deps | Fixed |
| Gray vs slate inconsistency | Mixed palette usage | Standardize on slate-* | Known |
| API endpoints missing | 40+ routes not implemented | Building modules (in progress) | In progress |

## Prisma Error Mapping

| Prisma Error | HTTP | Meaning |
|-------------|------|---------|
| P2002 | 409 Conflict | Duplicate (email, phone, coupon code) |
| P2025 | 404 Not Found | Record not found |
| P2003 | 400 Bad Request | Foreign key violation |

## Known Vulnerabilities

All 16 remaining CVEs require semver major upgrades - no safe patch fixes.

| Severity | Count | Package | Why Not Fixed |
|----------|-------|---------|--------------|
| High | 2 | multer (via NestJS) | Needs NestJS 12+ upgrade. Only exploitable if upload endpoint is public (currently behind JWT). |
| Moderate | 1 | postcss (via Next.js) | Build-time only, not runtime. Needs Next.js 17+ upgrade. |
| Moderate | 13 | uuid/xcode (via Expo) | Build-time only. xcode is for iOS project generation. Needs Expo SDK 57+ upgrade. |
