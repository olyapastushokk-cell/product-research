# Progress

## Done
- Stage 0: environment, repo, BRIEF.md.
- Stage 1 (closed): app skeleton on https://product-research-phi.vercel.app, Neon DB, password gate.
- Stage 2 (code done): research agent as Vercel Workflow. Flow: read main + extra URLs → map site → Haiku plans pages + 3 search queries → read pages → Firecrawl search (reviews, funding, research) → Haiku picks results → read → Haiku labels sources → Sonnet writes card items (2 calls). Saves sources, card items, run log, tokens, cost. Limits: 40 model calls, 25 page reads, $0.50. Product page: status, error, usage, raw card items with [Sn], sources, log.

- Fixes after first test: product input accepts URL / domain / name / messy link; resolve step (clean input, never the app's own domain, Haiku + Firecrawl search) saves the official URL, reason and namesake candidates; stops with a Ukrainian message if not confident. Niche questions are optional extras only (skipped if empty or duplicating card sections); every card section is always filled. Migration 0003 deletes the broken test product.

## Next
- Deploy, set FIRECRAWL_API_KEY in Vercel, run on a real product and check the card against BRIEF.md.
- Stage 3: proper card view.

## Open issues
- Not tested live yet (no DB, Firecrawl or AI Gateway access from the dev container).
- Cost shown is an estimate unless AI Gateway returns the exact cost.
- Resolve accepts only "high" confidence; otherwise the user must give a URL.
- Quotes not found verbatim in the source are kept and listed in the run log warnings.
