# P0 & P1 Implementation Plan — Next360

> **Status Reference**: Items already completed are marked ✅.  
> **Format**: Every item has a file-by-file breakdown of what to create/modify.

---

## Already Completed ✅

| Item | Scope | Deliverables |
|------|-------|-------------|
| Vendor name on ProductCard | Customer App | `onVendorPress` prop, vendor row in card, HomeScreen + ProductListScreen wiring |
| Vendor Storefront page | Customer App | `VendorStorefrontScreen.tsx`, `getVendorStorefront` API, navigation registration |
| Search filters | Customer App | Filter modal (store type, category, price, rating), active filter chips, filtered results `useMemo` |
| READY_FOR_PICKUP status | Backend + DB | Added to `OrderStatus` enum, status machine transitions |
| Vendor accept/reject orders | Vendor Dashboard | Accept/Reject buttons, `cancelVendorGroup` API, Ready for Pickup button |
| Failed delivery handling | Backend + Delivery App | `DeliveryFailure` model, `POST /delivery/failure`, failure reason modal |

---

## P0 — Ship-Blocking

### 1. Google Login (Customer App + Backend)

**Current State:** Phone OTP only. No Google login on any screen.

**Files to Create:**

| File | Purpose |
|------|---------|
| `apps/api/src/auth/dto/google-login.dto.ts` | DTO for Google ID token (contains `idToken: string`) |
| `apps/api/src/auth/strategies/google.strategy.ts` | **As an alternative** — could verify token inline in controller instead of Passport strategy |

**Files to Modify:**

| File | Change |
|------|--------|
| `apps/api/src/auth/auth.controller.ts` | Add `POST /auth/google-login` endpoint. Receives `{ idToken: string }`, verifies with Google's OAuth2 API (`google-auth-library`), extracts email/name, upserts user, returns JWT |
| `apps/api/src/auth/auth.service.ts` | Add `googleLogin(idToken)` method. Verify token via `OAuth2Client.verifyIdToken`. Find existing user by email or create. Return JWT same as login. |
| `apps/api/package.json` | Add `google-auth-library` dependency |
| `apps/customer-app/package.json` | Add `expo-auth-session` and `expo-web-browser` for Google OAuth flow |
| `apps/customer-app/src/lib/auth.ts` | Add `signInWithGoogle()` method. Opens Google OAuth via expo-auth-session, exchanges code for ID token, calls `POST /auth/google-login`, stores JWT |
| `apps/customer-app/src/lib/api.ts` | Add `googleLogin(idToken)` method |
| `apps/customer-app/src/screens/auth/PhoneAuthScreen.tsx` | Add "Continue with Google" button below the phone input. Red divider with "or". |
| `apps/customer-app/src/i18n/index.ts` | Add `auth.google.continueWith`, `auth.google.or` translation keys |

**Implementation Order:**
1. Backend DTO + endpoint + token verification
2. Install packages in customer app
3. Auth service Google method
4. PhoneAuthScreen UI

---

### 2. Delivery Slot at Checkout (Customer App + Backend + DB)

**Current State:** Checkout has no delivery slot/schedule step. Orders go straight to the vendor without an ETA promise.

**Files to Create:**

| File | Purpose |
|------|---------|
| `apps/customer-app/src/components/DeliverySlotPicker.tsx` | Slot selection UI component. Shows today/tomorrow tabs, available time windows as chips. Highlights selected slot. |
| `apps/api/src/delivery-slot/delivery-slot.module.ts` | NestJS module for delivery slot management |
| `apps/api/src/delivery-slot/delivery-slot.service.ts` | Generate and query available slots based on zone, day of week, time ranges |
| `apps/api/src/delivery-slot/delivery-slot.controller.ts` | `GET /delivery-slots?zoneId=` and `POST /admin/delivery-slots` |

