# Security

## Current Posture
| Item | Status | Risk |
|------|--------|------|
| Helmet (HTTP security headers) | **NOT INSTALLED** | Medium |
| ThrottlerGuard (rate limiting) | Guard exists, **NOT registered as APP_GUARD** | Medium |
| JWT secret hardcoded fallback | `'next360-dev-secret'` in `auth.module.ts:15` | High |
| OTP generation uses Math.random() | `auth.service.ts:140` + `delivery.service.ts:13` | High |
| ValidationPipe whitelist | Enabled (`whitelist: true, forbidNonWhitelisted: true`) | OK |
| CORS | Configured for localhost:3001, localhost:3002 | OK |
| Global exception filter | Handles Prisma errors, no stack traces to client | OK |
| Audit logging | Admin actions logged via AuditService | OK |
| RBAC | JwtAuthGuard + RolesGuard on all admin routes | OK |

## Fixes Required (Phase 1)
1. **Helmet:** `npm install helmet`, add `app.use(helmet())` in `main.ts`
2. **ThrottlerGuard:** Add `APP_GUARD` provider in `app.module.ts`
3. **JWT secret:** Remove fallback, require env var, throw if missing
4. **OTP:** Replace `Math.random()` with `crypto.randomInt()`

## Files to Modify
| File | Change |
|------|--------|
| `apps/api/src/main.ts` | Add helmet import + `app.use(helmet())` |
| `apps/api/src/app.module.ts` | Add `APP_GUARD` for ThrottlerGuard |
| `apps/api/src/auth/auth.module.ts` | Remove `fallback: 'next360-dev-secret'` |
| `apps/api/src/auth/auth.service.ts` | `Math.random()` → `crypto.randomInt()` |
| `apps/api/src/delivery/delivery.service.ts` | `Math.random()` → `crypto.randomInt()` |
