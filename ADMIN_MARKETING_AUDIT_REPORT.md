# ADMIN PANEL & MARKETING WEBSITE — COMPLETE AUDIT REPORT
## Next360 Organic Marketplace
**Date:** July 19, 2026  
**Role:** Founder / CTO / Principal Architect

---

## 1. EXISTING ADMIN FEATURES

### Sidebar Navigation (current)
The admin panel has a sidebar with **19 sections**:

| # | Section | Sub-pages |
|---|---------|-----------|
| 1 | Dashboard | Main overview |
| 2 | Users | List only |
| 3 | Vendors | All Vendors, Pending Approvals |
| 4 | Delivery Partners | All Partners, Pending Approvals |
| 5 | Products | All Products, Pending Approvals, Add Product |
| 6 | Categories | Categories, Sub-Categories |
| 7 | Orders | All Orders, Returns, Refunds |
| 8 | Payments | Transactions, Vendor Payouts, Delivery Payouts |
| 9 | Inventory | Main |
| 10 | Coupons | Main |
| 11 | Offers | Main |
| 12 | Reviews | Main |
| 13 | Ratings | Main |
| 14 | AI Logs | Chat Logs, Recommendations, Analytics |
| 15 | Reports | Sales Reports, Revenue Reports *(no backend)* |
| 16 | CMS | Pages, Banners, Notifications |
| 17 | Zones | Main |
| 18 | Disputes | Main |
| 19 | Roles & Permissions | Roles, Permissions |

### Dashboard (current)
- GMV Today, Orders Today, Pending Actions, Active Partners
- "Needs Your Attention" queue (vendor approvals, product approvals, disputes, delivery assignments)
- Order pipeline bar chart
- 7-day revenue bar chart (recharts)
- Recent orders table
- **All data aggregated client-side** from separate API calls (no dedicated `/admin/dashboard` endpoint)

### Components Built
- **AdminSidebar** — Collapsible navigation with sub-items, active state highlighting
- **AdminHeader** — Top bar with menu toggle
- **DataTable** — Reusable table with search, pagination, sortable columns, row click
- **StatsCard** — Metric card with icon, trend indicator, gradient accent
- **StatusBadge** — Colored status indicator
- **ErrorBoundary** — React error boundary
- **AuthProvider** — Auth context (login state, token management)

### Auth
- Login page (email + password)
- JWT token stored in localStorage as `admin_token`
- Route guard redirects unauthenticated users to `/login`

---

## 2. MISSING ADMIN FEATURES

### Critical Gaps (No Backend Support)

| Feature | Status | Backend Endpoint Needed |
|---------|--------|------------------------|
| `/admin/dashboard` aggregate endpoint | ❌ Missing | `GET /admin/dashboard` |
| Single user detail view | ❌ Missing | `GET /users/:id` |
| User status (suspend/ban) | ❌ Missing | `PATCH /users/:id/status` |
| Vendor detail page | ❌ Missing | `GET /vendors/:id` (exists but no dedicated admin detail page) |
| Vendor reject/suspend | ❌ Partial | Only `/vendors/:id/approve` exists |
| Delivery partner detail | ❌ Missing | No dedicated page |
| Product approval (isApproved) | ❌ Missing | `PATCH /products/:id/approve` |
| Product bulk operations | ❌ Missing | No bulk approve/reject |
| Payouts admin oversight | ❌ Missing | No `/payouts/*` backend routes |
| Reports module | ❌ Missing | No `/reports/*` backend routes |
| Admin settings | ❌ Missing | No `/admin/settings` route |
| Admin broadcoast notification | ❌ Missing | No POST notification endpoint |
| Ratings aggregate | ❌ Missing | No aggregate endpoint |
| Payments list | ❌ Missing | No bare `/payments` listing |
| Commission list | ❌ Missing | No paginated commission list |

### Missing Business Modules (Entirely)

