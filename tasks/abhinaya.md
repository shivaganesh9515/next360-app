# Abhinaya — Backend: brands / kyc / sub-categories / roles / cms

Area: `apps/api`. Prisma models for all of these already exist in `prisma/schema.prisma` — you're building the NestJS module layer on top, not the schema.

## Tasks

- [x] ~~**Fix `apps/api/package.json`**~~ — done 2026-07-15 (closed opportunistically while wiring up phone-OTP auth, see below). `@nestjs/jwt`, `@nestjs/mapped-types`, `@nestjs/passport`, `passport`, `passport-jwt`, `@supabase/supabase-js`, `class-validator`, `class-transformer`, `dotenv`, `multer` + their `@types` all added, verified via `npx nest build`.

- [x] ~~**Bonus, not originally yours: phone-OTP auth**~~ — done 2026-07-15. Customer-app's login is now Zomato-style phone+OTP (no email/password). Added `POST /auth/send-otp` + `POST /auth/verify-otp-login` in `apps/api/src/auth`, `User.phone` is now `@unique`, `User.email` is now optional. See `.claude/memory/STATUS.md` for full detail. Mentioning here so you don't duplicate it — vendor/admin's original email+password `login`/`signup` endpoints are untouched.

- [ ] **`brands/` module** — DTOs already exist under `apps/api/src/brands/dto/`, but there's no controller/service/module, and it's not registered in `app.module.ts`. CRUD with `storeType` filter, per CLAUDE.md's module list.

- [ ] **`kyc/` module** — Prisma has a `KYC` model, no module exists. Needs: submit (documents), get status, verify (admin-only, per `@Roles()` guard pattern used elsewhere).

- [ ] **`sub-categories/` module** — Prisma has `SubCategory`, no module exists. CRUD nested under `categories/` (follow the pattern already used by `categories/`).

- [ ] **`roles/` module** — Prisma has `Role` and `Permission`, no module exists. CRUD roles with JSON permissions, CRUD permissions. Admin panel already has a `roles` screen calling this.

- [ ] **`cms/` module** — Prisma has `CMS_Page` and `Banner`, no module exists. CRUD pages, CRUD banners. Note: customer-app's Home hero banner is currently hardcoded placeholder data specifically because this endpoint doesn't exist — closing this unblocks that gap too.

## Reference

- Response envelope format, Prisma error → HTTP mapping, and `@Roles()` RBAC pattern: see root `CLAUDE.md`.
- Follow the existing module structure (e.g. `categories/`, `vendors/`) for controller/service/DTO conventions rather than inventing a new pattern.
