# Known issues

Based on PROGRESS.md and the test runs on Synthesia, Creatify and arcads.ai (runs #5, #6).
Status: ✅ fixed · 🟡 partly fixed / workaround · 🔴 open.

## Research runs

### ✅ Firecrawl calls failed instantly with "Unexpected HTTP client error" (run #5)
- **Cause:** the Firecrawl client was created with `maxRetries: 0`. In the SDK this is the number of
  *attempts*, so no request was sent at all.
- **Fixed:** `maxRetries: 2` (the SDK only repeats on HTTP 502). A free health check
  (credit usage) runs first; if Firecrawl fails, the run stops with a clear Ukrainian error.
  Logs now show the real error (`HTTP 403 …`), unknown failures are `http_error`, not `not_found`.

### ✅ Card writing failed: "No object generated: could not parse the response" (run #6)
- **Cause:** one Sonnet call wrote 6 sections as one JSON answer with a 12k output limit. With
  23 sources (arcads.ai) the answer was most likely cut off and could not be parsed. The whole run
  failed and the 25 page reads were wasted.
- **Fixed:** 5 small groups (2–3 sections, 16k output tokens each); the finish reason and tokens
  of a failed call are logged; a failed group is retried once, then its sections become
  "Not established: generation_failed" and the other groups are kept.
  "Перезібрати картку" rebuilds a card from saved sources without new Firecrawl reads.
- **Not yet verified live** (no test runs). First thing to check in the demo: rebuild arcads.ai.

### ✅ A budget stop lost all finished work
- **Cause:** reaching the call or cost limit threw an error and the run was marked failed.
- **Fixed:** the run finishes as done (partial). Written groups are kept; unwritten sections become
  "Not established: budget_exhausted"; the product page shows a "partial" notice.

### ✅ Pre-call cost estimate was too pessimistic
- **Cause:** every call reserved its full `maxOutputTokens` (12–16k) in the estimate, which could
  stop a run while plenty of budget was left.
- **Fixed:** output is estimated from earlier card groups (average + 25%, first group 5k tokens);
  cached sources are counted at the cache price.
- **Rest:** actual cost comes from AI Gateway when it returns it; otherwise from list prices in
  `lib/research/config.ts`. Update `PRICES` if model prices change.

### 🟡 Firecrawl free plan rate limit (~10 requests/min)
- **Cause:** 11 reads in the first Synthesia/Creatify runs failed with "Rate limit exceeded",
  including G2 and Dealroom.
- **Fixed:** 7 s between Firecrawl calls (durable sleep), up to 2 retries after the wait time from
  the error, logged as `rate_limited`.
- **Rest:** a run takes ~3–5 min longer. With a paid Firecrawl plan lower
  `LIMITS.firecrawlMinIntervalSec`.

### 🔴 Reddit cannot be read
- **Cause:** Firecrawl refuses Reddit (`HTTP 403: we do not support this site`). Two Reddit threads
  were lost in run #6. Until now this was logged as `blocked`; it is now `unsupported_by_scraper`.
- **How to fix:** read Reddit through its public JSON (`<thread url>.json`) in a separate step, or
  skip Reddit URLs in "pick search results" so the page budget is not wasted.

### 🔴 Low-value pages use the page budget
- **Cause:** YouTube pages are read as sources (S23 in run #6: a 38k-character transcript page);
  feature pages S10–S13 are ≈ 22k characters each, probably mostly the same navigation and footer.
- **How to fix:** in `PICK_SEARCH_SYSTEM` prefer text sources over video; strip repeated
  navigation/footers (compare pages of one domain) before storing; lower `cardCharsPerSource` for
  pages already covered.

### 🔴 Review coverage is partial
- **Cause:** listing pages show only the first reviews (Trustpilot: ~20 of 192). The AI summary
  some platforms show is not a review.
- **How to fix:** allow 1–2 extra paginated reads for the main review platform within the page
  budget; label AI summaries in the classify step.

### 🔴 Rules still open from the manual Arcads test (`runs/arcads-test.md`)
Relative publish dates ("2 weeks ago"), founding year / team size of product vs legal entity,
exact boundary of `company_claim`, whether snippet-only values belong in the log only, how failed
reads count against the 25-page budget (now: every scrape attempt counts), and pre-launch
financials of the legal entity. **How to fix:** decide each rule in BRIEF.md, then update
`CARD_SYSTEM` / `CLASSIFY_SYSTEM` and regenerate `docs/AGENT.md`.

### 🔴 Topic mode not tested live
- **What:** "Тема" mode (e.g. "е-ТТН") was added without a test run (budget saved for the demo).
  Risks to check on the first run: search queries in Ukrainian return thin results (Firecrawl
  `country: UA` geo-targeting is used); government sites may block the scraper; 8 queries + 7 s
  throttle add ~1 min; provider prices may be missing if pricing pages are not in search results.
- **How to fix:** after the first run, read the log (queries, skipped sources) and tune
  `TOPIC_PLAN_SYSTEM` / `TOPIC_PICK_SYSTEM`; if provider pricing pages are missed, add a
  per-provider pricing read after the pick step.

## Input and app

### 🟡 Product input resolution
- **Fixed:** URL, domain, name and messy links (text highlights, links to the app itself) are
  resolved; namesakes are listed.
- **Rest:** only "high" confidence is accepted, so ambiguous names stop the run and ask for a URL.

### 🟡 Quote verification
- **Fixed:** lenient verbatim check (case, markdown, quotes, dashes, "…"); misses are marked
  "quote unverified" instead of being shown as normal.
- **Rest:** quotes from page parts Firecrawl dropped (e.g. tables, widgets) are flagged even when
  correct. Could compare against the raw HTML text as a second check.

### 🟡 Niche board previews
- **Rest:** entry price and model are parsed from card text with simple rules (`lib/card/preview.ts`);
  unusual price formats show "Ціна не встановлена". Favicons come from Google's favicon service;
  if it is blocked, the first letter is shown.

### 🔴 Testing gaps
- No automated tests. Pages with real DB data were never screenshot-tested in the dev container
  (no DB access there); research runs were tested only on Vercel.
- **How to fix:** add unit tests for `lib/research/resolve.ts`, `lib/card/preview.ts`,
  `lib/card/markdown.ts` and the quote check; use a Neon branch for preview deployments.

### 🔴 Shared database for preview and production
- **Cause:** `npm run build` applies migrations to whatever `DATABASE_URL` the build sees, and preview
  builds use the same database.
- **How to fix:** in the Neon integration, enable a separate branch for Preview.

### 🔴 Rebuild overwrites the run's card
- "Перезібрати картку" replaces the card items of the same run; the previous version is not kept
  (the card.md download is the only copy). **How to fix:** store a card version number per run.

### ℹ️ Dev environment
- `ui.shadcn.com` and `ai-gateway.vercel.sh` are blocked in the cloud dev container, so shadcn
  components were added by hand and models could not be called from there.
