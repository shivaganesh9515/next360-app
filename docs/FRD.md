# NEXT360
## Master Functional Requirements Document — FRD

**Product:** Next360
**Type:** Organic / Natural / Eco-Friendly Multi-Vendor Marketplace
**Document:** Master Functional Requirements Document
**Version:** 1.0
**Status:** Master Baseline — Review & Freeze
**MVP Geography:** Hyderabad + Vijayawada
**Architecture:** Turborepo Monorepo
**Primary Backend:** NestJS
**Database:** PostgreSQL + Prisma
**Authentication:** Supabase Auth + JWT
**Payments:** Razorpay
**Realtime:** Supabase Realtime
**Mobile:** Expo / React Native
**Web:** Next.js

---

# 1. PURPOSE OF THIS DOCUMENT

This FRD is the **single functional source of truth for Next360**.

It defines:

- What Next360 does
- Who can use it
- What each application is responsible for
- How customers, vendors, delivery partners and administrators interact
- How orders move through the platform
- How payments and settlements work
- How data is structured
- How authentication and authorization work
- How applications communicate with the backend
- What the MVP includes
- What is deferred
- What remains undecided
- How functionality will ultimately be tested and accepted

This document must be maintained whenever a change affects:

- Business logic
- User workflows
- Permissions
- Order states
- Payments
- Database behavior
- API contracts
- Security
- Application responsibilities
- MVP scope

The codebase must **not silently become the specification**.

---

# 2. PRODUCT OVERVIEW

Next360 is a multi-vendor marketplace focused on three product/storefront classifications:

```text
ORGANIC
NATURAL
ECO_FRIENDLY
```

The platform connects:

```text
Customers
    ↓
Marketplace
    ↓
Vendors
    ↓
Delivery Partners
    ↓
Platform Administration
```

The platform supports:

- Product discovery
- Vendor storefronts
- Multi-vendor carts
- Multi-vendor checkout
- Online payments
- COD
- Vendor-specific order fulfillment
- Delivery partner assignment
- OTP-based pickup
- Live delivery tracking
- Vendor commissions
- Vendor payouts
- Delivery partner earnings
- Reviews
- Loyalty
- Referrals
- Coupons
- Offers
- Customer support
- KYC
- Platform administration

---

# 3. PRODUCT OBJECTIVES

### Primary objectives

1. Build a trusted marketplace for Organic, Natural and Eco-Friendly products.
2. Allow multiple vendors to participate in a single customer checkout.
3. Keep vendor fulfillment independently manageable.
4. Provide real-time delivery visibility.
5. Give vendors operational control without allowing them to bypass platform governance.
6. Give administrators centralized control over marketplace operations.
7. Maintain strict separation between authentication, authorization and email delivery.
8. Build the system so additional cities/zones can be added without architectural redesign.
9. Maintain auditable financial and operational records.
10. Provide a scalable foundation rather than a collection of client-side shortcuts.

---

# 4. SYSTEM ARCHITECTURE

## 4.1 Monorepo

```text
next360-app/
│
├── apps/
│   ├── api/
│   ├── customer-app/
│   ├── delivery-app/
│   ├── vendor-dashboard/
│   ├── admin-panel/
│   └── marketing/
│
├── packages/
│   ├── shared/
│   ├── tsconfig/
│   └── eslint-config/
│
├── prisma/
│   └── schema.prisma
│
├── turbo.json
├── package.json
└── ...
```

---

# 5. APPLICATIONS

| Application | Technology | Responsibility |
|---|---|---|
| API | NestJS | Core backend/business logic |
| Customer App | Expo / React Native | Customer marketplace |
| Delivery App | Expo / React Native | Delivery operations |
| Vendor Dashboard | Next.js | Vendor operations |
| Admin Panel | Next.js | Platform operations |
| Marketing | Next.js | Public website |

### Shared packages

| Package | Purpose |
|---|---|
| `@next360/shared` | Shared types/constants/utilities |
| `@next360/tsconfig` | Shared TypeScript configuration |
| `@next360/eslint-config` | Shared ESLint configuration |

These should **remain separate workspace packages**.

The six applications should **not be merged into one application**.

---

# 6. ARCHITECTURAL PRINCIPLES

The following are mandatory engineering principles.

### 6.1 Backend is authoritative

The client must never be trusted for:

- Final price
- Stock
- Commission
- COD eligibility
- Payment status
- Order status
- Vendor ownership
- Delivery assignment
- Permissions
- Zone eligibility

The backend recalculates and validates these values.

### 6.2 Business logic belongs in the API

Customer, vendor, delivery and admin applications are clients.

They must not independently implement authoritative business rules.

### 6.3 Database integrity matters

Critical relationships and invariants should be protected using:

- Primary keys
- Foreign keys
- Unique constraints
- Appropriate indexes
- Check constraints where practical
- Transactions

### 6.4 Financial operations must be auditable

Payments, commissions, refunds and payouts must maintain historical records.

Financial records should not simply be overwritten.

### 6.5 Authorization is more than roles

The system must check:

```text
Authentication
        ↓
Role
        ↓
Permission
        ↓
Resource ownership
        ↓
Business-state eligibility
```

Example:

A user being `VENDOR` does **not** mean they can access every vendor.

They can access only their own vendor resources.

---

# 7. ACTORS

## 7.1 Customer

Can:

- Register/login
- Select supported location
- Browse products
- Search
- Filter
- View vendors
- Manage cart
- Apply coupons
- Checkout
- Pay
- Track orders
- Manage addresses
- Review purchases
- Request returns
- Contact support
- Manage wishlist
- Earn loyalty points
- Use referrals
- View notifications

---

## 7.2 Vendor

Can:

- Register
- Submit KYC
- Manage store information
- Manage products
- Manage variants
- Manage inventory
- Receive orders
- Update fulfillment status
- Configure delivery estimates
- View customers within permitted scope
- Manage coupons/offers
- View analytics
- View earnings
- View transactions
- Request/receive payouts
- Contact support

Cannot:

- Approve own products
- Approve own KYC
- Access another vendor's data
- Modify platform-wide settings
- Manipulate commissions
- Change financial history

---

## 7.3 Delivery Partner

Can:

- Authenticate
- Complete onboarding
- Submit KYC
- Configure vehicle
- Select availability
- Receive assignments
- Accept/reject assignments
- Pickup orders using OTP
- Update delivery status
- Send live location
- View earnings
- View delivery history
- Contact support

Cannot:

