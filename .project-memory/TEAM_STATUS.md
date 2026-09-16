# Team Status

## Current State (as of 2026-07-19)
- Git branch: `ashwanth`, fully synced with `origin/main` (HEAD = `75ebc58`)
- Working tree: clean
- Backend: Docker Postgres running, `apps/api` on `:4000`

## Assignments

### Ashwanth (You) — PM + Backend Developer
| Task | Status |
|------|--------|
| Security hardening (Helmet, ThrottlerGuard, JWT secret, OTP) | **IN PROGRESS** |
| User admin endpoints (GET :id, PATCH :id/status) | Pending |
| Admin notification broadcast (POST /notifications) | Pending |
| Reports module (sales + revenue) | Pending |
| Payouts admin oversight (vendors + delivery) | Pending |
| Support module (new Prisma models + CRUD) | Pending |

### Manaswini — Admin Panel
| Page | Backend Endpoint | Status |
|------|-----------------|--------|
| Support | `/support/*` | Blocked (no backend) |
| Reports | `/reports/*` | Blocked (no backend) |
| Payouts | `/payouts/*` | Blocked (no backend) |
| Notifications | `/notifications` (POST) | Blocked (no backend) |
| User Detail | `/users/:id` | Blocked (no backend) |

### Soumya — Vendor Dashboard
| Page | Backend Endpoint | Status |
|------|-----------------|--------|
| Payouts | `/payouts/vendors` | Blocked (no backend) |

### Srinitha — Backend APIs
| Task | Status |
|------|--------|
| Brands, KYC, Sub-categories, Roles, CMS | Done & merged |
| Delivery-partners, Zones, Disputes | Done & merged |

### Harshitha — Backend APIs
| Task | Status |
|------|--------|
| Delivery partners, zones, disputes endpoints | Done & merged |

## Dependencies
- **Manaswini** blocked on: Ashwanth's Phase 2-5
- **Soumya** blocked on: Ashwanth's Phase 5
- **Ashwanth** has zero dependencies on others
