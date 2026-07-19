# Project Flow

## Request Lifecycle
```
Client → Express (NestJS) → JwtAuthGuard → RolesGuard → Controller → Service → Prisma → Postgres
                                              ↓
                                    ValidationPipe (DTO)
                                              ↓
                                    ResponseInterceptor → { success, data, meta }
                                              ↓
                                    GlobalExceptionFilter (on error)
```

## Auth Flow
```
Phone OTP (Customer): send-otp → verify-otp-login → JWT
Email+Password (Vendor/Admin): login → JWT
JWT contains: { sub: userId, email, role }
Guards: JwtAuthGuard (validates token) → RolesGuard (checks @Roles decorator)
```

## Order Flow
```
Customer places order → Cart items → Order + OrderVendorGroup[] (one per vendor)
  → Each OrderVendorGroup has own status tracking
  → Payment via Razorpay (or COD capped at ₹2,000)
  → Vendor confirms → Packs → Ready for pickup
  → Delivery partner assigned → Pickup (OTP verified) → Out for delivery → Delivered
```

## Admin Oversight Flow
```
Admin Dashboard → aggregate metrics (parallel Prisma queries)
Vendor approval → PATCH /vendors/:id/status → audit log
Product approval → PATCH /products/:id/approve → audit log
Settings → PATCH /admin/settings → audit log
```

## Notification Flow
```
Service method → create Notification record → sendPushToUser (Expo Push API)
Role-based: sendPushToRole → queries PushToken where user.role = X
```