- Assign themselves arbitrary orders
- Access another partner's assignments
- Modify payout records
- Change order financial information

---

## 7.4 Admin

Can perform platform-level operations according to assigned permissions.

Responsibilities include:

- Vendor moderation
- KYC verification
- Product moderation
- Order operations
- Delivery operations
- Zone management
- Payment operations
- Payout management
- Commission management
- Dispute management
- User management
- Role/permission management
- CMS
- Promotions
- Reports
- Analytics
- Audit review

---

# 8. AUTHENTICATION

## 8.1 Authentication architecture

```text
Client
   ↓
Supabase Auth
   ↓
Authenticated identity
   ↓
JWT
   ↓
NestJS API
   ↓
JWT validation
   ↓
Role / Permission Guard
   ↓
Resource authorization
```

Supabase Auth is responsible for identity/session functionality.

NestJS remains responsible for **Next360 business authorization**.

---

# 9. AUTHENTICATION METHODS

Current supported/planned flows:

- Phone OTP
- Email/password where applicable
- Google login
- Apple login
- Forgot password
- Reset password
- Session retrieval
- Current-user endpoint

### Customer

Primary:

```text
Phone
 ↓
OTP
 ↓
Authenticated session
```

### Vendor

Current dashboard flow:

```text
Email
+
Password
 ↓
Authentication
```

### Admin

Admin authentication must use stronger controls appropriate for privileged accounts.

---

# 10. SMTP

SMTP is **not the authentication system**.

SMTP belongs to:

```text
Email Delivery
```

Examples:

- Verification emails
- Password reset
- Transactional emails
- Administrative emails

Architecture:

```text
Next360 API
    ↓
Email Service
    ↓
Authenticated SMTP / Email Provider
    ↓
User Inbox
```

SMTP credentials must never be exposed to:

- Customer app
- Delivery app
- Vendor dashboard
- Admin panel

---

# 11. AUTHORIZATION

Roles:

```text
CUSTOMER
VENDOR
DELIVERY_PARTNER
ADMIN
```

The API uses role guards such as:

```text
@Roles(...)
```

But role checks alone are insufficient.

Example:

```text
GET /vendors/me/orders
```

must ensure:

```text
Authenticated
      +
VENDOR
      +
vendorId belongs to authenticated vendor
```

---

# 12. API RESPONSE STANDARD

Every successful API response follows:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Errors must pass through the global exception filter.

Conceptually:

```json
{
  "success": false,
  "data": null,
  "meta": {},
  "error": {}
}
```

The final error schema should be frozen through the API contract/OpenAPI specification.

---

# 13. API RULES

The API must:

- Validate DTOs
- Validate authorization
- Validate ownership
- Validate business state
- Validate zone
- Validate stock
- Validate payment state
- Validate promotions
- Use transactions for critical mutations
- Use idempotency for retry-sensitive operations
- Avoid leaking internal errors
- Avoid leaking secrets
- Use consistent pagination

---

# 14. DATABASE

Database:

```text
PostgreSQL
    ↓
Prisma
    ↓
prisma/schema.prisma
```

`schema.prisma` is the application data-model source of truth.

---

# 15. CORE DATABASE MODELS

```text
User
Vendor
Zone

Category
SubCategory
Brand
Product
ProductVariant

CartItem
WishlistItem
Review
Address

Order
OrderVendorGroup
OrderItem
DeliveryAssignment

Payment
Commission
Payout

Coupon
Offer

Notification
PushToken

AI_Log
AI_Recommendation

CMS_Page
Banner

Role
Permission

KYC
```

---

# 16. DATABASE RELATIONSHIP MODEL

Core marketplace relationship:

```text
User
 │
 ├── Cart
 ├── Wishlist
 ├── Addresses
 ├── Orders
 └── Reviews

Vendor
 │
 ├── Products
 ├── Inventory
 ├── Orders
 ├── Commissions
 ├── Payouts
 └── Customers

Order
 │
 ├── OrderVendorGroup
 │       │
 │       ├── OrderItem
 │       ├── DeliveryAssignment
 │       └── Commission
 │
 └── Payment
```

---

# 17. STORE TYPES

Supported values:

```text
ORGANIC
NATURAL
ECO_FRIENDLY
```

StoreType belongs to vendor/store context.

Frontend discovery uses it for:

- Filtering
- Storefront presentation
- Product discovery
- Vendor discovery

---

# 18. STORE DESIGN SYSTEM

Locked design tokens:

```text
Background: #FFFFFF
Text:       #1C1B17
Brass:      #C9A66B
```

Store accents:

```text
ORGANIC
#5C6B4D

NATURAL
#9B6A3F

ECO_FRIENDLY
#2F5D62
```

Typography:

```text
Fraunces
Inter
JetBrains Mono
```

Store switching changes approved accent values.

It does **not** re-theme:

- Cart
- Checkout
- Tracking
- Profile
- Other transactional screens

---

# 19. VENDOR LIFECYCLE

```text
Vendor Registration
        ↓
KYC Submission
        ↓
Admin Review
        ↓
Approved / Rejected
        ↓
Store Configuration
        ↓
Product Submission
        ↓
Product Pending Approval
        ↓
Admin Approval
        ↓
Product Published
```

Unapproved vendors/products must not become normally purchasable.

---

# 20. KYC

KYC supports:

- Vendor documents
- Delivery partner documents
- Submission
- Status
- Admin verification
- Rejection reason

Suggested status model:

```text
PENDING
VERIFIED
REJECTED
```

KYC actions must be auditable.

---

# 21. PRODUCT MANAGEMENT

Product lifecycle:

```text
Vendor creates product
        ↓
isApproved = false
        ↓
Admin review
        ↓
APPROVED / REJECTED
        ↓
Active/inactive availability
```

Approval and active status are separate concepts.

---

# 22. PRODUCT VARIANTS

Variants may contain:

- Unit
- Weight
- Price
- Stock
- SKU
- Other variant-specific information

### Current gap

The customer application currently displays variants but does not provide complete variant selection.

This must be resolved before variant-dependent purchasing is considered complete.

---

# 23. CART

Current business rule:

```text
(userId + productId)
        ↓
UNIQUE
```

Cart requirements:

- Add product
- Increase quantity
- Decrease quantity
- Remove product
- Validate stock
- Validate product availability
- Group by vendor
- Validate coupons

Checkout must revalidate everything.

---

# 24. MULTI-VENDOR ORDER MODEL

This is one of the most important architecture decisions.

