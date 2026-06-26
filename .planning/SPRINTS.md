# Sprint Plan — Next360 Organic Marketplace (3 Months)

**Team:**
- **You** → Expo Mobile (Customer App 43 + Delivery App 26 = **69 screens**)
- **Person 2** → Next.js Web (Vendor Dashboard **32 screens**)
- **Person 3** → Next.js Web (Admin Panel **35 screens**)

**Total:** 136 screens, 3 one-month sprints

---

## Sprint 1 — Foundation + Core APIs + App Scaffolds (Month 1)

**Goal:** Everything shared built first. All apps scaffolded and ready for screens by end of month.

---

### Person 2 — Backend Setup + Core API A + Orders/Payments + Vendor Scaffold

#### Week 1: Monorepo & Foundation
| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1 | Init Turborepo monorepo | `package.json`, `turbo.json`, `tsconfig.base.json`, `.eslintrc.js`, `.prettierrc`, `.gitignore` | Root config with workspaces `["apps/*", "packages/*"]`, turbo pipeline with build/dev/lint |
| 1-2 | Create shared packages | `packages/shared/`, `packages/eslint-config/`, `packages/tsconfig/` | Shared TypeScript types, constants, ESLint config, base tsconfig |
| 2 | Scaffold NestJS app | `apps/api/package.json`, `tsconfig.json`, `nest-cli.json`, `src/main.ts`, `src/app.module.ts` | NestJS on port 4000, CORS enabled, global pipes |
| 2-3 | Create health endpoint | `src/health/health.controller.ts`, `health.module.ts` | `GET /health` returns `{ status: "ok", timestamp }` |
| 3-4 | Write full Prisma schema | `prisma/schema.prisma` | All models: User, Vendor, Category, SubCategory, Brand, Product, ProductVariant, CartItem, WishlistItem, Review, Address, Order, OrderItem, DeliveryAssignment, Payment, Coupon, Offer, ReturnRequest, KYC, Commission, Payout, Notification, CMS_Page, Banner, AI_Log, AI_Recommendation, Role, Permission, PushToken |
| 4 | Create .env.example | `.env.example` | DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, OPENAI_API_KEY, GEMINI_API_KEY |
| 5 | Install deps + Prisma migrate | — | `npm install` at root, `npx prisma generate`, `npx prisma db push` |

#### Week 2: Categories, Brands, Vendors, Upload, Products API
| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1 | PrismaService | `src/prisma/prisma.module.ts`, `prisma.service.ts` | Global module, extends PrismaClient, OnModuleInit $connect |
| 1-2 | Categories module | `src/categories/*` — module, controller, service, dto (create, update) | CRUD with storeType enum filter, admin-only create/update/delete |
| 2 | SubCategories module | `src/sub-categories/*` | Nested under categories, storeType filter |
| 2-3 | Brands module | `src/brands/*` | CRUD scoped by storeType, similar pattern to categories |
| 3-4 | Vendors module | `src/vendors/*` — register, findAll, findOne, update, approve, getStorefrontVendors | Vendor registration linked to user, admin approval flow, storeType scoping |
| 4 | Upload module | `src/upload/*` — controller + service | POST /upload/image (multipart), Supabase Storage "products" bucket, UUID file naming |
| 5 | Storage buckets | — | Create buckets: "products" (public), "vendors" (logos), "avatars" (user avatars) |

#### Week 3: Products API + Orders & Payments API
| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1-2 | Products module | `src/products/*` — CRUD + search/filter + variants | Product CRUD with vendor ownership check, image upload, search by name/price/category/storeType, variants sub-resource |
| 3 | Orders module | `src/orders/*` — create, findAll, findOne, updateStatus, cancel | Order creation from cart (transaction: create order + decrement stock + clear cart), status state machine, role-based access |
| 4 | Payments module | `src/payments/*` — createRazorpayOrder, verifyPayment, handleWebhook | Razorpay SDK integration, HMAC webhook verification, order lifecycle on payment |
| 5 | Commission module | `src/commission/*` — calculate, getSummary, markAsPaid, updateRate | Per-vendor commission rate (default 15%), payout tracking |

#### Week 4: Vendor Dashboard Scaffold
| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1 | Init Next.js app | `apps/vendor-dashboard/package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts` | Next.js 14+ App Router, shadcn/ui setup, organic earth-tone colors |
| 2 | Auth context + API client | `src/lib/auth.tsx`, `src/lib/api.ts` | AuthContext with localStorage JWT, fetch wrapper with auto Bearer header |
| 3 | Login + Signup + OTP pages | `src/app/(auth)/login/page.tsx`, `/signup/page.tsx`, `/otp-verification/page.tsx` | Form validation, API calls, loading states |
| 4 | Dashboard layout + sidebar | `src/app/(dashboard)/layout.tsx`, `src/components/Sidebar.tsx`, `src/components/Header.tsx` | 12-section sidebar (Dashboard, Products, Inventory, Orders, Promotions, Customers, Analytics, Earnings, Store, Notifications, Settings, Support) |
| 5 | Shared components + Dashboard home | `StatsCard.tsx`, `DataTable.tsx`, `StatusBadge.tsx`, `dashboard/page.tsx` | Reusable UI + metrics cards + recent orders list |

