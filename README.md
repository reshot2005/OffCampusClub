# OffCampusClub

Vite + React landing page. Scroll-driven frame sequences load JPEGs from **Cloudflare R2** in production.

## Local dev

```bash
pnpm install
cp .env.example .env.local
# Set VITE_FRAMES_CDN_BASE in .env.local to your public r2.dev URL (optional if frames are in public/)
pnpm dev
```

## Deploy (Vercel)

Set environment variable `VITE_FRAMES_CDN_BASE` to your public R2 URL (no trailing slash). Configure R2 CORS for your Vercel domain.

### Auth requirements

Your `/login` and `/dashboard` use Prisma + JWT, so Vercel also needs:

- `DATABASE_URL` (Postgres connection string for Prisma)
- `JWT_SECRET` (random secret for signing `occ-token`)

# OCC_V2_Mine
