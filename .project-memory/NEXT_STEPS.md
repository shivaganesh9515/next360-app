# Next Steps

## Immediate
1. Run Prisma migration when database is available:
   ```bash
   cd prisma && npx prisma migrate dev --name add-support-ticket
   ```
2. Verify all endpoints with live backend
3. Clean up stale comments in `apps/admin-panel/src/lib/api.ts`
4. Commit all changes

## After Commit
- Manaswini can test: user detail, notifications, reports, payouts pages
- Soumya can test: payouts page
- All 7 admin panel pages should now work against live backend
