# Next360 API Reference

> **Base URL:** `http://localhost:4000/api`
> **Response Envelope:** `{ success: boolean, data: T, meta?: { page, limit, total, totalPages } }`
> **Auth:** Bearer JWT token via `Authorization: Bearer <token>` header

---

## Auth Module

`POST /auth/signup` — Register a new user
- **Auth:** None
- **Body:** `{ email?, phone?, password, name, role? }`
- **Returns:** `{ user, accessToken }`

`POST /auth/login` — Login with email + password
- **Auth:** None
- **Body:** `{ email, password }`
- **Returns:** `{ user, accessToken }`

`GET /auth/me` — Get current user profile
- **Auth:** `JwtAuthGuard`

`POST /auth/logout` — Logout (stateless — client removes token)
- **Auth:** `JwtAuthGuard`

`POST /auth/send-otp` — Send phone OTP
- **Auth:** None
- **Body:** `{ phone }`

`POST /auth/verify-otp` — Verify OTP
- **Auth:** None
- **Body:** `{ phone, otp }`

`POST /auth/verify-otp-login` — Phone OTP login (provisions new account on first verify)
- **Auth:** None
- **Body:** `{ phone, otp }`
- **Returns:** `{ user, accessToken }`

`POST /auth/forgot-password` — Send password reset email
- **Auth:** None
- **Body:** `{ email }`

`POST /auth/reset-password` — Reset password with token
- **Auth:** None
- **Body:** `{ token, newPassword }`

`POST /auth/google` — Google OAuth login
- **Auth:** None
- **Body:** `{ idToken }`

---

## Users Module

`GET /users/me` — Get own profile
- **Auth:** `JwtAuthGuard`

`PATCH /users/me` — Update own profile
- **Auth:** `JwtAuthGuard`
- **Body:** `{ name?, email?, phone? }`

`GET /users` — List all users (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Query:** `{ role?, isActive?, page?, limit? }`

`GET /users/:id` — Get user by ID
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`PATCH /users/:id/status` — Toggle user active status
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ isActive: boolean }`

`PATCH /users/:id/role` — Change user role
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ role }`

---

## Vendors Module

`POST /vendors/register` — Register as vendor
- **Auth:** `JwtAuthGuard`
- **Body:** `{ storeName, storeType, description?, address?, zoneId?, gst? }`

