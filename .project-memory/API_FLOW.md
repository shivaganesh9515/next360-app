# API Flow

## Base URL
```
http://localhost:4000/api
```

## Response Envelope
All responses wrapped by `ResponseInterceptor`:
```json
// Success
{ "success": true, "data": { ... }, "meta": { "timestamp": "...", "requestId": "uuid" } }

// Paginated
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }

// Error
{ "statusCode": 400, "message": "Validation failed", "error": "BAD_REQUEST", "timestamp": "...", "path": "/api/products", "requestId": "uuid" }
```

## Auth Headers
```
Authorization: Bearer <jwt_token>
```

## Admin-Only Routes Pattern
```typescript
@Get('some-route')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async someMethod() { ... }
```

## Key Endpoints

### Auth
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | /auth/signup | None | Register (email+password) |
| POST | /auth/login | None | Login (email+password) |
| POST | /auth/send-otp | None | Send phone OTP |
| POST | /auth/verify-otp-login | None | Verify OTP + login |
| GET | /auth/me | JWT | Current user |

### Users
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | /users/me | JWT | Own profile |
| PATCH | /users/me | JWT | Update own profile |
| GET | /users | ADMIN | List all users (paginated) |
| PATCH | /users/:id/role | ADMIN | Update user role |
| GET | /users/:id | ADMIN | **MISSING** — user detail |
| PATCH | /users/:id/status | ADMIN | **MISSING** — activate/deactivate |

### Vendors
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | /vendors/register | JWT | Register vendor |
| GET | /vendors | ADMIN | List vendors |
| GET | /vendors/:id | ADMIN | Vendor detail |
| GET | /vendors/:id/detail | ADMIN | Vendor detail (enriched) |
| PATCH | /vendors/:id/approve | ADMIN | Approve vendor |
| PATCH | /vendors/:id/status | ADMIN | Update status (APPROVED/REJECTED/SUSPENDED) |

### Notifications
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | /notifications | JWT | List own notifications |
| GET | /notifications/unread-count | JWT | Unread count |
| PATCH | /notifications/:id/read | JWT | Mark as read |
| PATCH | /notifications/read-all | JWT | Mark all as read |
| POST | /notifications/register | JWT | Register push token |
| DELETE | /notifications/unregister | JWT | Unregister push token |
| GET | /notifications/tokens | ADMIN | Get all push tokens |
| POST | /notifications | ADMIN | **MISSING** — broadcast to role/all |

### Reports (MISSING)
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | /reports/sales | ADMIN | **MISSING** — daily sales report |
| GET | /reports/revenue | ADMIN | **MISSING** — revenue report |

### Payouts Admin (MISSING)
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | /payouts/vendors | ADMIN | **MISSING** — all vendor payouts |
| GET | /payouts/delivery | ADMIN | **MISSING** — all delivery payouts |

### Support (MISSING — needs Prisma models)
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | /support/tickets | JWT | Create ticket |
| GET | /support/tickets | JWT | List own tickets |
| GET | /support/tickets/:id | JWT | Ticket detail |
| POST | /support/tickets/:id/messages | JWT | Add message |
| GET | /support/tickets/admin | ADMIN | List all tickets |
| PATCH | /support/tickets/:id/status | ADMIN | Update status |
