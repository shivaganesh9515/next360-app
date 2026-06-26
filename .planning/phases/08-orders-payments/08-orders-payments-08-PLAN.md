---
phase: 08-orders-payments
plan: 08
type: execute
wave: 5
depends_on:
  - 03-core-api-b-04
  - 02-auth-02
files_modified:
  - apps/api/src/orders/orders.module.ts
  - apps/api/src/orders/orders.controller.ts
  - apps/api/src/orders/orders.service.ts
  - apps/api/src/orders/dto/create-order.dto.ts
  - apps/api/src/orders/dto/update-order-status.dto.ts
  - apps/api/src/payments/payments.module.ts
  - apps/api/src/payments/payments.controller.ts
  - apps/api/src/payments/payments.service.ts
  - apps/api/src/payments/dto/create-razorpay-order.dto.ts
  - apps/api/src/commission/commission.module.ts
  - apps/api/src/commission/commission.service.ts
  - apps/api/src/commission/commission.controller.ts
  - apps/api/src/app.module.ts
  - apps/api/package.json
  - .env.example
autonomous: false
requirements:
  - ORDER-01
  - ORDER-02
  - ORDER-03
  - ORDER-04
  - ORDER-05
must_haves:
  truths:
    - "User can place an order from their cart"
    - "Cart is split into OrderVendorGroup records (one per vendor) — each tracked independently"
    - "Order status machine: PLACED → CONFIRMED → PACKED → ASSIGNED_TO_DELIVERY → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED"
    - "COD capped at ₹2,000 — rejected server-side if exceeded"
    - "User can make payment via Razorpay checkout (single payment for full order total)"
    - "Razorpay Route splits payout to each vendor's linked account based on subtotal minus commissionPct"
    - "Admin can see commission earned per order"
    - "User can view their order history and details"
    - "Invoice is generated for completed orders"
    - "Webhook handles payment success/failure events and triggers per-vendor group status updates"
  artifacts:
    - path: "apps/api/src/orders/orders.service.ts"
      provides: "Order CRUD and status management"
      min_lines: 120
    - path: "apps/api/src/payments/payments.service.ts"
      provides: "Razorpay payment processing"
      min_lines: 80
    - path: "apps/api/src/commission/commission.service.ts"
      provides: "Commission calculation"
  key_links:
    - from: "apps/api/src/orders/orders.service.ts"
      to: "apps/api/src/cart/cart.service.ts"
      via: "clearCart after order placement"
    - from: "apps/api/src/orders/orders.service.ts"
      to: "prisma.order"
      via: "status transitions"
    - from: "apps/api/src/payments/payments.service.ts"
      to: "Razorpay API"
      via: "razorpay SDK"
    - from: "apps/api/src/payments/payments.service.ts"
      to: "POST /payments/webhook"
      via: "Razorpay webhook signature verification"
---

<objective>
Implement order creation, lifecycle management, Razorpay payment integration, commission tracking, and invoice generation.

Purpose: Enable customers to place orders from cart, process payments via Razorpay, track order status throughout fulfillment, calculate platform commissions, and generate invoices.
Output: Orders module, Payments module (Razorpay), Commission module, invoice generation.
</objective>