**Files to Modify:**

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `DeliverySlotConfig` model: `id, zoneId, dayOfWeek (Int 0-6), startTime (String "HH:mm"), endTime, maxOrders, isActive`. Add `DeliverySlotBooking` model: `id, orderVendorGroupId (unique), slotConfigId, date, timeRange, createdAt`. |
| `apps/api/src/app.module.ts` | Import `DeliverySlotModule` |
| `apps/customer-app/src/screens/cart/CheckoutScreen.tsx` | Add "Delivery Slot" section between "Delivery Address" and "Order Items". Renders `<DeliverySlotPicker />`. Stores selected slot in local state. Passes slot ID in `createOrder` call. |
| `apps/customer-app/src/lib/api.ts` | Add `getDeliverySlots(zoneId)` method. Update `createOrder` to accept `deliverySlotId`. |
| `apps/api/src/orders/dto/create-order.dto.ts` | Add `deliverySlotId?: string` field |
| `apps/api/src/orders/orders.service.ts` | On order creation, if `deliverySlotId` is provided, create `DeliverySlotBooking`, validate slot has capacity |
| `apps/customer-app/src/i18n/index.ts` | Add `checkout.section.deliverySlot`, `deliverySlot.today`, `deliverySlot.tomorrow`, `deliverySlot.select` keys |

**Implementation Order:**
1. Prisma schema migration
2. Backend delivery slot service + controller
3. DeliverySlotPicker component
4. CheckoutScreen integration

---

## P1 — MVP Complete

### 3. Background Job Queue (BullMQ + Redis)

**Current State:** No background job system. OTPs are stored in-memory, push notifications fire inline (blocking the request), no delivery assignment retry logic.

**Files to Create:**

| File | Purpose |
|------|---------|
| `apps/api/src/queue/queue.module.ts` | NestJS module that registers BullMQ queues |
| `apps/api/src/queue/queue.service.ts` | Wrapper service that manages job enqueuing for email, SMS, push, invoice generation, settlement |
| `apps/api/src/queue/processors/notification.processor.ts` | Worker that processes notification jobs (push, email, SMS) |
| `apps/api/src/queue/processors/invoice.processor.ts` | Worker that generates invoice PDFs |
| `apps/api/src/queue/processors/settlement.processor.ts` | Worker that processes vendor/DeliveryPartner payouts |

**Files to Modify:**

| File | Change |
|------|--------|
| `apps/api/package.json` | Add `@nestjs/bullmq`, `bullmq`, `ioredis` |
| `apps/api/src/app.module.ts` | Import `QueueModule`. Register `BullModule.forRoot()` with Redis connection from env vars. |
| `apps/api/src/auth/auth.service.ts` | Enqueue OTP SMS job instead of logging directly. |
| `apps/api/src/notifications/notifications.service.ts` | `sendPushNotification` → enqueue job instead of `fetch` inline. `sendOrderStatusNotification` → enqueue job. Add enqueue methods for SMS + email jobs. |
| `apps/api/src/orders/orders.service.ts` | Enqueue settlement job after order is delivered. Enqueue invoice generation job after order is placed. |
| `.env` | Add `REDIS_URL=redis://localhost:6379` |

**Implementation Order:**
1. Install BullMQ + Redis packages
2. Queue module + connection config
3. Notification processor (move inline fetch to background job)
4. Invoice processor
5. Settlement processor
6. Wire into existing services

---

### 4. SMS/Email Sending (Backend)

**Current State:** OTP is logged to console only (`"No SMS gateway wired up yet"`). No email sending at all. Push notifications use Expo Push API inline.

**Files to Create:**

| File | Purpose |
|------|---------|
| `apps/api/src/providers/sms/sms.service.ts` | SMS provider abstraction. Try MSG91 first, fallback to Twilio. Send OTP text. |
| `apps/api/src/providers/sms/sms.module.ts` | Module exporting SmsService |
| `apps/api/src/providers/email/email.service.ts` | Email provider (SendGrid or Resend). Send order confirmation, password reset, daily digests. |
| `apps/api/src/providers/email/email.module.ts` | Module exporting EmailService |

**Files to Modify:**

| File | Change |
|------|--------|
| `apps/api/package.json` | Add `@sendgrid/mail` (or `resend`), `twilio` packages |
| `apps/api/src/app.module.ts` | Import `SmsModule`, `EmailModule` |
| `apps/api/src/auth/auth.service.ts` | `sendOtp` — call `SmsService.sendOtp(phone, code)` instead of logging. Add email for forgot-password flow. |
| `apps/api/src/notifications/notifications.service.ts` | Add `sendEmailNotification`, `sendSmsNotification` methods. In `sendOrderStatusNotification`, enqueue both push + email + SMS based on user preferences. |
| `.env` | Add `MSG91_API_KEY`/`TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_PHONE_NUMBER`, `SENDGRID_API_KEY`/`FROM_EMAIL` |

**Implementation Order:**
1. Install provider packages
2. SMS service (MSG91 + Twilio)
3. Email service (SendGrid)
4. Wire into AuthService for OTP
5. Wire into NotificationsService for order updates