`GET /vendors` — List all vendors (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Query:** `{ storeType?, isApproved? }`

`GET /vendors/storefront/:storeType` — Get approved vendors for a store type (public)
- **Auth:** None

`GET /vendors/my-profile` — Get own vendor profile
- **Auth:** `JwtAuthGuard`

`PATCH /vendors/my-profile` — Update own vendor profile
- **Auth:** `JwtAuthGuard`
- **Body:** `{ storeName?, storeType?, description?, address?, gst?, razorpayAccountId? }`

`GET /vendors/me/payouts` — Get own payout history
- **Auth:** `JwtAuthGuard` + `RolesGuard(VENDOR)`

`GET /vendors/me/analytics` — Get own analytics
- **Auth:** `JwtAuthGuard` + `RolesGuard(VENDOR)`

`GET /vendors/me/earnings` — Get own earnings summary
- **Auth:** `JwtAuthGuard` + `RolesGuard(VENDOR)`

`GET /vendors/me/transactions` — Get own transactions
- **Auth:** `JwtAuthGuard` + `RolesGuard(VENDOR)`
- **Query:** `{ page?, limit?, startDate?, endDate? }`

`GET /vendors/me/customers` — Get own customer list
- **Auth:** `JwtAuthGuard` + `RolesGuard(VENDOR)`

`GET /vendors/:id` — Get vendor by ID
- **Auth:** None

`PATCH /vendors/:id` — Update vendor
- **Auth:** `JwtAuthGuard`
- **Body:** `{ storeName?, description?, address?, gst? }`

`POST /vendors/:id/approve` — Approve vendor (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`PATCH /vendors/:id/status` — Update vendor status
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ status }`

`GET /vendors/:id/detail` — Get vendor detail (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /vendors/:id/stats` — Get vendor stats (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /vendors/:id/products` — Get vendor's products
- **Auth:** None
- **Query:** `{ page?, limit? }`

---

## Products Module

`POST /products` — Create product
- **Auth:** `JwtAuthGuard` + `RolesGuard(VENDOR, ADMIN)`
- **Body:** `{ name, description?, price, compareAtPrice?, stock, unit, categoryId, subCategoryId?, brandId?, images?, variants? }`

`GET /products` — List products (public)
- **Auth:** None
- **Query:** `{ storeType?, categoryId?, subCategoryId?, brandId?, vendorId?, search?, minPrice?, maxPrice?, isApproved?, page?, limit?, sortBy?, sortOrder? }`

`GET /products/:id` — Get product by ID
- **Auth:** None

`PATCH /products/:id` — Update product
- **Auth:** `JwtAuthGuard` + `RolesGuard(VENDOR, ADMIN)`
- **Body:** `{ name?, description?, price?, compareAtPrice?, stock?, unit?, images?, isActive? }`

`DELETE /products/:id` — Delete product
- **Auth:** `JwtAuthGuard` + `RolesGuard(VENDOR, ADMIN)`

`PATCH /products/:id/approve` — Approve product (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## Categories Module

`POST /categories` — Create category
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ name, storeType, image?, description? }`

`GET /categories` — List categories
- **Auth:** None
- **Query:** `{ storeType? }`

`GET /categories/:id` — Get category by ID
- **Auth:** None

`PATCH /categories/:id` — Update category
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`DELETE /categories/:id` — Delete category
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## Sub-Categories Module

`POST /sub-categories` — Create sub-category
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ name, categoryId, image? }`

`GET /sub-categories` — List sub-categories
- **Auth:** None
- **Query:** `{ categoryId? }`

`GET /sub-categories/:id` — Get by ID
- **Auth:** None

`PATCH /sub-categories/:id` — Update
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`DELETE /sub-categories/:id` — Delete
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## Brands Module

`POST /brands` — Create brand
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ name, storeType, description?, image? }`

`GET /brands` — List brands
- **Auth:** None
- **Query:** `{ storeType? }`

`GET /brands/:id` — Get brand
- **Auth:** None

`PATCH /brands/:id` — Update brand
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`DELETE /brands/:id` — Delete brand
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## Cart Module

`POST /cart/items` — Add item to cart
- **Auth:** `JwtAuthGuard`
- **Body:** `{ productId, quantity, variantId? }`

`GET /cart` — Get cart with items
- **Auth:** `JwtAuthGuard`

`GET /cart/count` — Get cart item count
- **Auth:** `JwtAuthGuard`

`PATCH /cart/items/:productId` — Update item quantity
- **Auth:** `JwtAuthGuard`
- **Body:** `{ quantity }`

`DELETE /cart/items/:productId` — Remove item from cart
- **Auth:** `JwtAuthGuard`

`DELETE /cart` — Clear entire cart
- **Auth:** `JwtAuthGuard`

---

## Wishlist Module

`POST /wishlist/items` — Add product to wishlist
- **Auth:** `JwtAuthGuard`
- **Body:** `{ productId }`

`GET /wishlist` — Get wishlist
- **Auth:** `JwtAuthGuard`

`GET /wishlist/check/:productId` — Check if product is wishlisted
- **Auth:** `JwtAuthGuard`

`DELETE /wishlist/items/:productId` — Remove from wishlist
- **Auth:** `JwtAuthGuard`

---

## Orders Module

`POST /orders` — Create order from cart
- **Auth:** `JwtAuthGuard`
- **Body:** `{ addressId, items?, paymentMethod, notes?, couponCode?, discount?, deliverySlotId? }`

`GET /orders` — List user's orders
- **Auth:** `JwtAuthGuard`
- **Query:** `{ status?, page?, limit?, startDate?, endDate? }`

`GET /orders/summary` — Get order summary
- **Auth:** `JwtAuthGuard`

`GET /orders/vendor` — List vendor's orders
- **Auth:** `JwtAuthGuard` + `RolesGuard(VENDOR)`
- **Query:** `{ status?, page?, limit? }`

`GET /orders/:id` — Get order detail
- **Auth:** `JwtAuthGuard`

`GET /orders/:id/timeline` — Get order status timeline
- **Auth:** `JwtAuthGuard`

`PATCH /orders/:id/status` — Update order status
- **Auth:** `JwtAuthGuard`
- **Body:** `{ status }`

`PATCH /orders/:id/groups/:groupId/status` — Update vendor group status
- **Auth:** `JwtAuthGuard`
- **Body:** `{ status }`

`POST /orders/:id/cancel` — Cancel order
- **Auth:** `JwtAuthGuard`

`POST /orders/:id/groups/:groupId/cancel` — Cancel vendor group
- **Auth:** `JwtAuthGuard`

`POST /orders/:id/assign` — Assign delivery partner (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ deliveryPartnerId }`

`POST /orders/:id/reject` — Reject delivery assignment (DP)
- **Auth:** `JwtAuthGuard` + `RolesGuard(DELIVERY_PARTNER)`

`POST /orders/:id/verify-pickup` — Verify pickup OTP (DP)
- **Auth:** `JwtAuthGuard` + `RolesGuard(DELIVERY_PARTNER)`
- **Body:** `{ otp }`

`POST /orders/:id/deliver` — Complete delivery (DP)
- **Auth:** `JwtAuthGuard` + `RolesGuard(DELIVERY_PARTNER)`

---

## Payments Module

`GET /payments` — List all payments (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Query:** `{ status?, startDate?, endDate?, page?, limit? }`

`POST /payments/razorpay/order` — Create Razorpay order
- **Auth:** `JwtAuthGuard`
- **Body:** `{ orderId }`

`POST /payments/razorpay/verify` — Verify payment signature
- **Auth:** `JwtAuthGuard`
- **Body:** `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }`

`POST /payments/razorpay/webhook` — Razorpay webhook handler
- **Auth:** HMAC signature verification
- **Headers:** `x-razorpay-signature`

`POST /payments/refund/:orderId` — Initiate refund (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ reason? }`

