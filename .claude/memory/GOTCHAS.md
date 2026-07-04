# Gotchas & Workarounds

## npm install
- **Always use `--legacy-peer-deps`** — cross-workspace peer conflicts are normal
- `npx expo install --check` is the source of truth for Expo SDK compatible versions

## Backend
- **`.env` is placeholder** — Prisma can't connect. All frontend pages show empty states gracefully.
- **Backend not running** — API pages work fine with empty states, no crashes.
- **`response.text() → JSON.parse()`** — HTML error responses (from Nginx/proxy) crash `response.json()`. Both admin and vendor `api.ts` use the text-first pattern.
- **Missing endpoints** — 40+ routes called by admin/vendor panels don't exist in NestJS yet. Pages handle 404s gracefully.

## Database Schema
- **OrderVendorGroup is the critical pattern** — not OrderItem. One Order → many OrderVendorGroups → many OrderItems.
- **Address uses `fullAddress`** — not `street`. Don't look for `street` field.
- **Vendor uses `storeName`** — not `businessName`.
- **CartItem unique on (userId + productId)** — not (userId + productId + variantId).
- **storeType inherited from vendor** — products don't have their own storeType.

## Frontend
- **Customer App uses React Navigation** (stack + tabs), not Expo Router
- **Delivery App uses Expo Router** (file-based routing)
- **Bottom sheet for product detail** — never navigate away from list in customer app
- **Cart radius 18px, pill radius 999px** — design system values
- **Admin panel auth** — stored in `localStorage` as `admin_token` + `admin_user`, no API call on mount for dev sessions

## Git
- **Remote:** `https://github.com/shivaganesh9515/next360-app.git` (branch: main)
- **Git user:** shivaganesh9515 (global)
- **Credential Manager:** has shivaganesh9515 + Shivaganesh-dev

## Delivery App
- **Port 8082** — port 8081 is occupied by customer app
- **babel.config.js** — must exist for Expo, was missing initially
- **Notifications screen** — was wired but not in tab navigator, fixed

## Admin Panel
- **Root `page.tsx` deleted** — `(dashboard)/page.tsx` serves `/` via layout
- **Sidebar** — Dashboard href `/`, added Zones + Disputes links
- **AI Logs** — 3 pages migrated from raw `fetch()` to `adminApi` (had duplicate sidebar/header)
- **Disputes page** — merges returns + refunds into one view with tab filtering

## Vulnerabilities
- **All 16 remaining CVEs require semver major upgrades** — no safe fixes available
- **multer (2 high)** — only exploitable if upload endpoint is public. Currently behind JWT auth.
- **postcss (1 moderate)** — build-time only, not runtime. Next.js renders server-side.
- **uuid/xcode (13 moderate)** — build-time only. `xcode` is for iOS project generation, not production JS.
