# 🚀 Next360 Production Deployment & Play Store Resubmission Guide

**Why the app was rejected:** the submitted AAB had **no backend** — `EXPO_PUBLIC_API_URL`
was never set in the EAS build (`.env` is gitignored and `eas.json` only injected the demo flag),
so the app fell back to `http://localhost:4000/api`, and with demo mode off, **every screen failed**.
Google flagged it as "app isn't functional."

This guide fixes that end-to-end. **The API must be live BEFORE you rebuild the AAB.**

---

## Step 1 — Deploy the NestJS API to Railway

The repo already contains the deployment files you need:

| File | Purpose |
|------|---------|
| `apps/api/Dockerfile` | Multi-stage build (npm workspaces + Prisma client + NestJS) |
| `railway.toml` | Build from the Dockerfile, health-check `/api/health`, auto-restart |
| `.dockerignore` | Keeps the image small and excludes `.env` secrets |
| `apps/api/.env.production.example` | The full environment template |

**Do this:**
1. Make sure this repo is pushed to GitHub (`main` branch).
2. Go to **https://railway.com/new/github** → select the `next360-app` repo.
3. Railway auto-detects `railway.toml` + Dockerfile and deploys.
4. Add a **Redis** plugin: Railway → New → Database → Redis. Copy its URL.
5. Click the service → **Variables** → paste every variable from
   `apps/api/.env.production.example` with real values.
6. Railway injects `PORT` automatically — the code now honors it
   (`API_PORT || PORT || 4000`), so no port config needed.
7. Deploy and wait for the build to finish. Watch the logs for `🚀 Next360 API running`.

> **Alternatives (same Dockerfile works):** **Render** (web service → Docker) or **Fly.io**
> (`fly launch` with the Dockerfile). Render's free tier sleeps after 15 min idle — a sleeping
> API looks "broken" to a Play reviewer, so prefer Railway or a paid Render plan.

## Step 2 — Set the production environment variables

Fill `apps/api/.env.production.example` with real values (paste into Railway Variables):

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` + `DIRECT_URL` | Supabase → Project `dwjrflijewoxcopgiwmx` → Settings → Database → **Connection string** → *Direct connection* (you need the DB password). Use `sslmode=require`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API keys (keep secret — never in the mobile app) |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `REDIS_URL` | From the Railway Redis plugin you just added |
| `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET` | Razorpay Dashboard (live keys for production) |
| `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` | Twilio Console — **required for OTP login** |
| `CORS_ORIGINS` | `https://next360.com,https://admin.next360.com,https://vendor.next360.com` |
| `OPENAI/GEMINI`, `RESEND/SENDGRID`, `SENTRY_DSN` | Optional — can be blank |

## Step 3 — Create the schema + seed data (against Supabase Postgres)

From your machine (once `DATABASE_URL`/`DIRECT_URL` point at Supabase):

```bash
cd apps/api
npx prisma db push --schema ../../prisma/schema.prisma   # or: npx prisma migrate deploy
npm run prisma:seed                                       # demo categories/brands/products
```

Then confirm the API is reachable:
```bash
curl https://YOUR-RAILWAY-URL/api/health     # → {"status":"ok",...}
curl -X POST https://YOUR-RAILWAY-URL/api/auth/send-otp -H 'Content-Type: application/json' -d '{"phone":"9999999999"}'
```
The second call must return a 200 (Twilio sending the OTP). If it errors, fix Twilio env and redeploy.

## Step 4 — Point the mobile apps at the API and rebuild

1. **Replace the API URL placeholder** in BOTH apps:
   - `apps/customer-app/eas.json` → `production.env.EXPO_PUBLIC_API_URL`
   - `apps/delivery-app/eas.json` → `production.env.EXPO_PUBLIC_API_URL`
   Set it to `https://YOUR-RAILWAY-URL/api` (the same value you curled above).
   > The Supabase URL/anon key are already filled in — they're public client keys, safe to commit.
   > Prefer `eas env:create --environment production` over editing eas.json if you don't want them in git.

2. Rebuild the store bundles:
   ```bash
   cd apps/customer-app && npx eas-cli build --platform android --profile production
   cd apps/delivery-app && npx eas-cli build --platform android --profile production
   ```

3. **Smoke-test the AAB before resubmitting** (critical — don't submit blind again):
   - Install on a real phone → sign in with OTP → browse → add to cart → checkout (COD is fine) → place order.
   - If anything fails, fix it and rebuild. A reviewer will do exactly this.

## Step 5 — Get the privacy policy live

Google requires a **publicly reachable** privacy policy URL.

1. The page exists: `apps/marketing/src/app/privacy/page.tsx` (includes account-deletion info ✓).
2. **The whole `apps/marketing/src/` is currently untracked in git** — commit it:
   ```bash
   git add apps/marketing && git commit -m "feat(marketing): deployable site with privacy policy"
   ```
3. Deploy the marketing app (e.g. **Vercel** — `vercel` from `apps/marketing`, or connect the repo).
4. Verify `https://next360.com/privacy` (or your marketing domain) loads in a normal browser.
5. In Play Console → **App content** → **Privacy policy**, enter that exact URL.

## Step 6 — Resubmit

1. Play Console → the rejected app → **App content / Data safety** → confirm everything matches
   (location, phone, payments via Razorpay, target 18+).
2. Upload the new AAB (versionCode auto-increments) with release notes.
3. In the rejection appeal/response, state: *"Backend infrastructure is now live — the app was
   rebuilt against the production API and all core flows (login, catalog, cart, checkout, tracking)
   were verified on a physical device."*
4. Also verify: **Data safety** questionnaire, **Privacy policy** URL, **Target audience 18+**,
   **Financial features** (Razorpay) disclosure.

---

## Checklist (run before you resubmit)

- [ ] `curl https://YOUR-API/api/health` returns `{"status":"ok"}`
- [ ] `POST /api/auth/send-otp` returns 200 (Twilio works)
- [ ] Supabase `prisma db push` done — products/categories visible via `/api/products`
- [ ] `EXPO_PUBLIC_API_URL` replaced in **both** eas.json files
- [ ] New AAB installed on a phone: OTP login → browse → cart → checkout → order placed ✅
- [ ] `https://next360.com/privacy` loads in a browser (marketing site committed + deployed)
- [ ] Privacy policy URL + Data safety + Financial features filled in Play Console
