---
phase: 01-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/api/package.json
  - apps/api/tsconfig.json
  - apps/api/src/main.ts
  - apps/api/src/app.module.ts
  - packages/shared/src/index.ts
  - packages/shared/tsconfig.json
  - package.json
  - turbo.json
  - .eslintrc.js
  - prisma/schema.prisma
  - .env.example
autonomous: false
requirements:
  - SETUP-01
  - SETUP-02
  - SETUP-03
  - SETUP-04
  - SETUP-05
must_haves:
  truths:
    - "Monorepo compiles with `turbo build`"
    - "NestJS server starts and responds to health check"
    - "Prisma schema matches the full data model (22+ models: User, Vendor, Zone, DeliveryPartner, Brand, Wishlist, Review, Coupon, Offer, KYC, Return, Notification, AI_Log, CMS_Page, Role, Permission + OrderVendorGroup + core 10)"
    - "OrderVendorGroup model exists — one per vendor per order (multi-vendor split pattern)"
    - "DeliveryAssignment links to OrderVendorGroup (not Order) and has otp, pickedUpAt, deliveredAt fields"
    - "DeliveryPartner is a separate model with currentLat, currentLng, status (OFFLINE/AVAILABLE/ON_DELIVERY)"
    - "Zone model exists with city field — Vendor and DeliveryPartner both belong to a Zone"
    - "OrderStatus enum has 9 states: PLACED CONFIRMED PACKED ASSIGNED_TO_DELIVERY PICKED_UP OUT_FOR_DELIVERY DELIVERED CANCELLED REFUNDED"
    - "Supabase project is connected"
    - "Database migrations run cleanly"
  artifacts:
    - path: "package.json"
      provides: "Turborepo root config"
      contains: "\"turbo\""
    - path: "turbo.json"
      provides: "Pipeline configuration"
      contains: "\"pipeline\""
    - path: "apps/api/src/main.ts"
      provides: "NestJS entry point"
      contains: "NestFactory"
    - path: "prisma/schema.prisma"
      provides: "Full database schema"
      contains: "model Vendor"
    - path: ".env.example"
      provides: "Environment template"
      contains: "SUPABASE_URL"
  key_links:
    - from: "apps/api/src/main.ts"
      to: "apps/api/src/app.module.ts"
      via: "NestFactory.create"
    - from: "prisma/schema.prisma"
      to: "supabase"
      via: "datasource db"
    - from: "turbo.json"
      to: "apps/api"
      via: "pipeline.build.depends_on"
---

<objective>
Set up the Turborepo monorepo, NestJS backend, Supabase database, and Prisma schema for the entire platform.

Purpose: Establish the foundation that all other phases build upon. Get the monorepo compiling, database connected, and data model defined.
Output: Working monorepo with NestJS API, Prisma schema, Supabase connection, and CI-ready config.
</objective>

<execution_context>
@C:/Users/gunny/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/gunny/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scaffold Turborepo monorepo with shared configs</name>
  <files>
    package.json
    turbo.json
    tsconfig.base.json
    .eslintrc.js
    .prettierrc
    .gitignore
    packages/shared/package.json
    packages/shared/tsconfig.json
    packages/shared/src/index.ts
    packages/eslint-config/package.json
    packages/eslint-config/index.js
    packages/tsconfig/base.json
  </files>
  <action>
    Create a Turborepo monorepo from scratch at the root of C:\Users\gunny\development\next360-app:

    1. Initialize root package.json with:
       - name: "next360"
       - private: true
       - workspaces: ["apps/*", "packages/*"]
       - scripts: { build: "turbo build", dev: "turbo dev", lint: "turbo lint" }
       - devDependencies: turbo, typescript, eslint, prettier

    2. Create turbo.json with pipeline config for build, dev, lint that respects depends_on and outputs

    3. Create packages/shared/ with tsconfig, package.json (name: "@next360/shared"), and an index.ts that re-exports types.
       This package will hold shared TypeScript types, constants, and utilities used across apps.

    4. Create packages/eslint-config/ with a shared ESLint config for TypeScript.

    5. Create packages/tsconfig/ with a base tsconfig.json that all apps extend.

    6. Create a proper .gitignore (node_modules, .turbo, dist, .next, .expo, *.env)

    DO NOT run npm install yet — that happens after all package.jsons are ready.
  </action>
  <verify>
    Run `node -e "console.log(JSON.parse(require('fs').readFileSync('package.json','utf8')).workspaces)"` — confirms workspaces array exists.
    Check `turbo.json` has pipeline key.
    Confirm packages/shared, packages/eslint-config, packages/tsconfig directories exist.
  </verify>
  <done>
    Root monorepo with turbo.json, shared packages, and base configs is created. `turbo build` would work after installing deps.
  </done>