| Module | Priority | Why Needed |
|--------|----------|------------|
| **Executive Dashboard (live metrics)** | P0 | Current dashboard is client-side aggregated from 5 separate API calls |
| **Organic Verification Center** | P1 | Business-critical — NPOP certificate management, expiry tracking |
| **Finance Center** | P1 | Platform revenue, withdrawal queue, settlement automation |
| **Commission Management** | P1 | Editable commission %, platform fee, delivery fee from admin |
| **Customer Management** | P1 | Customer profiles, orders, activity timeline, admin actions |
| **Marketing Center** | P1 | Homepage builder, campaign manager, push/email campaigns |
| **Support Center** | P1 | Tickets, assignments, internal notes |
| **Fraud Detection** | P2 | Coupon/refund abuse, fake vendors/orders, risk scoring |
| **Automation Center** | P2 | Visual rule builder (stock alerts, certificate expiry, etc.) |
| **Audit Logs** | P1 | Log every admin action |
| **Developer Center** | P2 | API health, queue status, Redis, cron jobs, feature flags |
| **System Settings** | P1 | All configurable business rules from UI |
| **Analytics (full)** | P1 | Sales, cities, LTV, CAC, retention, conversion |
| **Product Moderation (full)** | P1 | Bulk approve/reject, duplicate detection, reported products |

### Missing UI Features in Existing Pages

| Existing Page | Missing Features |
|---------------|-----------------|
| Dashboard | Live metrics, activity feed, KPIs, platform profit |
| Vendors | Detail view, certificates, performance, bank details, withdrawal history |
| Products | Bulk approve, bulk reject, duplicate detection, reported products |
| Orders | Timeline view, delivery assignment UI |
| Users | Detail view, orders history, activity log, admin actions |
| Delivery Partners | Detail view, live status, performance metrics, zone assignment |
| CMS | Push campaign builder, email campaign builder |

---

## 3. EXISTING MARKETING FEATURES

### Pages
- **Homepage** (single page application — all sections on one scrollable page)

### Sections on Homepage (10 sections)

| Section | Component | Completeness |
|---------|-----------|:------------:|
| Navigation | Navbar | ✅ Complete — responsive with mobile menu |
| Hero | Hero | ✅ Complete — full-viewport, category swatch, CTA |
| Mission | Mission | ✅ Complete — scroll-triggered animations, floating tiles |
| How It Works | HowItWorks | ✅ Complete — 3-step layout |
| Storefront Showcase | StorefrontShowcase | ✅ Complete — 3-column card layout |
| Trust Strip | TrustStrip | ✅ Complete — KYC, Razorpay, COD, Tracking badges |
| Feature Grid | FeatureShowcase | ✅ Complete — 8 feature cards with hover effects |
| App Download | AppDownload | ✅ Complete — phone mockup, QR placeholder, store badges |
| Loyalty Teaser | LoyaltyTeaser | ✅ Complete — 8-tier progression strip, "Coming Soon" |
| Vendor/Partner CTA | VendorPartnerSection | ✅ Complete — dual CTA for vendors + DPs |
| Footer | Footer | ✅ Complete — 6-column links, social, app stores |

### Missing Pages (entirely)

| Page | Status | Notes |
|------|--------|-------|
| About Us | ❌ Missing | Link exists in footer, no route or page |
| Blog | ❌ Missing | Link exists in footer, no route or page |
| Careers | ❌ Missing | Link exists in footer, no route or page |
| Become a Vendor | ❌ Missing | Custom registration page beyond the CTA section |
| Become a Delivery Partner | ❌ Missing | Custom registration page |
| NPOP Certification Guide | ❌ Missing | Organic certification educational content |
| Organic Education | ❌ Missing | Guides, articles, resources |
| Recipes | ❌ Missing | Content marketing opportunity |
| FAQs | ❌ Missing | Common questions |
| Pricing | ❌ Missing | No pricing page |
| Contact | ❌ Missing | No contact form/email |
| Privacy Policy | ❌ Missing | Legal requirement |
| Terms of Service | ❌ Missing | Legal requirement |
| Refund Policy | ❌ Missing | Legal requirement |
| Investor Relations | ❌ Missing | Link exists, no page |
| Press Kit | ❌ Missing | No press resources |
| SEO — Blog articles | ❌ Missing | No SEO content strategy |