A checkout produces:

```text
ONE ORDER
     │
     ├── Vendor Group A
     │     ├── Items
     │     ├── Status
     │     └── Delivery Assignment
     │
     ├── Vendor Group B
     │     ├── Items
     │     ├── Status
     │     └── Delivery Assignment
     │
     └── Vendor Group C
           ├── Items
           ├── Status
           └── Delivery Assignment
```

This is the required Swiggy/Zomato-style model.

---

# 25. WHY ORDER GROUPING EXISTS

Suppose a customer buys:

```text
Vendor A
- Honey

Vendor B
- Organic Rice

Vendor C
- Bamboo Product
```

The customer sees:

```text
ONE CHECKOUT
ONE ORDER
```

But operationally:

```text
Vendor A → separate fulfillment
Vendor B → separate fulfillment
Vendor C → separate fulfillment
```

Each vendor group can therefore have:

- Independent status
- Independent delivery assignment
- Independent delivery estimate
- Independent commission
- Independent settlement basis

---

# 26. ORDER STATE MACHINE

Normal lifecycle:

```text
PLACED
   ↓
CONFIRMED
   ↓
PACKED
   ↓
READY_FOR_PICKUP
   ↓
ASSIGNED_TO_DELIVERY
   ↓
PICKED_UP
   ↓
OUT_FOR_DELIVERY
   ↓
DELIVERED
```

Exceptional:

```text
CANCELLED
REFUNDED
```

---

# 27. ORDER STATE AUTHORITY

| Transition | Responsible actor |
|---|---|
| PLACED → CONFIRMED | Vendor |
| CONFIRMED → PACKED | Vendor |
| PACKED → READY_FOR_PICKUP | Vendor |
| READY_FOR_PICKUP → ASSIGNED | Admin/System |
| ASSIGNED → PICKED_UP | Delivery Partner + OTP |
| PICKED_UP → OUT_FOR_DELIVERY | Delivery Partner |
| OUT_FOR_DELIVERY → DELIVERED | Delivery Partner |
| Cancellation | Policy-dependent |
| Refund | Authorized financial workflow |

The frontend cannot directly force a state.

---

# 28. ORDER INVARIANTS

The API must reject:

```text
DELIVERED → PACKED
```

or:

```text
PLACED → DELIVERED
```

unless a specifically defined business workflow allows it.

No client is allowed to bypass the state machine.

---

# 29. PARENT ORDER STATUS

The parent order contains multiple vendor groups.

Therefore the final aggregation policy must be explicitly defined.

For example:

```text
Vendor A → DELIVERED
Vendor B → OUT_FOR_DELIVERY
```

The parent order must **not** be considered fully delivered.

This parent-status aggregation rule is an open decision that must be frozen.

---

# 30. DELIVERY ESTIMATION

Vendor controls:

```text
deliveryTimeMin
deliveryTimeMax
deliveryTimeLabel
```

Example:

```text
10–20 minutes
Farm Direct
```

This information is displayed on:

- ProductCard
- Vendor Storefront
- Cart
- Checkout
- Order Confirmation
- Tracking

At order creation, the applicable estimate must be persisted.

Later vendor changes must not rewrite historical order estimates.

---

# 31. ETA POLICY

Current baseline:

```text
Vendor-configured delivery estimate
```

Example:

```text
10–20 minutes
```

The platform must not pretend that this is dynamic predictive ETA unless a real ETA engine exists.

Future dynamic ETA may consider:

- Distance
- Partner availability
- Vendor preparation time
- Traffic
- Queue
- Historical delivery time

But that is a separate capability.

---

# 32. ZONE SYSTEM

MVP:

```text
Hyderabad
Vijayawada
```

Zone is a first-class entity.

Relationship:

```text
Vendor → Zone

Delivery Partner → Zone

Customer → Selected Zone

Order → Zone
```

---

# 33. ZONE RULES

The backend must validate:

```text
Customer zone
      +
Vendor zone
      +
Delivery zone
      +
Order zone
```

before allowing relevant operations.

The frontend must never be the final zone authority.

---

# 34. ZONE EXTENSIBILITY

Do not hard-code:

```typescript
if (city === "Hyderabad")
```

throughout the application.

Instead:

```text
Zone
├── id
├── name
├── city
├── active
├── radius/configuration
├── COD policy
└── other operational rules
```

This allows future expansion without architectural redesign.

---

# 35. OPEN ZONE DECISION

The exact geographic mechanism must be finalized:

```text
City-based
OR
Radius-based
OR
Polygon/geofence
OR
Hybrid
```

The current requirement mentioning radius is not enough to silently decide the final model.

---

# 36. PAYMENT ARCHITECTURE

Primary payment:

```text
Razorpay
```

Currency:

```text
INR
```

Alternative:

```text
COD
```

COD maximum:

```text
₹2,000
```

---

# 37. ONLINE PAYMENT FLOW

```text
Customer Checkout
       ↓
Create Order
       ↓
Create Razorpay Order
       ↓
Customer Payment
       ↓
Razorpay
       ↓
Verification/Webhook
       ↓
Payment Status
       ↓
Order Financial State
```

Payment success must never be based only on a client callback.

---

# 38. PAYMENT WEBHOOK RULES

Webhook processing must:

- Verify signature
- Validate payload
- Be idempotent
- Store provider event/reference
- Handle duplicate delivery
- Update payment state safely
- Reconcile with order
- Be auditable

---

# 39. COD

COD is permitted only when:

```text
Final payable amount <= ₹2,000
```

The backend must enforce this.

A client sending:

```json
{
  "paymentMethod": "COD"
}
```

must not bypass the limit.

---

# 40. COMMISSION

Default:

```text
15%
```

Commission may be overridden according to approved vendor configuration.

The effective commission must be stored historically.

Example:

```text
Order:
₹1,000

Commission:
15%

Commission amount:
₹150
```

The exact calculation basis must include all applicable taxes/discounts/fees according to the finalized finance policy.

---

# 41. RAZORPAY ROUTE

Marketplace settlement:

```text
Customer Payment
       ↓
Razorpay
       ↓
Platform / Route
       ↓
Vendor Settlement
       ↓
Commission deducted
```

Razorpay Route provider identifiers must be stored.

---

# 42. PAYOUTS

Vendor payout records should have explicit statuses such as:

```text
PENDING
PROCESSING
PAID
FAILED
REVERSED
```

Exact final status vocabulary must be frozen.

Failed payouts must be:

- Visible to admin
- Retryable where provider allows
- Reconciled
- Audited

---

# 43. DELIVERY PARTNER FLOW

```text
Login
 ↓
Vehicle Setup
 ↓
KYC
 ↓
Verification
 ↓
Available
 ↓
Assignment
 ↓
Accept
 ↓
Pickup OTP
 ↓
Picked Up
 ↓
Out For Delivery
 ↓
Delivered
 ↓
Earnings
```

---

# 44. DELIVERY AVAILABILITY

Partner states:

```text
OFFLINE
AVAILABLE
ON_DELIVERY
```

Only appropriate states may receive assignments.

---

# 45. DELIVERY ASSIGNMENT

Assignment includes:

- Order/vendor group
- Partner
- Status
- Pickup information
- OTP
- Pickup timestamp
- Delivery timestamp
- Location information

---

# 46. ASSIGNMENT ACCEPTANCE

Incoming assignment:

```text
30-second countdown
```

Partner can:

```text
ACCEPT
REJECT
```

After expiry, the assignment must be handled by the defined assignment policy.

---

# 47. PICKUP OTP

Pickup requires OTP verification.

```text
Delivery Partner
       ↓
Enter OTP
       ↓
Backend validates
       ↓
Pickup confirmed
       ↓
PICKED_UP
```

The client must never validate the OTP independently.

---

# 48. REALTIME DELIVERY TRACKING

Required architecture:

```text
Delivery App
      │
      │ GPS
      ▼
Supabase Realtime
      │
      ▼
Customer App
      │
      ▼
Live Map
```

No polling for active delivery location.

---

# 49. LOCATION SECURITY

Customer must only receive location information for:

```text
their own active order
```

A customer must never be able to subscribe to another customer's delivery channel by changing an ID.

This requires realtime authorization.

---

# 50. LOCATION PRIVACY

The platform must define:

- Location collection start
- Location collection stop
- Active delivery retention
- Historical retention
- Access permissions
- Support/admin access
- Deletion/anonymization policy

---

# 51. CUSTOMER APP

Technology:

```text
Expo SDK 56
React Native
React Navigation
Zustand
```

---

# 52. CUSTOMER NAVIGATION

Initial flow:

```text
Splash
 ↓
Onboarding
 ↓
Auth
 ↓
OTP
 ↓
Location
 ↓
Main Tabs
```

If authenticated but city is missing:

```text
Authenticated
 ↓
Select Location
 ↓
Zone validation
 ↓
Main App
```

---

# 53. CUSTOMER MAIN SHELL

Main tabs:

```text
Home
All Products
Orders
Profile
```

Additional UI:

```text
Expanding Search Dock
Mini Cart Bar
Cart Sheet
Product Sheet
```

---

# 54. CUSTOMER HOME

Home includes:

- Greeting
- Search
- Storefront selector
- Banners
- Curated product rows
- Product grid

---

# 55. CUSTOMER STORE SELECTOR

Store selector:

```text
ORGANIC
NATURAL
ECO_FRIENDLY
```

Changing store type changes the approved accent system.

---

# 56. PRODUCT DISCOVERY

Filters:

- Store type
- Category
- Price
- Delivery time
- Vendor
- Sorting

API:

```text
GET /products
```

with supported filters.

---

# 57. SEARCH

Current flow:

```text
Search input
 ↓
GET products?search=
 ↓
Result grid
```

Autocomplete is currently not part of the implemented baseline.

---

# 58. VENDOR STOREFRONT

Displays:

- Vendor name
- Rating
- Delivery estimate
- Vendor products
- Store information

APIs:

```text
GET vendors/{id}
GET products?vendorId=
```

---

# 59. PRODUCT DETAIL

Current architecture:

```text
ProductCard
   ↓
Quick Add Sheet
   ↓
Full Product Sheet
```

Approximately:

```text
45% → Quick add
90% → Full detail
```

Includes:

- Image
- Price
- Unit
- Quantity
- Description
- Vendor
- Reviews
- Variants

Variant selection remains an implementation gap.

---

# 60. CART

Cart is grouped by vendor:

```text
Vendor A
 ├── Product
 └── Product

Vendor B
 ├── Product
 └── Product
```

Each vendor group displays its delivery estimate.

---

# 61. CHECKOUT

Checkout includes:

- Address
- Vendor breakdown
- Delivery estimate
- Coupon
- Payment method
- Order totals

Payment options:

```text
Razorpay
COD
```

COD blocked above ₹2,000.

---

# 62. ORDER CONFIRMATION

Confirmation displays:

- Order ID
- Vendor groups
- Items
- Payment
- Estimated delivery
- Relevant order information

---

# 63. CUSTOMER ORDERS

Order history:

```text
Order
 ├── Vendor Group
 ├── Vendor Group
 └── Vendor Group
```

Customer can:

- View order
- View status
- Track delivery
- Review
- Request return
- Contact support

---

# 64. CUSTOMER TRACKING

Tracking includes:

- Map
- Delivery partner location
- Order timeline
- Estimated arrival
- Countdown

Countdown behavior includes:

```text
< 5 minutes
→ attention/pulse

< 1 minute
→ "Arriving soon"
```

The UI must distinguish stale location from current location.

---

# 65. CUSTOMER PROFILE

Includes:

- Profile
- Orders
- Addresses
- Wishlist
- Loyalty
- Wallet
- Notifications
- Support
- Referrals
- Subscription where enabled
- Legal
- Delete account

---

# 66. CUSTOMER ADDRESS

Functions:

- List addresses
- Add
- Edit
- Delete
- Default toggle
- Map picker

The final cross-platform map behavior remains an implementation item.

---

# 67. CUSTOMER LOYALTY

Current tiers:

```text
Seed
↓
...
↓
Forest
```

Points include categories such as:

```text
PURCHASE_REWARD
REFERRAL_REWARD
```

Loyalty points should be ledger-based rather than relying only on a mutable balance.

---

# 68. DELIVERY APP

Technology:

```text
Expo
Expo Router
```

Design philosophy:

- Dense
- Fast
- Large touch targets
- One primary action
- Minimal distraction
- No unnecessary sheets
- No navigation during active delivery

---

# 69. DELIVERY APP ROUTES

```text
(auth)
├── login
├── phone-login
└── verify-otp

vehicle-setup
kyc-documents

(tabs)
├── index
├── new-orders
├── earnings
├── history
└── profile

delivery/[id]
delivery/complete

privacy-policy
terms-of-service
```

