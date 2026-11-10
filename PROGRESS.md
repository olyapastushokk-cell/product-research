# Progress

## Done
- Stages 0–1: repo, BRIEF.md, app on https://product-research-phi.vercel.app, Neon DB, password gate.
- Stage 2: research agent (Vercel Workflow) with input resolve (URL / domain / name / messy link), site + search reads, Haiku labelling, Sonnet card. Limits: 40 model calls, 25 pages, $0.50. Product page: resolve info, status, usage, cost, raw card with [Sn], sources, log.

- Fixes after Synthesia/Creatify runs: Firecrawl throttled (7 s between calls, 2 retries on rate limit, logged as rate_limited); company_claim only for self-reported numbers/rankings/superlatives; quotes checked leniently, misses marked "quote unverified"; facts written once with cross-section references; niche questions never repeat card facts.

## Next
- Redeploy and re-run Synthesia / Creatify; check rate limits, claims, references.
- Stage 3: proper card view.

## Open issues
- Resolve accepts only "high" confidence; otherwise the user must give a URL.
- Cost is an estimate unless AI Gateway returns the exact cost.
- Throttling makes a run ~3–5 min longer; a paid Firecrawl plan could lower the 7 s interval.