### Missing Features in Existing Marketing Pages

| Section | Missing |
|---------|---------|
| Hero | No video background, no animated product showcase |
| App Download | QR code is a placeholder, no real QR |
| Vendor/Partner CTA | Links to `#` — no actual registration flow |
| Footer "Blog" link | Points to `#` — no blog |
| All "Learn More" links | Points to `#` — no destination pages |

---

## 4. BACKEND MODULES NEEDED FOR ADMIN OS

### New Endpoints Required (25+)

| Module | Endpoints Needed |
|--------|-----------------|
| **Admin Dashboard** | `GET /admin/dashboard` (aggregate: live metrics, pending actions, recent activity, daily stats) |
| **Admin Users** | `GET /users/:id`, `PATCH /users/:id/status`, `POST /users/:id/send-notification`, `POST /users/:id/issue-coupon` |
| **Admin Vendors** | `PATCH /vendors/:id/reject`, `PATCH /vendors/:id/suspend`, `PATCH /vendors/:id/feature`, `GET /vendors/:id/activity-log` |
| **Admin Products** | `PATCH /products/bulk-approve`, `PATCH /products/bulk-reject`, `PATCH /products/:id/feature`, `GET /products/reported` |
| **Admin Payouts** | `GET /payouts/vendors`, `GET /payouts/delivery`, `POST /payouts/:id/approve`, `POST /payouts/:id/retry` |
| **Admin Reports** | `GET /reports/daily`, `GET /reports/weekly`, `GET /reports/monthly`, `GET /reports/export` |
| **Admin Settings** | `GET /admin/settings`, `PATCH /admin/settings` |
| **Analytics** | `GET /analytics/sales`, `GET /analytics/cities`, `GET /analytics/categories`, `GET /analytics/retention`, `GET /analytics/forecast` |
| **Audit Logs** | `GET /audit-logs`, `GET /audit-logs/:id` |
| **Fraud Detection** | `GET /fraud/alerts`, `GET /fraud/risk-score/:userId` |
| **KYC (Admin)** | `GET /kyc/pending`, `GET /kyc/expiring`, `POST /kyc/:id/verify`, `POST /kyc/:id/reject` |
| **Communications** | `POST /notifications/send-broadcast`, `POST /notifications/send-email-campaign` |
| **Automation** | `GET /automation/rules`, `POST /automation/rules`, `PATCH /automation/rules/:id`, `DELETE /automation/rules/:id` |
| **Support** | `GET /support/tickets`, `PATCH /support/tickets/:id`, `POST /support/tickets/:id/assign` |

---

## 5. DATABASE CHANGES NEEDED

### New Models Required

| Model | Purpose |
|-------|---------|
| `AuditLog` | Track every admin action (userId, action, targetType, targetId, oldValue, newValue, ip, userAgent) |
| `FraudAlert` | Automated fraud detection records |
| `SupportTicket` | Support ticket management with assignment |
| `AutomationRule` | Visual automation builder rules |
| `AdminSettings` | Global platform settings (editable from admin) |
| `Campaign` | Marketing campaigns (push/email) |
| `Withdrawal` | Vendor withdrawal requests with approval workflow |
| `Wallet` | Customer/vendor/delivery wallet balances and transactions |
| `Settlement` | Settlement records with approval workflow |
| `KycDocument` | Better document tracking with expiry dates (if not already sufficient) |
| `ActivityLog` | Vendor/customer activity timeline |

### Existing Models to Expand