---

# 70. DELIVERY HOME

Displays:

- Availability
- Today's deliveries
- Earnings

Availability:

```text
OFFLINE
AVAILABLE
ON_DELIVERY
```

---

# 71. ACTIVE DELIVERY

The active delivery screen is state-driven.

```text
ASSIGNED
 ↓
PICKUP
 ↓
OTP
 ↓
PICKED_UP
 ↓
OUT_FOR_DELIVERY
 ↓
DELIVERED
```

Content changes according to state.

The user should not be unnecessarily navigated between multiple screens during an active delivery.

---

# 72. VENDOR DASHBOARD

Technology:

```text
Next.js
App Router
shadcn/ui
Tailwind
```

Primary navigation:

```text
Dashboard
Orders
Products
Inventory
Payouts
Settings
```

Additional capabilities include:

- Analytics
- Customers
- Coupons
- Offers
- Store
- Notifications
- Support

---

# 73. VENDOR DASHBOARD — DASHBOARD

Displays:

- New orders
- Today's revenue
- Low-stock alerts
- Pending payout

---

# 74. VENDOR ORDER MANAGEMENT

Tabs:

```text
New
Preparing
Ready
Completed
```

The UI maps to vendor group statuses.

Vendor may advance only permitted states.

---

# 75. VENDOR PRODUCTS

Product table:

- Image
- Name
- Category
- Price
- Stock
- Active state
- Approval state

Pending products display:

```text
Pending approval
```

---

# 76. VENDOR INVENTORY

Functions:

- Stock editing
- Low-stock identification
- Inventory visibility

Inventory must remain server authoritative.

---

# 77. VENDOR EARNINGS

Includes:

- Earnings
- Payouts
- Transactions

Financial displays should distinguish:

```text
Gross
Discounts
Refunds
Commission
Other applicable adjustments
Net payable
```

according to finalized finance rules.

---

# 78. VENDOR ANALYTICS

Includes:

- Sales
- Revenue
- Delivery performance
- Fastest delivery
- Slowest delivery
- Average delivery

Analytics must remain vendor-scoped.

---

# 79. VENDOR STORE

Vendor can manage:

- Business name
- GST information
- Zone
- Razorpay linking
- Delivery estimate

---

# 80. VENDOR DELIVERY CONFIGURATION

Vendor can configure:

```text
deliveryTimeMin
deliveryTimeMax
deliveryTimeLabel
```

The platform must validate allowed ranges.

---

# 81. ADMIN PANEL

Admin is the **platform control plane**.

It has the highest operational density.

Major sections:

```text
Dashboard
Vendors
Products
Orders
Delivery Partners
Zones
Payments
Payouts
Commissions
Disputes
Reviews
Support
Users
Roles
Audit Logs
Categories
Brands
Coupons
Offers
Inventory
CMS
Analytics
Reports
AI Logs
Settings
```

---

# 82. ADMIN VENDOR MANAGEMENT

Admin can:

- View vendors
- Review KYC
- Approve
- Reject
- Record rejection reason
- Configure commission
- Configure delivery policy
- View vendor information

Admin approval is authoritative.

---

# 83. ADMIN PRODUCT MODERATION

Admin can:

- View products
- Filter products
- Review products
- Approve
- Reject
- Bulk approve

Admin should not arbitrarily rewrite vendor-owned product information.

---

# 84. ADMIN ORDER MANAGEMENT

Admin can:

- View all orders
- View vendor groups
- View delivery assignments
- Investigate payment status
- Handle disputes
- Handle returns
- Handle refunds according to policy

Historical order data must remain auditable.

---

# 85. ADMIN DELIVERY MANAGEMENT

Admin can:

- Review delivery partners
- Verify KYC
- View status
- View zone
- View completed deliveries
- View rating
- Manage operational eligibility

---

# 86. ADMIN ZONE MANAGEMENT

Admin can:

- Add zone
- Edit zone
- Activate/deactivate
- Configure operational policies
- Configure COD limits

---

# 87. ADMIN FINANCE

Admin financial areas:

```text
Payments
Vendor Payouts
Delivery Payouts
Commissions
```

Functions include:

- View transactions
- View batches
- Investigate failures
- Retry eligible failed payouts
- Reconcile
- Review commission
- Review provider identifiers

---

# 88. ADMIN DISPUTES

Disputes should link to:

```text
Customer
Order
Vendor Group
Payment
Support Case
Resolution
```

Every resolution should be auditable.

---

# 89. ADMIN USERS & RBAC

The platform has:

```text
Roles
Permissions
```

The system should support granular permissions rather than assuming:

```text
ADMIN = unlimited everything
```

Examples:

```text
vendors.read
vendors.approve

products.read
products.approve

payments.read
payouts.process

roles.manage
audit.read
```

Final permission matrix must be frozen before production.

---

# 90. AUDIT LOGS

Sensitive operations must create audit records.

Examples:

- Vendor approval
- Product approval
- KYC decision
- Role change
- Permission change
- Commission change
- Payout retry
- Refund
- Dispute resolution
- Zone modification
- System configuration change

Audit should capture:

```text
Actor
Action
Target
Target ID
Timestamp
Result
Relevant context
```

Sensitive data must not be unnecessarily logged.

---

# 91. MARKETING WEBSITE

Technology:

```text
Next.js
Framer Motion
GSAP
Lenis
```

Responsibilities:

- Public brand presentation
- Marketplace introduction
- Store categories
- Vendor acquisition
- Delivery-partner acquisition
- Informational content
- Legal pages

Must include:

- SEO metadata
- Open Graph metadata
- Sitemap
- Robots configuration
- Performance optimization

---

# 92. NOTIFICATIONS

Channels:

```text
Push
Email
SMS/OTP
In-app
```

Examples:

### Customer

- Order placed
- Order confirmed
- Order packed
- Delivery assigned
- Out for delivery
- Delivered
- Promotional notifications

### Vendor

- New order
- Product approval
- Payout
- Operational alerts

### Delivery Partner

- New assignment
- Assignment updates
- Operational notifications

---

# 93. NOTIFICATION PRINCIPLE

Notification failure should not corrupt the underlying transaction.

Example:

```text
Order successfully created
        ↓
Push notification fails
        ↓
Order remains successful
```

The notification should be retried independently.

---

# 94. COUPONS

Coupon validation must occur server-side.

Rules may include:

- Minimum order
- Maximum discount
- Expiry
- User limits
- Global usage limits
- Vendor scope
- Product scope
- StoreType
- Eligibility

