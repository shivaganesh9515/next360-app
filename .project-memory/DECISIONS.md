# Decisions

## Architecture Decisions
| Decision | Rationale |
|----------|-----------|
| Reuse existing files over creating new modules where possible | Minimizes teammate conflicts, follows existing patterns |
| New modules for Reports, PayoutsAdmin, Support | These are new feature areas with no existing module to extend |
| Use AuditService.log() for all admin mutations | Existing pattern (AdminModule already does this for settings) |
| Keep ResponseInterceptor envelope format | All frontend clients already unwrap `{ success, data, meta }` |
| ThrottlerGuard uses IP tracking (`req.ip`) | Already implemented in common/guards/throttler.guard.ts |

## Task Decisions
| Decision | Rationale |
|----------|-----------|
| PATCH /vendors/:id/status already exists — skip implementation | vendors.service.ts:updateStatus() handles APPROVED/REJECTED/SUSPENDED |
| PATCH /products/:id/approve already exists — skip implementation | products.controller.ts:51 already has this route |
| Support module needs Prisma migration — schedule last | Avoids schema conflicts during team merge windows |
| Security hardening first (Phase 1) | Zero risk, highest security value, no teammate impact |

## File Decisions
| Decision | Rationale |
|----------|-----------|
| New DTO files for each new endpoint | Follows existing DTO pattern (class-validator) |
| New module directories for Reports, PayoutsAdmin, Support | NestJS convention: module/controller/service per feature |
| No changes to frontend code | Backend-only tasks, frontend already has API calls ready |
