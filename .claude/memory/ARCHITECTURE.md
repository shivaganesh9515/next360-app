# Architecture

## Monorepo Structure (Turborepo)
```
next360-app/
├── apps/
│   ├── api/                  # NestJS backend (port 4000)
│   │   ├── src/
│   │   │   ├── auth/         # Supabase + JWT + RBAC guards
│   │   │   ├── users/
│   │   │   ├── categories/
│   │   │   ├── products/
│   │   │   ├── cart/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   ├── coupons/
│   │   │   ├── offers/
│   │   │   ├── returns/
│   │   │   ├── reviews/
│   │   │   ├── addresses/
│   │   │   ├── notifications/
│   │   │   ├── ai/
│   │   │   ├── upload/
│   │   │   ├── seed/
│   │   │   └── common/       # filters, interceptors, guards
│   │   └── prisma/
│   ├── customer-app/         # Expo (port 8081)
│   │   ├── src/
│   │   │   ├── components/   # 30+ reusable components
│   │   │   ├── screens/      # ~20 screens
│   │   │   ├── navigation/   # React Navigation config
│   │   │   ├── store/        # Zustand stores
│   │   │   └── lib/          # api.ts, theme.ts, utils
│   │   └── app/              # Expo Router entry
│   ├── delivery-app/         # Expo (port 8082)
│   │   ├── app/              # Expo Router (file-based)
│   │   └── src/              # components, stores, lib
│   ├── vendor-dashboard/     # Next.js (port 3001)
│   │   └── src/app/(dashboard)/  # 25 pages
│   └── admin-panel/          # Next.js (port 3002)
│       └── src/app/(dashboard)/  # 38 pages
├── packages/
│   └── shared/               # Shared types, constants
├── prisma/
│   └── schema.prisma         # 541 lines, 20+ models
└── turbo.json
```

## Data Flow
```
Customer/Vendor/Admin → API (NestJS) → Prisma → Supabase Postgres
                                        ↓
                              Supabase Auth (JWT)
                              Supabase Storage (images)
                              Supabase Realtime (live tracking)
                              Razorpay (payments)
                              OpenAI/Gemini (AI)
```

## Key Schema Pattern — OrderVendorGroup
```
Order → OrderVendorGroup[] → OrderItem[]
                           → DeliveryAssignment (one per group)
```
Each OrderVendorGroup tracks one vendor's fulfillment independently. This is the most critical pattern in the schema.

## Ports
| App | Port |
|-----|------|
| API | 4000 |
| Customer App | 8081 |
| Delivery App | 8082 |
| Vendor Dashboard | 3001 |
| Admin Panel | 3002 |
