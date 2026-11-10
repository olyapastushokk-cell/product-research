# Progress

## Done
- Stage 0: environment, repo, BRIEF.md.
- Stage 1 (closed): app skeleton deployed at https://product-research-phi.vercel.app. Pages: niches → niche (products, form "Дослідити", niche questions) → product (card placeholder). Password gate (`APP_PASSWORD`). Neon DB connected; Drizzle schema (niches, products, runs, sources, card_items) applied. Checked in production: login, create niche, create product.

## Next
- Stage 2: research agent (Firecrawl + Claude via AI Gateway), save sources and card items. Needs `FIRECRAWL_API_KEY` in Vercel env.

## Open issues
- Build applies migrations to whatever `DATABASE_URL` the build sees (preview builds use the same DB).
- Niche questions save and extra URLs not yet checked in production.