`GET /payments/:orderId` — Get payments for an order
- **Auth:** `JwtAuthGuard`

---

## Addresses Module

`POST /addresses` — Add address
- **Auth:** `JwtAuthGuard`
- **Body:** `{ label?, fullAddress, city, state, pincode, lat?, lng?, isDefault?, zoneId? }`

`GET /addresses` — List user's addresses
- **Auth:** `JwtAuthGuard`

`GET /addresses/:id` — Get address
- **Auth:** `JwtAuthGuard`

`PATCH /addresses/:id` — Update address
- **Auth:** `JwtAuthGuard`

`DELETE /addresses/:id` — Delete address
- **Auth:** `JwtAuthGuard`

`POST /addresses/:id/default` — Set as default
- **Auth:** `JwtAuthGuard`

---

## Reviews Module

`POST /reviews` — Create review
- **Auth:** `JwtAuthGuard`
- **Body:** `{ productId, rating, title?, comment?, images? }`

`GET /reviews/product/:productId` — Get product reviews
- **Auth:** None
- **Query:** `{ page?, limit? }`

`GET /reviews/ratings` — Get rating summary
- **Auth:** None
- **Query:** `{ productId }`

`GET /reviews/my` — Get user's reviews
- **Auth:** `JwtAuthGuard`

`DELETE /reviews/:id` — Delete review
- **Auth:** `JwtAuthGuard`

---

## Coupons Module

`POST /coupons` — Create coupon (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ code, type, discount, minOrder?, maxDiscount?, usageLimit?, expiresAt? }`

`GET /coupons` — List coupons (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /coupons/:id` — Get coupon
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`POST /coupons/validate` — Validate coupon code
- **Auth:** `JwtAuthGuard`
- **Body:** `{ code, subtotal }`

`PATCH /coupons/:id` — Update coupon
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`DELETE /coupons/:id` — Delete coupon
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## Offers Module

