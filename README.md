# Toxic PGA One & Done (Starter)

Mobile-first, dark UI fantasy one-and-done app. Next.js (App Router) + Supabase + Prisma.

## What works now
- Auth page (email magic link) with invite code gate
- Dark theme scaffolding (home, pick, leaderboard, me, admin)
- Prisma schema + starter SQL for Supabase
- API stubs for results ingestion and picks

## Zero-config Vercel Preview (no Supabase)
If you just want to click around the UI without wiring a database yet:

1. Push this repo to GitHub (or upload it when importing to Vercel).
2. In Vercel → Project → **Environment Variables**, add:
   - `PREVIEW_MODE=1`
3. Deploy. Auth is bypassed and pages use mocked data.

## Setup (database, when ready)
1. Create Supabase project; copy URL and anon/service keys.
2. Add `.env.local` from `.env.example`; set `DATABASE_URL`.
3. `npm i` then `npm run db:push`.
4. Run `npm run dev` to develop locally.

Generated 2025-08-08T08:48:41.965851 UTC.
