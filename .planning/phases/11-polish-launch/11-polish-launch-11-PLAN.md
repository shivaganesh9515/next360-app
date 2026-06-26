---
phase: 11-polish-launch
plan: 11
type: execute
wave: 7
depends_on:
  - 01-foundation-01
  - 02-auth-02
  - 03-core-api-a-03
  - 03-core-api-b-04
  - 04-vendor-dashboard-05
  - 05-customer-app-a-06
  - 06-customer-app-b-07
  - 08-orders-payments-08
  - 09-admin-dashboard-09
  - 10-delivery-app-10
files_modified:
  - apps/api/src/app.module.ts
  - apps/api/src/common/filters/global-exception.filter.ts
  - apps/api/src/common/interceptors/response.interceptor.ts
  - apps/api/src/common/interceptors/logging.interceptor.ts
  - apps/api/src/notifications/notifications.module.ts
  - apps/api/src/notifications/notifications.service.ts
  - apps/api/src/notifications/notifications.controller.ts
  - apps/api/src/seed/seed.module.ts
  - apps/api/src/seed/seed.service.ts
  - apps/api/src/seed/seed.controller.ts
  - apps/api/src/common/guards/throttler.guard.ts
  - apps/delivery-app/src/lib/notifications.ts
  - apps/delivery-app/package.json
  - apps/customer-app/src/lib/notifications.ts
  - apps/customer-app/package.json
  - apps/customer-app/src/components/ErrorBoundary.tsx
  - apps/delivery-app/src/components/ErrorBoundary.tsx
  - apps/vendor-dashboard/src/components/ErrorBoundary.tsx
  - apps/admin-dashboard/src/components/ErrorBoundary.tsx
  - packages/shared/src/index.ts
  - turbo.json
  - .github/workflows/ci.yml
  - apps/customer-app/app.json
  - apps/delivery-app/app.json
  - package.json (root)
autonomous: false
requirements:
  - POLISH-01
  - POLISH-02
  - POLISH-03
  - POLISH-04
  - POLISH-05
must_haves:
  truths:
    - "App handles errors gracefully without crashing"
    - "Users receive push notifications for order updates"
    - "API has rate limiting to prevent abuse"
    - "CI pipeline validates builds and tests"
    - "Seed data exists for demo and development"
    - "App is optimized and ready for production"
  artifacts:
    - path: "apps/api/src/common/filters/global-exception.filter.ts"
      provides: "Global error handling for all API routes"
    - path: "apps/api/src/notifications/notifications.service.ts"
      provides: "Push notification service using Expo Push API"
    - path: "apps/api/src/seed/seed.service.ts"
      provides: "Database seed service with demo data"
    - path: ".github/workflows/ci.yml"
      provides: "CI pipeline for build and test validation"
  key_links:
    - from: "apps/api/src/notifications/notifications.service.ts"
      to: "apps/api/src/orders/orders.service.ts"
      via: "Send notification on status transitions"
    - from: "apps/customer-app/src/components/ErrorBoundary.tsx"
      to: "App.tsx"
      via: "Wraps root navigation"
    - from: ".github/workflows/ci.yml"
      to: "turbo.json"
      via: "Runs turbo build and lint"
---

<objective>
Polish the entire platform: add error boundaries, push notifications, rate limiting, CI pipeline, seed data, and performance optimization.

Purpose: Production readiness — ensure the platform is robust, performant, and ready for launch with proper error handling, notifications, and CI/CD.
Output: Global error handling, push notification infrastructure, rate limiting, seed data, CI pipeline, and app optimizations across all apps.
</objective>

