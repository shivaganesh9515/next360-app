# Architecture

## Backend Structure
```
apps/api/src/
├── main.ts                    # Bootstrap: Helmet, CORS, ValidationPipe, global prefix /api
├── app.module.ts              # Root module: ~35 feature modules, APP_FILTER, APP_INTERCEPTOR
├── prisma/                    # PrismaService (extends PrismaClient)
├── common/
│   ├── filters/               # GlobalExceptionFilter (Prisma error mapping)
│   ├── interceptors/          # ResponseInterceptor (envelope), LoggingInterceptor
│   └── guards/                # ThrottlerGuard (custom, IP-based tracking)
├── auth/
│   ├── auth.module.ts         # Passport JWT strategy, JWT secret config
│   ├── auth.service.ts        # OTP store (in-memory Map), login, register
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   ├── decorators/            # @CurrentUser, @Roles
│   └── strategies/            # JwtStrategy (passport-jwt)
├── users/                     # Profile (GET/PATCH me), admin list, role update
├── vendors/                   # Register, list, approve, status, detail
├── products/                  # CRUD, search/filter/pagination, variants, approve
├── orders/                    # Create from cart, list, status update, cancel
├── payments/                  # Razorpay order, verify, webhook
├── cart/                      # POST/GET/PATCH/DELETE with stock validation
├── wishlist/                  # POST/DELETE, list
├── reviews/                   # POST create, GET by product
├── addresses/                 # CRUD with default toggle
├── categories/                # CRUD with storeType filter
├── sub-categories/            # CRUD nested under categories
├── brands/                    # CRUD with storeType filter
├── coupons/                   # CRUD with validation
├── offers/                    # CRUD with date range
├── returns/                   # POST request, PATCH approve/reject
├── inventory/                 # GET stock, PATCH update, GET low-stock
├── upload/                    # POST image (multipart → Supabase Storage)
├── notifications/             # CRUD, push token management, 33+ event methods
├── commission/                # Summary, pay, rate
├── kyc/                       # Submit, status, verify
├── roles/                     # CRUD roles with JSON permissions
├── permissions/               # CRUD permissions
├── cms/                       # Pages + Banners CRUD
├── ai/                        # Chat, scan, recommendations, health-insights
├── seed/                      # Demo data reset
├── health/                    # Health check endpoint
├── admin/                     # Dashboard, platform settings
├── audit/                     # Audit logs + summary
├── delivery-slot/             # Slot config, admin management
├── delivery/                  # Assignment, OTP verification, tracking
├── disputes/                  # Customer disputes, admin resolution
├── delivery-partners/         # CRUD, status, KYC
├── zones/                     # CRUD zones
├── users/dto/                 # UpdateProfileDto
├── auth/dto/                  # LoginDto, RegisterDto, SendOtpDto, VerifyOtpDto
└── ... (other module DTOs)
```

## Module Registration Order (app.module.ts)
```
ThrottlerModule → PrismaModule → HealthModule → AuthModule → UsersModule →
CategoriesModule → VendorsModule → ProductsModule → UploadModule →
AddressesModule → CartModule → WishlistModule → ReviewsModule →
CouponsModule → OffersModule → ReturnsModule → NotificationsModule →
OrdersModule → PaymentsModule → CommissionModule → BrandsModule →
KycModule → SubCategoriesModule → RolesModule → CmsModule →
InventoryModule → AiModule → SeedModule → DeliveryPartnersModule →
ZonesModule → DisputesModule → AuditModule → AdminModule →
DeliverySlotModule → DeliveryModule
```

## App-Level Providers (app.module.ts)
```
APP_FILTER: GlobalExceptionFilter
APP_INTERCEPTOR: ResponseInterceptor
APP_INTERCEPTOR: LoggingInterceptor
```

## Key Patterns
- **No APP_GUARD** registered — ThrottlerGuard exists but is not applied globally
- **No Helmet** — security headers not set
- **ValidationPipe** at global level with `whitelist + forbidNonWhitelisted + transform`
- **CORS** allows localhost:3001, localhost:3002
- **Global prefix:** `/api`