**Deliverable:** NestJS API with all CRUD endpoints running on :4000. Vendor dashboard scaffolded at :3001.

---

### Person 3 — Auth + Core API B + Admin Scaffold

#### Week 1: Auth Module + Users Module + RBAC
| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1-2 | Auth module | `src/auth/*` — module, controller, service, jwt.strategy, guards: jwt-auth, roles, decorators: roles, current-user | PassportModule + JwtModule, Supabase admin client validation, @Roles() and @CurrentUser() decorators |
| 2-3 | Auth DTOs + endpoints | `dto/signup.dto.ts`, `login.dto.ts`, `verify-otp.dto.ts`, `forgot-password.dto.ts` | POST /auth/signup, /login, /verify-otp, /forgot-password, /reset-password, GET /auth/me, POST /auth/logout |
| 3-4 | KYC module | `src/kyc/*` — controller, service, dto | POST /kyc/submit (document upload), GET /kyc/status, PATCH /kyc/:id/verify (admin) |
| 4-5 | Users module | `src/users/*` — controller, service, dto | GET/PATCH /users/me, GET /users (admin paginated), PATCH /users/:id/role, PATCH /users/:id/status (suspend/activate) |
| 5 | Register modules + global guards | `src/app.module.ts` | Register AuthModule, UsersModule, KycModule. Apply RolesGuard globally |

#### Week 2: Cart, Addresses, Wishlist, Reviews API
| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1 | Cart module | `src/cart/*` — addItem, getCart, updateQuantity, removeItem, clearCart, validateCart | Stock validation, quantity capping, totals calculation, unique userId+productId |
| 2 | Address module | `src/addresses/*` — CRUD + setDefault | User-scoped, pincode validation (6 digits), phone validation (10 digits), default toggle |
| 3 | Wishlist module | `src/wishlist/*` — add, remove, list | Simple userId+productId unique constraint |
| 4 | Reviews module | `src/reviews/*` — create, listByProduct, listByUser, avg rating | Rating 1-5, verified purchase check, average calculation |
| 5 | Inventory module | `src/inventory/*` — getStock, updateStock, getLowStock | Stock CRUD, low stock threshold (default 5), alert generation |

#### Week 3: Coupons, Offers, Returns API + Notifications + AI + CMS + Roles
| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1 | Coupons module | `src/coupons/*` | Coupon code, type (PERCENTAGE/FIXED), value, min order, max discount, usage limit, expiry validation |
| 2 | Offers module | `src/offers/*` | Store-wide offers with date range, storeType filter |
| 2-3 | Returns module | `src/returns/*` | Return request creation, approval/rejection workflow, refund amount calculation |
| 3 | Notifications module | `src/notifications/*` | Push token registration, in-app notification CRUD |
| 4 | CMS module | `src/cms/*` | Pages CRUD (title, slug, content, SEO), Banners CRUD (image, link, position) |
| 4-5 | Roles & Permissions module | `src/roles/*`, `src/permissions/*` | Role CRUD with JSON permissions, Permission CRUD with resource+action |
| 5 | AI module (basic) | `src/ai/*` — module + service skeleton | OpenAI/Gemini integration setup (full integration in Sprint 3) |

#### Week 4: Admin Panel Scaffold
| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1 | Init Next.js app | `apps/admin-panel/package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts` | Next.js 14+ App Router, shadcn/ui, brand colors |
| 2 | Auth + API client | `src/lib/auth.ts`, `src/lib/api.ts` | Supabase admin auth, fetch wrapper with server client |
| 3 | Login page | `src/app/login/page.tsx` | Centered login card, admin role verification on login |
| 4 | Dashboard layout + sidebar | `src/app/(dashboard)/layout.tsx`, `components/AdminSidebar.tsx`, `components/AdminHeader.tsx` | Dark sidebar with sections: Dashboard, Users, Vendors, Delivery, Catalog, Orders, Promotions, Payments, Operations, AI, Reports, Content, Admin — total 13 nav sections |
| 5 | Shared components + Dashboard home | `StatsCard.tsx`, `DataTable.tsx`, `StatusBadge.tsx`, `dashboard/page.tsx` | 4 metric cards (revenue, orders, vendors, users) + charts |

**Deliverable:** Auth system, all secondary APIs, admin panel scaffolded at :3002.

---

### You — Both Expo Apps Scaffold

#### Week 1: Customer App Foundation
| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1 | Init Expo customer app | `apps/customer-app/` via `npx create-expo-app` | Blank TypeScript template |
| 1-2 | Install deps | `package.json` | react-navigation (native-stack, bottom-tabs), expo-secure-store, zustand, @supabase/supabase-js, expo-notifications, expo-camera, react-native-maps, @expo/vector-icons |
| 2-3 | App.json config | `app.json` | Name "Next360", splash screen, iOS/Android configs |
| 3 | API client | `src/lib/api.ts` | Axios/fetch wrapper with EXPO_PUBLIC_API_URL, auto Bearer token from SecureStore, typed methods for all endpoints |
| 4 | Auth context | `src/lib/auth.tsx` | AuthContext/Provider, signIn, signUp, signOut, token persistence in SecureStore, auto-restore on mount |
| 5 | Store type context | `src/lib/store.ts` | Zustand store for selected storeType (ORGANIC/NATURAL/ECO_FRIENDLY), persists to AsyncStorage |

