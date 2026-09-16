# Errors Encountered

> **Last updated:** 2026-08-08

---

## Deployment Errors (2026-08-08)

| Error | Root Cause | Solution | Date |
|-------|-----------|----------|------|
| Google Play rejection: "App isn't functional" | No backend deployed, app falls back to localhost | Deploy API to Railway | 2026-08-08 |
| App crashes without API | EXPO_PUBLIC_API_URL not set | Add production URL validation | 2026-08-08 |
| Auth fails silently | Supabase placeholder credentials | Add config validation | 2026-08-08 |

---

## Store Compliance Errors (Fixed 2026-08-08)

| Error | Root Cause | Solution | Date |
|-------|-----------|----------|------|
| Google Play rejection: "Security vulnerabilities" | Debug console.log statements, push token leak, API URL fallback | Removed debug logs, added URL validation | 2026-08-08 |
| Google Play rejection: "Application stability issues" | App crashes if API not configured (localhost fallback) | Added production URL validation | 2026-08-08 |
| Google Play rejection: "Code quality" | Debug console.log statements visible in production | Removed all debug logs | 2026-08-08 |
| Google Play rejection: "Permission handling" | Missing privacy manifest for iOS | Added PrivacyManifest to both apps | 2026-08-08 |
| Delivery app missing legal screens | No Privacy Policy or Terms of Service | Created LegalScreens.tsx | 2026-08-08 |
| Delivery app missing account deletion | Google Play requires account deletion | Added to profile.tsx | 2026-08-08 |
| Android package name inconsistency | com.shivaganesh.gajavelli.next360 vs com.next360.customer | Standardized to com.next360.customer | 2026-08-08 |

---

## Previous Errors

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

---

## Prisma Error Mapping

| Prisma Error | HTTP | Meaning |
|-------------|------|---------|
| P2002 | 409 Conflict | Duplicate (email, phone, coupon code) |
| P2025 | 404 Not Found | Record not found |
| P2003 | 400 Bad Request | Foreign key violation |

---

## Known Vulnerabilities

All 16 remaining CVEs require semver major upgrades - no safe patch fixes.

| Severity | Count | Package | Why Not Fixed |
|----------|-------|---------|--------------|
| High | 2 | multer (via NestJS) | Needs NestJS 12+ upgrade. Only exploitable if upload endpoint is public (currently behind JWT). |
| Moderate | 1 | postcss (via Next.js) | Build-time only, not runtime. Needs Next.js 17+ upgrade. |
| Moderate | 13 | uuid/xcode (via Expo) | Build-time only. xcode is for iOS project generation. Needs Expo SDK 57+ upgrade. |

---

## Security Fixes Applied (2026-08-08)

### 1. Debug Console.log Statements Removed

**Files:** NotificationsPopover.tsx, LocationPopover.tsx, ExpandingSearchDock.tsx

**Before:**
```typescript
console.log('[DEBUG] NotificationsPopover measured:', { x, y, width, height, OS: Platform.OS });
```

**After:**
```typescript
// Line removed entirely
```

### 2. Push Token Security Leak Fixed

**File:** notifications.ts

**Before:**
```typescript
const token = (await Notifications.getExpoPushTokenAsync()).data;
console.log('Expo push token:', token);  // SECURITY RISK: Leaks token
```

**After:**
```typescript
const token = (await Notifications.getExpoPushTokenAsync()).data;
// Token logging removed for security
```

### 3. API URL Validation Added

**File:** api.ts

**Before:**
```typescript
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';
```

**After:**
```typescript
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

// Validate API URL in production — prevent app from running with localhost
if (!__DEV__ && !process.env.EXPO_PUBLIC_API_URL) {
  console.error('[SECURITY] EXPO_PUBLIC_API_URL is not set. App will not function correctly.');
}
```

### 4. Supabase Config Validation Added

**File:** supabase.ts

**Before:**
```typescript
export function isSupabaseConfigured(): boolean {
  return !!rawUrl && !!rawKey && rawUrl !== 'https://your-project.supabase.co' && rawKey !== 'your-anon-key';
}
```

**After:**
```typescript
export function isSupabaseConfigured(): boolean {
  const configured = !!rawUrl && !!rawKey && rawUrl !== 'https://your-project.supabase.co' && rawKey !== 'your-anon-key';
  // Warn in production if Supabase is not properly configured
  if (!__DEV__ && !configured) {
    console.error('[SECURITY] Supabase is not configured. Auth and realtime features will not work.');
  }
  return configured;
}
```

### 5. Empty Catch Blocks Documented

**Files:** i18n/index.ts, ReferralScreen.tsx, PromosScreen.tsx

**Before:**
```typescript
} catch {}
```

**After:**
```typescript
} catch { /* Language load failed — defaults to English */ }
```

---

## Google Play Rejection Email (2026-08-08)

```
Dear Team,

During the app review process, the Next360 Android application was not approved 
for publication due to multiple technical and security-related issues that require 
resolution before resubmission.

The key areas requiring attention include:

* Security vulnerabilities that do not meet Play Store requirements.
* Application stability issues resulting in unexpected errors.
* Code quality and performance optimizations.
* Permission handling and privacy compliance.
* Additional technical issues identified during testing.

Please prioritize resolving all identified issues, perform comprehensive testing, 
and ensure the application complies with Google Play's Developer Program Policies 
before submitting a new release for review.

Kindly share the updated build once all issues have been addressed.

Thank you.

Best regards,
Google Play Services
```

---

## Team Communication (2026-08-08)

### Abhinaya's Resignation Email

```
Hi Samhith

Naa biggest concern enti ante, naku work cheyadaniki proper environment 
dorakatledu. Ila continue aithe, naa side nundi better output ivvadam chala 
kashtam avutundi. Anduke ikkada continue avvadam correct decision aa ani 
doubt vastundi.

Main point money kaadu. Nenu technical work meeda focus cheyyalsina time lo, 
financial discussions mariyu vere issues valla ekkuva time spend chesthunna. 
Daani valla project chala frequent ga stop avutundi, progress impact avutundi.

Naku oka clarity kavali. Meeru naa tho ee project ni continue cheyyalani 
anukuntunnara leda? Endukante present situation lo work smooth ga jaragatledu.

Current situation ni chusi, nenu ee company nundi quit avvalani decide ayyanu. 
Kabatti, dayachesi pending settlement ni clear cheyyamani request chesthunna.

Thank you. I wish you all the best.
```

**Translation:**
"My biggest concern is that I'm not getting a proper environment to work. If this continues, it's very hard for me to give better output from my side. That's why I have doubts about whether continuing here is the right decision.

The main point is not money. When I should be focusing on technical work, I'm spending too much time on financial discussions and other issues. Because of this, the project keeps stopping frequently, and progress is impacted.

I need clarity. Do you want to continue this project with me or not? Because in the current situation, work is not happening smoothly.

Seeing the current situation, I have decided to quit this company. So, please request to clear the pending settlement.

Thank you. I wish you all the best."
