# Next360 — Flutter Take-Home Assessment (1 Week · 90% App Build)

**Candidate:** ______ · **Start:** ______ · **Deadline:** start + 7 days, submit by end of day.

**The job being tested for:** building and shipping real mobile apps for Next360's other
projects. This task asks you to rebuild ~90% of the **actual Next360 Customer App** (a live
multi-vendor organic marketplace) in **Flutter**, against the **real backend API contract**,
using the **real design system**.

You may use AI tools. You must be able to explain every line you submit.

---

## 1. The product (what you're building)

**Next360 — Organic Marketplace.** A multi-vendor grocery/marketplace app with **3 storefronts**
themed by accent color:

| Storefront | Accent | Description |
|---|---|---|
| **ORGANIC** | `#2E7D32` | Certified organic food & produce |
| **NATURAL** | `#9E5D2A` | Natural/Ayurvedic personal care & wellness |
| **ECO_FRIENDLY** | `#007A87` | Eco-friendly home & lifestyle |

**Business rules that must be honored:**
- Users browse one storefront at a time; a **swatch-style toggle** switches storefronts and
  re-themes accent colors across the app (200–250 ms crossfade).
- **Zone-gated:** serviceable only in **Hyderabad** and **Vijayawada** (localities listed below).
  Outside-zone users get a graceful block screen.
- **Cart is per-user, server-synced**, stock-capped (quantity cannot exceed stock).
- **COD capped at ₹2,000/order.** Above that, Razorpay is the only option.
- **One order can span multiple vendors** (OrderVendorGroup pattern) — cart groups by vendor.
- OTP login via **phone** (`send-otp` → `verify-otp-login`). No passwords.
- Prices shown with ₹ and Indian number formatting.

---

## 2. Design system (copy these tokens exactly)

| Token | Value |
|---|---|
| Background | `#F8F9FA` |
| Text | `#1C1C1E` |
| Text secondary | `#76767A` |
| Brass (price accent) | `#E5A93B` |
| Border | `#EAEAEA` |
| Error | `#E23744` |
| Success | `#2E7D32` |
| Organic / Dark / Light | `#2E7D32` / `#1B5E20` / `#E8F5E9` |
| Natural / Dark / Light | `#9E5D2A` / `#603813` / `#FBEFE6` |
| Eco / Dark / Light | `#007A87` / `#004D40` / `#E0F7FA` |
| Status colors | Pending `#F59E0B` · Confirmed `#3B82F6` · Preparing `#F97316` · OutForDelivery `#8B5CF6` · Delivered `#10B981` · Cancelled `#EF4444` · Refunded `#6B7280` |

**Typography (Google Fonts):**
- Display: **Fraunces 700** (category names, hero text, prices)
- Body: **Inter** (400/500/600/700)
- Utility: **JetBrains Mono 400** (weights, units, order IDs)

**UI patterns:**
- Floating **pill-shaped bottom nav** (Home, All Products, Favorites, Orders) — icon + label.
- Persistent **search bar** on Home / All Products / Search Results (not in the nav).
- **Product card:** image, category badge, name, vendor (underlined, tappable), price in
  brass + strikethrough compare-at price, unit, star rating, **ADD button** (outlined accent),
  wishlist heart, "Out of Stock" overlay.
- Product detail opens as a **bottom sheet**: 45% snap = quick add; 90% snap = full detail.
- Cart **grouped by vendor**; each vendor block shows its own subtotal.
- Empty states (cart, wishlist, orders, search no-results) with icon + message + CTA.
- Loading states (skeleton/shimmer) and error states (retry button).

**Zones:**
```
Hyderabad:    Banjara Hills, Jubilee Hills, Gachibowli, Madhapur, Kondapur, Kukatpally, Secunderabad
Vijayawada:   Governorpet, Benz Circle, Patamata, Labbipet, Gunadala, Auto Nagar
```

---

## 3. API contract (the real Next360 backend — `{success, data, meta}` envelope)

**Envelope:** success `{ "success": true, "data": ... , "meta": { page, limit, total, totalPages } }`
· errors `{ "statusCode": 4xx, "message": "...", "error": "..." }`

