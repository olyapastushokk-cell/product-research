# Working rules

@AGENTS.md

- Reply to the user in Ukrainian. Max 5 bullets per report. No step-by-step narration.
- At the end of every stage: update PROGRESS.md (done / next / open issues, max 15 lines), then commit and push.
- Never put secrets in code, commits or chat. Use env vars (`.env.local` locally, Vercel project settings in production). `.env.example` lists the names only.
- Product rules live in BRIEF.md. Read it before changing research or card logic.

## Project facts
- Next.js 16 (App Router, TypeScript). Auth gate is `proxy.ts` (Next 16 name for middleware), password from `APP_PASSWORD`.
- DB: Postgres (Neon) via Drizzle, schema in `db/schema.ts`. After schema changes run `npm run db:generate` and commit `drizzle/`. `npm run build` applies migrations when `DATABASE_URL` is set.
- Research agent: `workflows/research.ts` (Vercel Workflow; orchestration in the workflow, all I/O in `"use step"` functions). Prompts in `lib/research/prompts.ts`, limits and models in `lib/research/config.ts` (Sonnet writes card items only; Haiku for cheap steps). Hard limits per run: 40 model calls, 25 page reads, $0.50.
- Workflow steps import `@/db/client` (no `server-only`); app code imports `@/db`.
- UI: Tailwind v4 + shadcn/ui (`components/ui`), theme tokens in `app/globals.css`, Manrope font, accent #E96A2C. Shared pieces: `components/section-heading.tsx` (heading + orange bar), `chevron-link`, `status-badge`, `stat-card`, `info-panel`.
- Docs: `docs/AGENT.md` is generated from the prompts (`npm run docs:agent`; rerun after prompt changes); `docs/KNOWN_ISSUES.md` lists open issues.