#### Week 2: Customer App Navigation + Auth Screens
| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1-2 | AppNavigator | `src/navigation/AppNavigator.tsx` | Conditional auth stack vs main tabs, AuthStack (Login, Signup, OTP, ForgotPassword), MainTabs (Home, AI, Cart, Orders, Profile), StorefrontStack (Home→Products→Detail) |
| 3 | Login screen | `src/screens/auth/LoginScreen.tsx` | Email + password inputs, Sign In button, OTP option, Create Account link, error toasts, loading state, keyboard-aware |
| 4 | Signup screen | `src/screens/auth/SignupScreen.tsx` | Name + email + phone + password + confirm password, Create Account button, auto-login on success |
| 5 | OTP + Forgot Password screens | `src/screens/auth/OtpVerificationScreen.tsx`, `ForgotPasswordScreen.tsx` | 6-digit OTP input with auto-submit, resend timer, email input for reset |

#### Week 3: Delivery App Foundation
| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1 | Init Expo delivery app | `apps/delivery-app/` | Blank TypeScript template |
| 1-2 | Install deps | `package.json` | Same as customer app + react-native-maps, expo-location |
| 2-3 | API client | `src/lib/api.ts` | Same pattern as customer app |
| 3-4 | Auth store | `src/store/authStore.ts` | Zustand store, signIn/signOut/loadSession, role check (only DELIVERY_PARTNER allowed) |
| 4 | Delivery store | `src/store/deliveryStore.ts` | Zustand: newOrders[], activeDeliveries[], history[], earnings, actions: fetch/accept/reject/updateStatus |
| 5 | AppNavigator + Login | `src/navigation/AppNavigator.tsx`, `src/screens/LoginScreen.tsx` | 4 tabs (New Orders, Active, History, Profile), login with role validation |

#### Week 4: Reusable UI Components + App.tsx
| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1-2 | Shared components (Customer) | `src/components/StoreToggle.tsx`, `ProductCard.tsx`, `CategoryChip.tsx`, `LoadingSkeleton.tsx`, `EmptyState.tsx` | 3-store pill toggle, product card with image + name + price + unit, category chips, skeleton loaders, empty state illustrations |
| 2-3 | Shared components (Delivery) | `src/components/OrderCard.tsx`, `StatusBadge.tsx` | Order card with customer info + address + items + total, colored status badges |
| 3-4 | Types | `src/types/index.ts` (both apps) | TypeScript interfaces matching API models: User, Vendor, Product, Category, Brand, CartItem, Address, Order, OrderItem, DeliveryAssignment, Payment, Coupon, Offer, Review, KYC, Notification, AI Log, CMS Page, Banner, Role, Permission + enums: StoreType, UserRole, OrderStatus, PaymentStatus, AddressType |
| 4-5 | App.tsx (both apps) | `App.tsx` | Wrap with AuthProvider + NavigationContainer + Toast + StatusBar config, check auth state on mount |

**Deliverable:** Both Expo apps scaffolded with navigation, auth flow, API clients, and reusable components.

---

## Sprint 2 — All Apps Built in Parallel (Month 2)

**Goal:** All 4 apps fully built. Customer (43 screens), Vendor (32 screens), Admin (35 screens).

---

### You — Customer App (43 screens)

#### Week 1: Onboarding + Home + Storefronts
| Day | Task | Files | Components | API Endpoints |
|-----|------|-------|------------|---------------|
| 1 | Splash + Onboarding | `screens/onboarding/SplashScreen.tsx`, `OnboardingScreen.tsx` | Animated logo, swipeable intro cards (3 slides: Organic, Natural, Eco) | — |
| 2 | Home screen | `screens/home/HomeScreen.tsx` | StoreToggle, CategoryChip row, Featured products grid, Brands row, "Shop by Store" quick links | GET /products?featured=true, GET /categories, GET /brands |
| 3 | Product List with filters | `screens/products/ProductListScreen.tsx` | 2-column grid, sort dropdown (price/low-high/newest), category/brand/store filter pills, infinite scroll | GET /products?storeType=X&categoryId=Y&page=Z&limit=20 |
| 4 | Product Detail | `screens/products/ProductDetailScreen.tsx` | Image gallery with dots, name, rating stars, price+compare-at, unit, description, vendor link, qty stepper, Add to Cart button, stock indicator, reviews preview | GET /products/:id, GET /products/:id/reviews |
| 5 | Search | `screens/search/SearchScreen.tsx`, `SearchResultsScreen.tsx` | Search bar with debounce, recent searches, popular searches, results grid, filter bar | GET /products?search=QUERY |