The exact promotion engine must be finalized.

---

# 95. OFFERS

Offers may support:

- Product-specific promotions
- Vendor-specific promotions
- Store-level promotions
- Time-limited offers

Final priority/stacking rules must be defined.

---

# 96. RETURNS

Current backend capability:

```text
ReturnRequest
```

Required lifecycle:

```text
Requested
   ↓
Under Review
   ↓
Approved / Rejected
   ↓
Resolution
```

Return policy must define:

- Eligible products
- Time window
- Reasons
- Evidence
- Vendor responsibility
- Delivery responsibility
- Refund impact

---

# 97. REFUNDS

Refund must be connected to:

```text
Order
Payment
OrderVendorGroup
Commission
Vendor settlement
```

A refund cannot simply change:

```text
Order.status = REFUNDED
```

without reconciling financial records.

---

# 98. SUPPORT

Support cases should include:

```text
Ticket ID
User
Order
Vendor
Category
Description
Status
Assignee
Messages
Created At
Updated At
Resolution
```

---

# 99. CMS

Admin can manage:

```text
Pages
Banners
Notifications
```

Uploaded media:

```text
Multipart
 ↓
Validation
 ↓
Supabase Storage
 ↓
Controlled URL
```

File validation must include:

- Type
- Size
- Filename handling
- Malicious content protection

---

# 100. AI

Current AI functionality exists but is **deferred from the MVP critical path**.

Capabilities:

```text
AI Assistant
Product Scanner
Recommendations
Health Insights
Chat History
AI Logs
```

Architecture:

```text
Customer
 ↓
AI API
 ↓
AI service/model
 ↓
Response
```

AI must never bypass marketplace rules.

For example, AI cannot recommend:

- Unapproved products
- Out-of-stock products
- Products outside allowed zone

---

# 101. AI SAFETY

AI must not provide unsupported medical claims.

Health insights must be appropriately framed.

AI failures must not block:

- Browse
- Cart
- Checkout
- Orders
- Delivery

---

# 102. INVENTORY CONCURRENCY

This is important.

Suppose:

```text
Stock = 1
```

Two customers checkout simultaneously.

The system must not allow:

```text
Customer A → 1
Customer B → 1
```

creating:

```text
Stock = -1
```

Stock reservation/decrement strategy must therefore be transactional.

The exact reservation timing is an open decision.

---

# 103. CHECKOUT TRANSACTION

At final checkout the server must revalidate:

```text
Authentication
↓
Zone
↓
Vendor active status
↓
Product approval
↓
Product active status
↓
Variant
↓
Stock
↓
Price
↓
Coupon
↓
Delivery
↓
Payment method
↓
Totals
```

Only then should the order be finalized.

---

# 104. FINANCIAL DATA

Never use JavaScript floating-point arithmetic for money.

Use:

- Decimal database types
- Minor currency units where appropriate
- Explicit INR currency

Example:

```text
₹1,299.50
```

must never be represented internally through unsafe floating-point calculations.

---

# 105. IDEMPOTENCY

Required for operations vulnerable to retries.

Examples:

- Payment creation
- Payment verification
- Webhooks
- Payout creation
- Refund
- Referral reward
- Loyalty reward

Duplicate requests must not create duplicate financial effects.

---

# 106. ERROR HANDLING

Every application must handle:

```text
Loading
Empty
Error
Retry
Offline/stale state
Success
```

API errors must be normalized.

Internal implementation details must not leak.

---

# 107. MOBILE RESILIENCE

Customer and delivery apps must account for:

- Weak network
- Offline periods
- Duplicate taps
- Request retries
- Expired sessions
- Stale realtime connections
- Permission denial
- GPS failure
- Push token changes

---

# 108. SECURITY

Minimum security requirements:

- JWT validation
- Role authorization
- Resource ownership checks
- Rate limiting
- Input validation
- Secure secrets
- Secure mobile token storage
- Webhook signature verification
- Upload validation
- Audit logging
- Dependency security
- Database access control
- HTTPS
- Secure production configuration

---

# 109. OWASP API RISKS TO ADDRESS

Especially:

### Broken Object Level Authorization

Example:

```text
GET /orders/123
```

must verify that order `123` belongs to the authenticated user or authorized role.

### Broken Function Level Authorization

A vendor must not call an admin endpoint simply because they know its URL.

### Unrestricted Resource Consumption

Search, OTP, coupon validation, uploads and other expensive operations need controls.

---

# 110. SUPABASE DATABASE ACCESS

The architecture must explicitly decide whether clients:

```text
Client → Supabase directly
```

for any business data, or:

```text
Client → NestJS API → Supabase/Postgres
```

The second pattern should remain the default for core marketplace operations.

If any client directly accesses Supabase tables, appropriate RLS policies are mandatory.

---

# 111. REALTIME AUTHORIZATION

Realtime subscriptions must respect:

```text
Customer → own order only
Delivery Partner → own active assignment
Admin → authorized operational scope
```

No ID manipulation should grant access.

---

# 112. LOGGING

Use structured logs.

Every important request should have:

```text
Request ID
Timestamp
Actor
Action
Result
Latency
```

Do not log:

- Passwords
- OTPs
- JWTs
- Secrets
- Payment secrets
- Unnecessary personal information

---

# 113. OBSERVABILITY

Production should monitor:

- API errors
- API latency
- Database errors
- Payment failures
- Webhook failures
- Payout failures
- Realtime failures
- Push failures
- Queue/background failures if introduced
- Mobile crash rates

---

# 114. HEALTH CHECKS

Backend should expose:

```text
Health
Readiness
Liveness
```

Health checks should distinguish:

```text
Application running
```

from:

```text
Application actually ready to process traffic
```

---

# 115. TESTING STRATEGY

Testing layers:

```text
Unit
 ↓
Integration
 ↓
API/E2E
 ↓
Web E2E
 ↓
Mobile E2E
 ↓
Load
 ↓
Security
```

---

# 116. UNIT TESTS

Test:

- Commission calculations
- Coupon rules
- Order transitions
- Authorization policies
- Stock rules
- COD rules
- ETA calculation
- Loyalty calculations

---

# 117. INTEGRATION TESTS

Test:

- Prisma transactions
- Database constraints
- Payment integration
- Webhooks
- Storage
- Realtime
- Authentication integration

---

# 118. E2E TESTS

Critical scenarios:

### Customer

