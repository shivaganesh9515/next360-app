# Next360 - Project Context

> **Last updated:** 2026-07-20

## Overview

**What:** Multi-vendor organic/natural/eco-friendly marketplace platform
**Scope:** 136 screens across 4 apps + NestJS backend API
**Team:** 6 people (3 backend, 2 frontend, 1 PM/coordinator)
**Timeline:** 3-month delivery (all 12 phases complete)
**Status:** UI fully built across all apps. 25 of ~30 backend modules implemented.

## What It Does

Next360 is an organic/natural/eco-friendly marketplace with 3 themed storefronts:
- **Organic** (moss green #5C6B4D) - organic food and products
- **Natural** (clay brown #9B6A3F) - natural wellness items
- **Eco-Friendly** (eucalyptus #2F5D62) - sustainable goods

Key features: multi-vendor support (Swiggy/Zomato split model), zone-gated launch (Hyderabad + Vijayawada), real-time delivery tracking, Razorpay payments with Route-based vendor payouts, AI assistant/scanner/recommendations.

## Tech Stack

### Backend
- **Framework:** NestJS v11 (Express) on :4000
- **Database:** Supabase Postgres via Prisma v6 ORM
- **Auth:** Supabase Auth + Passport JWT + OTP + RBAC (@Roles())
- **Payments:** Razorpay (India, INR, Route for vendor splits)
- **Storage:** Supabase Storage (product images, KYC docs)
- **Real-time:** Supabase Realtime (delivery tracking)
- **AI:** OpenAI / Gemini API (chat, scanner, recommendations, health)
- **Push:** Expo Push API (notifications)

### Frontend (Mobile)
- **Customer App:** Expo SDK 56, React Navigation, Zustand, @gorhom/bottom-sheet
- **Delivery App:** Expo SDK 56, Expo Router (file-based), Zustand

### Frontend (Web)
- **Vendor Dashboard:** Next.js 14, App Router, Tailwind CSS, recharts, lucide-react
- **Admin Panel:** Next.js 14, App Router, Tailwind CSS, shadcn/ui (pending), lucide-react

### Shared
- packages/shared/ - Types, constants, utilities
- packages/eslint-config/ - ESLint config
- packages/tsconfig/ - TypeScript configs

## Architecture

Customer/Vendor/Admin -> API (NestJS :4000) -> Prisma ORM -> Supabase Postgres
                                               |
                                     Supabase Auth (JWT)
                                     Supabase Storage (images)
                                     Supabase Realtime (tracking)
                                     Razorpay (payments)
                                     OpenAI/Gemini (AI)

### Database Pattern - OrderVendorGroup

Order -> OrderVendorGroup[] (one per vendor) -> OrderItem[] -> DeliveryAssignment

Each group tracks one vendor's fulfillment independently. This is the critical schema pattern.

## Backend Flow

Request -> ThrottlerGuard -> JwtAuthGuard -> RolesGuard -> Controller -> Service -> PrismaService
Errors flow through GlobalExceptionFilter (Prisma errors mapped to HTTP).
Responses wrapped by ResponseInterceptor in { success, data, meta } envelope.

## Frontend Flow

**Customer App:** React Navigation (stack + tabs), floating pill bottom nav (4 items), bottom sheet for PDP, Zustand for state, SecureStore for tokens.
**Delivery App:** Expo Router, sans-only design, one action per screen, map-first active delivery.
**Web Apps:** Next.js App Router, sidebar layout, text-first fetch pattern in api.ts.

## Ports

| App | Port |
|-----|------|
| API (NestJS) | 4000 |
| Customer App (Expo) | 8081 |
| Delivery App (Expo) | 8082 |
| Vendor Dashboard (Next.js) | 3001 |
| Admin Panel (Next.js) | 3002 |
