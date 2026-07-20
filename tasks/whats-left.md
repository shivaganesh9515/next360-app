# What's Left — Beyond Assigned Tasks

## ✅ Already Done (Assigned to Team)
See individual task files for:
- 🟢 **Ashwanth**: User detail/status, admin notifications, security hardening, auth security
- 🟢 **Abhinaya**: Support Tickets, Reports, Payouts oversight, remaining admin endpoints
- 🟢 **Harshitha**: Payment list, refund webhooks, weekly payouts, vendor settlement
- 🟢 **Srinitha**: DP earnings, DP setup, vendor approve, batch payouts, auto-assignment
- 🟢 **Soumya**: Payouts wire-up, Razorpay linking, auto-refresh, CSV export, cancel reason, bulk actions
- 🟢 **Manaswini**: Support pages, bulk approval, wire reports/payouts, settings toggles, E2E testing, dashboard

---

## ❌ P1 — Should Do After P0

### Backend
| # | Task | What | Est. Time |
|---|------|------|-----------|
| 1 | **Background job queue (BullMQ + Redis)** | Move OTP SMS, push notifications, invoices, settlements to background jobs so API calls don't block | 2-3 days |
| 2 | **SMS/Email providers** | Wire MSG91/Twilio for real OTP SMS, SendGrid/Resend for email. Currently OTPs are only logged to console | 1-2 days |
| 3 | **Missing notification events** | Wire remaining 22 notification events (welcome, payment success, low stock, etc.). Already assigned - just need connecting | 1 day |
| 4 | **Delivery slot seed data** | Create default delivery slot configs for Hyderabad + Vijayawada zones so the picker shows real options | 2 hours |

### Frontend
| # | Task | What | Est. Time |
|---|------|------|-----------|
| 5 | **Cart validation enhancement** | Validate stock before order, auto-remove unavailable items, show warnings | 1 day |
| 6 | **Empty/error/loading states audit** | Every screen needs skeleton loaders, helpful empty messages, retry buttons | 2-3 days |
| 7 | **Vendor dashboard: Order cancellation reason** | Show reason input when rejecting orders | 1 day |
| 8 | **Admin panel: Notification toggles wire-up** | Connect UI toggles to backend PlatformSettings | 4 hours |

---

## 🟡 P2 — Nice to Have (After Launch)

### Features
| # | Task | What | Est. Time |
|---|------|------|-----------|
| 9 | **Reward points / wallet system** | Points from orders, redeem at checkout, new DB model | 3-4 days |
| 10 | **In-app chat (Customer ↔ Vendor)** | Real-time messaging per OrderVendorGroup | 3-5 days |
| 11 | **Reorder feature** | One-tap repeat previous order from history | 1 day |
| 12 | **Referral program** | Share code, get credit on signups | 2-3 days |
| 13 | **Restock notifications** | "Notify me when back in stock" button on out-of-stock products | 1 day |
| 14 | **Subscription/weekly box** | Recurring weekly box with curated products | 5-7 days |

### Polish
| # | Task | What | Est. Time |
|---|------|------|-----------|
| 15 | **Payment analytics** | Success/failure rate, average settlement time, revenue by method | 1 day |
| 16 | **Vendor dashboard: Export reports (CSV)** | Download sales/revenue data as spreadsheet | 4 hours |
| 17 | **Vendor dashboard: Product bulk actions** | Batch toggle activate/deactivate multiple products | 1 day |
| 18 | **Delivery partner KYC verification webhook** | Notify DP when KYC is approved/rejected | 4 hours |
| 19 | **Delivery zone pincode lists** | Add serviceable pincode list per zone | 1 day |

---

## 🏗️ Infrastructure — Not Started
| # | Task | What | Priority |
|---|------|------|----------|
| 20 | **Redis** | Needed for BullMQ (background jobs) + delivery assignment locking | 🔴 P1 |
| 21 | **CI/CD pipeline** | GitHub Actions for automated testing + deployment | 🟠 P2 |
| 22 | **Monitoring/error tracking** | Sentry or similar for production error alerts | 🟠 P2 |
| 23 | **Staging environment** | Separate staging deployment for payments testing | 🟠 P2 |
| 24 | **Production build** | Production Expo build + App Store submission | 🟠 P2 |

---

## 📊 Status Quick View

| Area | Complete | What's Left |
|------|:--------:|-------------|
| Backend API | ~92% | Queue, SMS/Email, notification events wiring |
| Customer App | ~90% | Cart validation, empty states polish |
| Vendor Dashboard | ~85% | Cancel reason, CSV export, bulk actions |
| Admin Panel | ~88% | Settings toggles wire-up |
| Delivery App | ~80% | Testing against live backend |
| Database | ~97% | Near final - only wallet/referral models if needed |
| Security | ~60% | Helmet + ThrottlerGuard (assigned), CSRF remains |
| Infrastructure | ~10% | No Redis/CI/CD/monitoring yet |

---

## Recommended Order

1. **First**: Wait for team to finish their P0 tasks (already assigned)
2. **Then**: Infrastructure (Redis → job queue → SMS/Email)
3. **Then**: Remaining notification events
4. **Then**: Polish (cart validation, empty states, exports)
5. **Finally**: New features (rewards, chat, referral)
