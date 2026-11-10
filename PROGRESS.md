# Progress

## Done
- Stages 0–1: repo, BRIEF.md, app on https://product-research-phi.vercel.app, Neon DB, password gate.
- Stage 2: research agent (Vercel Workflow) with input resolve (URL / domain / name / messy link), site + search reads, Haiku labelling, Sonnet card. Limits: 40 model calls, 25 pages, $0.50. Product page: resolve info, status, usage, cost, raw card with [Sn], sources, log.
- Fixes after Synthesia/Creatify runs: Firecrawl throttled (7 s between calls, 2 retries on rate limit, logged as rate_limited); company_claim only for self-reported numbers/rankings/superlatives; quotes checked leniently, misses marked "quote unverified"; facts written once with cross-section references; niche questions never repeat card facts.
- Stage 3: card view + card.md / log.md downloads. Design pass: Tailwind v4 + shadcn/ui (components in components/ui, added by hand: ui.shadcn.com is blocked in the dev container), Manrope, orange accent, dark header, card grids, stat cards, pill badges.
- Niche board: preview cards from existing card items, sort, auto-refresh, empty state. Fix: Firecrawl client had maxRetries 0 (SDK = attempts, so no request was sent). Real errors logged (HTTP status + message, "http_error"); health check stops the run on the first failed Firecrawl call.
- Card writing in 5 section groups (cached sources), retry then generation_failed; budget stop = partial done (budget_exhausted); realistic cost estimate; "Перезібрати картку". Docs: AGENT.md, KNOWN_ISSUES.md.

## Next
- Demo: rebuild the arcads.ai card first (no new reads). Open issues: docs/KNOWN_ISSUES.md.

## Open issues
- Cost is an estimate unless AI Gateway returns the exact cost. Pages with DB data not screenshot-tested.
