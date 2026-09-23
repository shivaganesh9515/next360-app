# Testing

## How to Verify Changes

### Phase 1 — Security Hardening
```bash
# 1. Install helmet
cd apps/api && npm install helmet

# 2. Start API server
cd apps/api && npx nest start

# 3. Verify Helmet headers
curl -I http://localhost:4000/api/health
# Expected: x-content-type-options, x-frame-options, etc. headers present

# 4. Verify rate limiting (ThrottlerGuard)
# Make 11 rapid requests to any endpoint
# Expected: 429 Too Many Requests after 10 requests

# 5. Verify JWT secret (check server startup logs)
# Expected: No fallback warning, server starts cleanly

# 6. Verify OTP randomness
# Check auth.service.ts logs — OTP values should be generated with crypto.randomInt
```

### Phase 2 — User Admin Endpoints
```bash
# Get admin JWT token first
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@next360.com","password":"..."}' | jq -r '.data.access_token')

# Test GET /users/:id
curl http://localhost:4000/api/users/<user-id> \
  -H "Authorization: Bearer $TOKEN"
# Expected: { success: true, data: { id, email, name, role, ... } }

# Test PATCH /users/:id/status
curl -X PATCH http://localhost:4000/api/users/<user-id>/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
# Expected: { success: true, data: { id, isActive: false, ... } }
```

### Phase 3 — Admin Notification Broadcast
```bash
# Test POST /notifications
curl -X POST http://localhost:4000/api/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Broadcast","body":"Hello everyone","targetRole":"CUSTOMER"}'
# Expected: { success: true, data: { message: "Broadcast sent to X users" } }
```

### Phase 4 — Reports Module
```bash
# Test GET /reports/sales
curl "http://localhost:4000/api/reports/sales?startDate=2026-07-01&endDate=2026-07-19" \
  -H "Authorization: Bearer $TOKEN"
# Expected: { success: true, data: { daily: [...], total: {...} } }

# Test GET /reports/revenue
curl "http://localhost:4000/api/reports/revenue?startDate=2026-07-01&endDate=2026-07-19" \
  -H "Authorization: Bearer $TOKEN"
# Expected: { success: true, data: { daily: [...], summary: {...} } }
```

### Phase 5 — Payouts Admin Oversight
```bash
# Test GET /payouts/vendors
curl "http://localhost:4000/api/payouts/vendors?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
# Expected: { success: true, data: [...], meta: { page, limit, total, totalPages } }

# Test GET /payouts/delivery
curl "http://localhost:4000/api/payouts/delivery?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
# Expected: { success: true, data: [...], meta: { page, limit, total, totalPages } }
```

### Phase 6 — Support Module
```bash
# Test POST /support/tickets (customer)
curl -X POST http://localhost:4000/api/support/tickets \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Order issue","description":"My order was not delivered"}'
# Expected: { success: true, data: { id, subject, status: "OPEN", ... } }

# Test GET /support/tickets/admin (admin)
curl http://localhost:4000/api/support/tickets/admin \
  -H "Authorization: Bearer $TOKEN"
# Expected: { success: true, data: [...], meta: {...} }
```

## Regression Check
After each phase, verify:
```bash
# 1. Server starts without errors
cd apps/api && npx nest start

# 2. Health check passes
curl http://localhost:4000/api/health

# 3. Existing auth still works
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@next360.com","password":"..."}'

# 4. Dashboard still loads
curl http://localhost:4000/api/admin/dashboard \
  -H "Authorization: Bearer $TOKEN"
```