<execution_context>
@C:/Users/gunny/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/gunny/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-foundation-01-SUMMARY.md
@.planning/phases/02-auth/02-auth-02-SUMMARY.md
@.planning/phases/03-core-api-b/03-core-api-b-04-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Orders module — order creation, status machine, and order history API</name>
  <files>
    apps/api/src/orders/orders.module.ts
    apps/api/src/orders/orders.controller.ts
    apps/api/src/orders/orders.service.ts
    apps/api/src/orders/dto/create-order.dto.ts
    apps/api/src/orders/dto/update-order-status.dto.ts
    apps/api/src/app.module.ts
  </files>
  <action>
    Create Orders module with full order lifecycle management:

    1. Install dependencies: `cd apps/api && npm install uuid` (for order number generation)

    2. Create orders.module.ts — imports PrismaModule, CartModule (to clear cart on order)

    3. Create orders.service.ts with methods:

       a. create(userId, dto):
          - Fetch user's cart with items (prisma.cartItem.findMany with product + vendor relations)
          - Validate all items have sufficient stock
          - Validate zone: user's address zone must match vendor zones
          - If paymentMethod is COD: validate totalAmount <= ₹2,000 (hard cap — throw 400 if exceeded)
          - Generate order number: ORD-{timestamp}-{random 4 digits}
          - Use a Prisma transaction:
            1. Create Order (totalAmount, paymentMethod, addressId, status: PLACED)
            2. Group cart items by vendorId
            3. For each vendor group:
               a. Create OrderVendorGroup (orderId, vendorId, subtotal, status: PLACED)
               b. Create OrderItem records linked to the group (with priceAtPurchase snapshot)
            4. Decrement product stock for each item
            5. Delete all cart items (clear cart)
          - If paymentMethod is COD: set Order status to CONFIRMED, each OrderVendorGroup to CONFIRMED
          - If paymentMethod is RAZORPAY: keep as PLACED (wait for payment webhook)
          - Return order with vendorGroups → items

       b. findAll(userId, role?, filters?):
          - Customer: returns their orders with items (paginated, newest first)
          - Vendor: returns orders containing their products (filtered by their vendorId)
          - Admin: returns all orders
          - Filters: status, date range, store_type, page/limit

       c. findOne(orderId, userId?, role?):
          - Return order with items, payment info, delivery info
          - Authorization: customer sees own, vendor sees orders with their products, admin sees all

       d. updateStatus(orderId, groupId, dto, userId, role):
          - Status transitions are on OrderVendorGroup (not Order):
            PLACED → CONFIRMED (payment webhook or COD)
            CONFIRMED → PACKED (vendor action)
            PACKED → ASSIGNED_TO_DELIVERY (admin assigns delivery partner)
            ASSIGNED_TO_DELIVERY → PICKED_UP (delivery partner confirms + OTP)
            PICKED_UP → OUT_FOR_DELIVERY (auto after pickup)
            OUT_FOR_DELIVERY → DELIVERED (delivery partner marks complete)
            Any → CANCELLED (customer before CONFIRMED; admin/vendor after)
            DELIVERED/CANCELLED → REFUNDED (admin action after return approval)
          - Order.status is derived: PLACED until all groups CONFIRMED, DELIVERED when all groups DELIVERED, etc.
          - Reject invalid transitions with 400 BadRequest

       e. cancel(orderId, userId, reason?):
          - Customer can cancel if status is PENDING or CONFIRMED
          - Admin/vendor can cancel anytime
          - Restore product stock on cancellation
          - Handle refund logic if payment was made

       f. getOrderStatusTimeline(orderId):
          - Return ordered list of status changes with timestamps

    4. Create orders.controller.ts with endpoints:
       - POST /orders — protected (customer), create order from cart
         - Body: addressId, paymentMethod (COD | RAZORPAY), notes?
       - GET /orders — protected, list orders (scoped to user role)
         - Query: status, page, limit, startDate, endDate
       - GET /orders/summary — protected, lightweight order stats for dashboard
       - GET /orders/:id — protected, order detail
       - PATCH /orders/:id/status — protected (vendor/admin), update status
       - POST /orders/:id/cancel — protected, cancel order

    5. Create DTOs:
       - CreateOrderDto: addressId (UUID, required), paymentMethod (enum: COD | RAZORPAY), notes (string, optional), storeType (optional, enum)
       - UpdateOrderStatusDto: status (enum from Prisma OrderStatus)

    6. Register OrdersModule in app.module.ts

    7. Status enum (in Prisma schema already from Plan 01):
       PENDING, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, REFUNDED

    8. Error handling:
       - Empty cart → 400 BadRequest
       - Insufficient stock → 400 with item details
       - Invalid status transition → 400
       - Order not found → 404
       - Unauthorized access → 403
  </action>
  <verify>
    Check orders.service.ts has create/findAll/findOne/updateStatus/cancel methods.
    Verify status state machine logic prevents invalid transitions.
    Check order creation clears cart and decrements stock in transaction.
    Verify role-based access control in controller.
  </verify>
  <done>
    Orders module with complete lifecycle, status state machine, and role-based access is ready.
  </done>
</task>

