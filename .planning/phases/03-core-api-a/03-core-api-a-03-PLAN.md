---
phase: 03-core-api-a
plan: 03
type: execute
wave: 3
depends_on:
  - 02-auth-02
files_modified:
  - apps/api/src/categories/categories.module.ts
  - apps/api/src/categories/categories.controller.ts
  - apps/api/src/categories/categories.service.ts
  - apps/api/src/categories/dto/*.ts
  - apps/api/src/products/products.module.ts
  - apps/api/src/products/products.controller.ts
  - apps/api/src/products/products.service.ts
  - apps/api/src/products/dto/*.ts
  - apps/api/src/vendors/vendors.module.ts
  - apps/api/src/vendors/vendors.controller.ts
  - apps/api/src/vendors/vendors.service.ts
  - apps/api/src/vendors/dto/*.ts
  - apps/api/src/app.module.ts
  - apps/api/src/prisma/prisma.module.ts
  - apps/api/src/prisma/prisma.service.ts
  - apps/api/src/upload/upload.module.ts
  - apps/api/src/upload/upload.controller.ts
  - apps/api/src/upload/upload.service.ts
autonomous: false
requirements:
  - CORE-01
  - CORE-02
  - CORE-03
  - CORE-06
must_haves:
  truths:
    - "Categories are CRUD-able and scoped by store_type"
    - "Vendors can create/list/update products"
    - "Products have images stored in Supabase Storage"
    - "Products can be searched and filtered by store_type, category, price"
    - "Vendor can manage their own product catalog"
  artifacts:
    - path: "apps/api/src/categories/categories.service.ts"
      provides: "Category CRUD logic"
      contains: "findAll"
    - path: "apps/api/src/products/products.service.ts"
      provides: "Product CRUD logic"
      contains: "create"
    - path: "apps/api/src/upload/upload.service.ts"
      provides: "File upload to Supabase Storage"
      contains: "supabase.storage"
  key_links:
    - from: "apps/api/src/products/products.service.ts"
      to: "apps/api/src/categories/categories.service.ts"
      via: "prisma.category.findUnique"
    - from: "apps/api/src/vendors/vendors.service.ts"
      to: "apps/api/src/products/products.service.ts"
      via: "import"
---

<objective>
Build the core product-related APIs: categories, products with image upload, vendor management, and search/filter.

Purpose: Enable vendors to manage their catalog and customers to browse products — the heart of the marketplace.
Output: Categories, Products, Vendors modules with full CRUD + Supabase Storage upload + search/filter.
</objective>

<execution_context>
@C:/Users/gunny/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/gunny/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-foundation-01-SUMMARY.md
@.planning/phases/02-auth/02-auth-02-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: PrismaService + Categories module + Vendors module</name>
  <files>
    apps/api/src/prisma/prisma.module.ts
    apps/api/src/prisma/prisma.service.ts
    apps/api/src/categories/categories.module.ts
    apps/api/src/categories/categories.controller.ts
    apps/api/src/categories/categories.service.ts
    apps/api/src/categories/dto/create-category.dto.ts
    apps/api/src/categories/dto/update-category.dto.ts
    apps/api/src/vendors/vendors.module.ts
    apps/api/src/vendors/vendors.controller.ts
    apps/api/src/vendors/vendors.service.ts
    apps/api/src/vendors/dto/create-vendor.dto.ts
    apps/api/src/vendors/dto/update-vendor.dto.ts
  </files>
  <action>
    Create Prisma service, Categories module, and Vendors module:

    1. Create prisma.module.ts and prisma.service.ts:
       - PrismaService extends PrismaClient, implements OnModuleInit
       - Global module so all other modules can inject it
       - onModuleInit: this.$connect()

    2. Create Categories module with full CRUD:

       CategoriesService:
       - create(dto) — validates storeType enum, creates category
       - findAll(storeType?) — if storeType provided, filter; else all
       - findOne(id)
       - update(id, dto)
       - remove(id) — soft delete or actual delete (check for products first)

       CategoriesController:
       - POST /categories — admin only
       - GET /categories?storeType=ORGANIC — public, filter by store type
       - GET /categories/:id — public
       - PATCH /categories/:id — admin only
       - DELETE /categories/:id — admin only

       CreateCategoryDto: name, slug, description?, imageUrl?, storeType (enum)
       UpdateCategoryDto: all fields optional

    3. Create Vendors module:

       VendorsService:
       - register(userId, dto) — user becomes vendor, creates Vendor record
       - findAll(storeType?, isApproved?) — admin
       - findOne(id) — public
       - update(id, dto) — vendor owner or admin
       - approve(id) — admin only
       - getVendorProducts(vendorId) — get products for a vendor
       - getStorefrontVendors(storeType) — approved vendors for a store type

       VendorsController:
       - POST /vendors/register — protected (any user), creates vendor application
       - GET /vendors — admin only
       - GET /vendors/storefront/:storeType — public, approved vendors
       - GET /vendors/:id — public
       - PATCH /vendors/:id — vendor owner or admin
       - POST /vendors/:id/approve — admin only
       - GET /vendors/:id/products — public

       CreateVendorDto: storeName, storeSlug, description?, storeType
       UpdateVendorDto: all optional

    4. Register CategoriesModule, VendorsModule, and PrismaModule in app.module.ts
  </action>
  <verify>
    Check all controller files exist with endpoint handlers.
    Run `node -e "console.log(require('fs').existsSync('apps/api/src/prisma/prisma.service.ts'))"` — confirms file exists.
  </verify>
  <done>
    PrismaService, Categories CRUD, and Vendors module with registration/approval flow are complete.
  </done>
</task>

<task type="auto">
  <name>Task 2: Products module + Upload module (Supabase Storage)</name>
  <files>
    apps/api/src/products/products.module.ts
    apps/api/src/products/products.controller.ts
    apps/api/src/products/products.service.ts
    apps/api/src/products/dto/create-product.dto.ts
    apps/api/src/products/dto/update-product.dto.ts
    apps/api/src/products/dto/query-products.dto.ts
    apps/api/src/upload/upload.module.ts
    apps/api/src/upload/upload.controller.ts
    apps/api/src/upload/upload.service.ts
  </files>
  <action>
    Create Products module and image upload module:

    1. Install: @supabase/supabase-js (if not already), multer, @types/multer

    2. Create Upload module:
       - UploadService with methods:
         - uploadImage(file: Express.Multer.File, folder: string): uploads to Supabase Storage bucket "products", returns public URL
         - deleteImage(url: string): deletes from storage
         - Uses supabase.storage.from('products').upload()
         - Generates unique file names: `${folder}/${uuid}-${sanitizedOriginalName}`
       - UploadController:
         - POST /upload/image — protected (vendor or admin), accepts multipart file, returns { url }
       - Register UploadModule in app.module.ts
       - Create a Supabase storage bucket called "products" (public)
       - Also create buckets: "vendors" (for logos/banners), "avatars" (for user avatars)

    3. Create Products module:

       ProductsService:
       - create(vendorId, dto) — creates product linked to vendor
       - findAll(query: QueryProductsDto) — powerful filtering:
         - storeType (required for customer browsing)
         - categoryId
         - vendorId
         - minPrice, maxPrice
         - search (name contains, case-insensitive)
         - isActive
         - sortBy (price, name, createdAt) + sortOrder (asc, desc)
         - page, limit (pagination with total count)
         - Returns { data: Product[], meta: { total, page, limit, totalPages } }
       - findOne(id) — full product detail with vendor info
       - update(vendorId, productId, dto) — vendor owns product or admin
       - remove(productId) — soft delete (set isActive = false)
       - getVendorStats(vendorId) — count of products, active/inactive

       ProductsController:
       - POST /products — protected (vendor), creates product
       - GET /products?storeType=ORGANIC&categoryId=&search=&page=&limit= — public, with filters
       - GET /products/:id — public
       - PATCH /products/:id — vendor owner or admin
       - DELETE /products/:id — vendor owner or admin

       CreateProductDto:
       - name, description?, categoryId, price, compareAtPrice?, unit, stock, images (string[]), isActive?
       - Validation: price > 0, stock >= 0

       UpdateProductDto: all optional
       QueryProductsDto: storeType?, categoryId?, vendorId?, minPrice?, maxPrice?, search?, isActive?, sortBy?, sortOrder?, page?, limit?

    4. Register ProductsModule in app.module.ts

    5. Add vendor authorization check — a vendor can only create/manage products for their own vendor profile
       - Extract userId from JWT, look up Vendor by userId, verify ownership
  </action>
  <verify>
    Check products.controller.ts has GET, POST, PATCH, DELETE endpoints.
    Check products.service.ts has findAll with pagination/filtering logic.
    Check upload.service.ts uses Supabase Storage API.
  </verify>
  <done>
    Products module with full CRUD, image uploads to Supabase Storage, search/filter/pagination, and vendor ownership checks are complete.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Categories, Vendors, Products, and Upload modules</what-built>
  <how-to-verify>
    1. Start NestJS server
    2. Create a category:
       ```
       curl -X POST http://localhost:4000/categories \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer <admin_token>" \
         -d '{"name":"Fresh Fruits","slug":"fresh-fruits","storeType":"ORGANIC"}'
       ```
       Expect: 201

    3. Register as vendor:
       ```
       curl -X POST http://localhost:4000/vendors/register \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer <user_token>" \
         -d '{"storeName":"Green Farms","storeSlug":"green-farms","storeType":"ORGANIC"}'
       ```
       Expect: 201

    4. Admin approves vendor:
       ```
       curl -X POST http://localhost:4000/vendors/:id/approve \
         -H "Authorization: Bearer <admin_token>"
       ```
       Expect: 200

    5. Upload product image (multipart):
       ```
       curl -X POST http://localhost:4000/upload/image \
         -H "Authorization: Bearer <vendor_token>" \
         -F "file=@/path/to/image.jpg"
       ```
       Expect: 200 with { url }

    6. Create product:
       ```
       curl -X POST http://localhost:4000/products \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer <vendor_token>" \
         -d '{"name":"Organic Bananas","categoryId":"<id>","price":60,"unit":"dozen","stock":100}'
       ```
       Expect: 201

    7. Browse products with store filter:
       ```
       curl "http://localhost:4000/products?storeType=ORGANIC&page=1&limit=10"
       ```
       Expect: 200 with paginated results
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
1. Category CRUD works with store_type scoping
2. Vendor registration → approval flow works
3. Image upload to Supabase Storage returns public URL
4. Product CRUD with vendor ownership checks works
5. Product listing with storeType filter + pagination returns correct results
</verification>

<success_criteria>
- Full product catalog management for vendors
- Public product browsing with store_type toggle filtering
- Image upload to Supabase Storage
- Ready for Phase 4 (Core API B — Cart, Addresses)
</success_criteria>

<output>
After completion, create `.planning/phases/03-core-api-a/03-core-api-a-03-SUMMARY.md`
</output>
