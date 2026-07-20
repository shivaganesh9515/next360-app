# Next Steps

> **Last updated:** 2026-07-20

---

## Immediate Tasks (This Week)

### 1. Backend Modules - Complete Missing API Endpoints

**Srinitha (highest impact):**
- Build delivery-partners/ module (list, status, zone, document verification)
- Build zones/ module (add/edit/activate, delivery radius, COD cap enforcement)
- Build disputes/ module (refund requests + complaints linked to orders)
- Build vendor analytics endpoints (/vendors/me/analytics, /earnings, /payouts, /transactions, /customers, /:id/stats)

**Harshitha:**
- Build Razorpay Route split-payout automation (auto-split from platform to vendor accounts)
- Build inventory/ module (GET stock, PATCH update, GET low-stock alerts)
- Coordinate with Srinitha on payout read vs write endpoint boundaries

### 2. Frontend Setup - Dependency Installation

**Soumya (vendor-dashboard):**
- Add @supabase/supabase-js to package.json
- Run shadcn/ui CLI init
- Confirm if zustand/axios are needed

**Manaswini (admin-panel):**
- Add @supabase/supabase-js to package.json
- Run shadcn/ui CLI init
- Confirm if zustand/axios are needed

### 3. Wire Live Data

Once backend modules land:
- Soumya: Wire vendor-dashboard payouts, analytics, earnings, customers pages
- Manaswini: Wire admin-panel delivery-partners, zones, disputes pages
- Manaswini: Wire roles, CMS, brands, sub-categories (UNBLOCKED - Abhinaya done)
- Manaswini: Wire payouts oversight (blocked on Harshitha + Srinitha)

---

## Medium-Term Tasks

### 4. Data & Infrastructure
- Add seed data (demo products, orders, vendors, customers)
- Set up CI/CD pipeline (GitHub Actions)
- Fix 3 raw fetch() calls in admin panel (reviews, refunds pages)

### 5. Polish
- Fix design system inconsistency (gray-* vs slate-* in admin panel)
- Upgrade Expo SDK from 56 to 57+ (fixes 13 moderate CVEs)
- Wire customer-app hero banner to CMS endpoint
- Performance optimization, error boundaries, loading/empty states

### 6. Quality
- Write unit tests for backend services
- Write integration tests for API endpoints
- Write E2E tests for critical flows (auth, cart, checkout)

---

## Long-Term Tasks

### 7. Launch Preparation
- Set up staging environment (needed before real payments)
- Configure real Supabase Postgres database
- Set up Razorpay production account + vendor KYC flow
- Environment strategy (dev/staging/prod)

### 8. Post-Launch
- Redis for delivery assignment locking
- WhatsApp/SMS notifications
- Reviews and ratings aggregation
- Advanced analytics dashboard
- Multi-language support (Telugu/English toggle)
