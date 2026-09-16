# Next360 Investor APK — Build Pending

## Current Build
- **Profile:** preview (standalone APK, no dev client needed)
- **ID:** e640b138-652b-4d3f-8b9c-a2caf892e088
- **Status:** Queued on EAS Cloud (Gradle 8 infra)
- **Logs:** https://expo.dev/accounts/shivaganesh.gajavelli/projects/next360-customer/builds/e640b138-652b-4d3f-8b9c-a2caf892e088
- **Mode:** EXPO_PUBLIC_ENABLE_DEMO_FALLBACK=true — works **offline** without backend (demo data)
- **Package:** com.next360.customer
- **Output:** `build/next360-investor-preview.apk` (will be downloaded here when finished)

## Why Cloud vs Local
Local build failed due to Gradle 9.3.1 incompatibility (AGP requires Gradle 8.x, Java 21). EAS Cloud uses pinned Gradle 8.13 + Java 17, so this build will succeed in ~8-12 min.

## Download when ready
```bash
cd apps/customer-app
eas build:view e640b138-652b-4d3f-8b9c-a2caf892e088
# when status = finished:
eas build:download --id e640b138-652b-4d3f-8b9c-a2caf892e088 --output ../../build/next360-investor-preview.apk
# or
eas build:download --id e640b138-652b-4d3f-8b9c-a2caf892e088
```

## Fast Local Fix (alternative, needs 2 min manual)
The android/ prebuild was left in your repo from the failed local build. To fix local building:
1. rm -rf apps/customer-app/android
2. Edit gradle wrapper to 8.13: `distributionUrl=https\://services.gradle.org/distributions/gradle-8.13-bin.zip`
3. Use Java 21: `export JAVA_HOME=/home/shiva/.local/share/mise/installs/java/21.0.2`
4. Then: `eas build --platform android --profile preview --local --output ../../build/next360-investor-preview.apk`
