---
phase: 02-auth
plan: 02
type: execute
wave: 2
depends_on:
  - 01-foundation-01
files_modified:
  - apps/api/src/auth/auth.module.ts
  - apps/api/src/auth/auth.controller.ts
  - apps/api/src/auth/auth.service.ts
  - apps/api/src/auth/guards/jwt-auth.guard.ts
  - apps/api/src/auth/guards/roles.guard.ts
  - apps/api/src/auth/decorators/roles.decorator.ts
  - apps/api/src/auth/decorators/current-user.decorator.ts
  - apps/api/src/auth/strategies/jwt.strategy.ts
  - apps/api/src/auth/dto/*.ts
  - apps/api/src/users/users.module.ts
  - apps/api/src/users/users.controller.ts
  - apps/api/src/users/users.service.ts
  - apps/api/src/app.module.ts
autonomous: false
requirements:
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04
  - AUTH-05
  - AUTH-06
  - AUTH-07
  - AUTH-08
  - AUTH-09
must_haves:
  truths:
    - "User can sign up and receive verification email/OTP via Supabase"
    - "User can log in and receive a JWT"
    - "NestJS validates JWT on protected routes"
    - "Each endpoint enforces correct role (customer, vendor, delivery, admin)"
    - "User can view and update their profile"
  artifacts:
    - path: "apps/api/src/auth/auth.module.ts"
      provides: "Auth module registration"
      contains: "AuthModule"
    - path: "apps/api/src/auth/guards/jwt-auth.guard.ts"
      provides: "JWT validation guard"
      contains: "canActivate"
    - path: "apps/api/src/auth/guards/roles.guard.ts"
      provides: "Role-based access guard"
      contains: "roles"
  key_links:
    - from: "apps/api/src/auth/auth.service.ts"
      to: "supabase"
      via: "createClient"
    - from: "apps/api/src/auth/guards/jwt-auth.guard.ts"
      to: "apps/api/src/auth/strategies/jwt.strategy.ts"
      via: "validate"
    - from: "apps/api/src/app.module.ts"
      to: "apps/api/src/auth/auth.module.ts"
      via: "imports"
---

<objective>
Implement full authentication system with Supabase Auth, NestJS JWT validation, multi-role RBAC, OTP verification, forgot password, KYC document upload, and user profile management.

Purpose: Secure all API endpoints by role — customers, vendors, delivery partners, and admins each have distinct access. Enable KYC verification for vendors and delivery partners.
Output: Auth module with guards, decorators, JWT strategy, OTP flows, forgot password, KYC module, user CRUD, and role enforcement.
</objective>

<execution_context>
@C:/Users/gunny/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/gunny/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-foundation-01-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Auth module — Supabase integration + JWT strategy + guards</name>
  <files>
    apps/api/src/auth/auth.module.ts
    apps/api/src/auth/auth.controller.ts
    apps/api/src/auth/auth.service.ts
    apps/api/src/auth/strategies/jwt.strategy.ts
    apps/api/src/auth/guards/jwt-auth.guard.ts
    apps/api/src/auth/guards/roles.guard.ts
    apps/api/src/auth/decorators/roles.decorator.ts
    apps/api/src/auth/decorators/current-user.decorator.ts
    apps/api/src/auth/dto/signup.dto.ts
    apps/api/src/auth/dto/login.dto.ts
  </files>
  <action>
    Create the auth module with Supabase Auth integration:

    1. Install dependencies:
       - @nestjs/passport, @nestjs/jwt, passport, passport-jwt
       - @supabase/supabase-js

    2. Create auth.module.ts:
       - Imports PassportModule, JwtModule.register({ secret: from env, signOptions: { expiresIn: '7d' }})
       - Providers: AuthService, JwtStrategy
       - Controllers: AuthController
       - Exports: AuthService
       - Global guard setup for RolesGuard

    3. Create jwt.strategy.ts:
       - Extends PassportStrategy
       - Extracts JWT from Authorization Bearer header
       - Validates token using Supabase admin client (supabase.auth.getUser())
       - Returns user payload with id, email, role from DB
       - Use @nestjs/passport's PassportStrategy

    4. Create jwt-auth.guard.ts:
       - Extends AuthGuard('jwt') from @nestjs/passport
       - Override handleRequest to throw proper HTTP exceptions

    5. Create roles.guard.ts:
       - Implements CanActivate
       - Reads metadata from @Roles() decorator
       - Compares user.role against allowed roles
       - Returns true/false, throws ForbiddenException if denied
       - If no roles metadata set, allow access (public)

    6. Create roles.decorator.ts:
       - SetMetadata wrapper for role names
       - Usage: @Roles(UserRole.ADMIN, UserRole.VENDOR)

    7. Create current-user.decorator.ts:
       - Custom parameter decorator extracting user from request
       - Usage: @CurrentUser() user: UserPayload

    8. Create DTOs:
       - SignupDto: email (email), password (min 8), name (optional), phone (optional), role (enum, defaults to CUSTOMER)
       - LoginDto: email, password
       - VerifyOtpDto: phone/email, otp (string, length 6)
       - ForgotPasswordDto: email
       - ResetPasswordDto: token, newPassword
       - KycSubmitDto: documentType, documentNumber, documentUrl

    9. Create auth.service.ts with methods:
       - signup(dto): calls supabase.auth.signUp(), creates User record in DB via Prisma, returns user + session
       - login(dto): calls supabase.auth.signInWithPassword(), returns session + user
       - validateUser(userId): fetches user from Prisma by id
       - getProfile(userId): full user profile with addresses
       - verifyOtp(dto): verifies OTP via Supabase, marks phone/email as verified
       - forgotPassword(dto): sends password reset email via Supabase
       - resetPassword(dto): resets password via Supabase

    10. Create auth.controller.ts with endpoints:
        - POST /auth/signup — public, creates account
        - POST /auth/login — public, returns JWT + user
        - GET /auth/me — protected, returns current user profile
        - POST /auth/logout — protected, invalidates session
        - POST /auth/verify-otp — public, verify OTP
        - POST /auth/forgot-password — public, send reset email
        - POST /auth/reset-password — public, reset password with token

    11. Register AuthModule in app.module.ts
  </action>
  <verify>
    Run `node -e "console.log(require('fs').existsSync('apps/api/src/auth/auth.module.ts'))"` — confirms file exists.
    Check auth.controller.ts has at least 4 endpoint handlers (signup, login, me, logout).
    Check jwt.strategy.ts imports from '@nestjs/passport' and '@nestjs/jwt'.
  </verify>
  <done>
    Auth module with Supabase integration, JWT validation, role-based guards, and decorators is complete.
  </done>
</task>

<task type="auto">
  <name>Task 2: Users module — profile CRUD + admin user management</name>
  <files>
    apps/api/src/users/users.module.ts
    apps/api/src/users/users.controller.ts
    apps/api/src/users/users.service.ts
    apps/api/src/users/dto/update-profile.dto.ts
  </files>
  <action>
    Create Users module for profile management:

    1. Create users.module.ts with PrismaService import

    2. Create users.service.ts with methods:
       - findById(id) — full user with addresses
       - findByEmail(email)
       - updateProfile(userId, dto) — update name, phone, avatarUrl
       - findAll(filters) — admin only, with pagination
       - updateRole(userId, role) — admin only

    3. Create users.controller.ts with endpoints:
        - GET /users/me — returns current user profile (protected)
        - PATCH /users/me — update own profile
        - GET /users — admin only, list all users with pagination
        - PATCH /users/:id/role — admin only, change user role

    4. Create UpdateProfileDto: name (optional), phone (optional), avatarUrl (optional)

    5. All endpoints use @CurrentUser() decorator to get the authenticated user
    6. Admin endpoints use @Roles(UserRole.ADMIN) guard
  </action>
  <verify>
    Check users.controller.ts has GET /users/me, PATCH /users/me, GET /users, PATCH /users/:id/role.
    Verify @Roles decorator is applied to admin endpoints.
  </verify>
  <done>
    Users module with profile CRUD and admin management is complete.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Auth system (Supabase + JWT + RBAC) + Users module</what-built>
  <how-to-verify>
    1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
    2. Start NestJS: `cd apps/api && npx nest start --watch`
    3. Test signup:
       ```
       curl -X POST http://localhost:4000/auth/signup \
         -H "Content-Type: application/json" \
         -d '{"email":"test@example.com","password":"test1234","name":"Test User"}'
       ```
       Expect: 201 with user object + access_token

    4. Test login:
       ```
       curl -X POST http://localhost:4000/auth/login \
         -H "Content-Type: application/json" \
         -d '{"email":"test@example.com","password":"test1234"}'
       ```
       Expect: 200 with user + JWT

    5. Test /auth/me with token:
       ```
       curl http://localhost:4000/auth/me \
         -H "Authorization: Bearer <token>"
       ```
       Expect: 200 with user profile

    6. Test role guard:
       ```
       curl http://localhost:4000/users \
         -H "Authorization: Bearer <customer_token>"
       ```
       Expect: 403 Forbidden (customer cannot list users)
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
1. POST /auth/signup creates user in Supabase Auth + User table in DB
2. POST /auth/login returns JWT
3. GET /auth/me returns authenticated user
4. Role guard blocks unauthorized access (403)
5. Users module CRUD works correctly
</verification>

<success_criteria>
- Signup → login → authenticated request cycle works end-to-end
- Role guards correctly enforce permissions (customers can't access admin routes)
- Profile update works
- Ready for Phase 3 (Core API)
</success_criteria>

<output>
After completion, create `.planning/phases/02-auth/02-auth-02-SUMMARY.md`
</output>
