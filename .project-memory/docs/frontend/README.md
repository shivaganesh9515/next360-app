# Frontend Docs

Admin panel and vendor dashboard API client reference.

## API Client (apps/admin-panel/src/lib/api.ts)
- Base URL: `http://localhost:4000/api`
- Unwraps `{ success, data, meta }` envelope automatically
- Auth token from `localStorage.getItem('admin_token')`

## Stale Comments in api.ts
These comments are outdated and should be ignored:
- Line 98: "no /admin/* routes at all besides the two AI ones" — Dashboard route exists
- Line 103: "Neither of these exist on the backend" — GET /users and PATCH /users/:id/role exist
- Line 115: "No generic status endpoint" — PATCH /vendors/:id/status exists
- Line 137: "No approve endpoint" — PATCH /products/:id/approve exists
- Line 206: "no /payouts/* routes exist" — TRUE GAP (backend needed)
- Line 225: "no /reports/* routes exist" — TRUE GAP (backend needed)
- Line 239: "No POST /notifications route" — TRUE GAP (backend needed)

## Pages Blocked by Missing Backend
| Page | Missing Endpoint |
|------|-----------------|
| User Detail | GET /users/:id |
| User Status | PATCH /users/:id/status |
| Notifications Broadcast | POST /notifications |
| Reports Sales | GET /reports/sales |
| Reports Revenue | GET /reports/revenue |
| Payouts Vendors | GET /payouts/vendors |
| Payouts Delivery | GET /payouts/delivery |
| Support Tickets | /support/* (entire module) |