---

### 5. Admin Support Ticket System (Backend + Admin Panel)

**Current State:** No support ticket system exists. The `support` route in the spec has zero implementation on both backend and admin panel.

**Files to Create:**

| File | Purpose |
|------|---------|
| `apps/api/src/support/support.module.ts` | NestJS module for support tickets |
| `apps/api/src/support/support.service.ts` | CRUD for tickets: create (user), list (admin by status), assign (admin), reply (user + admin), resolve (admin) |
| `apps/api/src/support/support.controller.ts` | `POST /support/tickets`, `GET /support/tickets`, `GET /support/tickets/:id`, `PATCH /support/tickets/:id/assign`, `POST /support/tickets/:id/reply`, `PATCH /support/tickets/:id/status` |
| `apps/api/src/support/dto/create-ticket.dto.ts` | `subject`, `message`, `orderId?`, `category` (ORDER_ISSUE, VENDOR_ISSUE, DELIVERY_ISSUE, REFUND, OTHER) |
| `apps/api/src/support/dto/reply-ticket.dto.ts` | `message: string` |
| `apps/admin-panel/src/app/(dashboard)/support/page.tsx` | Tickets list table: ID, subject, user, status, priority, date. Inline status filter tabs (Open / Assigned / Resolved / All). |
| `apps/admin-panel/src/app/(dashboard)/support/[id]/page.tsx` | Ticket detail: Subject, user info, order link, threaded replies list, status update dropdown, assignee selector. |
| `apps/admin-panel/src/lib/api.ts` (if doesn't exist, add) | Add `adminApi.getTickets`, `adminApi.getTicket`, `adminApi.assignTicket`, `adminApi.replyTicket`, `adminApi.updateTicketStatus` |

**Files to Modify:**

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `SupportTicket` model: `id, userId, subject, message, category, orderId?, status (OPEN/ASSIGNED/RESOLVED/CLOSED), priority (LOW/MEDIUM/HIGH/URGENT), assignedToId?, createdAt, updatedAt`. Add `TicketReply` model: `id, ticketId, userId, message, createdAt`. |
| `apps/api/src/app.module.ts` | Import `SupportModule` |
| `apps/admin-panel/src/app/(dashboard)/layout.tsx` | Add "Support" nav item to sidebar with ticket counter badge |
| `apps/admin-panel/src/app/(dashboard)/components/Sidebar.tsx` | Add support link with icon + unread count |

**Implementation Order:**
1. Prisma migration (SupportTicket + TicketReply models)
2. Backend support module (service + controller)
3. Admin panel API client methods
4. Admin support list page
5. Admin support detail page with reply UI
6. Sidebar integration with ticket count badge

---

### 6. All Missing Notification Events (Backend)

**Current State:** Only 6 of 38 notification triggers are wired. The `NotificationsService.sendOrderStatusNotification` handles CONFIRMED, PACKED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED. Missing events for customer (welcome, payment success, refund, coupon), vendor (low stock, payout, document), DP (earnings, pickup reminder, performance), and admin (new vendor registration, fraud alert).

**Files to Modify:**

| File | Change |
|------|--------|
| `apps/api/src/notifications/notifications.service.ts` | Expand `sendOrderStatusNotification` to handle all 10 statuses. Add new methods: `sendWelcomeNotification`, `sendPaymentSuccessNotification`, `sendRefundNotification`, `sendCouponNotification`, `sendLowStockNotification`, `sendVendorPayoutNotification`, `sendNewVendorRegistrationAlert`, `sendDailySalesReport`. Each method creates an in-app notification record AND enqueues push/email/SMS jobs. |
| `apps/api/src/auth/auth.service.ts` | After successful `verifyOtpLogin` where `isNewUser === true`, call `notificationsService.sendWelcomeNotification`. |
| `apps/api/src/payments/payments.service.ts` | After successful payment capture webhook, call `notificationsService.sendPaymentSuccessNotification`. After refund, call `sendRefundNotification`. |
| `apps/api/src/returns/returns.service.ts` | After refund processed, call `notificationsService.sendRefundNotification`. |
| `apps/api/src/orders/orders.service.ts` | Expand the notification calls to include all intermediate statuses (READY_FOR_PICKUP, PICKED_UP, CONFIRMED → vendor notification). |
| `apps/api/src/inventory/inventory.service.ts` | After stock update that drops below threshold, call `notificationsService.sendLowStockNotification` to vendor's push tokens. |
| `apps/api/src/vendors/vendors.service.ts` | On vendor registration, call admin notification. On payout completion, call `sendVendorPayoutNotification`. |
| `apps/api/src/delivery-partners/delivery-partners.service.ts` | On DP KYC approval, trigger notification. On new DP registration, alert admin. |
| `apps/api/src/delivery/delivery.service.ts` | After delivery completed, trigger earnings notification to DP. |

**Notification Events Matrix — All 38:**

**Customer (16 events):**
| Event | Current | Implementation |
|-------|---------|---------------|
| OTP Sent | ✅ (logged) | `auth.service.ts` — no change needed |
| Welcome | 🔴 | After `verifyOtpLogin` (new user) |
| Order Confirmed | ✅ | `orders.service.ts` via `sendOrderStatusNotification` |
| Payment Success | 🔴 | `payments.service.ts` after webhook |
| Vendor Accepted | 🔴 | Add to `orders.service.ts` when vendor group → CONFIRMED |
| Preparing (PACKED) | ✅ | Already wired |
| Ready for Pickup | 🔴 | Add to `orders.service.ts` when group → READY_FOR_PICKUP |
| Picked Up | 🔴 | Add to `orders.service.ts` when group → PICKED_UP |
| Out for Delivery | ✅ | Already wired |
| Delivered | ✅ | Already wired |
| Cancelled | ✅ | Already wired |
| Refund Initiated | 🔴 | `returns/returns.service.ts` or `payments.service.ts` |
| Refund Completed | 🔴 | `returns/returns.service.ts` |
| Coupon Received | 🔴 | Could be batch/scheduled |
| Offer Available | 🔴 | Could be batch/scheduled |
| Wishlist Price Drop | 🔴 | Future — needs cron job |

**Vendor (8 events):**
| Event | Current | Implementation |
|-------|---------|---------------|
| New Order | ✅ | Already wired in `orders.service.ts` |
| Order Cancelled | 🔴 | Add to cancel endpoint in `orders.service.ts` |
| Low Stock Alert | 🔴 | `inventory.service.ts` on stock update |
| Out of Stock | 🔴 | Same as low stock but at 0 |
| Payment Settled | 🔴 | After commission payout processed |
| New Review | 🔴 | `reviews.service.ts` after create |
| Store Approved | 🔴 | `vendors.service.ts` on status → APPROVED |
| Store Suspended | 🔴 | `vendors.service.ts` on status → SUSPENDED |
| Document Expiry | 🔴 | Future — needs cron job |

**Delivery Partner (6 events):**
| Event | Current | Implementation |
|-------|---------|---------------|
| New Delivery Request | ✅ | Already wired in `delivery.service.ts` |
| Pickup Reminder | 🔴 | Future — scheduled job |
| Customer Not Reachable | 🔴 | Already covered by `DeliveryFailure` model |
| Delivery Completed | 🔴 | `delivery.service.ts` on complete |
| Daily Earnings | 🔴 | `delivery.service.ts` on complete (or batch) |
| Weekly Incentive | 🔴 | Future — scheduled job |

**Admin (8 events):**
| Event | Current | Implementation |
|-------|---------|---------------|
| New Vendor Registration | 🔴 | `vendors.service.ts` on create |
| New DP Registration | 🔴 | `delivery-partners.service.ts` on create |
| Vendor Doc Pending | 🔴 | `kyc.service.ts` on submit |
| Large Refund (>₹5000) | 🔴 | `returns.service.ts` on high-value |
| Payment Failure | 🔴 | `payments.service.ts` on failure |
| Server Error | 🔴 | Already in `LoggingInterceptor` |
| Inventory Alert | 🔴 | Same as low stock but for admin |
| Daily Sales Report | 🔴 | Future — scheduled cron job |

**Implementation Order:**
1. Expand `sendOrderStatusNotification` to all 10 statuses
2. Add `sendWelcomeNotification`, `sendPaymentSuccessNotification`
3. Wire into AuthService + PaymentsService
4. Add refund notification events
5. Add vendor low stock + payout notifications
6. Add vendor status change notifications
7. Add DP delivery + earnings notifications
8. Add admin registration alerts
9. Add daily sales report (future — cron job)

---

## Summary of All Changes

### Files to Create (15 total)

| # | File | For Item |
|---|------|----------|
| 1 | `apps/api/src/auth/dto/google-login.dto.ts` | Google Login |
| 2 | `apps/api/src/delivery-slot/delivery-slot.module.ts` | Delivery Slot |
| 3 | `apps/api/src/delivery-slot/delivery-slot.service.ts` | Delivery Slot |
| 4 | `apps/api/src/delivery-slot/delivery-slot.controller.ts` | Delivery Slot |
| 5 | `apps/customer-app/src/components/DeliverySlotPicker.tsx` | Delivery Slot |
| 6 | `apps/api/src/queue/queue.module.ts` | Background Jobs |
| 7 | `apps/api/src/queue/queue.service.ts` | Background Jobs |
| 8 | `apps/api/src/queue/processors/notification.processor.ts` | Background Jobs |
| 9 | `apps/api/src/queue/processors/invoice.processor.ts` | Background Jobs |
| 10 | `apps/api/src/queue/processors/settlement.processor.ts` | Background Jobs |
| 11 | `apps/api/src/providers/sms/sms.service.ts` | SMS/Email |
| 12 | `apps/api/src/providers/email/email.service.ts` | SMS/Email |
| 13 | `apps/api/src/support/support.module.ts` | Support Tickets |
| 14 | `apps/api/src/support/support.service.ts` | Support Tickets |
| 15 | `apps/api/src/support/support.controller.ts` | Support Tickets |
| 16 | `apps/admin-panel/src/app/(dashboard)/support/page.tsx` | Support Tickets |
| 17 | `apps/admin-panel/src/app/(dashboard)/support/[id]/page.tsx` | Support Tickets |

### Files to Modify (25 total)

| # | File | Items |
|---|------|-------|
| 1 | `prisma/schema.prisma` | Delivery Slot, Support Ticket models |
| 2 | `apps/api/src/app.module.ts` | Imports for Queue, Support, DeliverySlot, SMS, Email modules |
| 3 | `apps/api/src/auth/auth.controller.ts` | Google Login |
| 4 | `apps/api/src/auth/auth.service.ts` | Google Login + Welcome notification |
| 5 | `apps/api/package.json` | Google, BullMQ, Redis, SendGrid, Twilio deps |
| 6 | `apps/customer-app/package.json` | Expo auth-session, web-browser deps |
| 7 | `apps/customer-app/src/lib/auth.ts` | Google sign-in method |
| 8 | `apps/customer-app/src/lib/api.ts` | Google login, delivery slots, ticket methods |
| 9 | `apps/customer-app/src/screens/auth/PhoneAuthScreen.tsx` | Google button |
| 10 | `apps/customer-app/src/i18n/index.ts` | All new translation keys |
| 11 | `apps/customer-app/src/screens/cart/CheckoutScreen.tsx` | Delivery slot section |
| 12 | `apps/api/src/orders/dto/create-order.dto.ts` | deliverySlotId field |
| 13 | `apps/api/src/orders/orders.service.ts` | Delivery slot booking + more notification events |
| 14 | `apps/api/src/notifications/notifications.service.ts` | Full 38-event expansion + queue enqueue |
| 15 | `apps/api/src/payments/payments.service.ts` | Payment success + refund notifications |
| 16 | `apps/api/src/returns/returns.service.ts` | Refund notification |
| 17 | `apps/api/src/inventory/inventory.service.ts` | Low stock notification |
| 18 | `apps/api/src/vendors/vendors.service.ts` | Registration alert + payout + status notifications |
| 19 | `apps/api/src/delivery/delivery.service.ts` | Delivery completed + earnings notifications |
| 20 | `apps/api/src/delivery-partners/delivery-partners.service.ts` | Registration alert |
| 21 | `.env` | Redis URL, SMS/Email API keys |
| 22 | `apps/admin-panel/src/app/(dashboard)/layout.tsx` | Support sidebar item |
| 23 | `apps/admin-panel/src/app/(dashboard)/components/Sidebar.tsx` | Support nav link |

---

## Recommended Implementation Sequence

```
Phase 1 (Start here — lowest effort, highest visibility):
├── Google Login (P0) — 1 backend endpoint + 1 screen change
└── Delivery Slot (P0) — 1 Prisma model + 1 component + 1 backend service

Phase 2 (Foundation — unblocks everything else):
├── SMS/Email providers (P1) — Needed before more notifications
└── Background job queue (P1) — Needed before SMS/email/NOTIF volume

Phase 3 (Support — operational necessity):
└── Admin Support Ticket System (P1)

Phase 4 (Coverage — polish):
└── All missing notification events (P1)
```