`POST /offers` — Create offer (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /offers` — List offers
- **Auth:** None

`GET /offers/active` — Get active offers
- **Auth:** None

`GET /offers/:id` — Get offer
- **Auth:** None

`PATCH /offers/:id` — Update offer
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`DELETE /offers/:id` — Delete offer
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## Returns Module

`POST /returns` — Request return
- **Auth:** `JwtAuthGuard`
- **Body:** `{ orderItemId, reason, description? }`

`GET /returns` — List user's returns
- **Auth:** `JwtAuthGuard`

`GET /returns/vendor` — List returns for vendor
- **Auth:** `JwtAuthGuard` + `RolesGuard(VENDOR)`

`GET /returns/refunds` — List refund requests
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /returns/:id` — Get return detail
- **Auth:** `JwtAuthGuard`

`PATCH /returns/:id` — Approve/reject return
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## Notifications Module

`GET /notifications` — List user notifications
- **Auth:** `JwtAuthGuard`
- **Query:** `{ page?, limit? }`

`GET /notifications/unread-count` — Get unread count
- **Auth:** `JwtAuthGuard`

`PATCH /notifications/:id/read` — Mark as read
- **Auth:** `JwtAuthGuard`

`PATCH /notifications/read-all` — Mark all as read
- **Auth:** `JwtAuthGuard`

`POST /notifications/register` — Register push token
- **Auth:** `JwtAuthGuard`
- **Body:** `{ token, platform? }`

`DELETE /notifications/unregister` — Unregister push token
- **Auth:** `JwtAuthGuard`

`POST /notifications/send` — Send admin broadcast
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ title, body, data? }`

`GET /notifications/tokens` — List push tokens (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## CMS Module

`POST /cms/pages` — Create CMS page
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ title, slug, content, meta? }`

`GET /cms/pages` — List pages
- **Auth:** None

`GET /cms/pages/:slug` — Get page by slug
- **Auth:** None

`PATCH /cms/pages/:id` — Update page
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`DELETE /cms/pages/:id` — Delete page
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`POST /cms/banners` — Create banner
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ title?, subtitle?, imageUrl, link?, storeType, isActive?, order? }`

`GET /cms/banners` — List banners
- **Auth:** None
- **Query:** `{ storeType?, isActive? }`

`GET /cms/banners/:id` — Get banner
- **Auth:** None

`PATCH /cms/banners/:id` — Update banner
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`DELETE /cms/banners/:id` — Delete banner
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## KYC Module

`POST /kyc/submit` — Submit KYC documents
- **Auth:** `JwtAuthGuard`
- **Body:** `{ documents: [{ documentType, documentNumber?, documentUrl }] }`

`GET /kyc/status` — Get own KYC status
- **Auth:** `JwtAuthGuard`

`GET /kyc` — List all KYC submissions (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /kyc/:id` — Get KYC detail (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`PATCH /kyc/:id/verify` — Approve/reject KYC (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ status: 'VERIFIED' | 'REJECTED', rejectionReason? }`

---

## Inventory Module

`GET /inventory` — List inventory
- **Auth:** `JwtAuthGuard` + `RolesGuard(VENDOR, ADMIN)`

`GET /inventory/low-stock` — Get low-stock products
- **Auth:** `JwtAuthGuard` + `RolesGuard(VENDOR, ADMIN)`
- **Query:** `{ threshold? }`

`PATCH /inventory/:productId` — Update stock
- **Auth:** `JwtAuthGuard` + `RolesGuard(VENDOR, ADMIN)`
- **Body:** `{ stock }`

---

## Commission Module

`GET /commission` — List commissions
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /commission/summary` — Get commission summary
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`POST /commission/calculate/:orderId` — Calculate commission
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`PATCH /commission/:id/pay` — Mark commission as paid
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`POST /commission/bulk-pay` — Bulk pay commissions
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`PATCH /commission/rate/:vendorId` — Update vendor commission rate
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ rate }`

---

## Payouts Module

`GET /payouts` — List all payouts (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /payouts/vendors` — List vendor payouts
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /payouts/delivery` — List delivery partner payouts
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /payouts/summary` — Get payout summary
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`PATCH /payouts/:id/status` — Update payout status
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ status }`

---

## Delivery Module (DP)

`PATCH /delivery/availability` — Toggle availability
- **Auth:** `JwtAuthGuard` + `RolesGuard(DELIVERY_PARTNER)`
- **Body:** `{ isAvailable: boolean }`

`PATCH /delivery/location` — Update current location
- **Auth:** `JwtAuthGuard` + `RolesGuard(DELIVERY_PARTNER)`
- **Body:** `{ lat, lng }`

`GET /delivery/new-orders` — Get available delivery orders
- **Auth:** `JwtAuthGuard` + `RolesGuard(DELIVERY_PARTNER)`

`GET /delivery/active` — Get active deliveries
- **Auth:** `JwtAuthGuard` + `RolesGuard(DELIVERY_PARTNER)`

`GET /delivery/history` — Get delivery history
- **Auth:** `JwtAuthGuard` + `RolesGuard(DELIVERY_PARTNER)`

`GET /delivery/earnings` — Get earnings
- **Auth:** `JwtAuthGuard` + `RolesGuard(DELIVERY_PARTNER)`
- **Query:** `{ period?: 'today' | 'week' | 'month' | 'all' }`

`POST /delivery/setup` — Setup vehicle & zone
- **Auth:** `JwtAuthGuard` + `RolesGuard(DELIVERY_PARTNER)`
- **Body:** `{ vehicleType, zoneName }`

`POST /delivery/failure` — Report delivery failure
- **Auth:** `JwtAuthGuard` + `RolesGuard(DELIVERY_PARTNER)`
- **Body:** `{ orderId, reason, details? }`

---

## Delivery Partners Module (Admin)

`GET /delivery-partners` — List delivery partners
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /delivery-partners/:id` — Get DP detail
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`PATCH /delivery-partners/:id/status` — Update DP status
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ status }`

---

## Delivery Slots Module

`GET /delivery-slots` — Get available delivery slots
- **Auth:** None
- **Query:** `{ zoneId?, date? }`

`POST /admin/delivery-slots` — Create delivery slot (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## Zones Module

`POST /zones` — Create zone (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /zones` — List zones
- **Auth:** None

