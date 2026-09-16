# Database

> **Last updated:** 2026-08-10

---

## Prisma Schema

**File:** prisma/schema.prisma (541 lines)
**ORM:** Prisma v6
**Database:** Supabase Postgres
**Migration:** 20260714132826_init (initial migration applied)

## Models (20+)

### Core Models
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| User | id, email, phone, role, name | -> Vendor, CartItem, Order, Address, Review, WishlistItem |
| Vendor | id, storeName, storeType, commissionPct, zoneId | -> User, Product, OrderVendorGroup |
| Zone | id, name, cities, deliveryRadius, codCap | -> Vendor, DeliveryPartner |
| Category | id, name, slug, storeType, image | -> SubCategory, Product |
| SubCategory | id, name, slug, categoryId | -> Category, Product |
| Brand | id, name, slug, storeType, logo | -> Product |
| Product | id, name, slug, price, stock, vendorId, categoryId | -> Vendor, Category, Brand, CartItem, OrderItem, Review |
| ProductVariant | id, productId, name, price, stock | -> Product |
| CartItem | id, userId, productId, quantity | -> User, Product |
| WishlistItem | id, userId, productId | -> User, Product |
| Review | id, userId, productId, rating, comment | -> User, Product |
| Address | id, userId, fullAddress, city, lat, lng, isDefault | -> User |

### Order Models
| Model | Key Fields | Notes |
|-------|-----------|-------|
| Order | id, userId, status, total, paymentId | Root order entity |
| OrderVendorGroup | id, orderId, vendorId, status, subtotal, commissionPct | Critical pattern - one per vendor |
| OrderItem | id, orderVendorGroupId, productId, quantity, price | Belongs to a vendor group |
| DeliveryAssignment | id, orderVendorGroupId, partnerId, otp, status | OTP-verified pickup/dropoff |
| Payment | id, orderId, method, status, razorpayOrderId | Payment tracking |
| ReturnRequest | id, orderItemId, reason, status | Refund requests |

### Finance Models
| Model | Description |
|-------|-------------|
| Commission | Per-order vendor commission tracking |
| Payout | Vendor payout record (Razorpay Route) |

### Engagement Models
Coupon, Offer, Notification, PushToken

### AI Models
AI_Log (interaction log), AI_Recommendation (product recommendations)

### Admin Models
CMS_Page (content pages), Banner (hero banners), Role (with JSON permissions), Permission (granular)

### Compliance Models
KYC (Know Your Customer - documents, status, verification)

### Loyalty Models (NEW)
| Model | Description |
|-------|-------------|
| Purchase | Tracks purchases for loyalty points |
| PointsLedger | Full audit trail of all point transactions |
| UserMetrics | Points balance, tier, RFM segmentation |
| Referral | Referral tracking (referrer, referred, status) |
| LoyaltyConfig | Platform-wide loyalty settings |

---

## Key Relationships

### Order Structure (Critical Pattern)


### Product Inheritance
Product -> vendor.storeType (NOT on Product itself)
Product -> Category, SubCategory, Brand
Product -> ProductVariant[]

### User Relationships
User -> Vendor (if role = VENDOR)
User -> DeliveryPartner (if role = DELIVERY_PARTNER)
User -> CartItem[], Order[], Address[], Review[], WishlistItem[]

---

## Important Schema Notes
- **Address uses fullAddress** - not street. Don't look for a street field.
- **Vendor uses storeName** - not businessName.
- **CartItem unique on (userId + productId)** - not (userId + productId + variantId).
- **storeType inherited from vendor** - products don't have their own storeType.
- **OrderVendorGroup is the critical pattern** - not OrderItem.
- **DeliveryAssignment includes OTP** - verified on pickup.
- **DeliveryPartner tracks currentLat/currentLng** - for live tracking.
