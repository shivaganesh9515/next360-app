# Database

## Stack
- Supabase Postgres (hosted)
- Prisma v5+ ORM
- Schema at `prisma/schema.prisma`

## Enums
```
StoreType: ORGANIC, NATURAL, ECO_FRIENDLY
UserRole: CUSTOMER, VENDOR, DELIVERY_PARTNER, ADMIN
OrderStatus: PLACED, CONFIRMED, PACKED, READY_FOR_PICKUP, ASSIGNED_TO_DELIVERY,
             PICKED_UP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, REFUNDED
PaymentStatus: PENDING, PAID, FAILED, REFUNDED
VendorStatus: PENDING, APPROVED, SUSPENDED, REJECTED
DeliveryPartnerStatus: OFFLINE, AVAILABLE, ON_DELIVERY
KycStatus: PENDING, VERIFIED, REJECTED
ReturnStatus: PENDING, APPROVED, REJECTED, REFUNDED
CouponType: PERCENTAGE, FIXED
```

## Core Models (30+)
```
User, Vendor, Zone, Category, SubCategory, Brand, Product, ProductVariant,
CartItem, WishlistItem, Review, Address, Order, OrderVendorGroup, OrderItem,
DeliveryAssignment, DeliveryFailure, Payment, Commission, Payout, Coupon,
Offer, ReturnRequest, KYC, Notification, PushToken, AI_Log, AI_Recommendation,
CMS_Page, Banner, Role, Permission, PlatformSettings, DeliverySlotConfig,
DeliverySlotBooking, AuditLog
```

## Key Relationships
```
Order → OrderVendorGroup[] → OrderItem[]
                           → DeliveryAssignment (one per group)
                           → DeliverySlotBooking

Vendor → Product[]
Vendor → OrderVendorGroup[]
Vendor → Coupon[]
Vendor → Offer[]
Vendor → Commission[]
Vendor → Payout[]

User → Vendor? (one-to-one)
User → DeliveryPartner? (one-to-one)
User → Address[]
User → Order[]
User → Notification[]
User → PushToken[]
User → AuditLog[]

Zone → Vendor[]
Zone → DeliveryPartner[]
Zone → DeliverySlotConfig[]
```

## Models NOT Yet in Schema
```
SupportTicket   — needs creation for support module
TicketMessage   — needs creation for support module
TicketStatus    — enum: OPEN, IN_PROGRESS, RESOLVED, CLOSED
```

## Prisma Error → HTTP Mapping
| Prisma Error | HTTP | Use Case |
|-------------|------|----------|
| P2002 | 409 | Duplicate email/phone/coupon code |
| P2025 | 404 | Record not found |
| P2003 | 400 | Foreign key violation |