```text
Register
→ Login
→ Location
→ Browse
→ Add to cart
→ Checkout
→ Payment
→ Order
→ Tracking
→ Delivery
```

### Vendor

```text
Register
→ KYC
→ Approval
→ Product
→ Approval
→ Receive Order
→ Prepare
→ Ready
→ Earnings
```

### Delivery

```text
KYC
→ Available
→ Assignment
→ Accept
→ Pickup OTP
→ Delivery
→ Earnings
```

### Admin

```text
Login
→ Vendor Approval
→ Product Approval
→ Order Monitoring
→ Delivery Monitoring
→ Finance
→ Audit
```

---

# 119. LOAD TESTING

Before production, test:

- Product listing
- Search
- Checkout
- Order creation
- Admin tables
- Payment webhook bursts
- Concurrent stock updates
- Realtime delivery tracking

Realtime concurrency should be measured against the expected active-delivery volume.

---

# 120. DEPLOYMENT ENVIRONMENTS

Minimum:

```text
LOCAL
DEVELOPMENT
STAGING
PRODUCTION
```

Each must have separate:

- Database
- Secrets
- API keys
- Supabase configuration
- Razorpay configuration
- Storage
- Push configuration

---

# 121. CI/CD

Pipeline should include:

```text
Install
 ↓
Lint
 ↓
Typecheck
 ↓
Unit tests
 ↓
Integration tests
 ↓
Build
 ↓
Migration validation
 ↓
Deploy
```

Production deployment should not bypass tests.

---

# 122. DATABASE MIGRATIONS

All schema changes must use controlled migrations.

Never manually change production schema without documenting the migration.

Migrations involving financial/order tables require additional review.

---

# 123. BACKUPS

Production database must have:

- Automated backups
- Retention policy
- Restore testing
- Disaster recovery procedure

---

# 124. DATA RETENTION

Retention policies must be defined for:

- Orders
- Payments
- Payouts
- KYC documents
- Audit logs
- Notifications
- Delivery location
- Support cases
- AI logs

The exact periods require legal/operational approval.

---

# 125. PRIVACY

The system should collect only data necessary for its functionality.

Sensitive data should have:

- Purpose
- Access controls
- Retention policy
- Deletion/anonymization strategy

The final production privacy model should be reviewed against applicable Indian legal requirements by qualified counsel.

---

# 126. CUSTOMER ACCOUNT DELETION

Delete-account functionality exists.

Deletion must distinguish between:

```text
Account identity
```

and:

```text
Historical financial/order records
```

Financial/legal records may need retention or anonymization rather than physical deletion.

---

# 127. PERFORMANCE PRINCIPLES

Avoid:

- Unbounded queries
- Huge API responses
- N+1 database queries
- Unnecessary mobile re-renders
- Excessive realtime subscriptions
- Large images without optimization

Use:

- Pagination
- Indexes
- Caching where measured useful
- Image optimization
- Lazy loading
- Query optimization

---

# 128. API PAGINATION

Large collections must use pagination:

```text
Products
Orders
Users
Vendors
Transactions
Notifications
Reviews
Audit logs
```

Pagination metadata must be consistent.

---

# 129. SHARED PACKAGE RULES

`@next360/shared` may contain:

```text
Types
Constants
Enums
Validation primitives
Safe utilities
```

It must not contain:

- Secrets
- Server-only code accidentally imported into clients
- Database credentials
- Provider private keys

---

# 130. DESIGN SYSTEM RULE

Customer:

```text
Editorial / organic / premium
```

Delivery:

```text
Operational / dense / functional
```

Vendor:

```text
Professional dashboard
```

Admin:

```text
High-density operational interface
```

Marketing:

```text
Brand / acquisition
```

These applications do not need identical UI systems.

They need consistent **brand fundamentals**, not identical UX.

---

# 131. KNOWN IMPLEMENTATION GAPS

Current known gaps:

1. Product variant selection.
2. Full map-based address picker.
3. Thin return UI.
4. Loyalty illustrations.
5. CMS banner creatives.
6. Admin bulk product approval.
7. Razorpay Route end-to-end verification.
8. Payout failure/reconciliation verification.
9. Realtime authorization validation.
10. Parent order status aggregation.
11. Final return/refund financial policy.
12. Inventory reservation strategy.
13. Exact zone geometry.
14. Exact ETA calculation policy.
15. Final permission matrix.
16. Final API versioning.
17. Final privacy/data-retention policy.

---

# 132. DEFERRED FEATURES

AI capabilities are currently deferred:

```text
AI Chat
AI Scanner
AI Recommendations
AI Health Insights
AI Chat History
```

They should not block the core MVP.

---

# 133. OPEN ARCHITECTURAL DECISIONS

These must be explicitly decided before engineering freeze:

| ID | Decision |
|---|---|
| OD-001 | API versioning convention |
| OD-002 | Exact User ↔ Role relationship |
| OD-003 | Web token/session storage strategy |
| OD-004 | Direct Supabase client access vs API-only |
| OD-005 | Realtime Changes vs Broadcast |
| OD-006 | Zone geometry |
| OD-007 | ETA algorithm |
| OD-008 | GST/tax calculation |
| OD-009 | Route transfer timing |
| OD-010 | Delivery partner payout formula |
| OD-011 | Return/refund policy |
| OD-012 | Variant cart uniqueness |
| OD-013 | Inventory reservation |
| OD-014 | Data retention |
| OD-015 | Legal/privacy review |

---

# 134. MVP DEFINITION

The MVP must successfully support:

```text
Vendor
 ↓
KYC
 ↓
Admin Approval
 ↓
Product
 ↓
Product Approval
 ↓
Customer
 ↓
Zone Validation
 ↓
Browse
 ↓
Cart
 ↓
Multi-Vendor Checkout
 ↓
Razorpay / COD
 ↓
Order
 ↓
Vendor Groups
 ↓
Vendor Fulfillment
 ↓
Delivery Assignment
 ↓
Partner Acceptance
 ↓
OTP Pickup
 ↓
Live Tracking
 ↓
Delivery
 ↓
Settlement
 ↓
Review
```

---

# 135. MVP ACCEPTANCE CRITERIA

The MVP is functionally acceptable when:

### Customer

- Customer can authenticate.
- Customer can select a supported zone.
- Customer can browse approved products.
- Customer can filter by storefront.
- Customer can add products from multiple vendors.
- Customer can checkout.
- Customer can pay online.
- Customer can use COD where eligible.
- Customer can see vendor-separated order groups.
- Customer can track active deliveries.
- Customer can review eligible purchases.

