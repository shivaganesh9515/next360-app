# Known Issues

## Critical
| Issue | File | Line | Impact |
|-------|------|------|--------|
| JWT secret hardcoded fallback `'next360-dev-secret'` | auth.module.ts | 15 | Security risk in production |
| OTP generated with Math.random() (not cryptographically secure) | auth.service.ts | 140 | OTP predictable |
| OTP generated with Math.random() (not cryptographically secure) | delivery.service.ts | 13 | OTP predictable |
| No Helmet (HTTP security headers missing) | main.ts | — | Security headers missing |
| ThrottlerGuard not registered as APP_GUARD | app.module.ts | — | Rate limiting not enforced |

## Medium
| Issue | File | Line | Impact |
|-------|------|------|--------|
| Stale comment: "no /admin/* routes at all besides the two AI ones" | api.ts (admin-panel) | 98 | Misleading, routes exist now |
| Stale comment: "Neither of these exist on the backend" | api.ts (admin-panel) | 103 | Misleading, GET /users and PATCH /users/:id/role exist |
| Stale comment: "No generic status endpoint" for vendors | api.ts (admin-panel) | 115 | Misleading, PATCH /vendors/:id/status exists |
| Stale comment: "No approve endpoint" for products | api.ts (admin-panel) | 137 | Misleading, PATCH /products/:id/approve exists |
| Stale comment: "no /payouts/* routes exist" | api.ts (admin-panel) | 206 | True gap, not just stale |

## Low
| Issue | File | Line | Impact |
|-------|------|------|--------|
| CLAUDE.md references deleted `.claude/memory/STATUS.md` | CLAUDE.md | — | Dead path, misleading |
| CLAUDE.md task division dated 2026-07-16 (outdated) | CLAUDE.md | — | Stale info |