#### Week 2: Categories, Brands, 3 Storefronts, Wishlist
| Day | Task | Files | Components | API Endpoints |
|-----|------|-------|------------|---------------|
| 1 | Categories + Category Products | `screens/categories/CategoryListScreen.tsx`, `CategoryProductsScreen.tsx` | Category grid with images, tap → filtered product list | GET /categories, GET /products?categoryId=X |
| 2 | Brands + Brand Details | `screens/brands/BrandListScreen.tsx`, `BrandDetailScreen.tsx` | Brand cards with logo, tap → brand products | GET /brands, GET /products?brandId=X |
| 3 | 3 Storefront tabs | `screens/storefronts/OrganicProductsScreen.tsx`, `NaturalProductsScreen.tsx`, `EcoFriendlyProductsScreen.tsx` | Dedicated screens for each store type, reuses ProductCard component | GET /products?storeType=ORGANIC (or NATURAL/ECO_FRIENDLY) |
| 4 | Wishlist | `screens/wishlist/WishlistScreen.tsx` | Product grid with heart icon toggle, empty state, remove swipe | GET /wishlist, POST /wishlist, DELETE /wishlist/:id |
| 5 | Cart screen | `screens/cart/CartScreen.tsx` | Scrollable CartItem list with qty steppers, sticky bottom bar (subtotal+delivery+total), "Proceed to Checkout" button, empty state | GET /cart, PATCH /cart/items/:id, DELETE /cart/items/:id |
| 5 | Cart store (Zustand) | `lib/cartStore.ts` | fetchCart, addItem, updateQuantity, removeItem, clearCart, computed totals + item count, tab badge integration | — |

#### Week 3: Checkout, Payment, Orders, Returns
| Day | Task | Files | Components | API Endpoints |
|-----|------|-------|------------|---------------|
| 1 | Checkout screen | `screens/checkout/CheckoutScreen.tsx` | Multi-section: Address selection, Items summary, Payment method (COD/Razorpay), Order notes, Price breakdown, "Place Order" button | POST /orders |
| 2 | Address Selection + Add Address | `screens/address/AddressListScreen.tsx`, `AddAddressScreen.tsx` | Saved addresses with radio select + add/edit form (name, phone, street, city, state, pincode, type toggle) | GET /addresses, POST /addresses, PATCH /addresses/:id |
| 3 | Payment Method + Payment Success | `screens/payment/PaymentMethodScreen.tsx`, `PaymentSuccessScreen.tsx` | Razorpay checkout integration, COD option, success animation + order number | POST /payments/razorpay/order, POST /payments/verify |
| 4 | My Orders + Order Details | `screens/orders/OrderListScreen.tsx`, `OrderDetailScreen.tsx` | Status badges, order cards, tap → detail with items + status timeline + price breakdown | GET /orders, GET /orders/:id |
| 4 | Track Order | `screens/orders/TrackOrderScreen.tsx` | Real-time order status, progress stepper, estimated delivery, delivery partner info | GET /orders/:id (polling) + Supabase Realtime |
| 5 | Return Request | `screens/orders/ReturnRequestScreen.tsx` | Item selection, reason dropdown, description, submit with confirmation | POST /returns |

#### Week 4: Profile, Notifications, Offers, Settings, Legal
| Day | Task | Files | API Endpoints |
|-----|------|-------|---------------|
| 1 | Profile + Edit Profile | `screens/profile/ProfileScreen.tsx`, `EditProfileScreen.tsx` | Avatar, name, email, phone, menu items (Orders, Addresses, Settings, About, Sign Out) | GET/PATCH /users/me |
| 2 | Saved Addresses | `screens/profile/SavedAddressesScreen.tsx` | Address list with edit/delete, default badge | GET/DELETE /addresses |
| 3 | Notifications | `screens/notifications/NotificationsScreen.tsx` | Notification list, mark read, tap to navigate | GET /notifications |
| 3 | Offers & Coupons | `screens/offers/OffersScreen.tsx`, `screens/coupons/CouponListScreen.tsx` | Available offers, coupon codes with copy + apply | GET /offers, GET /coupons |
| 4 | Settings + Help Center | `screens/settings/SettingsScreen.tsx`, `screens/help/HelpCenterScreen.tsx` | Notification prefs, password change, FAQs accordion | — |
| 4 | FAQ + Contact Support | `screens/help/FAQScreen.tsx`, `screens/help/ContactSupportScreen.tsx` | Expandable FAQ items, contact form (subject + message + screenshot) | POST /support |
| 5 | About Us, Privacy Policy, Terms | `screens/about/AboutScreen.tsx`, `PrivacyPolicyScreen.tsx`, `TermsScreen.tsx` | Static content screens with app version, company info | GET /cms/pages (or static markdown) |

**Customer App Deliverable:** 43 screens fully functional. Complete shopping flow: browse → add to cart → checkout → pay → track → return.

---

### Person 2 — Vendor Dashboard (32 pages)

