// Generates docs/AGENT.md from the prompts and limits in code.
// Run: npm run docs:agent
import { writeFileSync } from "node:fs";
import { COST_LIMIT_USD, LIMITS, MODELS, PRICES } from "../lib/research/config.ts";
import {
  CARD_SYSTEM,
  CLASSIFY_SYSTEM,
  NICHE_QUESTIONS_SPEC,
  PICK_SEARCH_SYSTEM,
  PLAN_SYSTEM,
  RESOLVE_CHOOSE_SYSTEM,
  RESOLVE_EXTRACT_SYSTEM,
  SECTION_SPECS,
  TOPIC_CARD_SYSTEM,
  TOPIC_PICK_SYSTEM,
  TOPIC_PLAN_SYSTEM,
  TOPIC_SECTION_SPECS,
} from "../lib/research/prompts.ts";

const topicGroups = [
  ["topic_what", "topic_regulation"],
  ["topic_who_when", "topic_providers"],
  ["topic_stats", "topic_news"],
  ["topic_problems", "research_mentions", "(niche_questions, only if the niche has questions)"],
];

const fence = (text: string) => "```text\n" + text.trim() + "\n```";

const groups = [
  ["company", "what_it_does", "who_for"],
  ["pricing", "acquisition"],
  ["market_signals", "customer_cases"],
  ["reviews", "competitors"],
  ["research_mentions", "legal", "(niche_questions, only if the niche has questions)"],
];

