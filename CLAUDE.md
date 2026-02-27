# SwixAI Dashboard – Claude Instructions

## Project Overview
SwixAI Voice Agent SaaS Dashboard. Next.js App Router project with Supabase (PostgreSQL), Prisma, NextAuth, and Stripe.

## Tech Stack
- **Next.js 16.1.6** with Turbopack (App Router)
- **Tailwind v4** – CSS-based config via `@import "tailwindcss"` in globals.css. No `tailwind.config.js` exists.
- **Prisma 7.4.1** – Driver Adapter pattern (NOT standard PrismaClient)
- **Zod 4.x** – use `.issues` not `.errors`
- **NextAuth v4.24.x**
- **Stripe** for billing/top-ups

## Prisma Rules (CRITICAL)
- Client is generated to `app/generated/prisma/` — NOT `node_modules`
- Import path: `@/app/generated/prisma/client` (NEVER `@prisma/client`)
- Requires Driver Adapter — always use this pattern in `lib/db.ts`:
  ```typescript
  import { PrismaClient } from "@/app/generated/prisma/client";
  import { PrismaPg } from "@prisma/adapter-pg";
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  ```
- After schema changes: run `npm run db:generate`

## Database (Supabase)
- Project ref: `imufbgahggkwhclhbzcc` (eu-west-1)
- **Always use Session Pooler port 5432** for Prisma — NEVER direct connection, NEVER Transaction Pooler (6543)
- Pooler host: `aws-1-eu-west-1.pooler.supabase.com`
- Username format: `postgres.imufbgahggkwhclhbzcc`
- Transaction Pooler (6543) hangs on `db:push` — do not use it

## Route Structure
- `/login`, `/signup` → `app/(auth)/...`
- `/app/*` → `app/(customer)/app/...` (protected)
- `/admin/*` → `app/(admin)/admin/...` (admin-only)

## Build Commands
```bash
npm run dev          # dev server
npm run db:push      # push schema to DB (uses Session Pooler)
npm run db:generate  # regenerate Prisma client
npm run db:seed      # seed demo data
npm run build        # prisma generate && next build
```

## Common Mistakes to Avoid
- Do NOT import from `@prisma/client` — wrong package
- Do NOT use Tailwind config file — Tailwind v4 uses CSS-only config
- Do NOT use `<Link legacyBehavior>` — causes Server Component errors; use `useRouter` in client components instead
- Do NOT use Transaction Pooler (port 6543) for Prisma CLI operations
- Do NOT use direct DB connection (`db.imufbgahggkwhclhbzcc.supabase.co`) — blocked by network

## Vercel Deployment
- Build script must be `"prisma generate && next build"` (postinstall alone is unreliable)
- DATABASE_URL must point to Session Pooler (port 5432) in Vercel env vars
- `app/generated/prisma/` is in `.gitignore` — must be generated at build time

## Demo Credentials (after seed)
- Admin: `admin@swixai.com` / `admin123`
- Customer: `demo@musterfirma.de` / `demo1234`
- Customer: `ceo@techstartup.de` / `startup123`
