# Progress

## Done
- Stage 0: environment, repo, BRIEF.md.
- Stage 1: app skeleton. Pages: niches → niche (products, form "Дослідити", niche questions) → product (card placeholder). Password gate (`APP_PASSWORD`). Drizzle schema: niches, products, runs, sources, card_items; migration `drizzle/0000_init.sql`. `npm run build` passes.

## Next
- Deploy to Vercel, connect Neon, set env vars; check the app end to end with a real DB.
- Stage 2: research agent (Firecrawl + Claude via AI Gateway), save sources and card items.

## Open issues
- Pages with DB were not tested locally (no database in the dev container).
- Build applies migrations to whatever `DATABASE_URL` the build sees (preview builds too).