const doc = `# Research agent: full instructions

> Generated from \`lib/research/prompts.ts\` and \`lib/research/config.ts\` by \`npm run docs:agent\`.
> Do not edit by hand: change the code and regenerate. Product rules come from \`BRIEF.md\`.

## How the pipeline works

One research run is a durable Vercel Workflow (\`workflows/research.ts\`). The workflow only
orchestrates and keeps counters; every network or database call is a retryable step.

1. **Health check.** A free Firecrawl call (credit usage). If it fails, the run stops with a clear error.
2. **Resolve the input** (only if the product has no official URL yet). The input may be a URL, a
   domain, a name or a messy link. Code cleans it (fragments, text highlights, links to this app,
   search-engine links). One clear product domain is used directly; otherwise Haiku extracts a
   name and query, Firecrawl searches, and Haiku chooses the official site. Only "high" confidence
   is accepted; otherwise the run stops and asks the user for a URL.
3. **Read the product's own pages.** Main URL, the user's extra URLs (flag \`added_by_user\`),
   Firecrawl \`map\` of the site, then Haiku picks the most important pages (prompt: plan).
4. **Search** only for three topics: reviews, funding / company status, research mentions.
   Haiku picks which results to read (prompt: pick search results). Results not read are logged
   as "seen only in search".
5. **Label sources** with Haiku in batches of 12 (prompt: classify). Code then sets \`check\`
   and excludes namesakes, listicles and unusable pages.
6. **Write the card** with Sonnet in ${groups.length} small groups of sections (prompt: card).
   The system prompt and all sources are one prompt-cached block, so later groups pay ~10% for
   it. Each group sees the facts already written and must not repeat them. A group that cannot be
   parsed is retried once, then its sections become "Not established: generation_failed".
7. **Save** sources, card items, run log, tokens and cost. "Перезібрати картку" repeats step 6
   from saved sources without new reads.

Firecrawl calls are spaced ${LIMITS.firecrawlMinIntervalSec} s apart (free plan ~10 requests/min); a rate-limited call
waits for the time in the error and is retried up to ${LIMITS.firecrawlRateLimitRetries} times.

### Hard limits per run

| Limit | Value |
|---|---|
| Model calls | ${LIMITS.maxModelCalls} |
| Page reads (every scrape attempt) | ${LIMITS.maxPageReads} |
| Cost (product / topic) | $${LIMITS.maxCostUsd} / $${COST_LIMIT_USD.topic} |
| Pages reserved for search results | ${LIMITS.reservedForSearch} |
| Extra URLs read | ${LIMITS.maxExtraUrls} |
| Characters per source sent to Sonnet | ${LIMITS.cardCharsPerSource} |
| Output tokens per card group (max / first estimate) | ${LIMITS.cardMaxOutputTokens} / ${LIMITS.cardExpectedOutputTokens} |

Before every model call the cost is estimated (input at full, cache-write or cache-read price;
output = average of earlier card groups + 25%). If the estimate or the actual spend passes a
limit, the run stops **as done (partial)**: finished sections are kept, the rest become
"Not established: budget_exhausted".

### Models

| Role | Model | $ per 1M tokens in / out |
|---|---|---|
| Card writing only | \`${MODELS.writer}\` | ${PRICES[MODELS.writer].input} / ${PRICES[MODELS.writer].output} |
| Cheap steps (resolve, plan, pick, classify) | \`${MODELS.cheap}\` | ${PRICES[MODELS.cheap].input} / ${PRICES[MODELS.cheap].output} |

## Source rules

- **Labels:** \`category\` = official · listing · business_data · reviews · research · news (by content;
  pages on the product's own domain are always official). \`check\` = reliable for official,
  listing, business_data and reviews hosted on a listing; verify for everything else.
  \`added_by_user\` only for the user's extra URLs.
- **Excluded from the card** (kept in the DB as context): namesakes (\`sameProduct = no\`),
  blog-style listicles and affiliate/coupon pages not on the product's domain, unusable pages
  (login_required, paywall, blocked, not_found).
- **Own comparison pages** are used only for competitor names, with \`company_claim\`.
- **Gap reasons:** not_found, blocked, paywall, login_required, 404, unsupported_by_scraper,
  budget_exhausted, generation_failed. Logs also use rate_limited and http_error.

## Card item schema (Sonnet output, validated with zod)

| Field | Meaning |
|---|---|
| \`section\` | Section key of this group, or \`not_established\` for gaps |
| \`forSection\` | Section the item is about (also for gaps); used to check every section is covered |
| \`field\` | Short label in Ukrainian, e.g. "Рік заснування" |
| \`value\` | One fact in Ukrainian (product, plan, company names in English) |
| \`status\` | established · not_established · not_applicable · reference |
| \`seeSection\` | For \`reference\`: the section that holds the fact |
| \`sourceRef\` | n of [Sn]; required for established |
| \`quote\` | 1–2 sentences verbatim from that source |
| \`companyClaim\` | Only self-reported numbers, rankings, superlatives |
| \`reason\` | Gap reason for not_established |

Code checks after the call: established items need a valid source and quote (otherwise dropped);
quotes are checked against the source text and stored as \`quote_verified\`; sections with no item
get a not_established item; if nothing legal was found, "Nothing notable found in sources read".

Card sections, in groups: ${groups.map((g) => g.join(", ")).join(" | ")}.

## System prompts

### 1. Resolve: extract product name (Haiku)

${fence(RESOLVE_EXTRACT_SYSTEM)}

### 2. Resolve: choose official site (Haiku)

${fence(RESOLVE_CHOOSE_SYSTEM)}

### 3. Plan: pages and search queries (Haiku)

${fence(PLAN_SYSTEM)}

### 4. Pick search results (Haiku)

${fence(PICK_SEARCH_SYSTEM)}

### 5. Classify sources (Haiku)

${fence(CLASSIFY_SYSTEM)}

### 6. Write card items (Sonnet)

System prompt (same for every group):

${fence(CARD_SYSTEM)}

The user message of each group lists its sections with these specs:

${Object.entries(SECTION_SPECS)
  .map(([k, v]) => `- **${k}** — ${v.replace(/^[a-z_]+: /, "")}`)
  .join("\n")}
- **niche_questions** (only when the niche has questions) — ${NICHE_QUESTIONS_SPEC.replace(/^niche_questions: /, "")}

## Topic mode

For a solution or topic, not one company (e.g. "е-ТТН"). There is no official domain, so steps 2–3
are replaced: the user's URLs are read first, Haiku plans up to ${LIMITS.topicMaxQueries} search queries in the topic's
language (plus English for non-English topics) across six intents (official, regulation,
providers, news, research, reviews), Firecrawl searches (${LIMITS.topicResultsPerQuery} results per query, geo-targeted to the
topic's country), Haiku picks what to read, then classify and card writing run as for products
with the topic prompts below. Limits: ${LIMITS.maxPageReads} pages, ${LIMITS.maxModelCalls} model calls, cost $${COST_LIMIT_USD.topic} per run.

Topic card groups: ${topicGroups.map((g) => g.join(", ")).join(" | ")}.

### T1. Topic plan: queries (Haiku)

${fence(TOPIC_PLAN_SYSTEM)}

### T2. Pick search results for a topic (Haiku)

${fence(TOPIC_PICK_SYSTEM)}

### T3. Write topic card items (Sonnet)

System prompt (same for every group):

${fence(TOPIC_CARD_SYSTEM)}

Section specs:

${Object.entries(TOPIC_SECTION_SPECS)
  .map(([k, v]) => `- **${k}** — ${v.replace(/^[a-z_]+: /, "")}`)
  .join("\n")}
`;

writeFileSync(new URL("../docs/AGENT.md", import.meta.url), doc);
console.log("docs/AGENT.md written");