<task type="auto">
  <name>Task 2: Razorpay payment integration + webhook handler</name>
  <files>
    apps/api/src/payments/payments.module.ts
    apps/api/src/payments/payments.controller.ts
    apps/api/src/payments/payments.service.ts
    apps/api/src/payments/dto/create-razorpay-order.dto.ts
    apps/api/src/app.module.ts
    apps/api/package.json
    .env.example
  </files>
  <action>
    Integrate Razorpay payment gateway:

    1. Install dependencies:
       ```
       cd apps/api && npm install razorpay
       cd apps/api && npm install -D @types/razorpay (if needed)
       ```

    2. Update .env.example:
       - RAZORPAY_KEY_ID=
       - RAZORPAY_KEY_SECRET=
       - RAZORPAY_WEBHOOK_SECRET=

    3. Create payments.module.ts — imports PrismaModule, forwardRef(() => OrdersModule) for order updates

    4. Create payments.service.ts with methods:

       a. createRazorpayOrder(orderId):
          - Fetch order from database with totalAmount and vendorGroups
          - Create a single Razorpay Order for the full total (one payment from customer):
            ```
            razorpay.orders.create({
              amount: order.totalAmount * 100, // paise
              currency: "INR",
              receipt: order.orderNo,
              notes: { orderId: order.id },
              transfers: order.vendorGroups.map(group => ({
                account: group.vendor.razorpayAccountId,
                amount: Math.round((group.subtotal - group.subtotal * group.vendor.commissionPct / 100) * 100),
                currency: "INR",
                on_hold: false
              }))
            })
            // transfers = Razorpay Route — auto-splits payout to each vendor's linked account
            ```
          - Store razorpayOrderId in the Order record
          - Return razorpayOrderId, amount, currency, keyId (for frontend checkout)

       b. verifyPayment(razorpayPaymentId, razorpayOrderId, razorpaySignature):
          - Generate expected signature: HMAC_SHA256(razorpayOrderId + "|" + razorpayPaymentId, RAZORPAY_KEY_SECRET)
          - Compare with razorpaySignature
          - If valid: update Payment record status to COMPLETED, update Order status to CONFIRMED
          - If invalid: update Payment status to FAILED

       c. handleWebhook(event):
          - Verify webhook signature using RAZORPAY_WEBHOOK_SECRET
          - Handle event types:
            - payment.captured → mark order as CONFIRMED, payment as COMPLETED
            - payment.failed → mark payment as FAILED, order as CANCELLED
            - order.paid → mark order as CONFIRMED
          - Return success/acknowledgment

       d. getPaymentStatus(orderId):
          - Return payment details for an order

       e. initiateRefund(orderId, reason?):
          - Call Razorpay refund API
          - Update Payment status to REFUNDED
          - Update Order status to REFUNDED

    5. Create payments.controller.ts with endpoints:
       - POST /payments/razorpay/order — protected, create Razorpay order for given orderId
         - Body: orderId (UUID)
         - Response: { razorpayOrderId, amount, currency, keyId }
       - POST /payments/verify — protected, verify payment on client callback
         - Body: razorpayPaymentId, razorpayOrderId, razorpaySignature
       - POST /payments/webhook — public (HMAC verified), Razorpay webhook endpoint
         - Body: Razorpay webhook payload
         - Response: 200 OK (Razorpay expects this)
       - GET /payments/:orderId/status — protected, get payment status

    6. Create DTOs:
       - CreateRazorpayOrderDto: orderId (UUID)
       - VerifyPaymentDto: razorpayPaymentId, razorpayOrderId, razorpaySignature

    7. Razorpay webhook signature verification:
       ```
       const crypto = require('crypto');
       const expected = crypto
         .createHmac('sha256', webhookSecret)
         .update(JSON.stringify(body))
         .digest('hex');
       if (expected !== signature) throw new UnauthorizedException();
       ```

    8. Register PaymentsModule in app.module.ts

    Security notes:
    - The webhook endpoint is public but verifies HMAC signature before processing
    - Never trust client-side payment confirmation — always verify server-side
    - Store all payment transactions in Payment model for audit trail
  </action>
  <verify>
    Check payments.service.ts has createRazorpayOrder, verifyPayment, handleWebhook methods.
    Verify HMAC signature check in webhook handler.
    Check successful payment updates order to CONFIRMED.
  </verify>
  <done>
    Razorpay payment integration with order creation, verification, and webhook handling is complete.
  </done>
</task>

