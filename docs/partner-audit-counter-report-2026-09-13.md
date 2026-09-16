# Next360 — Response to Partner Security & Production-Readiness Audit

**Date:** 2026-09-13
**Verified against:** `main` @ `c7467ee` (+ uncommitted COD-only scope change, 7 files — see §5)
**Author:** Next360 engineering
**Scope decision (locked 2026-09):** Customer app is **Google-auth + Cash-on-Delivery only** for MVP. Phone-OTP login and Razorpay online payments are disabled by design (no SMS provider, no Razorpay keys).

---

## 1. Summary

| Verdict | Count | Findings |
|---|---|---|
| **Out of scope by design** (endpoint disabled, returns 410/503) | 5 | #1, #2, #3, #7, #8 |
| **Disputed — control already exists** (with file:line evidence) | 3 | #4, #6, #9 |
| **Accepted — scheduled fix** | 7 | #5, #10, #13, #14, #16, #18, #19 |
| **Accepted as post-launch hardening** (dormant at MVP volume) | 5 | #11, #12, #15, #17, #20 |

We request re-verification against the commit above. Findings marked "out of scope" can be confirmed with a single HTTP call each (reproduction steps in §3).

## 2. Scope note (please use for re-audit)

* Customer auth: Google (primary) + Apple + email/password (vendor/admin). Phone OTP removed — `apps/api/src/auth/auth.service.ts` (`sendOtp`, `verifyOtpLogin`, `verifyOtp` throw `410 Gone`); customer app already had `ENABLE_PHONE_AUTH=false` (`apps/customer-app/src/screens/auth/PhoneAuthScreen.tsx:21`).
* Payments: COD-only, capped at ₹2,000 (`CreateOrderDto` accepts `['COD']` only; `CheckoutScreen` offers COD only). `createRazorpayOrder`, `verifyPayment`, `handleWebhook`, `initiateRefund` return `503`. Delivery-app OTP (via Supabase Auth directly, not via our backend) is unchanged and out of scope of backend findings #2/#3.

## 3. Finding-by-finding response

### #1 — Missing Idempotency Key Validation (`payments.service.ts`) — OUT OF SCOPE
`POST /api/payments/razorpay/verify` now returns `503 Online payments are disabled`. The reported concurrent-verification race cannot execute. When Razorpay is re-enabled, we will add a conditional-update guard in addition to the existing `PAID` early-return + `Payout @@unique([orderId, vendorId])` dedup.

### #2 — OTP Brute Force (`auth.controller.ts`) — OUT OF SCOPE
`POST /api/auth/verify-otp-login` and `POST /api/auth/verify-otp` return `410 Gone`. No OTP is issued or accepted by the backend, so there is nothing to brute-force. (Delivery-app OTP goes through Supabase Auth, which enforces its own rate limits — not this endpoint.)

### #3 — No Rate Limiting on OTP Send (`auth.controller.ts`) — OUT OF SCOPE
`POST /api/auth/send-otp` returns `410 Gone`; no SMS is sent. For the record, before disablement the endpoint had both a 5/min throttle **and** a 60-second per-phone Redis cooldown (`auth.service.ts`, pre-change).

### #4 — No File Upload Validation (`upload.controller.ts`) — DISPUTED, control exists
`apps/api/src/upload/upload.service.ts:44-76` enforces: mimetype allowlist (`jpeg/png/webp/gif`), magic-byte sniffing independent of client headers, 5 MB size cap, UUID filenames with verified extension, plus `JwtAuthGuard + RolesGuard (VENDOR/ADMIN)` at the controller. Missing only malware scanning, which we accept as future hardening, not a current critical. Request: re-test with a renamed `.exe`/`.svg` claiming `image/png` — it is rejected.

### #5 — Invalid Date Input in Admin Payment Filters (`payments.service.ts`) — ACCEPTED
`findAll` does `new Date(str)` without validity checks; garbage input causes a query error (no SQL injection — Prisma parameterizes; agreed). Fix scheduled: `IsDateString` DTO validation. Severity we assess as Low.