**Auth (no passwords):**
```
POST /auth/send-otp         { "phone": "+91XXXXXXXXXX" }            → data: { "message": "OTP sent" }
POST /auth/verify-otp-login { "phone": "...", "otp": "123456" }      → data: { "access_token", "user": { id, phone, name, role }, "isNewUser" }
GET  /users/me              (Bearer)                                 → data: User
PATCH /users/me             (Bearer) { "name"?, "email"? }           → data: User
```
**Catalogue:**
```
GET /categories?storeType=ORGANIC                                   → data: Category[]
GET /products?storeType&categoryId&search&page&limit&sortBy&sortOrder → data: Product[] + meta
GET /products/:id                                                   → data: Product
GET /vendors/:id                                                    → data: Vendor (storefront)
GET /offers?storeType                                                → data: Offer[]
```
**Product shape:** `{ id, name, price, compareAtPrice?, unit, stock, images[], isActive,
category { id, name }, vendor { id, storeName }, _count.reviews, reviews[] }`

**Cart (server-synced, Bearer):**
```
GET    /cart                        → data: CartItem[]   { id, productId, product, quantity }
POST   /cart         { productId, quantity }             → data: CartItem
PATCH  /cart/:id     { quantity }                        → data: CartItem
DELETE /cart/:id                                          → 204
DELETE /cart                                              → 204 (clear)
```
**Wishlist (Bearer):** `GET /wishlist` · `POST /wishlist { productId }` · `DELETE /wishlist/:productId`

**Addresses (Bearer):**
```
GET    /addresses
POST   /addresses  { label?, fullAddress, city, state, pincode, lat?, lng?, isDefault }
PATCH  /addresses/:id
DELETE /addresses/:id
```
**Orders (Bearer):**
```
POST   /orders { addressId, items: [{ productId, quantity, variantId? }], paymentMethod: "COD"|"RAZORPAY", notes?, couponCode?, discount? }
GET    /orders?status&page&limit
GET    /orders/:id
GET    /orders/:id/timeline
POST   /orders/:id/cancel
POST   /returns/request  { orderId, reason }
POST   /payments/razorpay/order { orderId }     → data: { key, amount, currency, order_id, receipt }
POST   /payments/razorpay/verify { razorpayOrderId, razorpayPaymentId, razorpaySignature }
```
**Order shape:** `{ id, orderNo, status, totalAmount, paymentMethod, paymentStatus, address,
vendorGroups: [{ id, vendor { storeName }, status, items[] }], createdAt, updatedAt }`
**Status machine:** PLACED → CONFIRMED → PACKED → READY_FOR_PICKUP → ASSIGNED_TO_DELIVERY →
PICKED_UP → OUT_FOR_DELIVERY → DELIVERED · CANCELLED · REFUNDED

**Extras:** `GET /coupons/validate?code&orderAmount` · `GET /notifications?page&limit` ·
`POST /notifications/read/:id` · `POST /notifications/read-all` · `POST /cms/banners?...`

> **No live backend is required to develop.** Build against a **local stub** (shelf / mocktail /
> a hand-rolled `http` server, or `dio` interceptors) that mimics this contract — and keep the
> repository seam so pointing at the real API is a config change. That seam is part of the grade.

---

## 4. Scope — the 90% (must build)

| # | Screen / flow | Must include |
|---|---|---|
| 1 | **Splash** | Logo, route by auth + onboarding state |
| 2 | **Onboarding** (3 slides) | One slide per storefront theme; skip button; shown once |
| 3 | **Phone Auth (OTP)** | +91 phone entry, validation, send-otp, 6-digit code, resend w/ countdown, error states |
| 4 | **Zone check** | City picker (Hyderabad/Vijayawada), locality list, graceful out-of-zone block screen |
| 5 | **Home** | Greeting, persistent search bar, storefront swatch toggle (crossfade), banners, category chips, product grid, curated rows |
| 6 | **All Products** | 2-col grid, storefront filter, sort (price/newest), infinite scroll (meta.page), pull-to-refresh |
| 7 | **Search** | Debounced search, results grid, recent searches, no-results state |
| 8 | **Category Feed** | Products filtered by category chip |
| 9 | **Vendor Storefront** | Vendor header (name, rating, item count), product grid, tap vendor from card → here |
| 10 | **Product Sheet** | 45% quick-add (price, unit, qty stepper, ADD) / 90% full (desc, gallery, reviews, vendor link) |
| 11 | **Cart** | Grouped by vendor w/ per-vendor subtotal, qty steppers (stock-capped), remove, subtotal/total, empty state |
| 12 | **Checkout** | Address select/add, delivery slot picker, payment method (COD/Razorpay, COD>₹2000 blocked w/ warning), coupon apply, order summary, slide-to-confirm |
| 13 | **Razorpay** | Create order → open Razorpay SDK → verify → success/fail/cancel handling |
| 14 | **Order Confirmation** | Order number, ETA, "track order" CTA |
| 15 | **Order History** | Status tabs, list, empty state, pull-to-refresh |
| 16 | **Order Detail** | Per-vendor groups + status timeline, items, totals, cancel (when allowed), return |
| 17 | **Order Tracking** | Status timeline (PLACED→DELIVERED), map/ETA placeholder where no assignment |
| 18 | **Wishlist** | Grid, remove, add-to-cart, empty state |
| 19 | **Profile** | Header (avatar initials, name, phone), sections: My Orders, Addresses, Wishlist, Notifications, Support, Legal, Delete Account & Data, Logout |
| 20 | **Address List / Add** | CRUD, set default, empty state, validation (pincode, phone) |
| 21 | **Notifications** | List, unread badge, mark read, empty state |
| 22 | **Support** | Static help topics, contact info |
| 23 | **Legal** | Privacy Policy + Terms screens (static content) |
| 24 | **Delete Account & Data** | In-app flow with confirm dialog (store policy requirement) |
| 25 | **Settings** | Language toggle (English/Telugu), app version |

