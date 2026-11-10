# Progress

## Done
- Stages 0–1: repo, BRIEF.md, app on https://product-research-phi.vercel.app, Neon DB, password gate.
- Stage 2: research agent (Vercel Workflow): resolve input → read site + extra URLs → search reviews / funding / research → Haiku labels sources → Sonnet writes card. Limits: 40 model calls, 25 pages, $0.50. Product page: status, usage, cost, raw card with [Sn], sources, log.
- Fixes after first test: input accepts URL / domain / name / messy link; resolve step skips the app's own domain, saves official URL, reason and namesakes, asks for a URL if unsure. Niche questions are optional extras; every card section is always filled. Migration 0003 deletes the broken test product.

## Next
- Redeploy, test with a name ("Synthesia"), a domain and a messy link.
- Stage 3: proper card view.

## Open issues
- Resolve accepts only "high" confidence; otherwise the user must give a URL.
- Cost is an estimate unless AI Gateway returns the exact cost; unverified quotes go to log warnings.
