# BRIEF: Product Research Agent

## Goal
Build a web app where the user creates **niche projects**, pastes a product URL, and an agent collects primary information about that product into a **product card**. Every source the agent reads is stored in a database.

The agent **collects and structures**. It does not interpret, score, draw conclusions or give recommendations. The user draws conclusions.

The agent works for any kind of product: SaaS, physical goods, services, any niche.

## Core rules (these override everything below)
1. **No source, no data.** Every data point cites a source read in this run (`[Sn]`) and a short 1–2 sentence quote from that page. No source → the item goes to "Not established".
2. **Report gaps honestly.** Write "Not established" with a reason: `not_found` / `blocked` / `paywall` / `login_required` / `404` / `unsupported_by_scraper` / `budget_exhausted`. Never claim something "does not exist".
3. **Show who is speaking.** Numbers a company states about itself (site, press release, founder quote) get the flag `company_claim`.
4. **Never pick silently.** If sources disagree, show both values.
5. **Same product.** Confirm the source is about this product, not a namesake.
6. **Budget.** Read at most ~25 pages per product. Choose the important pages yourself.
7. **Skip listicles and affiliate/coupon pages** (blog articles like "top 10 alternatives", "best X tools"). Do not use them as sources. Exceptions:
   - "Alternatives" pages on review listings (e.g. G2, Capterra) are `listing` and are allowed.
   - The product's own comparison pages (including its own "best X" / "alternatives" articles) are allowed **only for competitor names**, flagged `company_claim`. Take no other data from them.

## Inputs
- **Main product URL** (required): one URL given by the user.
- **Extra URLs** (optional): more pages the user adds for this product. Sources from these URLs get the flag `added_by_user`. No other source gets a provenance flag.
- All sources read for a product (main domain, extra URLs, search results) are stored together as **that product's context**.

## Where information comes from
- **Core: the product's own site** (domain of the main URL), including subdomains (help., docs., blog., shop., etc.). Main source for almost every card field. Choose the pages that fit the product type, for example: homepage, pricing / shop / product pages, features or specifications, customers / case studies, about, help center / FAQ, affiliate or partner page, store locator / where to buy, integrations, API docs.
- **Extra URLs** added by the user.
- **External: web search, only for three topics:**
  1. **Reviews**: review platforms, listings and marketplaces (e.g. G2, Capterra, Trustpilot, Product Hunt, app stores, Amazon and other marketplaces, Google reviews) and communities (e.g. Reddit). Capture reviewer details (e.g. industry, company size, verified purchase) when the platform shows them.
  2. **Funding and company status**: funding databases, company registries, press releases, company rankings, news.
  3. **Research mentions**: reports, studies, surveys, statistics that mention the product.

## Source labels
Each source has two labels, plus an optional flag.
- `category` (examples are guidance, classify by content): `official` · `listing` · `business_data` · `reviews` · `research` · `news`
- `check`: `reliable` for `official`, `listing`, `business_data`, and reviews hosted on a listing. `verify` for everything else, and for any source you are unsure how to classify.
- `added_by_user`: only for sources from the user's extra URLs.

## Product card
Card language: Ukrainian. Product names, plan names and industry terms: English.

**Format.**
- Each card item: value · `[Sn]` · short quote · (`company_claim` if applicable).
- At the end of the card, a **sources table** `[S1]..[Sn]`: URL · category · check · date read · date published (`not shown` if the page has no date) · (`added_by_user` if applicable).

**Product-agnostic.** The sections are the same for every product. The fields inside each section adapt to the product type. Niche-specific questions belong only in "Niche questions".

**Not applicable vs Not established.**
- "Not applicable": the field does not fit this product type (e.g. API for a physical product). Say why in a few words.
- "Not established": the field fits, but it was not found. Give a reason from Core rule 2. List it in the "Not established" section.

**Sections.**

0. **Company**: name, URL, country / legal entity, founding year, team size, funding.
1. **What it does**: description and key features or characteristics, in the product's own terms.
2. **Who it is for**: segments and use cases the product itself names.
3. **Business model and pricing**: model type and price structure, adapted to the product type. For example: plans, credits and limits for SaaS; unit price, pack sizes, retailers and distributors for physical goods; packages or rates for services.
   - Prices only from the product's own site on the run date.
   - If prices are not public: write "Not established: pricing only after login" (or the matching reason). Still record plan names, limits and what is included if the product's own pages show them.
4. **Acquisition channels**: how the product reaches customers, as the sources state it. For example: free tier / trial, direct or enterprise sales, affiliate program (terms), partnerships, integrations, API, marketplaces.
5. **Market signals**: funding rounds, revenue, customer, user or sales counts, ratings and review counts. Do not present usage metrics as paying customers.
6. **Customer cases**: named customers and stated results.
7. **Customer reviews**: rating and count per platform; reviewer details if shown; recurring praise and complaint themes, grouped, with quotes. No agent verdicts.
8. **Competitors**: only those named by sources (the product's own comparison pages, flagged `company_claim`; "alternatives" sections on listings), with the source.
9. **Research mentions**: reports, studies, surveys that mention the product: publisher, report title, what it says about the product, date published.
10. **Notable legal facts**: only standout items already found in pages read in this run, such as lawsuits, trademark problems, bans or recalls, missing required certifications. No dedicated legal searches. Skip routine terms of service and privacy policies. If none: "Nothing notable found in sources read".
11. **Niche questions**: extra questions defined in the niche project by the user.
12. **Not established**: what was searched for and why it was not found.

Sources table `[S1]..[Sn]` (see Format).

## Run log
Search queries · URLs read in full · URLs seen only in search results · skipped sources with reason · read errors · page count.

## Stack (plan)
Next.js on Vercel · Claude via Vercel AI Gateway · Firecrawl API · Vercel Workflow for long runs · Postgres (Neon) · password-protected access.

## Later (not now)
Filter card fields and switch views in the UI; comparison table across products in a niche.
- Product page: filter card sections (show only chosen sections, e.g. only "Notable legal facts").
- Product page: filter card items by source date (date published / date read).
