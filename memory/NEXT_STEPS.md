# Next Steps

> **Last updated:** 2026-08-10
> **Priority:** Run Prisma migration → Deploy API to Railway → Rebuild App → Submit to Play Store

---

## IMMEDIATE: Complete Loyalty Setup + Deploy

### Loyalty Setup (5 min)

| Step | Command | Time |
|------|---------|------|
| 1 | `npx prisma migrate dev --name add-loyalty` | 2 min |
| 2 | Restart API server | 1 min |
| 3 | Test loyalty endpoints | 2 min |

### Deploy to Railway

### Phase 1: Push Code to GitHub

| Step | Command | Time |
|------|---------|------|
| 1 | `git add .` | 1 min |
| 2 | `git commit -m "feat: store compliance fixes + deployment ready"` | 1 min |
| 3 | `git push origin main` | 1 min |

---

### Phase 2: Deploy to Railway

| Step | Action | Time |
|------|--------|------|
| 1 | Go to https://railway.app | 1 min |
| 2 | Sign up with GitHub | 2 min |
| 3 | Click "New Project" | 1 min |
| 4 | Select "Deploy from GitHub repo" | 1 min |
| 5 | Select `next360-app` | 1 min |
| 6 | Wait for build (3-5 min) | 5 min |
| 7 | Add Redis plugin (New → Database → Redis) | 2 min |
| 8 | Add environment variables | 10 min |
| 9 | Get your API URL | 1 min |
| **Total** | | **~25 min** |

---

### Phase 3: Environment Variables

Copy from `apps/api/.env.production.example`:

```env
# Required
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxxxx:password@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require
SUPABASE_URL=https://dwjrflijewoxcopgiwmx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-32-char-hex-secret
REDIS_URL=redis://default:xxx@redis.railway.internal:6379
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Optional
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CORS_ORIGINS=https://next360.com
```

---

### Phase 4: Update App Config

Edit `apps/customer-app/eas.json`:

```json
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://YOUR-RAILWAY-URL/api",
    "EXPO_PUBLIC_SUPABASE_URL": "https://dwjrflijewoxcopgiwmx.supabase.co",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key"
  }
}
```

Do the same for `apps/delivery-app/eas.json`.

---

### Phase 5: Rebuild App

```bash
cd apps/customer-app
npx eas-cli build --platform android --profile production
```

---

### Phase 6: Test on Phone

1. Download AAB from EAS
2. Install on real Android phone
3. Test: Login → Browse → Add to Cart → Checkout

---

### Phase 7: Submit to Play Store

1. Upload new AAB to Play Console
2. Fill Data Safety questionnaire
3. Add privacy policy URL
4. Submit for review

---

## Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Railway (free credit) | $0 | First month |
| Railway (after) | $5-20 | Monthly |
| Supabase (free tier) | $0 | Monthly |
| EAS Build | $0 | Per build |
| Google Play Developer | $25 | One-time |
| **Total to launch** | **$25-45** | First month |

---

## Migration to AWS (Future)

When ready to scale:

| Phase | Platform | Cost | When |
|-------|----------|------|------|
| **Now** | Railway | $0-20/month | Testing & Launch |
| **Later** | AWS (ECS Fargate) | $70-200/month | Scale when revenue comes |

**AWS Migration Steps:**
1. Create AWS account
2. Set up ECS Fargate cluster
3. Same Dockerfile works on AWS
4. Update DNS to point to AWS
5. Monitor for 1 week
6. Decommission Railway

---

## What Google Play Needs

| Requirement | Status | Action |
|-------------|--------|--------|
| Working backend | ❌ Not deployed | Deploy to Railway |
| Privacy policy URL | ❌ Not live | Deploy marketing site |
| Screenshots | ❌ Not captured | Capture on device |
| Data Safety | ❌ Not filled | Fill in Play Console |
| Developer account | ❌ Not created | Pay $25 |

---

## Timeline

| Phase | Duration |
|-------|----------|
| Deploy to Railway | 1 day |
| Update app config | 1 hour |
| Rebuild app | 30 min |
| Test on phone | 1-2 hours |
| Capture screenshots | 1 hour |
| Fill Play Console | 1 hour |
| Submit for review | 3-7 days |
| **Total** | **~1-2 weeks** |

---

## Team Status

| Person | Status | Notes |
|--------|--------|-------|
| **You (Samhith)** | Active | Working on deployment |
| **Abhinaya** | Quit | Sent resignation email |
| **Others** | Unknown | Last seen working on tasks |

---

## Decision: Railway Now, AWS Later

**Why Railway:**
- Free $5 credit
- Never sleeps
- Easy Docker support
- Quick deploy

**When to migrate to AWS:**
- Revenue > $1000/month
- Need more services (Lambda, SQS, etc.)
- Need better compliance
- Need India region for low latency