| Model | New Fields Needed |
|-------|-------------------|
| `User` | `isBanned`, `banReason`, `lastLoginAt`, `loginIp`, `deviceInfo` |
| `Vendor` | `isFeatured`, `featuredUntil`, `suspensionReason`, `isFrozen`, `rejectionReason`, `organicCertificateVerified` |
| `Product` | `isFeatured`, `isReported`, `reportCount`, `rejectionReason`, `bulkApprovalBatchId` |
| `Order` | `autoCancelledAt`, `fraudScore` |
| `KYC` | `expiresAt`, `lastVerifiedAt`, `adminNotes` |
| `Notification` | `sentVia` (enum: PUSH, EMAIL, SMS, ALL), `campaignId` |
| `Coupon` | `createdBy`, `maxUsagePerUser`, `applicableVendors[]` |

---

## 6. RECOMMENDED INFORMATION ARCHITECTURE

### New Sidebar Structure (Admin OS)

```
📊 EXECUTIVE
├── Dashboard           ← Enhanced: live metrics, KPIs, activity feed
├── Analytics           ← New: full analytics suite
└── Reports             ← New: exportable reports

👥 PEOPLE
├── Customers            ← NEW module
├── Vendors             ← Enhanced: detail view, certificates, performance
└── Delivery Partners   ← Enhanced: detail view, live tracking, performance

📦 OPERATIONS
├── Orders
├── Products / Moderation ← Enhanced: bulk ops, duplicate detection
├── Inventory
├── Categories
├── Coupons
└── Offers

✅ VERIFICATION
├── Vendor Approvals    ← Enhanced: certificates, organic verification
├── Product Approvals
├── Organic Verification ← NEW: dedicated NPOP certificate center
└── KYC Center

🚚 DELIVERY OPS         ← NEW module
├── Live Map
├── Driver Management
├── Zones
└── Delivery Rules

💰 FINANCE              ← NEW module
├── Platform Revenue
├── Vendor Payouts
├── Delivery Payouts
├── Withdrawal Queue
├── Commission Management
└── Refund Queue

🎯 MARKETING             ← NEW module
├── Homepage Builder
├── Banner Manager
├── Campaign Manager
├── Push Campaigns
├── Email Campaigns
└── SEO / Blog

🎫 SUPPORT              ← NEW module
├── Tickets
├── Disputes
├── Returns / Refunds
└── Escalations

⚙️ SYSTEM
├── Admin Settings       ← Enhanced: all config rules from UI
├── Roles & Permissions
├── Automation Center    ← NEW
├── Audit Logs           ← NEW
├── Developer Center     ← NEW
└── AI Logs
```

---

## 7. REQUIRED BACKEND MODULES

| Module | Priority | Status |
|--------|:--------:|:------:|
| Admin Dashboard (aggregate) | P0 | ❌ New |
| Users Detail + Management (admin) | P0 | 🔧 Extend |
| Vendors Admin (reject/suspend/feature) | P0 | 🔧 Extend |
| Products Admin (bulk approve/feature) | P1 | 🔧 Extend |
| Payouts Admin | P1 | ❌ New |
| Reports | P1 | ❌ New |
| Analytics | P1 | ❌ New |
| Organic Verification | P1 | ❌ New |
| Finance / Commission Settings | P1 | ❌ New |
| Audit Logs | P1 | ❌ New |
| Support Tickets | P1 | ❌ New |
| Settings (platform) | P1 | ❌ New |
| Customer Management | P1 | 🔧 Extend |
| Delivery Operations | P1 | 🔧 Extend |
| Automation Rules | P2 | ❌ New |
| Fraud Detection | P2 | ❌ New |
| Campaign Management | P2 | ❌ New |
| Developer Center | P2 | ❌ New |

---

## 8. REQUIRED FRONTEND PAGES (Admin Panel)