<task type="auto">
  <name>Task 3: Commission module + invoice generation</name>
  <files>
    apps/api/src/commission/commission.module.ts
    apps/api/src/commission/commission.service.ts
    apps/api/src/commission/commission.controller.ts
    apps/api/src/commission/dto/update-commission-rate.dto.ts
    apps/api/src/app.module.ts
  </files>
  <action>
    Create Commission module and invoice generation:

    1. Create commission.module.ts — imports PrismaModule

    2. Create commission.service.ts with methods:

       a. calculateCommission(orderId):
          - For each item in the order, calculate:
            - platformCommission = item.price * item.quantity * vendor.commissionRate
            - vendorEarning = item.price * item.quantity - platformCommission
          - Default commission rate: 15% (configurable per vendor via vendor.commissionRate field)
          - Store as Commission record: orderId, vendorId, itemId, platformAmount, vendorAmount, rate
          - Return summary: totalPlatformCommission, totalVendorEarning

       b. getCommissionSummary(filters):
          - Total commission earned (date range, vendor filter)
          - Group by vendor or by day/week/month
          - Used by admin dashboard for analytics

       c. getVendorEarnings(vendorId, filters):
          - Total earnings for a vendor
          - Pending/paid status
          - With date range filtering

       d. markAsPaid(commissionIds):
          - Admin marks commission payout as PAID
          - Updates Commission.status from PENDING to PAID
          - Stores payoutDate

       e. updateVendorCommissionRate(vendorId, rate):
          - Admin updates the commission rate for a vendor
          - Rate stored as percentage (e.g., 0.15 = 15%)

    3. Create commission.controller.ts:
       - GET /commission/summary — admin only, platform commission summary
       - GET /commission/vendors/:vendorId — admin/vendor, specific vendor earnings
       - PATCH /commission/pay — admin, mark commissions as paid
         - Body: commissionIds (UUID[])
       - PATCH /commission/rate/:vendorId — admin, update vendor commission rate
         - Body: rate (number, 0-1 range)

    4. Invoice generation:
       a. In orders.service.ts, add generateInvoice(orderId) method:
          - Generate a unique invoice number: INV-{year}-{sequential number}
          - Store in Order.invoiceNumber field
          - Return invoice data object: {
              invoiceNumber, orderNumber, date, customer, vendor(s),
              items, subtotal, deliveryFee, platformFee, total, paymentMethod, status
            }
       b. Invoice data is returned as part of GET /orders/:id response
       c. For now, invoice is a data object (JSON). PDF generation can be added later.

    5. Register CommissionModule in app.module.ts

    Notes:
    - Commission is calculated at order placement time (after payment)
    - The vendor.commissionRate field should be added to the Vendor model if not already present
    - Default rate for all vendors: 15%
  </action>
  <verify>
    Check commission.service.ts calculateCommission and getCommissionSummary methods.
    Verify invoice data is returned with order detail.
    Check commission rate update endpoint works.
  </verify>
  <done>
    Commission module with per-vendor rates, calculation, payout tracking, and invoice generation is complete.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Orders API (create, status machine, history), Razorpay payment integration (order creation, verification, webhooks), Commission module (calculation, payout), Invoice generation</what-built>
  <how-to-verify>
    1. Start NestJS server with Razorpay keys configured
    2. Place an order directly via API:
       ```
       curl -X POST http://localhost:4000/orders \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer <customer_token>" \
         -d '{"addressId":"<address_id>","paymentMethod":"COD"}'
       ```
       Expect: 201 with order object, items snapshot, totals, order number
    3. Check the order status:
       ```
       curl http://localhost:4000/orders/<order_id> \
         -H "Authorization: Bearer <customer_token>"
       ```
       Expect: 200 with order detail, items, status, invoice data
    4. Update order status as vendor:
       ```
       curl -X PATCH http://localhost:4000/orders/<order_id>/status \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer <vendor_token>" \
         -d '{"status":"PREPARING"}'
       ```
       Expect: 200 with updated order
    5. Test invalid transition:
       ```
       curl -X PATCH http://localhost:4000/orders/<order_id>/status \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer <vendor_token>" \
         -d '{"status":"DELIVERED"}'
       ```
       Expect: 400 (can't skip PREPARING and OUT_FOR_DELIVERY)
    6. Verify commission was calculated: GET /commission/summary (admin token)
       Expect: 200 with commission data
    7. Create Razorpay payment order:
       ```
       curl -X POST http://localhost:4000/payments/razorpay/order \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer <customer_token>" \
         -d '{"orderId":"<order_id>"}'
       ```
       Expect: 200 with razorpayOrderId, amount, currency, keyId
    8. Verify the invoice is included in the order detail response
    9. Test order cancellation and stock restoration
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
1. Order creation validates cart, decrements stock, clears cart
2. Status state machine prevents illegal transitions
3. Razorpay order creation returns correct payment payload
4. Webhook handles payment.captured and payment.failed correctly
5. Commission is calculated per item based on vendor's commission rate
6. Invoice data is generated and accessible
7. Role-based access works: customers see own, vendors see relevant, admin sees all
8. Cancellation restores stock and initiates refund if paid
</verification>

<success_criteria>
- Full order lifecycle: cart → create → pay → prepare → deliver
- Razorpay payments work end-to-end (order creation, verification, webhook, refund)
- Commission tracked per vendor with configurable rates
- Invoices generated for completed orders
- Order and payment APIs ready for mobile and web clients
</success_criteria>

<output>
After completion, create `.planning/phases/08-orders-payments/08-orders-payments-08-SUMMARY.md`
</output>