#### Week 1: Auth/KYC + Dashboard + Products
| Day | Task | Route | Components | API Endpoints |
|-----|------|-------|------------|---------------|
| 1 | KYC flow | `/onboarding/business`, `/onboarding/bank`, `/onboarding/documents`, `/onboarding/pending` | BusinessDetailsForm, BankDetailsForm, DocumentUploader, ApprovalPendingCard | POST /kyc/submit, GET /kyc/status |
| 2 | Dashboard | `/dashboard` | StatsCard (4 metrics), RecentOrdersTable, LowStockAlerts, QuickActions | GET /vendors/:id/stats, GET /orders?vendorId=me&limit=5, GET /inventory/low-stock |
| 3 | Products list | `/dashboard/products` | DataTable (image, name, SKU, price, stock, status, category), search bar, filter by status/category, "Add Product" button | GET /products?vendorId=me |
| 4 | Add Product | `/dashboard/products/add` | ProductForm (name, desc, category dropdown, brand dropdown, price, compare-at, unit, stock, SKU), ImageUploader (multi with preview + reorder), Variants inline section | POST /products |
| 5 | Edit Product + Detail | `/dashboard/products/[id]` | Pre-filled ProductForm, variants management table, delete with confirmation | GET /products/:id, PATCH /products/:id |