| Page | Priority | Status |
|------|:--------:|:------:|
| Executive Dashboard (live metrics) | P0 | 🔧 Upgrade existing |
| Vendor Detail Page | P0 | ❌ New |
| Customer Management Page | P1 | ❌ New |
| Organic Verification Center | P1 | ❌ New |
| Finance Center | P1 | ❌ New |
| Commission Management | P1 | ❌ New |
| Product Moderation (bulk) | P1 | ❌ New |
| Support Center | P1 | ❌ New |
| Marketing Center | P1 | ❌ New |
| Admin Settings | P1 | ❌ New |
| Audit Logs Viewer | P1 | ❌ New |
| Analytics Dashboard | P1 | ❌ New |
| Delivery Operations | P1 | ❌ New |
| Fraud Detection | P2 | ❌ New |
| Automation Center | P2 | ❌ New |
| Developer Center | P2 | ❌ New |

---

## 9. BUSINESS LOGIC NEEDED

### Platform Finance Rules
- Platform collects full payment from customer
- Platform Fee = configurable % (default 0%)
- Delivery Fee = configurable flat rate
- Payment Gateway Fee = configurable %
- Tax = configurable %
- **Vendor Pending Balance** = (Order Total) - Platform Fee - Delivery Fee - Gateway Fee - Tax
- **24-hour settlement hold** before vendor can withdraw
- **Minimum withdrawal ₹299**
- Withdrawal auto-approved or admin-approved

### Organic Verification
- Vendor uploads NPOP certificate
- Admin views certificate (zoom, download)
- Admin approves/rejects with remarks
- Certificate has expiry date
- Auto-notify vendor + admin before expiry (30/15/7 days)
- Expired certificate → remove organic badge + premium card
- Verified Organic → automatic organic badge, premium product card, organic category access

### Commission Rules
- Commission % = configurable per vendor (default from settings)
- Organic vendors can have different commission rate
- Festival/campaign commission = temporary override
- Commission calculated on order value BEFORE platform fee

### Settlement Automation
- Auto-settle every X hours (configurable)
- Batch settlements
- Retry failed Razorpay Route transfers
- Manual override available

---

## 10. AUTOMATION OPPORTUNITIES

| Trigger | Action(s) |
|---------|-----------|
| Stock < threshold | Notify vendor + admin |
| Certificate expiring in 30 days | Notify vendor |
| Certificate expiring in 7 days | Notify vendor + admin |
| Certificate expired | Remove badge, notify vendor + admin |
| Order delivered | Request review, send coupon (if first order) |
| Withdrawal requested | Notify finance admin |
| Payment failed for 3+ attempts | Flag order for review |
| Vendor inactive for 30 days | Notify admin for review |
| Product reported 3+ times | Auto-hide product, notify admin |
| Customer has 5+ refunds in 30 days | Flag for fraud review |
| Daily at 8 AM | Send daily sales report to admins |
| Weekly on Monday | Send weekly settlement report |
| New vendor registered | Send KYC reminder after 24 hours if incomplete |

---

## 11. SECURITY CONSIDERATIONS

| Area | Action Needed |
|------|---------------|
| Admin Session | Session timeout, force logout on password change |
| Audit Trail | Log every: approve, reject, suspend, feature, settings change, payout |
| Role Hierarchy | Super Admin > Admin > Support Agent > Viewer |
| Action Confirmation | Require confirmation for: payouts, refunds > ₹10k, vendor suspension |
| 2FA Admin | Add optional 2FA for admin accounts |
| IP Whitelisting | Optional IP restriction for admin panel |
| Rate Limiting | Stricter limits on admin endpoints |
| Data Export | Require reason for bulk data exports |

---

## 12. PERFORMANCE CONSIDERATIONS

| Area | Strategy |
|------|----------|
| Dashboard Metrics | Dedicated `/admin/dashboard` endpoint — single query, not 5 separate calls |
| Real-time Updates | Supabase Realtime subscription for live dashboard |
| Analytics | Pre-aggregated daily tables, not live queries |
| Reports | Generate on demand with caching (15 min TTL) |
| Audit Logs | Write-heavy, use separate table with time-based partitioning |
| Bulk Operations | Queue-based processing (BullMQ) for large batches |
| Dashboard Charts | Client-side caching with stale-while-revalidate |

