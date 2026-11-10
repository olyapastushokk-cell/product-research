# BRIEF: Product Research Agent

## Goal
Build a web app where the user creates **niche projects**, pastes a product URL, and an agent collects primary information about that product into a **product card**. Every source the agent reads is stored in a database.

The agent **collects and structures**. It does not interpret, score, draw conclusions or give recommendations. The user draws conclusions.

## Core rules (these override everything below)
1. **No source, no data.** Every data point has a URL read in this run and a 1–2 sentence quote from that page. No source → the item goes to "Not established".
2. **Report gaps honestly.** Write "Not established" with a reason: `not found` / `blocked` / `paywall`. Never claim something "does not exist".
3. **Show who is speaking.** Numbers a company states about itself (site, press release, founder quote) get the flag `company_claim`.
4. **Never pick silently.** If sources disagree, show both values.
5. **Same product.** Confirm the source is about this product, not a namesake.
6. **Budget.** Read at most ~25 pages per product. Choose the important pages yourself.
7. **Skip listicles and affiliate/coupon pages** (blog articles like "top 10 alternatives", "best X tools"). Do not use them as sources. This does not apply to "alternatives" pages on review listings (e.g. G2, Capterra): those are `listing` and are allowed.

## Where information comes from
- **Core: the product domain** (URL given by the user). Main source for almost every card field. Read the homepage, pricing, features, customers/case studies, about, help center / FAQ, affiliate page, integrations, API docs. Include subdomains (help., docs., blog.).
- **External: web search, only for three topics:**
  1. **Reviews**: review platforms and listings (e.g. G2, Capterra, Trustpilot, Product Hunt, app stores) and communities (e.g. Reddit). Capture the reviewer's industry and company size when the platform shows them.
  2. **Funding and company status**: funding databases, company registries, press releases, company rankings, news.
  3. **Research mentions**: reports, studies, surveys, statistics that mention the product.

## Source labels
Each source has three labels.
- `origin`: `user` | `search`
- `category` (examples are guidance, classify by content): `official` · `listing` · `business_data` · `reviews` · `research` · `news`
- `check`: `reliable` for `official`, `listing`, `business_data`, and reviews hosted on a listing. `verify` for everything else, and for any source you are unsure how to classify.

## Product card
Each item: value · quote · URL · date read · date published (`not shown` if the page has no date) · category · check · origin · (`company_claim` if applicable).
Card language: Ukrainian. Product names, plan names and industry terms: English.

0. **Company**: name, URL, country / legal entity, founding year, team size, funding.
1. **What it does**: description and key features, in the product's own terms.
2. **Who it is for**: segments and use cases the product itself names.
3. **Business model and pricing**: model type; plans (name, monthly / annual price, limits, what is included). Prices only from the product's own pricing page on the run date.
4. **Acquisition channels**: free tier / trial, enterprise sales, affiliate program (terms), integrations and partnerships, API.
5. **Market signals**: funding rounds, revenue, customer or user counts, ratings and review counts. Do not present usage metrics as paying customers.
6. **Customer cases**: named customers and stated results.
7. **Customer reviews**: rating and count per platform; reviewer industries if shown; recurring praise and complaint themes, grouped, with quotes. No agent verdicts.
8. **Competitors**: only those named by sources (the product's own comparison pages, "alternatives" sections on listings), with the source.
9. **Research mentions**: reports, studies, surveys that mention the product: publisher, report title, what it says about the product, date published.
10. **Niche questions**: extra questions defined in the niche project by the user.
11. **Not established**: what was searched for and why it was not found.

## Run log
Search queries · URLs read in full · URLs seen only in search results · skipped sources with reason · read errors · page count.

## Stack (plan)
Next.js on Vercel · Claude via Vercel AI Gateway · Firecrawl API · Vercel Workflow for long runs · Postgres (Neon) · password-protected access.

## Later (not now)
Filter card fields and switch views in the UI; comparison table across products in a niche.