### Vendor

- Vendor can register.
- Vendor can complete KYC.
- Admin can approve vendor.
- Vendor can create products.
- Admin can approve products.
- Vendor can receive orders.
- Vendor can advance permitted order states.
- Vendor can configure delivery estimate.
- Vendor can view earnings.

### Delivery

- Partner can complete onboarding.
- Partner can become available.
- Partner receives assignment.
- Partner accepts within defined window.
- Partner performs OTP pickup.
- Partner sends live location.
- Partner completes delivery.
- Partner sees earnings.

### Admin

- Admin can approve vendors.
- Admin can approve products.
- Admin can manage zones.
- Admin can monitor orders.
- Admin can manage delivery partners.
- Admin can inspect payments.
- Admin can manage payouts.
- Admin can manage commissions.
- Admin can manage disputes.
- Admin actions are audited.

---

# 136. CORE BUSINESS INVARIANTS

These are **non-negotiable**.

```text
1. Customer cannot order outside supported zone.

2. Vendor cannot access another vendor's resources.

3. Delivery partner cannot access another partner's assignment.

4. Vendor cannot approve own product.

5. Vendor cannot approve own KYC.

6. COD > ₹2,000 is rejected server-side.

7. Product stock cannot become negative.

8. Payment cannot be trusted solely from client callback.

9. Duplicate webhooks cannot duplicate financial effects.

10. Order state transitions are backend controlled.

11. One parent Order can contain multiple vendor groups.

12. Each vendor group has independent fulfillment.

13. Delivery assignment belongs to a vendor group.

14. Customer sees only authorized delivery location.

15. Financial history cannot be silently rewritten.

16. Commission rate is historically preserved.

17. Core business operations go through authorized backend services.

18. AI cannot bypass marketplace rules.
```

---

# 137. MASTER END-TO-END FLOW

```text
                         NEXT360
                            │
             ┌──────────────┴──────────────┐
             │                             │
          CUSTOMER                      VENDOR
             │                             │
        Register/Login                 Register
             │                             │
         Zone Check                       KYC
             │                             │
          Browse                      Admin Review
             │                             │
          Product                       Approved
             │                             │
            Cart                         Store
             │                             │
         Checkout                      Products
             │                             │
      Razorpay / COD                Admin Approval
             │                             │
             └──────────────┬──────────────┘
                            │
                           ORDER
                            │
                 ┌──────────┴──────────┐
                 │                     │
             Vendor A              Vendor B
                 │                     │
             Group A               Group B
                 │                     │
              Prepare               Prepare
                 │                     │
               Ready                 Ready
                 │                     │
                 └──────────┬──────────┘
                            │
                    Delivery Assignment
                            │
                    Delivery Partner
                            │
                          Accept
                            │
                       Pickup OTP
                            │
                        Picked Up
                            │
                   Live GPS Tracking
                            │
                    Customer Tracking
                            │
                         Delivered
                            │
                 ┌──────────┴──────────┐
                 │                     │
             Commission             Payout
                 │                     │
                 └──────────┬──────────┘
                            │
                     Review / Loyalty
```

---

# 138. FINAL ARCHITECTURAL POSITION

### We are **NOT** building:

```text
One giant application
```

### We ARE building:

```text
One product
+
One monorepo
+
Six applications
+
Three shared packages
+
One authoritative API
+
One PostgreSQL data model
```

Architecture:

```text
                NEXT360
                   │
          ┌────────┴────────┐
          │                 │
       FRONTENDS          BACKEND
          │                 │
   ┌──────┼───────┐         │
   │      │       │         │
Customer Delivery Web     NestJS
   │      │       │         │
   │      │   ┌───┴───┐     │
   │      │ Vendor  Admin   │
   │      │                 │
   └──────┴─────────────────┘
                   │
                 Prisma
                   │
               PostgreSQL
                   │
       ┌───────────┼───────────┐
       │           │           │
    Supabase    Razorpay    Storage
       │
    Realtime
```

---

# 139. THE MOST IMPORTANT ENGINEERING RULE

The project should be developed in this order:

```text
FRD
 ↓
Architecture Specification
 ↓
Database Specification
 ↓
API Specification
 ↓
RBAC Matrix
 ↓
State Machines
 ↓
Frontend Navigation Specification
 ↓
UI/UX Specification
 ↓
Implementation
 ↓
Tests
 ↓
Deployment
```

**Not:**

```text
AI → generate code → discover requirements later
```

---

# 140. MASTER SOURCE REFERENCES

The architecture principles in this FRD should be cross-checked against the current primary documentation for:

- NestJS Modules and Guards
- Supabase Auth and JWT
- Supabase Row Level Security
- Supabase Realtime
- Razorpay Route
- Expo authentication/navigation
- Next.js App Router
- PostgreSQL constraints
- Prisma relational data modeling
- OWASP API Security Top 10

These sources support the architectural guardrails, but **they do not override Next360's approved business requirements**.

---

# 141. MASTER PROJECT RULE

From this point onward:

> **The FRD defines the required behavior. The architecture specification defines how that behavior is implemented. The code implements those specifications. Tests prove that the implementation satisfies them.**

If a developer, AI coding agent, library, or architectural proposal suggests something different, it must be evaluated against this hierarchy:

```text
Legal / Compliance
       ↓
Approved Business Rules
       ↓
Master FRD
       ↓
Technical Architecture
       ↓
Implementation
```

If implementation and FRD disagree, **the implementation is not automatically correct**.

---

## 🔒 FRD STATUS

**Next360 Master FRD v1.0 — BASELINE**

The major architecture and functional model is now defined.

The next serious document we should create from this is **not another FRD**.

It should be the:

### **Next360 Technical Architecture Specification (TAS)**

That document should go one level deeper into the exact:

```text
Prisma schema
↓
Database relationships
↓
Indexes
↓
NestJS modules
↓
Controllers
↓
Services
↓
DTOs
↓
Guards
↓
API endpoints
↓
Request/response contracts
↓
RBAC matrix
↓
Order state transition matrix
↓
Payment state machine
↓
Payout ledger
↓
Realtime channels
↓
Frontend ↔ API data mapping
↓
Mobile navigation
↓
Web routes
↓
Caching
↓
Queues/background jobs
↓
Security boundaries
↓
Deployment architecture
```

**That TAS + this FRD would become the real engineering blueprint for Next360.**
