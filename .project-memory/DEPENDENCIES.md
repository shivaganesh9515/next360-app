# Dependencies

## Backend (apps/api)
| Package | Purpose | Status |
|---------|---------|--------|
| @nestjs/core | NestJS framework | Installed |
| @nestjs/common | NestJS common utilities | Installed |
| @nestjs/passport | Passport integration | Installed |
| @nestjs/throttler | Rate limiting | Installed (guard exists, not applied) |
| @prisma/client | Prisma ORM client | Installed |
| passport-jwt | JWT strategy | Installed |
| class-validator | DTO validation | Installed |
| class-transformer | DTO transformation | Installed |
| uuid | Request ID generation | Installed |
| dotenv | Environment variables | Installed |
| helmet | HTTP security headers | **NOT INSTALLED** (needs install) |

## External Services
| Service | Purpose | Status |
|---------|---------|--------|
| Supabase Postgres | Database | Connected |
| Supabase Auth | Authentication | Used for phone OTP |
| Supabase Storage | File uploads | Used for images |
| Razorpay | Payments | Integrated |
| Expo Push API | Push notifications | Integrated |
| OpenAI / Gemini | AI features | Integrated (on hold) |

## NPM Install Commands Needed
```bash
# Phase 1: Security
cd apps/api && npm install helmet
```