`GET /zones/:id` — Get zone
- **Auth:** None

`PATCH /zones/:id` — Update zone
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`DELETE /zones/:id` — Delete zone
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## Upload Module

`POST /upload/image` — Upload single image
- **Auth:** `JwtAuthGuard`
- **Body:** multipart/form-data `{ file }`

`POST /upload/images` — Upload multiple images
- **Auth:** `JwtAuthGuard`
- **Body:** multipart/form-data `{ files }`

`POST /upload/avatar` — Upload user avatar
- **Auth:** `JwtAuthGuard`
- **Body:** multipart/form-data `{ file }`

`POST /upload/vendor-logo` — Upload vendor logo
- **Auth:** `JwtAuthGuard` + `RolesGuard(VENDOR)`
- **Body:** multipart/form-data `{ file }`

---

## Roles Module

`POST /roles` — Create role (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ name, permissions }`

`GET /roles` — List roles
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /roles/:id` — Get role
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`PATCH /roles/:id` — Update role
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`DELETE /roles/:id` — Delete role
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`POST /permissions` — Create permission
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /permissions` — List permissions
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`DELETE /permissions/:id` — Delete permission
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## Support Module

`POST /support/tickets` — Create support ticket
- **Auth:** `JwtAuthGuard`
- **Body:** `{ subject, message, orderId? }`

`GET /support/tickets` — List support tickets
- **Auth:** `JwtAuthGuard`

`GET /support/tickets/:id` — Get ticket
- **Auth:** `JwtAuthGuard`

`PATCH /support/tickets/:id/assign` — Assign ticket (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`POST /support/tickets/:id/reply` — Add reply
- **Auth:** `JwtAuthGuard`
- **Body:** `{ message }`

`PATCH /support/tickets/:id/status` — Update ticket status
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ status }`

---

## Reports Module

