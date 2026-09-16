# Next360 Investor Preview APK — Ready to Install

## File
- **Location:** `build/next360-investor-preview.apk` (127 MB)
- **Package:** `com.next360.customer` versionCode 2 / 1.0.0
- **Build:** EAS preview (internal) — **standalone APK, no dev client / no cable**
- **SDK:** Expo 56, target SDK 36, min SDK 24 (Android 7.0+)
- **EAS ID:** e640b138-652b-4d3f-8b9c-a2caf892e088 — https://expo.dev/accounts/shivaganesh.gajavelli/projects/next360-customer/builds/e640b138-652b-4d3f-8b9c-a2caf892e088
- **Mode:** `EXPO_PUBLIC_ENABLE_DEMO_FALLBACK=true` — works **offline** with demo data (no backend needed). Ideal for investor demo.

## Install (30 seconds)
1. Send APK via WhatsApp / Drive / USB / `adb install`
2. On phone: Allow "Install unknown apps" when prompted → Install → Open
3. `adb install build/next360-investor-preview.apk`  (or `adb install -r` to update)

## What investor sees
- Splash + Onboarding (3 slides) → Home (search, category swatch Organic/Natural/Eco, banners, herbarium cards, floating pill nav)
- Product bottom sheet (45%/90%), cart grouped by vendor with delivery ETA, checkout → confirmation → live tracking with countdown
- Delivery filters (Under 15/20/30 min) + Fastest-first sort, wishlist, orders, profile — all with demo data

## Notes
- No real payment — Razorpay in demo mode
- Permissions: Camera, Location
- Cloud built with Gradle 8.13 / Java 21 (correct). Local build was patched from 9.3.1→8.13.

## Next build
```bash
cd apps/customer-app
eas build --platform android --profile preview --non-interactive
# when finished:
curl -L "$(eas build:view <id> --json | jq -r '.artifacts.buildUrl // .artifacts.applicationArchiveUrl')" -o ../../build/next360-investor-preview.apk
```