#### Week 2: Variants, Inventory, Categories, Orders
| Day | Task | Route | Components | API Endpoints |
|-----|------|-------|------------|---------------|
| 1 | Product Variants | `/dashboard/products/[id]/variants` | VariantsTable, AddVariantModal (name, price, stock, SKU), inline edit/delete | POST/PATCH/DELETE /products/:id/variants |
| 2 | Categories view | `/dashboard/categories` | Read-only category list with sub-categories, product count per category | GET /categories |
| 3 | Inventory + Stock Management | `/dashboard/inventory`, `/dashboard/inventory/stock` | InventoryTable with inline stock edit, BulkUpdateModal | GET /inventory, PATCH /products/:id/stock |
| 4 | Low Stock Alerts | `/dashboard/inventory/low-stock` | LowStockCards (product image, name, current stock, "Restock" button with qty input), empty celebration state | GET /inventory/low-stock |
| 5 | Orders list | `/dashboard/orders` | DataTable (order#, customer, items, total, status, date), status filter, date range filter, search | GET /orders?vendorId=me |

#### Week 3: Order Detail, Returns, Customers, Promotions
| Day | Task | Route | Components | API Endpoints |
|-----|------|-------|------------|---------------|
| 1 | Order Detail | `/dashboard/orders/[id]` | OrderInfoCard, CustomerInfoCard, OrderItemsList, PriceBreakdown, StatusTimeline, StatusUpdateDropdown (with transition validation) | GET /orders/:id, PATCH /orders/:id/status |
| 2 | Returns | `/dashboard/orders/returns` | ReturnsTable (order#, customer, item, reason, status, date), Approve/Reject modal | GET /returns, PATCH /returns/:id/status |
| 3 | Customers | `/dashboard/customers` | CustomersTable (name, email, phone, orders count, total spent, last order), search, customer detail modal | GET /customers?vendorId=me |
| 4 | Coupons | `/dashboard/coupons` | CouponsTable, CreateCouponForm (code, type, value, min order, max discount, usage limit, expiry), toggle active/inactive | CRUD /coupons |
| 5 | Offers | `/dashboard/offers` | OffersTable, CreateOfferForm (title, desc, discount type/value, date range, storeType) | CRUD /offers |

#### Week 4: Analytics, Earnings, Store, Notifications, Settings, Support
| Day | Task | Route | Components | API Endpoints |
|-----|------|-------|------------|---------------|
| 1 | Analytics dashboard | `/dashboard/analytics` | StatsCards (revenue, orders, AOV, top product), SalesLineChart (7/30/90d), OrdersByStatusDonut, TopProductsRanked | GET /analytics/summary |
| 2 | Sales + Revenue Analytics | `/dashboard/analytics/sales`, `/dashboard/analytics/revenue` | DailySalesBarChart, SalesByCategoryPie, RevenueTrendLineChart, MoM growth, Platform fees vs earnings breakdown | GET /analytics/sales, GET /analytics/revenue |
| 3 | Earnings + Payouts + Transactions | `/dashboard/earnings`, `/dashboard/earnings/payouts`, `/dashboard/earnings/transactions` | EarningsSummary (total, this month, pending, paid), EarningsTrendChart, PayoutsTable, TransactionsTable | GET /earnings, GET /payouts, GET /transactions |
| 4 | Store Profile + Edit | `/dashboard/store`, `/dashboard/store/edit` | StoreInfoCard, EditStoreForm (name, description, logo upload, banner upload) | GET/PATCH /vendors/:id |
| 5 | Notifications + Settings + Support | `/dashboard/notifications`, `/dashboard/settings`, `/dashboard/support` | NotificationsList (read/unread/mark all read), SettingsForm (prefs, password), FAQAccordion, ContactForm | GET /notifications, PATCH /settings |

**Vendor Dashboard Deliverable:** 32 pages fully functional. End-to-end vendor workflow: KYC → products → orders → earnings.

---

### Person 3 — Admin Panel (35 pages)

#### Week 1: Core Management — Users, Vendors, Delivery, Products
| Day | Task | Route | Components | API Endpoints |
|-----|------|-------|------------|---------------|
| 1 | Dashboard | `/dashboard` | 4 StatsCards (GMV, orders, vendors, users), OrdersLineChart, RecentOrdersList, RecentVendorRegistrations | GET /admin/stats |
| 2 | Users list + Details | `/dashboard/users`, `/dashboard/users/[id]` | DataTable (name, email, phone, role badge, status, orders count, date), UserDetailCard, Suspend/Activate button | GET /users, PATCH /users/:id/status |
| 3 | Vendors list | `/dashboard/vendors` | DataTable (store name, owner, email, storeType badge, status badge, products count, date), search, filter by status/storeType | GET /vendors |
| 4 | Vendor Approvals | `/dashboard/vendors/approvals` | PendingVendorsTable (highlighted), Approve/Reject buttons with confirmation | PATCH /vendors/:id/status |
| 5 | Vendor Details | `/dashboard/vendors/[id]` | StoreInfoCard, OwnerInfo, CommissionRateEditor, ProductsCountLink, RecentOrders, ActivityLog | GET /vendors/:id |

#### Week 2: Delivery, Products, Categories, Brands
| Day | Task | Route | Components | API Endpoints |
|-----|------|-------|------------|---------------|
| 1 | Delivery Partners + Approvals | `/dashboard/delivery-partners`, `/dashboard/delivery-partners/approvals` | DataTable (name, email, phone, vehicle, KYC status, status), Approve/Reject | GET /delivery-partners, PATCH /delivery-partners/:id/status |
| 2 | Delivery Partner Details | `/dashboard/delivery-partners/[id]` | PartnerInfoCard, KYCDocumentsList, VehicleInfoCard, BankDetails, DeliveryStats (total deliveries, earnings, rating) | GET /delivery-partners/:id |
| 3 | Products + Add/Edit | `/dashboard/products`, `/dashboard/products/add`, `/dashboard/products/edit/[id]` | ProductsTable (all vendors), AdminProductForm (same fields + vendor dropdown) | CRUD /products (admin scope) |
| 4 | Categories + Sub Categories | `/dashboard/categories`, `/dashboard/categories/sub-categories` | CategoriesTable with inline edit, SubCategoriesTable, Add/Delete with product check | CRUD /categories, /sub-categories |
| 5 | Brands | `/dashboard/brands` | BrandsTable, AddBrandForm (name, slug, storeType, logo, description) | CRUD /brands |

#### Week 3: Orders, Returns/Refunds, Promotions, Payments
| Day | Task | Route | Components | API Endpoints |
|-----|------|-------|------------|---------------|
| 1 | Orders list | `/dashboard/orders` | DataTable (order#, customer, vendor, items, total, payment method, payment status, order status, date), filters (status, storeType, date range, payment method), export CSV | GET /orders (admin scope) |
| 2 | Order Detail + Status Timeline | `/dashboard/orders/[id]` | Full order detail, status timeline, status update dropdown, cancel/refund actions, invoice section | GET /orders/:id |
| 3 | Returns + Refunds | `/dashboard/orders/returns`, `/dashboard/orders/refunds` | ReturnsTable (order#, customer, item, reason, status), RefundsTable, Approve/Reject with modal | GET /returns, PATCH /returns/:id/status, POST /refunds |
| 4 | Coupons + Offers | `/dashboard/coupons`, `/dashboard/offers` | Same CRUD as vendor dashboard but admin-scoped (all vendors) | CRUD /coupons, /offers |
| 5 | Payments + Vendor Payouts | `/dashboard/payments`, `/dashboard/payments/vendor-payouts` | PaymentsTable, PayoutsTable (vendor, period, amount, status), "Mark as Paid" batch action | GET /payments, GET /commission/summary, PATCH /commission/pay |

#### Week 4: Delivery Payouts, Inventory, Reviews, AI, Reports, CMS, Roles, Settings
| Day | Task | Route | Components | API Endpoints |
|-----|------|-------|------------|---------------|
| 1 | Delivery Payouts + Inventory | `/dashboard/payments/delivery-payouts`, `/dashboard/inventory` | DeliveryPayoutsTable, InventoryOverviewTable (all vendors), filter by vendor | GET /delivery-payouts, GET /inventory |
| 2 | Reviews + Ratings | `/dashboard/reviews`, `/dashboard/ratings` | ReviewsTable (product, user, rating, text, date, verified badge), delete/moderate | GET /reviews, DELETE /reviews/:id |
| 3 | Reports | `/dashboard/reports/sales`, `/dashboard/reports/revenue` | SalesReportTable + chart, RevenueReportTable + chart, date range selector, export CSV | GET /reports/sales, GET /reports/revenue |
| 4 | CMS Pages + Banners | `/dashboard/cms/pages`, `/dashboard/cms/banners` | PagesTable with editor (title, slug, content, SEO meta), BannersTable (image, link, position, storeType) | CRUD /cms/pages, /cms/banners |
| 5 | Roles + Permissions + Settings | `/dashboard/roles`, `/dashboard/roles/permissions`, `/dashboard/settings`, `/dashboard/settings/system` | RolesTable with inline permission toggles, SystemConfigForm | CRUD /roles, /permissions, GET/PATCH /settings |

**Admin Panel Deliverable:** 35 pages fully functional. Complete platform management.

---

## Sprint 3 — Delivery App + AI + Polish & Launch (Month 3)

**Goal:** Delivery partner app (26 screens), AI features (5 customer + 3 admin), and production launch.

---

### You — Delivery App (26 screens) + AI Features (5 screens)

#### Week 1: Delivery Auth + KYC + Dashboard
| Day | Task | Files | Components | API Endpoints |
|-----|------|-------|------------|---------------|
| 1 | Splash + Login + Signup + OTP | `screens/SplashScreen.tsx`, `screens/auth/LoginScreen.tsx`, `screens/auth/SignupScreen.tsx`, `screens/auth/OtpVerificationScreen.tsx` | Same pattern as customer app, delivery branding | POST /auth/signup, /login, /verify-otp |
| 2 | KYC Verification | `screens/kyc/KycVerificationScreen.tsx` | Document upload (ID proof, address proof) with camera/gallery picker, status tracking | POST /kyc/submit, GET /kyc/status |
| 3 | Vehicle Details + Bank Details | `screens/kyc/VehicleDetailsScreen.tsx`, `screens/kyc/BankDetailsScreen.tsx` | Form: vehicle type, number, model; Bank: account number, IFSC, holder name | POST /kyc/submit |
| 4 | Approval Pending | `screens/kyc/ApprovalPendingScreen.tsx` | Status card showing pending review, estimated time, contact support link | GET /kyc/status (polling) |
| 5 | Dashboard | `screens/dashboard/DashboardScreen.tsx` | Stats cards (today's deliveries, earnings, rating), quick actions toggle availability | GET /delivery/stats, PATCH /delivery/availability |

#### Week 2: Orders, Navigation, Active Delivery
| Day | Task | Files | Components | API Endpoints |
|-----|------|-------|------------|---------------|
| 1 | Available Orders | `screens/orders/AvailableOrdersScreen.tsx` | Real-time feed via Supabase Realtime, OrderCard list (order#, customer, address, items, total, distance, wait time), Accept/Reject buttons, confirmation dialog | Supabase Realtime channel + PATCH /orders/:id/assign |
| 2 | Order Detail + Pickup + Delivery Details | `screens/orders/OrderDetailScreen.tsx`, `screens/orders/PickupDetailsScreen.tsx`, `screens/orders/DeliveryDetailsScreen.tsx` | Full order info, customer contact (call button), vendor address (navigate button), items list, price breakdown, delivery fee | GET /orders/:id |
| 3 | Navigation Map | `screens/navigation/NavigationMapScreen.tsx` | react-native-maps: vendor marker, customer marker, current location, polyline route, zoom-to-fit | GET /orders/:id (lat/lng) |
| 4 | Active Delivery | `screens/delivery/ActiveDeliveryScreen.tsx` | Real-time tracking card, "Mark as Picked Up" → "Mark as Delivered" buttons with confirmation, progress stepper | PATCH /orders/:id/status |
| 5 | Delivery Confirmation | `screens/delivery/DeliveryConfirmationScreen.tsx` | Success animation, delivery time, customer signature (optional), photo proof (optional), complete button | POST /delivery/confirm |

#### Week 3: History, Earnings, Profile, AI Features
| Day | Task | Files | Components | API Endpoints |
|-----|------|-------|------------|---------------|
| 1 | Completed + Cancelled Deliveries | `screens/history/CompletedDeliveriesScreen.tsx`, `screens/history/CancelledDeliveriesScreen.tsx` | Sectioned by date (Today/Yesterday/Week/Older), OrderCard dimmed for cancelled | GET /orders?status=DELIVERED, GET /orders?status=CANCELLED |
| 2 | Earnings + Payout History + Incentives | `screens/earnings/EarningsScreen.tsx`, `screens/earnings/PayoutHistoryScreen.tsx`, `screens/earnings/IncentivesScreen.tsx` | EarningsSummary (today/week/month/all), LineChart, PayoutsTable, IncentivesTable (bonus, streak bonuses) | GET /delivery/earnings, /delivery/payouts, /delivery/incentives |
| 3 | Profile + Documents + Vehicle Info | `screens/profile/ProfileScreen.tsx`, `screens/profile/DocumentsScreen.tsx`, `screens/profile/VehicleInfoScreen.tsx` | Avatar, stats, documents list with verification status, vehicle details, logout | GET/PATCH /users/me |
| 4 | AI Assistant + AI Chat History | `screens/ai/AiAssistantScreen.tsx`, `screens/ai/AiChatHistoryScreen.tsx` | Chat interface, message bubbles, suggested prompts, history grouped by date | POST /ai/chat, GET /ai/chat-history |
| 5 | AI Product Scanner + AI Recommendations + AI Health Insights | `screens/ai/AiProductScannerScreen.tsx`, `screens/ai/AiRecommendationsScreen.tsx`, `screens/ai/AiHealthInsightsScreen.tsx` | Camera viewfinder + scan results, personalized product cards with reasons, dashboard-style health insights with tips | POST /ai/scan, GET /ai/recommendations, GET /ai/health-insights |

#### Week 4: Notifications, Settings, Support + AI Backend + Error Boundaries
| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1 | Notifications + Settings + Support | `screens/notifications/NotificationsScreen.tsx`, `screens/settings/SettingsScreen.tsx`, `screens/support/SupportScreen.tsx` | Notification list with read/unread, availability toggle, notification prefs, FAQ accordion, contact form |
| 2 | AI Backend (if not done in Sprint 1) | `apps/api/src/ai/*` | OpenAI/Gemini integration for chat, vision scan, recommendations, health insights |
| 3 | Error boundaries (both apps) | `src/components/ErrorBoundary.tsx` (customer + delivery) | Class component catching render errors, friendly fallback with "Try Again" + "Go Home" buttons |
| 4 | Loading states + empty states audit | All screens | Verify every screen has: LoadingSkeleton, EmptyState illustration, ErrorState with retry |
| 5 | Expo app configs | `app.json` (both apps) | App name, slug, icon, splash, Android package name, iOS bundle identifier, notification plugin config |

---

### Person 2 — Polish & Launch (Vendor Dashboard)

| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1-2 | Error boundaries | `src/components/ErrorBoundary.tsx` | React error boundary wrapping root layout, friendly fallback UI |
| 3-4 | Loading states audit | All list/detail pages | Skeleton components for every data-fetching page |
| 5-6 | Empty states audit | All list pages | Illustrations + CTAs for empty products, orders, earnings, etc. |
| 7-8 | Performance optimization | `next.config.js`, lazy loading imports | Bundle analysis, dynamic imports for charts, image optimization |
| 9 | .env.example | `.env.example` | All required env vars documented |
| 10 | Production build | — | `npm run build` clean, verify no TS errors |

---

### Person 3 — CI/CD + Seed Data + Deployment + Admin AI

| Day | Task | Files | Details |
|-----|------|-------|---------|
| 1 | Global error handling (API) | `src/common/filters/global-exception.filter.ts`, `src/common/interceptors/response.interceptor.ts`, `src/common/interceptors/logging.interceptor.ts` | Consistent error envelope, Prisma error handling (P2002→409, P2025→404), request logging |
| 2 | Rate limiting | `src/common/guards/throttler.guard.ts`, `src/app.module.ts` | @nestjs/throttler: 10/s default, 5/min auth, 100/min admin |
| 3 | Admin AI screens | AI Scanner Logs, Recommendations, Analytics pages | Same as described in Sprint 2 week 4 for admin |
| 4 | Seed data | `src/seed/seed.service.ts`, `src/seed/seed.controller.ts` | 10 users (admin, 3 vendors, 4 customers, 2 delivery), 12 categories, 3 vendors, 24 products, 5 orders, 100+ reviews, 5 coupons, 3 offers |
| 5 | CI/CD pipeline | `.github/workflows/ci.yml` | lint → typecheck → build → test on push/PR, Node 18, ubuntu-latest, turbo cache |
| 6 | Error boundaries (admin) | `src/components/ErrorBoundary.tsx` | Admin-themed fallback |
| 7 | Loading states audit | All admin pages | Skeletons for table loads, chart placeholders |
| 8 | Performance | `next.config.js` | Bundle analyzer, image optimization |
| 9 | Production build verification | — | `turbo build` passes for all apps |
| 10 | .env.example files | All apps | Document all env vars for every app |

---

## Summary

| Sprint | You (Mobile) | Person 2 (Web) | Person 3 (Web) |
|--------|-------------|----------------|----------------|
| **S1** | Both Expo apps scaffolded: navigation, auth, API clients, 30+ reusable components | Monorepo + NestJS + all APIs + Vendor scaffold (auth, layout, 12-section sidebar) | Auth + all CRUD APIs + Admin scaffold (auth, layout, 13-section sidebar) |
| **S2** | **Customer App — 43 screens** (onboarding→storefront→cart→checkout→orders→profile) | **Vendor Dashboard — 32 pages** (KYC→products→orders→analytics→earnings) | **Admin Panel — 35 pages** (users→vendors→orders→payments→CMS→roles) |
| **S3** | **Delivery App — 26 screens** + **AI — 5 screens** + Polish + Error boundaries | Error boundaries + Loading/empty states + Performance + Production build | CI/CD + Seed data + Rate limiting + Admin AI + Error boundaries |

**Screens per person:**
- **You:** 43 (Customer) + 26 (Delivery) + 5 (AI) = **74 screens**
- **Person 2:** 32 (Vendor) = **32 screens**
- **Person 3:** 35 (Admin) = **35 screens**
