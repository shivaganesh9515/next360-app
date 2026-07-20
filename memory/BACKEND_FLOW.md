# Backend Flow

> **Last updated:** 2026-07-20

---

## API Architecture

NestJS v11 (Express) on port 4000. Modular architecture with feature modules, DTOs, and guards.

### Request Lifecycle

Request -> ThrottlerGuard -> JwtAuthGuard -> RolesGuard -> Controller -> Service -> PrismaService -> Response Interceptor -> Response

### Response Envelope

Success: { success: true, data: {...}, meta: { timestamp, requestId } }
Error: { statusCode: 400, message: ..., error: BAD_REQUEST, timestamp, path, requestId }
Paginated: { success: true, data: [...], meta: { page, limit, total, totalPages } }

---

## Authentication Flow

### Supabase Auth + JWT + OTP

1. Signup: email/phone -> Supabase Auth -> JWT
2. Login: credentials verified -> JWT -> SecureStore (mobile) / localStorage (web)
3. OTP: OTP sent -> code verified -> token issued
4. Token validation: JwtAuthGuard validates Bearer token
5. RBAC: @Roles("ADMIN") + RolesGuard checks role

### Auth Roles
- CUSTOMER - Standard marketplace user
- VENDOR - Manage products, fulfill orders
- DELIVERY_PARTNER - Accept/complete deliveries
- ADMIN - Full platform control

### Auth Module Structure
auth.controller.ts - /auth/signup, /auth/login, /auth/verify-otp, /auth/forgot-password, /auth/reset-password, /auth/me
auth.service.ts - Business logic
guards/ - jwt-auth.guard.ts, roles.guard.ts
strategies/ - jwt.strategy.ts (Passport)
decorators/ - current-user.decorator.ts, roles.decorator.ts

---

## Middleware / Guard Flow

### Order of execution (per route)
1. ThrottlerGuard - Rate limiting
2. JwtAuthGuard - Token validation
3. RolesGuard - Role authorization
4. @CurrentUser() - Extract user
5. Controller method
6. PrismaService - DB operations

### Error Handling Chain
- Prisma P2002 -> 409 Conflict (duplicate)
- Prisma P2025 -> 404 Not Found
- Prisma P2003 -> 400 Bad Request
- Validation error -> 400 Bad Request
- Auth error -> 401 Unauthorized
- Role error -> 403 Forbidden
- Unhandled -> 500 Internal Server Error

### Interceptors
- ResponseInterceptor - Wraps in { success, data, meta }
- LoggingInterceptor - Logs request/response

---

## Database Flow

Service -> PrismaService -> Prisma Client -> Supabase Postgres

### Key Models (20+)
Core: User, Vendor, Zone, Category, SubCategory, Brand, Product, ProductVariant, CartItem, WishlistItem, Review, Address
Orders: Order, OrderVendorGroup, OrderItem, DeliveryAssignment, Payment, ReturnRequest
Finance: Commission, Payout
Engagement: Coupon, Offer, Notification, PushToken
AI: AI_Log, AI_Recommendation
Admin: CMS_Page, Banner, Role, Permission
Compliance: KYC

### Critical Pattern - OrderVendorGroup
Order -> OrderVendorGroup[] -> OrderItem[] -> DeliveryAssignment
Each group tracks one vendor's fulfillment independently.

---

## Payment Flow

### Razorpay Integration (India, INR)
1. Frontend requests /payments/razorpay-order
2. NestJS creates order via Razorpay API
3. Frontend receives razorpay_order_id
4. /payments/verify with signature
5. Webhook: /payments/webhook handles payment.captured / payment.failed
6. COD fallback: orders under Rs. 2,000

### Razorpay Route (Multi-Vendor Split)
Customer Payment -> Platform Account -> Auto-split to each vendor's linked account
Platform retains commission (default 15%)
Delivery partner payouts are SEPARATE (weekly batch, NOT through Route)

### Order Status Machine
PLACED -> CONFIRMED -> PACKED -> ASSIGNED_TO_DELIVERY -> PICKED_UP -> OUT_FOR_DELIVERY -> DELIVERED -> CANCELLED -> REFUNDED