<execution_context>
@C:/Users/gunny/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/gunny/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-foundation-01-SUMMARY.md
@.planning/phases/02-auth/02-auth-02-SUMMARY.md
@.planning/phases/03-core-api-a/03-core-api-a-03-SUMMARY.md
@.planning/phases/03-core-api-b/03-core-api-b-04-SUMMARY.md
@.planning/phases/05-customer-app-a/05-customer-app-a-06-SUMMARY.md
@.planning/phases/06-customer-app-b/06-customer-app-b-07-SUMMARY.md
@.planning/phases/08-orders-payments/08-orders-payments-08-SUMMARY.md
@.planning/phases/09-admin-dashboard/09-admin-dashboard-09-SUMMARY.md
@.planning/phases/10-delivery-app/10-delivery-app-10-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Global error handling + rate limiting + API hardening</name>
  <files>
    apps/api/src/common/filters/global-exception.filter.ts
    apps/api/src/common/interceptors/response.interceptor.ts
    apps/api/src/common/interceptors/logging.interceptor.ts
    apps/api/src/common/guards/throttler.guard.ts
    apps/api/src/app.module.ts
    apps/api/package.json
  </files>
  <action>
    Implement global error handling, API hardening, and rate limiting across the NestJS API:

    1. Create src/common/filters/global-exception.filter.ts:
       - Catches all unhandled exceptions (HttpException, and generic Error)
       - Returns consistent JSON response:
         ```json
         {
           "statusCode": 500,
           "message": "Internal server error",
           "error": "INTERNAL_ERROR",
           "timestamp": "2024-01-01T00:00:00.000Z",
           "path": "/api/orders",
           "requestId": "uuid"
         }
         ```
       - For HttpException: preserve status, message, and error code
       - For Prisma errors (PrismaClientKnownRequestError):
         - P2002 (unique constraint): 409 CONFLICT with friendly message
         - P2025 (not found): 404 NOT_FOUND with friendly message
         - P2003 (foreign key): 400 BAD_REQUEST
         - All others: 500 with generic message
       - For Zod validation errors (if used): 422 with field-level errors
       - For all other errors:
         - Log full error with stack trace (use NestJS Logger)
         - Return 500 with generic message (don't expose internals)
       - Include requestId from request header or generate UUID
       - Include path from request.url
       - Register in app.module.ts providers

    2. Create src/common/interceptors/response.interceptor.ts:
       - Wraps all successful responses in consistent envelope:
         ```json
         {
           "success": true,
           "data": { ... },
           "meta": {
             "timestamp": "2024-01-01T00:00:00.000Z",
             "requestId": "uuid"
           }
         }
         ```
       - For paginated responses, include meta:
         ```json
         {
           "success": true,
           "data": [...],
           "meta": {
             "page": 1,
             "limit": 20,
             "total": 100,
             "totalPages": 5,
             "timestamp": "...",
             "requestId": "uuid"
           }
         }
         ```

    3. Create src/common/interceptors/logging.interceptor.ts:
       - Log all incoming requests: method, URL, timestamp, requestId
       - Log outgoing responses: status code, duration (ms)
       - Use NestJS Logger with context "HTTP"
       - Register globally

    4. Create src/common/guards/throttler.guard.ts:
       - Rate limiting using @nestjs/throttler
       - Default: 10 requests per second per IP
       - Auth endpoints (/auth/*): 5 requests per minute (prevent brute force)
       - Public routes: 30 requests per minute
       - Admin routes: 100 requests per minute
       - Return 429 TOO_MANY_REQUESTS with retry-after header
       - Configuration in app.module.ts

    5. Update apps/api/src/app.module.ts:
       - Import and register:
         - ThrottlerModule.forRoot() with config
         - APP_FILTER for GlobalExceptionFilter
         - APP_INTERCEPTOR for ResponseInterceptor
         - APP_INTERCEPTOR for LoggingInterceptor
       - CORS configuration: allow origins from env, credentials: true
       - Helmet middleware for security headers
       - RequestId middleware (generate UUID for each request)

    6. Install dependencies: @nestjs/throttler, helmet, uuid
       - Update apps/api/package.json

    Security hardening:
    - Validate Content-Type headers on POST/PUT/PATCH (application/json)
    - Request size limit (1MB default)
    - CORS whitelist from env variable
    - All errors are logged with requestId for traceability
  </action>
  <verify>
    Check API returns consistent error envelope on 400/404/500 errors.
    Check rate limiting returns 429 after exceeding limit.
    Check response interceptor wraps data in { success: true, data: ... }.
    Check request logging shows method, URL, duration.
  </verify>
  <done>
    Global error handling, rate limiting, and API hardening are complete.
  </done>
</task>

<task type="auto">
  <name>Task 2: Push notifications + Expo notification setup + error boundaries</name>
  <files>
    apps/api/src/notifications/notifications.module.ts
    apps/api/src/notifications/notifications.service.ts
    apps/api/src/notifications/notifications.controller.ts
    apps/api/src/app.module.ts
    apps/delivery-app/src/lib/notifications.ts
    apps/customer-app/src/lib/notifications.ts
    apps/delivery-app/package.json
    apps/customer-app/package.json
    apps/customer-app/src/components/ErrorBoundary.tsx
    apps/delivery-app/src/components/ErrorBoundary.tsx
    apps/vendor-dashboard/src/components/ErrorBoundary.tsx
    apps/admin-dashboard/src/components/ErrorBoundary.tsx
  </files>
  <action>
    Implement push notification infrastructure and error boundaries across all apps:

    1. Create apps/api/src/notifications/notifications.service.ts:
       - Service for sending push notifications via Expo Push API
       - sendPushNotification(expoPushToken, title, body, data):
         - POST to https://exp.host/--/api/v2/push/send
         - Body: { to: token, sound: "default", title, body, data: { ... } }
         - Handle response: check for errors, log failures
       - sendOrderStatusNotification(order, userPushToken):
         - Sends push when order status changes
         - Templates per status:
           - CONFIRMED: "Order Confirmed! Your order #XYZ has been confirmed."
           - PREPARING: "Order is being prepared at [store name]."
           - OUT_FOR_DELIVERY: "Your order #XYZ is out for delivery! 🚚"
           - DELIVERED: "Order delivered! Enjoy your [store type] products 🎉"
           - CANCELLED: "Order #XYZ has been cancelled."
       - sendNewOrderNotification(deliveryPartnerToken, orderData):
         - "New delivery available! Order #XYZ from [store name]."
       - Bulk send: iterate over array of tokens with batching
       - Error handling: log failed tokens, remove invalid tokens from DB

    2. Create apps/api/src/notifications/notifications.module.ts:
       - NestJS module exporting NotificationsService
       - Register in app.module.ts imports

    3. Create apps/api/src/notifications/notifications.controller.ts:
       - POST /notifications/register — register Expo push token
         - Body: { expoPushToken: string }
         - Auth required (any role)
         - Save token to user profile or push_tokens table
       - DELETE /notifications/unregister — remove push token
       - GET /notifications/tokens — get registered tokens (admin only)

    4. Integrate notifications with order status updates:
       - wire in orders.service.ts: after status update, send push notification
       - Customer: look up user's push token from user profile
       - Delivery partner: look up assigned delivery partner's push token
       - Log notification send status (don't fail order on notification failure)

    5. Create Expo notification helpers:
       - apps/customer-app/src/lib/notifications.ts:
         - registerForPushNotifications(): request permissions, get Expo push token
         - POST to /notifications/register with the token
         - Handle notification tap (navigate to order detail)
         - Handle foreground notifications (show in-app banner)
         - Use expo-notifications and expo-device
       - apps/delivery-app/src/lib/notifications.ts:
         - Same pattern as customer
         - On notification tap: navigate to OrderDetailScreen
       - Add expo-notifications, expo-device to both apps' package.json

    6. Create ErrorBoundary components for each app:
       - apps/customer-app/src/components/ErrorBoundary.tsx:
         - React error boundary (class component)
         - Catches render errors
         - Shows friendly fallback UI:
           - "Something went wrong" message
           - App icon/logo
           - "Try Again" button -> reset error state
           - "Go Home" button -> navigate to home
           - Error details in dev mode only
         - Logs error to console (future: send to error tracking)
       - apps/delivery-app/src/components/ErrorBoundary.tsx:
         - Same pattern, delivery-themed fallback
       - apps/vendor-dashboard/src/components/ErrorBoundary.tsx:
         - React error boundary for Next.js (use ErrorBoundary wrapper)
         - Fallback: "Dashboard error" with reload button
       - apps/admin-dashboard/src/components/ErrorBoundary.tsx:
         - Same pattern, admin-themed fallback

    7. Wire ErrorBoundary at root of each app:
       - Customer app: wrap NavigationContainer in App.tsx
       - Delivery app: wrap NavigationContainer
       - Vendor dashboard: wrap root layout
       - Admin dashboard: wrap root layout

    Design:
    - Error fallback: centered, minimal, brand colors, accessible
    - Notifications: use platform-appropriate alerts
    - Handle notification permissions denied gracefully
  </action>
  <verify>
    Check API register endpoint saves push token.
    Check notification service sends via Expo Push API.
    Check ErrorBoundary fallback renders on render error.
    Verify notification permission request works on app start.
  </verify>
  <done>
    Push notification infrastructure works and error boundaries are in place across all apps.
  </done>
</task>

<task type="auto">
  <name>Task 3: Seed data + CI pipeline + performance optimization + app config</name>
  <files>
    apps/api/src/seed/seed.module.ts
    apps/api/src/seed/seed.service.ts
    apps/api/src/seed/seed.controller.ts
    apps/api/src/app.module.ts
    .github/workflows/ci.yml
    turbo.json
    apps/customer-app/app.json
    apps/delivery-app/app.json
    package.json (root)
  </files>
  <action>
    Implement seed data, CI pipeline, build optimization, and final production configuration:

    1. Create apps/api/src/seed/seed.service.ts:
       - SeedDatabaseService with cascade seeding:
       - Users (10):
         - 1 admin (admin@next360.com / password123)
         - 3 vendors (organic@next360.com, natural@next360.com, eco@next360.com)
         - 4 customers (customer1-4@next360.com)
         - 2 delivery partners (delivery1@next360.com, delivery2@next360.com)
         - All with hashed passwords (bcrypt)
       - User profiles for each user
       - Categories (12):
         - 4 per store type: Organic (Fruits, Vegetables, Grains, Dairy), Natural (Skincare, Haircare, Wellness, Home), Eco-Friendly (Kitchen, Cleaning, Accessories, Clothing)
       - Vendors (3, linked to vendor users):
         - "Green Earth Organics" (ORGANIC)
         - "Pure Natural Living" (NATURAL)
         - "Eco Harmony Store" (ECO_FRIENDLY)
         - Each with commission rate 15%, status APPROVED
       - Products (24):
         - 8 per vendor (varied prices, descriptions, images)
       - Orders (5):
         - 2 DELIVERED, 1 IN_TRANSIT, 1 READY_FOR_DELIVERY, 1 PENDING
         - With order items, addresses, various payment methods
       - Seeder should be idempotent (check existing data before insert)
       - Progress logging during seed

    2. Create apps/api/src/seed/seed.controller.ts:
       - POST /seed — run seed (admin only)
       - POST /seed/reset — drop all data and re-seed (admin only, with confirmation)
       - GET /seed/status — check if DB has data

    3. Create apps/api/src/seed/seed.module.ts:
       - NestJS module importing PrismaModule
       - Register SeedDatabaseService and SeedController
       - Import in app.module.ts

    4. Create .github/workflows/ci.yml:
       - Trigger: push to main, pull requests
       - Jobs:
         - lint-and-typecheck:
           - Run on ubuntu-latest
           - Steps: checkout, setup node (18), npm ci, npm run lint, npm run typecheck
           - Cache node_modules with turbo cache
         - build:
           - Needs lint passes
           - npm run build (turbo build)
         - test:
           - Needs build passes
           - npm run test (if tests exist)
       - Environment variables for API URL (secrets)
       - Notifications on failure (optional, slack webhook if configured)
       - Timeout: 15 minutes

    5. Update turbo.json:
       - Add cache outputs for all apps
       - Configure dependsOn for proper build ordering:
         - packages/shared#build -> all apps
         - apps/vendor-dashboard#build -> apps/api
         - apps/admin-dashboard#build -> apps/api
       - Remote caching config (optional, for team)

    6. Update package.json (root):
       - Scripts:
         - "build": "turbo run build"
         - "lint": "turbo run lint"
         - "typecheck": "turbo run typecheck"
         - "dev": "turbo run dev"
         - "seed": "cd apps/api && npm run seed"
       - engines: { node: ">=18.0.0" }

    7. Update app.json for both mobile apps:
       - apps/customer-app/app.json:
         - App name: "Next360 - Organic Marketplace"
         - Slug: "next360-customer"
         - Icon, splash screen config
         - Android: package name, version
         - iOS: bundle identifier, version
         - Plugins: expo-notifications, expo-location
         - Background modes: remote-notification
       - apps/delivery-app/app.json:
         - App name: "Next360 Delivery"
         - Slug: "next360-delivery"
         - Similar config, diff identifiers
         - Plugins: expo-notifications, expo-location, react-native-maps

    8. Performance optimization:
       - API: add compression middleware (compression package)
       - API: enable NestJS cache module for GET endpoints
       - Customer app: lazy load screens (React.lazy or expo-router dynamic routes)
       - Delivery app: lazy load screens
       - Vendor dashboard: bundle analysis config (next/bundle-analyzer)
       - Admin dashboard: bundle analysis config
       - Image optimization: verify Supabase Storage image transforms are used
       - All apps: verify production builds complete without errors

    9. Create .env.example files for each app:
       - apps/api/.env.example: all required env vars with placeholder values
       - apps/customer-app/.env.example
       - apps/delivery-app/.env.example
       - apps/vendor-dashboard/.env.example
       - apps/admin-dashboard/.env.example

    Verification strategy:
    - Run seed endpoint and verify data in DB
    - Run CI pipeline locally (act) or push to test
    - Build all apps with turbo build
    - Verify mobile apps build with npx expo export
  </action>
  <verify>
    Check seed endpoint populates DB with demo data.
    Check CI pipeline YAML is valid (can be parsed by GitHub).
    Check `npm run build` succeeds for all apps with turbo.
    Check app.json configs are valid for both mobile apps.
    Check .env.example files exist for all apps.
  </verify>
  <done>
    Seed data, CI pipeline, performance optimization, and production configuration are complete.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Platform polish: global error handling, rate limiting, push notifications, error boundaries, seed data, CI pipeline, and production configuration</what-built>
  <how-to-verify>
    1. Start API server: `cd apps/api && npm run start:dev`
    2. Test error handling:
       - GET /api/nonexistent -> 404 with consistent error envelope
       - POST /api/orders without auth -> 401
       - Send malformed JSON -> 400
    3. Test rate limiting:
       - Rapidly call any endpoint 15+ times -> 429 on the 11th call
    4. Test seed data:
       - POST /api/seed (as admin) -> check DB populated with users, vendors, products, orders
       - Check all 10 users created with correct roles
    5. Test push notifications:
       - POST /api/notifications/register with expo push token -> 201
       - Update an order status -> notification service invoked
    6. Test ErrorBoundary:
       - Temporarily throw error in a component -> see fallback UI with "Try Again" button
    7. Test CI pipeline structure:
       - Check .github/workflows/ci.yml is valid
    8. Test production build:
       - `npm run build` at root -> all apps build successfully
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
1. Global exception filter provides consistent error responses
2. Rate limiting prevents abuse with 429 responses
3. Response interceptor wraps all responses in consistent envelope
4. Push notifications send via Expo Push API on order status changes
5. Error boundaries catch render errors across all apps
6. Seed data creates realistic demo data for all entities
7. CI pipeline validates builds on push/PR
8. All apps build in production mode without errors
9. app.json configurations are valid for app store submission prep
</verification>

<success_criteria>
- Platform has global error handling and consistent API responses
- Push notification infrastructure works for order updates
- Error boundaries catch and gracefully handle render errors in all apps
- Seed data populates the platform for demo/testing
- CI pipeline automates build verification
- All apps build and are ready for production deployment
</success_criteria>

<output>
After completion, create `.planning/phases/11-polish-launch/11-polish-launch-11-SUMMARY.md`
</output>
