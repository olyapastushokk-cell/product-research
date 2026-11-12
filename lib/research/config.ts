// Hard safety limits and model choices for one research run.

export type ResearchKind = "product" | "topic";

export const LIMITS = {
  maxModelCalls: 40,
  maxPageReads: 25,
  // Cost limit of a product run; topic runs use COST_LIMIT_USD.topic.
  maxCostUsd: 0.5,
  // Topic mode: web search queries per run (Ukrainian + English for Ukrainian topics).
  topicMaxQueries: 8,
  topicResultsPerQuery: 6,
  // How many page reads to keep for search results (reviews, funding, research).
  reservedForSearch: 8,
  maxExtraUrls: 5,
  searchResultsPerQuery: 8,
  mapLinks: 300,
  // Characters stored per source (full_text) and shown to models.
  maxStoredChars: 200_000,
  classifyChars: 2_500,
  cardCharsPerSource: 5_000,
  // Per section group (5 groups); a group needs ~2–5k tokens.
  cardMaxOutputTokens: 16_000,
  // Expected output of the first group for the pre-call cost check; later groups use
  // the average of earlier groups (+25%).
  cardExpectedOutputTokens: 5_000,
  // Firecrawl free plan allows ~10 requests/min: keep at least 7 s between calls.
  firecrawlMinIntervalSec: 7,
  firecrawlRateLimitRetries: 2,
  firecrawlDefaultWaitSec: 60,
} as const;

// Cost limit per run, by research mode.
export const COST_LIMIT_USD: Record<ResearchKind, number> = {
  product: LIMITS.maxCostUsd,
  topic: 1,
};

export function costLimitFor(kind: string | null | undefined): number {
  return kind === "topic" ? COST_LIMIT_USD.topic : COST_LIMIT_USD.product;
}

// Sonnet only writes card items; Haiku does cheap steps.
export const MODELS = {
  writer: "anthropic/claude-sonnet-5.5",
  cheap: "anthropic/claude-haiku-5.5",
} as const;

// USD per 1M tokens (AI Gateway list prices, checked 2026-11-10). Used for estimates.
export const PRICES: Record<string, { input: number; output: number }> = {
  [MODELS.writer]: { input: 2, output: 10 },
  [MODELS.cheap]: { input: 0.1, output: 0.5 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number) {
  const p = PRICES[model];
  if (!p) throw new Error(`No price for model ${model}`);
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

// Rough upper estimate of tokens for a prompt (about 3 chars per token).
export function estimateTokens(chars: number) {
  return Math.ceil(chars / 3);
}