### #6 — Order Access Authorization via Unvalidated IDs (`orders.controller.ts`) — DISPUTED, control exists
`orders.service.ts:findOne` uses exact `findUnique` (not pattern matching) followed by owner check (`order.userId !== userId` → 403) and vendor-membership check (vendor must own one of the order's vendor groups). Same pattern in `getPaymentsForOrder`. No cross-vendor leak demonstrated. We will add `ParseUUIDPipe` on `:id` params as hygiene.

### #7 — No Rate Limiting on Payment Order Creation (`payments.controller.ts`) — OUT OF SCOPE
`POST /api/payments/razorpay/order` returns `503`. Additionally, the "no throttle" premise was inaccurate: a global `ThrottlerGuard` (10 req/s default, `app.module.ts`) applies to all routes.

### #8 — Webhook Replay, No Timestamp (`payments.controller.ts`) — OUT OF SCOPE
`POST /api/payments/razorpay/webhook` service handler returns `503 Webhooks not accepted`. On the merits: Razorpay webhooks carry no signed timestamp field, so HMAC-over-raw-body (implemented correctly with `timingSafeEqual` + mandatory secret) is the documented scheme; replay protection belongs in idempotency/dedup, which existed (`paymentId`-level dedup + `Payout` unique constraint).

### #9 — No CSRF Protection (`main.ts`) — DISPUTED, not applicable
Authentication is stateless Bearer JWT (SecureStore/localStorage), not cookie sessions. There are no ambient credentials for a malicious site to ride, so CSRF does not apply. Helmet + explicit CORS allowlist is the correct posture. Action only if cookie auth is ever introduced.

### #10 — Password Reset Token Not Validated (`auth.service.ts`) — ACCEPTED
`resetPassword` passes the client token as a user ID into `updateUserById` with no purpose/expiry binding, and silently succeeds when Supabase is unconfigured. Scheduled fix: random-token flow (stored hash + expiry, verify-before-update). Severity we assess as High (requires knowing a valid user UUID; not unauthenticated RCE).

### #11 — No Structured Logging — ACCEPTED, post-launch
Console + request-ID interceptor only. Adequate for MVP volume; JSON log pipeline scheduled before scale-up.

### #12 — No Connection Pooling — ACCEPTED, post-launch
Schema already carries `directUrl` (pooler intent); single-replica MVP is within limits. Pool sizing (`connection_limit`, PgBouncer) scheduled with multi-replica move.

### #13 — Missing DB Indexes on `Order` — ACCEPTED, scheduled
`Order.userId` has no `@@index` (newer models do). Fix: `@@index([userId])`, `@@index([paymentStatus])`, `@@index([createdAt])`. Cheap migration, queued with #16.

### #14 — No Env Validation — ACCEPTED, scheduled
`|| ''` fallbacks defer failure to request time. Fix: fail-fast startup assertion for required keys.

### #15 — No Backup/DR Strategy — ACCEPTED, post-launch (platform task)
No repo artifact expected — action is enabling Supabase PITR + documenting RTO/RPO. Scheduled before real-money traffic.

### #16 — No Automated Production Migrations — ACCEPTED, scheduled
`Dockerfile`/`railway.toml` start the app without `prisma migrate deploy`. Fix: migrate in release step. Deploy-risk, queued.

### #17 — No Multi-Instance Coordination for Payout Jobs — ACCEPTED, dormant
`processWeeklyPayouts`/`autoSettleVendors` currently have **no callers** (no cron/BullMQ repeat), so duplicate-payout risk is zero today. When scheduling, we will add a distributed lock (or BullMQ repeatable + `jobId` dedup).

### #18 — No Graceful Shutdown — ACCEPTED, scheduled
One-line fix (`enableShutdownHooks`), queued with #16.

### #19 — No Request Timeout — ACCEPTED, scheduled (Low priority)
No timeout interceptor; platform timeouts cover MVP. Queued with hardening.

### #20 — No Secrets Rotation — ACCEPTED, post-launch
No runbook; normal for MVP. Rotation procedure to be documented before handling live payment secrets.

## 4. What we ask from the partner

1. Confirm the commit/branch audited — several "missing" controls exist in current `main` (#4, #6, parts of #3), suggesting a stale snapshot.
2. Re-verify the 5 out-of-scope findings against the disabled endpoints (expect 410/503) and either close them or re-file against the COD-only surface.
3. For any re-filed access-control claim (#6-class), include a reproduction (two accounts, request/response) rather than a hypothetical.

## 5. Change record for this response (uncommitted at time of writing)

* `apps/api/src/auth/auth.service.ts` — OTP endpoints throw `410 Gone`
* `apps/api/src/orders/dto/create-order.dto.ts` — `paymentMethod: ['COD']` only
* `apps/api/src/payments/payments.service.ts` — Razorpay paths throw `503`, dead code removed
* `apps/customer-app/src/screens/cart/CheckoutScreen.tsx` — COD-only, Razorpay flow removed
* `apps/customer-app/src/screens/profile/{WalletScreen,SupportScreen,LegalScreens}.tsx` — copy aligned to COD-only
* Verification: `tsc --noEmit` clean for `apps/api` and `apps/customer-app`.