</task>

<task type="auto">
  <name>Task 2: Scaffold NestJS API app and Prisma schema</name>
  <files>
    apps/api/package.json
    apps/api/tsconfig.json
    apps/api/nest-cli.json
    apps/api/src/main.ts
    apps/api/src/app.module.ts
    apps/api/src/health/health.controller.ts
    apps/api/src/health/health.module.ts
    prisma/schema.prisma
    prisma/seed.ts
    .env.example
  </files>
  <action>
    Create apps/api/ as a NestJS application:

    1. Create apps/api/package.json with:
       - name: "@next360/api"
       - scripts: { start, dev, build, lint, "prisma:generate", "prisma:migrate" }
       - dependencies: @nestjs/core, @nestjs/common, @nestjs/platform-express, @prisma/client, reflect-metadata, rxjs
       - devDependencies: @nestjs/cli, @nestjs/schematics, typescript, ts-node, prisma, @types/express, @types/node

    2. Create apps/api/tsconfig.json extending @next360/tsconfig/base

    3. Create nest-cli.json with @nestjs/schematics

    4. Create src/main.ts — bootstrap NestJS app on port 4000, enable CORS, log startup

    5. Create src/app.module.ts — root module importing all feature modules

    6. Create src/health/ — a simple GET /health endpoint returning { status: "ok", timestamp }

    7. Create prisma/schema.prisma with the FULL data model:

    ```prisma
    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }

    enum StoreType {
      ORGANIC
      NATURAL
      ECO_FRIENDLY
    }

    enum UserRole {
      CUSTOMER
      VENDOR
      DELIVERY_PARTNER
      ADMIN
    }

    enum OrderStatus {
      PLACED
      CONFIRMED
      PACKED
      ASSIGNED_TO_DELIVERY
      PICKED_UP
      OUT_FOR_DELIVERY
      DELIVERED
      CANCELLED
      REFUNDED
    }

    enum PaymentStatus {
      PENDING
      PAID
      FAILED
      REFUNDED
    }

    enum VendorStatus {
      PENDING
      APPROVED
      SUSPENDED
      REJECTED
    }

    enum DeliveryPartnerStatus {
      OFFLINE
      AVAILABLE
      ON_DELIVERY
    }

    model User {
      id          String   @id @default(uuid())
      email       String   @unique
      phone       String?
      name        String?
      role        UserRole @default(CUSTOMER)
      avatarUrl   String?
      isActive    Boolean  @default(true)
      createdAt   DateTime @default(now())
      updatedAt   DateTime @updatedAt

      addresses    Address[]
      cartItems    CartItem[]
      orders       Order[]
      vendor       Vendor?
      deliveries   DeliveryAssignment[]
    }

    // Zone — city-based zone gating (MVP: Hyderabad + Vijayawada)
    model Zone {
      id        String   @id @default(uuid())
      name      String
      city      String
      isActive  Boolean  @default(true)

      vendors          Vendor[]
      deliveryPartners DeliveryPartner[]
    }

    model Vendor {
      id            String       @id @default(uuid())
      userId        String       @unique
      user          User         @relation(fields: [userId], references: [id])
      storeName     String
      storeSlug     String       @unique
      storeType     StoreType
      description   String?
      logoUrl       String?
      bannerUrl     String?
      status        VendorStatus @default(PENDING)
      commissionPct Float        @default(10.0)
      razorpayAccountId String?  // for Razorpay Route payouts
      zoneId        String
      zone          Zone         @relation(fields: [zoneId], references: [id])
      createdAt     DateTime     @default(now())
      updatedAt     DateTime     @updatedAt

      products      Product[]
      vendorGroups  OrderVendorGroup[]
    }

    // Separate DeliveryPartner model (not just a User role)
    model DeliveryPartner {
      id          String                @id @default(uuid())
      userId      String                @unique
      user        User                  @relation(fields: [userId], references: [id])
      vehicleType String
      zoneId      String
      zone        Zone                  @relation(fields: [zoneId], references: [id])
      status      DeliveryPartnerStatus @default(OFFLINE)
      currentLat  Float?                // updated periodically for live tracking
      currentLng  Float?
      createdAt   DateTime              @default(now())
      updatedAt   DateTime              @updatedAt

      assignments DeliveryAssignment[]
    }

    model Category {
      id          String    @id @default(uuid())
      name        String
      slug        String
      description String?
      imageUrl    String?
      storeType   StoreType
      isActive    Boolean   @default(true)
      createdAt   DateTime  @default(now())
      updatedAt   DateTime  @updatedAt

      products    Product[]

      @@unique([slug, storeType])
    }

    model Product {
      id          String   @id @default(uuid())
      vendorId    String
      vendor      Vendor   @relation(fields: [vendorId], references: [id])
      categoryId  String
      category    Category @relation(fields: [categoryId], references: [id])
      name        String
      description String?
      price       Decimal  @db.Decimal(10, 2)
      compareAtPrice Decimal? @db.Decimal(10, 2)
      unit        String   // kg, g, piece, bunch, litre, etc.
      stock       Int      @default(0)
      images      String[] // URLs stored in Supabase Storage
      isActive    Boolean  @default(true)
      createdAt   DateTime @default(now())
      updatedAt   DateTime @updatedAt

      cartItems   CartItem[]
      orderItems  OrderItem[]
    }

    model CartItem {
      id        String   @id @default(uuid())
      userId    String
      user      User     @relation(fields: [userId], references: [id])
      productId String
      product   Product  @relation(fields: [productId], references: [id])
      quantity  Int      @default(1)
      createdAt DateTime @default(now())
      updatedAt DateTime @updatedAt

      @@unique([userId, productId])
    }

    model Address {
      id         String  @id @default(uuid())
      userId     String
      user       User    @relation(fields: [userId], references: [id])
      label      String? // Home, Work, Other
      fullAddress String
      city       String
      state      String
      pincode    String
      lat        Float?
      lng        Float?
      isDefault  Boolean @default(false)
      createdAt  DateTime @default(now())
      updatedAt  DateTime @updatedAt
    }

    // One customer order can span multiple vendors — each vendor's portion is tracked independently
    model Order {
      id              String        @id @default(uuid())
      orderNo         String        @unique
      userId          String
      user            User          @relation(fields: [userId], references: [id])
      addressId       String
      address         Address       @relation(fields: [addressId], references: [id])
      totalAmount     Decimal       @db.Decimal(10, 2)
      paymentMethod   String        // RAZORPAY | COD
      paymentStatus   PaymentStatus @default(PENDING)
      razorpayOrderId String?
      status          OrderStatus   @default(PLACED)
      notes           String?
      createdAt       DateTime      @default(now())
      updatedAt       DateTime      @updatedAt

      vendorGroups    OrderVendorGroup[]
    }

    // One record per vendor per order — tracked and fulfilled independently (Swiggy/Zomato model)
    model OrderVendorGroup {
      id        String      @id @default(uuid())
      orderId   String
      order     Order       @relation(fields: [orderId], references: [id])
      vendorId  String
      vendor    Vendor      @relation(fields: [vendorId], references: [id])
      subtotal  Decimal     @db.Decimal(10, 2)
      status    OrderStatus @default(PLACED)

      items     OrderItem[]
      delivery  DeliveryAssignment?
    }

    model OrderItem {
      id                 String           @id @default(uuid())
      orderVendorGroupId String
      group              OrderVendorGroup @relation(fields: [orderVendorGroupId], references: [id])
      productId          String
      product            Product          @relation(fields: [productId], references: [id])
      name               String           // snapshot at order time
      priceAtPurchase    Decimal          @db.Decimal(10, 2)
      quantity           Int
    }

    // One delivery assignment per OrderVendorGroup (not per Order)
    model DeliveryAssignment {
      id                 String           @id @default(uuid())
      orderVendorGroupId String           @unique
      orderVendorGroup   OrderVendorGroup @relation(fields: [orderVendorGroupId], references: [id])
      deliveryPartnerId  String
      deliveryPartner    DeliveryPartner  @relation(fields: [deliveryPartnerId], references: [id])
      assignedAt         DateTime         @default(now())
      otp                String           // verified on pickup
      pickedUpAt         DateTime?
      deliveredAt        DateTime?
    }

    model Payment {
      id              String        @id @default(uuid())
      orderId         String
      order           Order         @relation(fields: [orderId], references: [id])
      razorpayPaymentId String?
      razorpayOrderId String?
      amount          Decimal       @db.Decimal(10, 2)
      status          String        @default("PENDING") // PENDING, CAPTURED, FAILED, REFUNDED
      method          String?
      createdAt       DateTime      @default(now())
    }
    ```

    8. Create .env.example with:
       - DATABASE_URL
       - SUPABASE_URL
       - SUPABASE_ANON_KEY
       - SUPABASE_SERVICE_ROLE_KEY
       - JWT_SECRET
       - RAZORPAY_KEY_ID
       - RAZORPAY_KEY_SECRET

    9. Create prisma/seed.ts with initial category data for each store type and basic roles/permissions.

    10. Add new Prisma models to the schema:
        - Brand: id, name, slug, description, imageUrl, storeType, isActive
        - SubCategory: id, name, slug, categoryId (relation), storeType
        - ProductVariant: id, productId, name, price, stock, sku
        - WishlistItem: id, userId, productId, createdAt (@@unique userId+productId)
        - Review: id, userId, productId, rating (1-5), title, body, isVerifiedPurchase, createdAt
        - Coupon: id, code (unique), type (PERCENTAGE/FIXED), value, minOrderAmount, maxDiscount, usageLimit, expiresAt, isActive
        - Offer: id, title, description, storeType, discountType, discountValue, startDate, endDate, isActive
        - ReturnRequest: id, orderId, orderItemId, userId, reason, status (PENDING/APPROVED/REJECTED/REFUNDED), refundAmount, createdAt
        - KYC: id, userId, documentType, documentNumber, documentUrl, status (PENDING/VERIFIED/REJECTED), rejectionReason, submittedAt, verifiedAt
        - Notification: id, userId, title, body, type, data (JSON), isRead, createdAt
        - AI_Log: id, userId, type (SCANNER/CHAT/RECOMMENDATION), input, output, metadata (JSON), createdAt
        - CMS_Page: id, title, slug (unique), content, metaTitle, metaDescription, isPublished, createdAt
        - Banner: id, title, imageUrl, linkUrl, storeType, position, isActive
        - Role: id, name (unique), description, permissions (JSON), isSystem
        - Permission: id, name (unique), resource, action
        - PushToken: id, userId, token, platform, createdAt
        - Payout: id, vendorId/deliveryPartnerId, amount, status, period, paidAt
  </action>
  <verify>
    Run `node -e "console.log(require('fs').existsSync('apps/api/src/main.ts'))"` — confirms main.ts exists.
    Run `node -e "console.log(require('fs').existsSync('prisma/schema.prisma'))"` — confirms schema exists.
    Verify prisma/schema.prisma contains all models: User, Vendor, Category, SubCategory, Brand, Product, ProductVariant, CartItem, WishlistItem, Review, Address, Order, OrderItem, DeliveryAssignment, Payment, Coupon, Offer, ReturnRequest, KYC, Commission, Payout, Notification, CMS_Page, Banner, AI_Log, AI_Recommendation, Role, Permission, PushToken.
  </verify>
  <done>
    NestJS app structure and complete Prisma schema are in place. Ready for npm install and prisma migrate.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Turborepo monorepo scaffold + NestJS app + Prisma schema</what-built>
  <how-to-verify>
    1. Verify the directory structure:
       ```
       package.json (root with workspaces)
       turbo.json
       apps/api/src/main.ts
       prisma/schema.prisma
       packages/shared/src/index.ts
       ```
    2. Review prisma/schema.prisma to confirm all 10 models are present.
    3. Run: `npm install` in the root (installs all workspace deps)
    4. Run: `npx prisma generate` — should complete without errors
    5. Run: `npx prisma db push` — should create tables in Supabase (requires DATABASE_URL in .env)
    6. Install Supabase CLI or manually create a Supabase project, add the connection string to .env
    7. Start: `cd apps/api && npx nest start --watch` — should start on port 4000
    8. Visit http://localhost:4000/health — should return `{ "status": "ok" }`
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
1. `npm install` completes without errors
2. `npx prisma generate` outputs Prisma client generation success
3. Supabase project created and DATABASE_URL configured
4. `npx prisma db push` runs without errors
5. NestJS server starts and responds on port 4000
6. `GET /health` returns HTTP 200 with status body
</verification>

<success_criteria>
- Turborepo builds successfully with `turbo build`
- NestJS API health endpoint responds
- Prisma schema with all 18+ models is pushed to Supabase
- Shared packages compile without errors
- The project is ready for Phase 2 (Auth)
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-foundation-01-SUMMARY.md`
</output>
