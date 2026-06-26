---
phase: 03-core-api-b
plan: 04
type: execute
wave: 4
depends_on:
  - 03-core-api-a-03
files_modified:
  - apps/api/src/addresses/addresses.module.ts
  - apps/api/src/addresses/addresses.controller.ts
  - apps/api/src/addresses/addresses.service.ts
  - apps/api/src/addresses/dto/*.ts
  - apps/api/src/cart/cart.module.ts
  - apps/api/src/cart/cart.controller.ts
  - apps/api/src/cart/cart.service.ts
  - apps/api/src/cart/dto/*.ts
  - apps/api/src/app.module.ts
autonomous: false
requirements:
  - CORE-04
  - CORE-05
must_haves:
  truths:
    - "User can add/remove/update items in their cart"
    - "Cart items require authentication and are user-scoped"
    - "User can manage multiple saved addresses"
    - "Cart correctly calculates item totals"
    - "Addresses are used during checkout"
  artifacts:
    - path: "apps/api/src/cart/cart.service.ts"
      provides: "Cart CRUD"
      contains: "prisma.cartItem"
    - path: "apps/api/src/addresses/addresses.service.ts"
      provides: "Address CRUD"
      contains: "prisma.address"
  key_links:
    - from: "apps/api/src/cart/cart.service.ts"
      to: "apps/api/src/products/products.service.ts"
      via: "prisma.product.findUnique"
    - from: "apps/api/src/addresses/addresses.controller.ts"
      to: "apps/api/src/auth/decorators/current-user.decorator.ts"
      via: "@CurrentUser"
---

<objective>
Implement address management and shopping cart APIs.

Purpose: Let users save multiple delivery addresses and manage their cart prior to checkout — essential infrastructure for Phase 6 orders.
Output: Addresses module + Cart module with full CRUD, user scoping, and validation.
</objective>

<execution_context>
@C:/Users/gunny/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/gunny/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-foundation-01-SUMMARY.md
@.planning/phases/02-auth/02-auth-02-SUMMARY.md
@.planning/phases/03-core-api-a/03-core-api-a-03-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Addresses module — CRUD for user delivery addresses</name>
  <files>
    apps/api/src/addresses/addresses.module.ts
    apps/api/src/addresses/addresses.controller.ts
    apps/api/src/addresses/addresses.service.ts
    apps/api/src/addresses/dto/create-address.dto.ts
    apps/api/src/addresses/dto/update-address.dto.ts
  </files>
  <action>
    Create Addresses module for user delivery address management:

    1. Create addresses.module.ts — imports PrismaModule

    2. Create addresses.service.ts with methods:
       - create(userId, dto): creates address, if isDefault=true, unset other defaults
       - findAll(userId): returns all addresses for user
       - findOne(id): single address by id, verify ownership
       - update(userId, id, dto): update address fields, handle default toggle
       - remove(userId, id): delete address
       - setDefault(userId, id): set one address as default

    3. Create addresses.controller.ts with endpoints:
       - POST /addresses — protected, create new address
       - GET /addresses — protected, list user's addresses
       - GET /addresses/:id — protected, get one address
       - PATCH /addresses/:id — protected, update address
       - DELETE /addresses/:id — protected, delete address
       - PATCH /addresses/:id/default — protected, set as default

    4. Create DTOs:
       - CreateAddressDto: fullName, phone, street, area, city, state, pincode, landmark?, isDefault?, addressType (HOME, WORK, OTHER)
       - UpdateAddressDto: all optional
       - Validate: pincode format (6 digits), phone format (10 digits)

    5. Register AddressesModule in app.module.ts
  </action>
  <verify>
    Check addresses.controller.ts has 6 endpoint methods.
    Verify all endpoints use @CurrentUser() for user scoping.
    Check Prisma address model is used from shared schema (Plan 01).
  </verify>
  <done>
    Addresses module with user-scoped CRUD and default address management is complete.
  </done>
</task>

<task type="auto">
  <name>Task 2: Cart module — user-scoped shopping cart with product validation</name>
  <files>
    apps/api/src/cart/cart.module.ts
    apps/api/src/cart/cart.controller.ts
    apps/api/src/cart/cart.service.ts
    apps/api/src/cart/dto/add-to-cart.dto.ts
    apps/api/src/cart/dto/update-cart-item.dto.ts
  </files>
  <action>
    Create Cart module for shopping cart management:

    1. Create cart.module.ts — imports PrismaModule

    2. Create cart.service.ts with methods:
       - addItem(userId, dto):
         - Check if product exists AND is active AND has sufficient stock
         - If item already in cart, increment quantity (capped by stock)
         - Otherwise create new cart item
         - Return updated cart
       - getCart(userId): return all cart items with product details + vendor info
         - Calculate subtotal per item (price × quantity)
         - Calculate total cart value
       - updateItemQuantity(userId, itemId, dto):
         - Validate item belongs to user
         - Cap quantity at available stock
         - If quantity <= 0, remove item
       - removeItem(userId, itemId): delete cart item
       - clearCart(userId): remove all items (used after order placement)
       - getCartSummary(userId): returns items, subtotal, total items count
       - validateCart(userId): check stock availability for all items (called before checkout)

    3. Create cart.controller.ts with endpoints:
       - POST /cart/items — protected, add item to cart
       - GET /cart — protected, get full cart with totals
       - GET /cart/summary — protected, lightweight cart info (badge count)
       - PATCH /cart/items/:itemId — protected, update quantity
       - DELETE /cart/items/:itemId — protected, remove item
       - DELETE /cart — protected, clear entire cart

    4. Create DTOs:
       - AddToCartDto: productId (uuid), quantity (min 1, default 1)
       - UpdateCartItemDto: quantity (min 0)

    5. Register CartModule in app.module.ts

    6. Error handling: throw proper HTTP exceptions (NotFound for missing product, BadRequest for insufficient stock)
  </action>
  <verify>
    Check cart.controller.ts has 6 endpoint methods.
    Verify cart.service.ts getCart() calculates subtotals.
    Check product stock validation on addItem().
  </verify>
  <done>
    Cart module with product validation, quantity management, totals calculation, and proper error handling is complete.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Addresses API + Cart API</what-built>
  <how-to-verify>
    1. Start NestJS server

    2. Create an address:
       ```
       curl -X POST http://localhost:4000/addresses \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer <token>" \
         -d '{"fullName":"Test User","phone":"9876543210","street":"123 Main St","area":"Downtown","city":"Mumbai","state":"Maharashtra","pincode":"400001"}'
       ```
       Expect: 201 with address object

    3. List addresses:
       ```
       curl http://localhost:4000/addresses \
         -H "Authorization: Bearer <token>"
       ```
       Expect: 200 with address array

    4. Add item to cart:
       ```
       curl -X POST http://localhost:4000/cart/items \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer <token>" \
         -d '{"productId":"<existing_product_id>","quantity":2}'
       ```
       Expect: 201 with cart item

    5. Get cart with totals:
       ```
       curl http://localhost:4000/cart \
         -H "Authorization: Bearer <token>"
       ```
       Expect: 200 with items, subtotal per item, total

    6. Test insufficient stock: try to add quantity > available stock
       Expect: 400 BadRequest with error message
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
1. Address CRUD works with user scoping (users see only their addresses)
2. Default address toggle works correctly
3. Cart add/update/remove items works with stock validation
4. Cart returns correct totals
5. All endpoints properly guarded by JWT auth
</verification>

<success_criteria>
- Users can manage addresses
- Shopping cart works end-to-end with stock validation
- Ready for Phase 6 (Orders & Payments)
</success_criteria>

<output>
After completion, create `.planning/phases/03-core-api-b/03-core-api-b-04-SUMMARY.md`
</output>
