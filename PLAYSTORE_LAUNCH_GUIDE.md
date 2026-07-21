# 🚀 Next360 Play Store Submission & Launch Guide

This guide outlines the exact step-by-step instructions to compile, sign, and submit **Next360 Customer** and **Next360 Delivery** apps to the Google Play Store.

---

## 📅 Phase 1: Environment & API URL Configuration

To switch from development mock fallbacks to a live production backend, you must update the environment variables for both apps.

### 1. Update Customer App Environment
Open [apps/customer-app/.env](file:///c:/Users/gunny/development/next360-app/apps/customer-app/.env) and set the production API and Supabase details:
```env
EXPO_PUBLIC_API_URL=https://api.next360.com/api
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_ENABLE_DEMO_FALLBACK=false
```

### 2. Update Delivery App Environment
Open [apps/delivery-app/.env](file:///c:/Users/gunny/development/next360-app/apps/delivery-app/.env) and update the production variables:
```env
EXPO_PUBLIC_API_URL=https://api.next360.com/api
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 📱 Phase 2: App Branding & Package Configuration

Make sure your app icons, package names, and version numbers are set correctly inside the `app.json` of each app.

### 1. Customer App `app.json`
Verify the following parameters in [apps/customer-app/app.json](file:///c:/Users/gunny/development/next360-app/apps/customer-app/app.json):
* **`name`**: `"Next360 - Organic Marketplace"` (This is the name users see under the icon).
* **`android.package`**: `"com.next360.customer"`
* **`android.versionCode`**: `1` (Increment this by 1 for every subsequent app update).

### 2. Delivery App `app.json`
Verify the parameters in [apps/delivery-app/app.json](file:///c:/Users/gunny/development/next360-app/apps/delivery-app/app.json):
* **`name`**: `"Next360 Delivery"`
* **`android.package`**: `"com.next360.delivery"`
* **`android.versionCode`**: `1`

---

## 🛠️ Phase 3: Building the signed `.aab` Bundles

We use Expo Application Services (EAS) to build production-ready Android App Bundles (`.aab`) in the cloud.

### Step 1: Install EAS CLI Globally
Run this command in your computer's terminal:
```bash
npm install -g eas-cli
```

### Step 2: Log into your Expo Account
```bash
npx eas-cli login
```
*(Enter your Expo developer username and password)*.

### Step 3: Run EAS Build for Customer App
Navigate to the customer app directory and start the build:
```bash
cd apps/customer-app
npx eas-cli build --platform android --profile production
```
* Note: EAS will ask if you want to generate a new Keystore. Press **Yes** to let Expo handle your signing keys securely in the cloud.

### Step 4: Run EAS Build for Delivery App
Navigate to the delivery app directory and build:
```bash
cd apps/delivery-app
npx eas-cli build --platform android --profile production
```

Once the builds are complete, Expo will provide download links for your `.aab` bundle files (e.g. `next360-customer-prod.aab`). Download these files to your computer.

---

## 🌐 Phase 4: Google Play Console Configuration

1. **Log in / Sign up**: Go to the [Google Play Console](https://play.google.com/console/) and sign in using your Developer Account.
2. **Create New Apps**:
   * Click **Create App** in the top-right corner.
   * Do this twice to create two separate app listings:
     * App 1: `Next360 - Organic Marketplace` (Type: App, Free)
     * App 2: `Next360 Delivery` (Type: App, Free)

### 3. Store Listing Assets (Prepare the following)
For both listings, upload:
* **App Icon**: 512 x 512 px PNG (transparent background).
* **Feature Graphic**: 1024 x 500 px JPEG/PNG (banner graphic).
* **Screenshots**: At least 4-6 high-resolution screenshots of the app screens.

### 4. Mandatory Content Declarations
Under the **App Content** section in the sidebar, fill out the following questionnaires:
* **Privacy Policy**: Link to your privacy policy web page (e.g., `https://next360.com/privacy`).
* **Target Audience**: Select **18 and over**.
* **Financial Features**: Disclose that the app facilitates online payments/checkouts (uses Razorpay integration).
* **Data Safety Questionnaire**:
  * *Location*: Yes, coarse and fine GPS location collected for delivery address lookup.
  * *Personal Info*: Yes, Phone Number & User ID collected for Zomato-style OTP login.

---

## 🚀 Phase 5: Uploading & Submitting for Review

1. In the Play Console sidebar, navigate to **Testing** $\rightarrow$ **Internal testing**.
2. Click **Create new release**.
3. Upload the `.aab` file you downloaded from Phase 3.
4. Enter release notes (e.g. `"Initial launch of Next360 Organic Grocery Marketplace"`).
5. Click **Save** $\rightarrow$ **Review release** $\rightarrow$ **Start roll-out to Internal testing**.
6. Add your email address and test team emails to the testers list so you can install it on your phones.
7. Once internal testing is verified, promote the release to **Production** for Google Reviewers to review and list the app publicly!