---

## 13. PRIORITY ORDER

### P0 — Must Have (Core Operations)

| Order | Module | Effort |
|:-----:|--------|:------:|
| 1 | **Executive Dashboard** — aggregate backend endpoint + live metrics | Medium |
| 2 | **Vendor Detail Page** — full vendor profile with certificates, orders, performance | Medium |
| 3 | **Product Moderation** — approval endpoint + bulk approve/reject | Small |
| 4 | **Customer Management** — user detail, orders, timeline, admin actions | Medium |
| 5 | **Admin Settings** — platform fee, commission %, delivery fee, withdrawal rules | Medium |
| 6 | **Audit Logs** — record and view every admin action | Medium |

### P1 — Business Critical

| Order | Module | Effort |
|:-----:|--------|:------:|
| 7 | **Organic Verification Center** — NPOP certificate management | Medium |
| 8 | **Finance Center** — revenue, payouts, withdrawal queue | Large |
| 9 | **Commission Management** — editable rates, platform fee | Small |
| 10 | **Support Center** — tickets, assignment, internal notes | Medium |
| 11 | **Marketing Center** — homepage builder, campaigns | Large |
| 12 | **Analytics Dashboard** — full analytics suite | Large |
| 13 | **Reports** — exportable daily/weekly/monthly | Medium |

### P2 — Growth & Automation

| Order | Module | Effort |
|:-----:|--------|:------:|
| 14 | **Delivery Operations** — live map, driver tracking | Large |
| 15 | **Fraud Detection** — automated alerts, risk scoring | Large |
| 16 | **Automation Center** — visual rule builder | Large |
| 17 | **Developer Center** — system health, feature flags | Medium |

---

## 14. MARKETING WEBSITE — PRIORITY ORDER

| Order | Page/Feature | Effort |
|:-----:|-------------|:------:|
| 1 | **Become a Vendor** page — dedicated registration page | Small |
| 2 | **Become a Delivery Partner** page | Small |
| 3 | **Legal pages** — Privacy, Terms, Refund Policy | Small |
| 4 | **FAQ page** — common questions | Small |
| 5 | **NPOP Certification Guide** — organic certification education | Medium |
| 6 | **Contact page** — form + email | Small |
| 7 | **Blog** — CMS-backed blog section | Medium |
| 8 | **SEO optimization** — meta tags, structured data, sitemap | Small |
| 9 | **Careers page** | Small |
| 10 | **Recipes section** — content marketing | Medium |
| 11 | **Press Kit** | Small |
| 12 | **Investor Relations** page | Small |
| 13 | **Pricing page** | Small |

---

## 15. SUMMARY

### Admin Panel
| Metric | Value |
|--------|-------|
| Existing pages | 44 (all scaffolded) |
| Fully functional pages | ~30 (CMS data comes from real API) |
| Pages with no backend support | ~14 (Reports, Payouts, Analytics, Settings) |
| Missing business modules | **17 new modules** |
| Current completion | **~70%** (UI exists but many lack backend data) |
| Missing backend endpoints | **25+** |

### Marketing Website
| Metric | Value |
|--------|-------|
| Existing sections (homepage) | 10 (all complete) |
| Existing separate pages | 1 (homepage only) |
| Missing pages | **16** |
| Current completion | **~40%** (homepage is polished, everything else missing) |

### Overall Assessment
The Admin Panel has a strong UI foundation (sidebar, DataTable, StatsCard, StatusBadge, auth, layout) but is missing **~25 backend endpoints** and **17 business modules** to become a true Business OS. The Marketing Website has a polished homepage but **16 missing pages** that are critical for SEO, user acquisition, and legal compliance.

---

*End of Audit Report — ready for implementation priority discussion*
