# API Reference

> **Last updated:** 2026-07-20

---

## Response Format

Success: { success: true, data: {...}, meta: { timestamp, requestId } }
Error: { statusCode: 400, message: ..., error: BAD_REQUEST, timestamp, path, requestId }
Paginated: { success: true, data: [...], meta: { page, limit, total, totalPages } }

---

## Auth Module (/api/auth/)
POST /api/auth/signup - Create account (Public)
POST /api/auth/login - Login (Public)
POST /api/auth/verify-otp - Verify OTP (Public)
POST /api/auth/forgot-password - Request reset (Public)
POST /api/auth/reset-password - Reset password (Public)
GET /api/auth/me - Get current user (JWT)

## Users Module (/api/users/)
GET /api/users/me - Get profile (JWT)
PATCH /api/users/me - Update profile (JWT)
GET /api/users - List all users (Admin)
PATCH /api/users/:id/role - Update role (Admin)
PATCH /api/users/:id/status - Update status (Admin)

## KYC Module (/api/kyc/)
POST /api/kyc/submit - Submit documents (JWT)
GET /api/kyc/status - Get KYC status (JWT)
GET /api/kyc - List all submissions (Admin)
PATCH /api/kyc/:id/verify - Verify/reject (Admin)

## Categories Module (/api/categories/)
GET /api/categories - List (Public, filter by storeType)
GET /api/categories/:id - Get one (Public)
POST /api/categories - Create (Admin)
PATCH /api/categories/:id - Update (Admin)
DELETE /api/categories/:id - Delete (Admin)

## Sub-Categories Module (/api/sub-categories/)
GET /api/sub-categories - List (Public)
GET /api/sub-categories/:id - Get one (Public)
POST /api/sub-categories - Create (Admin)
PATCH /api/sub-categories/:id - Update (Admin)
DELETE /api/sub-categories/:id - Delete (Admin)

## Brands Module (/api/brands/)
GET /api/brands - List (Public, filter by storeType)
GET /api/brands/:id - Get one (Public)
POST /api/brands - Create (Admin)
PATCH /api/brands/:id - Update (Admin)
DELETE /api/brands/:id - Delete (Admin)

## Vendors Module (/api/vendors/)
POST /api/vendors/register - Register (JWT)
GET /api/vendors - List all (Admin)
GET /api/vendors/:id - Get one (Public)
PATCH /api/vendors/:id/approve - Approve (Admin)
PATCH /api/vendors/me/profile - Update profile (Vendor)

## Products Module (/api/products/)
GET /api/products - List with search/filter/pagination (Public)
GET /api/products/:id - Get with variants (Public)
POST /api/products - Create (Vendor)
PATCH /api/products/:id - Update (Vendor)
DELETE /api/products/:id - Delete (Admin)
GET /api/products/:id/variants - List variants (Public)
POST /api/products/:id/variants - Add variant (Vendor)

## Cart Module (/api/cart/)
GET /api/cart - List items (JWT)
POST /api/cart - Add item (JWT, stock validation)
PATCH /api/cart/:id - Update quantity (JWT)
DELETE /api/cart/:id - Remove item (JWT)

## Wishlist Module (/api/wishlist/)
GET /api/wishlist - List (JWT)
POST /api/wishlist - Add (JWT)
DELETE /api/wishlist/:id - Remove (JWT)

## Reviews Module (/api/reviews/)
GET /api/reviews/product/:id - Get product reviews (Public, with avg rating)
POST /api/reviews - Create (JWT)

## Addresses Module (/api/addresses/)
GET /api/addresses - List (JWT)
POST /api/addresses - Create (JWT)
PATCH /api/addresses/:id - Update (JWT)
DELETE /api/addresses/:id - Delete (JWT)
PATCH /api/addresses/:id/default - Set default (JWT)

## Orders Module (/api/orders/)
POST /api/orders - Create from cart (JWT)
GET /api/orders - List (JWT)
GET /api/orders/:id - Get detail (JWT)
PATCH /api/orders/:id/status - Update status (Admin/Vendor)
POST /api/orders/:id/cancel - Cancel (JWT)

## Payments Module (/api/payments/)
POST /api/payments/razorpay-order - Create Razorpay order (JWT)
POST /api/payments/verify - Verify signature (JWT)
POST /api/payments/webhook - Razorpay webhook (Public, signed)

## Commission Module (/api/commission/)
GET /api/commission/summary - Summary (Admin)
PATCH /api/commission/pay - Mark as paid (Admin)
PATCH /api/commission/vendor-rate - Update rate (Admin)

## Coupons Module (/api/coupons/)
CRUD - GET/POST/PATCH/DELETE (Admin)
POST /api/coupons/validate - Validate code (JWT)

## Offers Module (/api/offers/)
GET /api/offers - List active (Public, filter by storeType)
POST/PATCH/DELETE (Admin)

## Returns Module (/api/returns/)
POST /api/returns - Request return (JWT)
GET /api/returns - List (JWT)
PATCH /api/returns/:id/approve - Approve (Admin)
PATCH /api/returns/:id/reject - Reject (Admin)

## Notifications Module (/api/notifications/)
POST /api/notifications/register-token - Register push token (JWT)
GET /api/notifications - List (JWT)
PATCH /api/notifications/:id/read - Mark read (JWT)

## AI Module (/api/ai/)
POST /api/ai/chat - AI chat (JWT)
POST /api/ai/scan - Product scanner (JWT)
GET /api/ai/recommendations - Get recommendations (JWT)
POST /api/ai/health-insights - Health insights (JWT)
GET /api/ai/admin/logs - AI usage logs (Admin)

## Upload Module (/api/upload/)
POST /api/upload/image - Upload image to Supabase (JWT)

## CMS Module (/api/cms/)
GET /api/cms/pages - List pages (Public)
GET /api/cms/pages/:slug - Get by slug (Public)
POST/PATCH/DELETE /api/cms/pages - CRUD (Admin)
GET /api/cms/banners - List active banners (Public)
POST/PATCH/DELETE /api/cms/banners - CRUD (Admin)

## Roles Module (/api/roles/)
GET /api/roles - List roles (Admin)
POST /api/roles - Create role (Admin)
PATCH /api/roles/:id - Update role (Admin)
DELETE /api/roles/:id - Delete role (Admin)
GET /api/roles/permissions - List permissions (Admin)
POST /api/roles/permissions - Create permission (Admin)

## Seed Module (/api/seed/)
POST /api/seed/demo-data - Seed demo data (Admin)
POST /api/seed/reset - Reset database (Admin)
