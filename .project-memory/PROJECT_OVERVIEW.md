# Project Overview

## What
Multi-vendor organic/natural/eco-friendly marketplace — 3 storefronts (Organic, Natural, Eco-friendly).
136 screens across 4 apps + NestJS backend. 3-person team, 3-month delivery.

## Team
| Person | Role | Platform |
|--------|------|----------|
| **Ashwanth** | PM/Coordinator + Backend Developer (Admin Endpoints + Security + Support) | NestJS API |
| Soumya | Vendor Dashboard | Next.js (port 3001) |
| Manaswini | Admin Panel | Next.js (port 3002) |
| Srinitha | Backend APIs (brands, kyc, sub-categories, roles, cms) | NestJS API |
| Harshitha | Backend APIs (delivery-partners, zones, disputes) | NestJS API |

## Tech Stack
- **Backend:** NestJS v10+, Prisma v5+, Supabase Postgres, Supabase Auth, Passport JWT
- **Payments:** Razorpay (India-focused, INR)
- **Customer App:** Expo (React Native), React Navigation, Zustand, SecureStore
- **Vendor Dashboard:** Next.js 14 App Router, shadcn/ui, Tailwind CSS
- **Admin Panel:** Next.js 14 App Router, shadcn/ui, Tailwind CSS
- **Monorepo:** Turborepo with `apps/*` and `packages/*`

## Ports
| Service | Port |
|---------|------|
| API | 4000 |
| Vendor Dashboard | 3001 |
| Admin Panel | 3002 |
| Marketing Site | 3100 |
| Customer App (Expo) | 8081 |
| Delivery App (Expo) | 8082 |

## Key Conventions
- All API responses wrapped in `{ success, data, meta }` envelope
- All errors go through `GlobalExceptionFilter` (consistent format)
- Auth tokens stored in SecureStore (Expo) / localStorage (Next.js)
- `whitelist: true` + `forbidNonWhitelisted: true` on all DTOs
- Admin routes: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`
- Every admin mutation must call `AuditService.log()`
