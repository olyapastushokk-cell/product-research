# Progress

## Done
- Stages 0–1: repo, BRIEF.md, app on https://product-research-phi.vercel.app, Neon DB, password gate.
- Stage 2: research agent (Vercel Workflow) with input resolve (URL / domain / name / messy link), site + search reads, Haiku labelling, Sonnet card. Limits: 40 model calls, 25 pages, $0.50. Product page: resolve info, status, usage, cost, raw card with [Sn], sources, log.
- Fixes after Synthesia/Creatify runs: Firecrawl throttled (7 s between calls, 2 retries on rate limit, logged as rate_limited); company_claim only for self-reported numbers/rankings/superlatives; quotes checked leniently, misses marked "quote unverified"; facts written once with cross-section references; niche questions never repeat card facts.
- Stage 3: card view on the product page (sections, [Sn] links, collapsible quotes, labels company_claim / verify / quote unverified, sources table, collapsed log); downloads card.md and log.md (also for previous runs).
- Design pass: Tailwind v4 + shadcn/ui (components in components/ui, added by hand: ui.shadcn.com is blocked in the dev container), Manrope, orange accent, dark header, card grids, stat cards, pill badges.

## Next
- Redeploy and check all pages on desktop and phone.
- Stage 4.

## Open issues
- Cost is an estimate unless AI Gateway returns the exact cost. Pages with DB data not screenshot-tested.