**Non-negotiable behaviors:** cart server-sync + stock caps · COD cap enforcement ·
per-vendor cart grouping · zone gating · token persistence via secure storage ·
401 → refresh → retry once → forced logout · offline → graceful error, never crash.

---

## 5. Explicitly OUT of scope (the 10% — do NOT build)

- AI screens (Assistant, Scanner, Recommendations, Health Insights, Chat History)
- Loyalty tiers, Referral, Wallet, Subscription screens
- Promos screen (offer landing)
- Live map rendering (use a static placeholder map/ETA card)
- Push notifications
- Real payment gateway SDK integration **is required**; only the *card UIs* of the above
  are excluded.

---

## 6. Deliverables (submit by deadline)

1. **Git repo** (GitHub/GitLab) — commit history, clean `README.md` with run instructions.
2. **`flutter analyze` clean** and **`flutter test` passing** — screenshot of both.
3. **APK** built (`flutter build apk --debug`) + screenshot/video of the app running:
   onboarding → OTP → home → browse → cart → checkout (COD) → order placed → track.
4. **ARCHITECTURE.md** (1 page): layer diagram, state management choice + why,
   how the API seam works, what you'd do next.
5. **EXPLANATION.md**: what you used AI for (honestly), what you understand vs. generated,
   and 3 questions you'd ask the backend team.

---

## 7. Grading rubric (scored on the repo + a live grilling session)

| Criterion | Pass | Fail |
|---|---|---|
| Builds & runs | APK installs, journey completes on emulator | Doesn't compile / crashes on launch |
| `flutter test` + `analyze` | Green, real tests | Broken suite, template test left broken |
| Contract fidelity | Uses real envelope `data`/`meta`, camelCase fields, real endpoints | Keeps `items`/`cursor`/fake endpoints from his prototype |
| Design fidelity | Tokens match, storefront re-theming works, pill nav, brass prices | Styled arbitrarily, no re-theming |
| Business rules | Zone gate, COD cap, per-vendor groups, stock caps all enforced | Rules absent or bypassable |
| API seam | Local stub + clean swap to real API | Hardcoded mock, no seam |
| Explainability | Live session: explains his own code, fixes a new bug on the spot | Can't explain his submission |

**Pass threshold:** buildable + journey works + contract & design fidelity + explains his work.
A candidate who clears this can be trusted on your other mobile projects.

---

## 8. Anti-AI verification (the part that matters most)

Because this is take-home, assume AI was used. **The live 60-minute grilling session is
mandatory before hiring:**

1. Pick 3 random files from his submission — he must explain them line-by-line.
2. Give him a **new bug** in his own code to fix live (e.g., "the cart double-charges on
   rapid taps" or "zone block shows for Hyderabad") — watch his debugging process.
3. Ask one "why not" question: *"Why Flutter's [X] instead of [Y]?"* — measures real reasoning.
4. Ask him to add a small feature live (e.g., a "sort by rating" chip) — measures
   whether he can extend, not just generate.

**If he can't explain his submission, he fails regardless of how good the code is.**