`GET /reports/sales` — Get sales report (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Query:** `{ startDate?, endDate?, period?: 'daily' | 'weekly' | 'monthly' }`

`GET /reports/revenue` — Get revenue report (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Query:** `{ startDate?, endDate?, period? }`

---

## Admin Dashboard Module

`GET /admin/dashboard` — Executive dashboard with aggregate metrics
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Returns:** today's pulse, pending actions, order pipeline, weekly revenue, recent orders, total counts

`GET /admin/analytics` — Platform analytics
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /admin/settings` — Get platform settings
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`PATCH /admin/settings` — Update platform settings
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## AI Module

`POST /ai/chat` — AI chat
- **Auth:** `JwtAuthGuard`
- **Body:** `{ message }`

`POST /ai/scan` — AI product scanner (vision)
- **Auth:** `JwtAuthGuard`
- **Body:** `{ image }`

`GET /ai/recommendations` — AI product recommendations
- **Auth:** `JwtAuthGuard`

`GET /ai/health-insights` — AI health insights
- **Auth:** `JwtAuthGuard`

`GET /ai/chat-history` — AI chat history
- **Auth:** `JwtAuthGuard`

`GET /ai/admin/logs` — View AI logs (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /ai/admin/analytics` — AI usage analytics (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## Audit Logs Module

`GET /audit-logs` — List audit logs (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Query:** `{ adminId?, action?, resource?, startDate?, endDate?, page?, limit? }`

`GET /audit-logs/summary` — Audit log summary (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

---

## Disputes Module

`GET /disputes` — List disputes (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /disputes/:id` — Get dispute
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`POST /disputes` — Create dispute
- **Auth:** `JwtAuthGuard`
- **Body:** `{ orderId, reason, description? }`

`PATCH /disputes/:id/resolve` — Resolve dispute (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`
- **Body:** `{ resolution, notes? }`

---

## Seed Module

`POST /seed` — Seed demo data (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`POST /seed/reset` — Reset database (admin)
- **Auth:** `JwtAuthGuard` + `RolesGuard(ADMIN)`

`GET /seed/status` — Check seed status
- **Auth:** None

---

## Health Module

`GET /health` — Health check
- **Auth:** None
- **Returns:** `{ status: 'ok', timestamp, uptime }`

---

## Error Codes

| HTTP | Error | Cause |
|------|-------|-------|
| 400 | `BAD_REQUEST` | Validation failed, missing/invalid fields |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 403 | `FORBIDDEN` | Authenticated but insufficient role |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Duplicate (email, phone, coupon code) |

| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |

### Prisma → HTTP Mapping

| Prisma Error | HTTP | Scenario |
|-------------|------|----------|
| P2002 | 409 | Duplicate unique field |
| P2025 | 404 | Record not found |
| P2003 | 400 | Foreign key violation |

---

## Order Status Machine

```
PLACED → CONFIRMED → PACKED → ASSIGNED_TO_DELIVERY → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED
                                                                          ↘ CANCELLED → REFUNDED
```

Each status transition is validated server-side. `CANCELLED` and `REFUNDED` are terminal states.

---

## Response Formats

### Success (single)
```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "...", "requestId": "uuid" }
}
```

### Success (paginated)
```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

### Error
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "BAD_REQUEST",
  "timestamp": "...",
  "path": "/api/products",
  "requestId": "uuid"
}
```

---

## Auth Flow

1. **Phone OTP** (customer app): `POST /auth/send-otp` → user enters code → `POST /auth/verify-otp-login`
2. **Email + Password** (vendor/admin dashboard): `POST /auth/login` → receives `{ accessToken, user }`
3. **Google OAuth**: `POST /auth/google` with `{ idToken }`
4. All subsequent requests: `Authorization: Bearer <accessToken>`

## RBAC Roles

| Role | Scope |
|------|-------|
| `CUSTOMER` | Browse, cart, orders, profile |
| `VENDOR` | Product catalog, order fulfillment, earnings |
| `DELIVERY_PARTNER` | Accept/reject orders, track delivery |
| `ADMIN` | Oversight, approvals, settings, payouts |

---

*Generated from NestJS source — 36 modules, 160+ endpoints*
