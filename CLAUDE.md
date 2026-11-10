# Working rules

@AGENTS.md

- Reply to the user in Ukrainian. Max 5 bullets per report. No step-by-step narration.
- At the end of every stage: update PROGRESS.md (done / next / open issues, max 15 lines), then commit and push.
- Never put secrets in code, commits or chat. Use env vars (`.env.local` locally, Vercel project settings in production). `.env.example` lists the names only.
- Product rules live in BRIEF.md. Read it before changing research or card logic.

## Project facts
- Next.js 16 (App Router, TypeScript). Auth gate is `proxy.ts` (Next 16 name for middleware), password from `APP_PASSWORD`.
- DB: Postgres (Neon) via Drizzle, schema in `db/schema.ts`. After schema changes run `npm run db:generate` and commit `drizzle/`. `npm run build` applies migrations when `DATABASE_URL` is set.
