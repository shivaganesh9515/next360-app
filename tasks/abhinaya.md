# Abhinaya — Backend: brands / kyc / sub-categories / roles / cms

Area: `apps/api`. Prisma models for all of these already exist in `prisma/schema.prisma` — you're building the NestJS module layer on top, not the schema.

## Tasks

- [x] **Fix `apps/api/package.json`** — a fresh `npm install` + build currently fails. Add missing deps actually imported in `src/`:
  - `@nestjs/jwt`, `@nestjs/mapped-types`, `@nestjs/passport`, `passport-jwt`
  - `@supabase/supabase-js`
  - `class-validator`, `class-transformer`
  - `dotenv`, `multer`
  - Do this first — it blocks everyone else's local builds too.

- [x] **`brands/` module** — DTOs already exist under `apps/api/src/brands/dto/`, but there's no controller/service/module, and it's not registered in `app.module.ts`. CRUD with `storeType` filter, per CLAUDE.md's module list.

- [x] **`kyc/` module** — Prisma has a `KYC` model, no module exists. Needs: submit (documents), get status, verify (admin-only, per `@Roles()` guard pattern used elsewhere).

- [x] **`sub-categories/` module** — Prisma has `SubCategory`, no module exists. CRUD nested under `categories/` (follow the pattern already used by `categories/`).

- [x] **`roles/` module** — Prisma has `Role` and `Permission`, no module exists. CRUD roles with JSON permissions, CRUD permissions. Admin panel already has a `roles` screen calling this.

- [x] **`cms/` module** — Prisma has `CMS_Page` and `Banner`, no module exists. CRUD pages, CRUD banners. Note: customer-app's Home hero banner is currently hardcoded placeholder data specifically because this endpoint doesn't exist — closing this unblocks that gap too.

## Reference

- Response envelope format, Prisma error → HTTP mapping, and `@Roles()` RBAC pattern: see root `CLAUDE.md`.
- Follow the existing module structure (e.g. `categories/`, `vendors/`) for controller/service/DTO conventions rather than inventing a new pattern.
