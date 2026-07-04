# Coding Conventions

## API Response Format (enforced by ResponseInterceptor)
```json
// Success
{ "success": true, "data": { ... }, "meta": { "timestamp": "...", "requestId": "uuid" } }
// Paginated
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
// Error
{ "statusCode": 400, "message": "Validation failed", "error": "BAD_REQUEST", "timestamp": "...", "path": "/api/products", "requestId": "uuid" }
```

## Prisma → HTTP Error Mapping
| Prisma | HTTP | Meaning |
|--------|------|---------|
| P2002 | 409 | Duplicate (email, phone, coupon code) |
| P2025 | 404 | Record not found |
| P2003 | 400 | Foreign key violation |

## API Client Pattern (Frontend)
Both `adminApi` and `vendorApi` use:
```ts
const response = await fetch(url, options);
const text = await response.text();
const data = JSON.parse(text); // prevents HTML error pages crashing
```
**Never** use `response.json()` — HTML error responses crash it.

## Auth Pattern
- **Mobile (Expo):** Tokens in `expo-secure-store`, attached via `Authorization: Bearer <token>`
- **Web (Next.js):** Tokens in `localStorage`, attached via fetch interceptor
- **Backend:** Supabase Auth + NestJS JWT + `@Roles()` decorator for RBAC

## State Management
- **Zustand** for all frontend state (no Redux)
- **expo-secure-store** for auth tokens
- **localStorage** for web auth tokens

## Styling
- **Mobile:** StyleSheet.create, design tokens from `src/lib/theme.ts`
- **Web:** Tailwind CSS + shadcn/ui components
- **Admin:** `slate-*` palette (blue-gray) — not `gray-*`
- **Delivery:** green (#10B981) branding, sans-only (no Fraunces)

## Naming
- **Files:** kebab-case (`order-detail.tsx`)
- **Components:** PascalCase (`OrderDetail`)
- **API routes:** kebab-case (`/api/delivery-partners`)
- **Prisma models:** PascalCase, singular (`OrderVendorGroup`)
- **DB tables:** snake_case, plural (`order_vendor_groups`)

## Ports
| App | Port |
|-----|------|
| API | 4000 |
| Customer App | 8081 |
| Delivery App | 8082 |
| Vendor Dashboard | 3001 |
| Admin Panel | 3002 |
