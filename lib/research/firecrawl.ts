// Firecrawl helpers. Used only inside workflow steps.
import Firecrawl, { SdkError } from "@mendable/firecrawl-js";
import { FatalError } from "workflow";
import { LIMITS } from "./config";
import type { GapReason } from "./types";

let client: Firecrawl | undefined;

export function firecrawl() {
  if (!client) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new FatalError("FIRECRAWL_API_KEY is not set");
    // No SDK retries: rate limits are handled by withRateLimitRetry.
    client = new Firecrawl({ apiKey, maxRetries: 0, timeoutMs: 90_000 });
  }
  return client;
}

// Account-level problems (bad key, no credits) must stop the run.
export function failOnAccountError(e: unknown) {
  if (e instanceof SdkError && (e.status === 401 || e.status === 402)) {
    throw new FatalError(`Firecrawl: ${e.message} (HTTP ${e.status})`);
  }
}

export function isRateLimited(e: unknown): boolean {
  const message = e instanceof Error ? e.message : String(e);
  return (e instanceof SdkError && e.status === 429) || /rate limit/i.test(message);
}

// Seconds to wait, taken from the error text ("retry after 23s", "resets at ...").
export function retryAfterSeconds(e: unknown): number {
  const message = e instanceof Error ? e.message : String(e);
  const after = /retry after (\d+)\s*s/i.exec(message);
  if (after) return Math.min(Number(after[1]) + 1, 90);
  const resets = /resets at ([^.,;]+(?:GMT|Z|UTC)[^.,;]*)/i.exec(message);
  if (resets) {
    const ms = Date.parse(resets[1]) - Date.now();
    if (Number.isFinite(ms) && ms > 0) return Math.min(Math.ceil(ms / 1000) + 1, 90);
  }
  return LIMITS.firecrawlDefaultWaitSec;
}

// Runs a Firecrawl call; on a rate limit waits for the time from the error and retries
// (at most LIMITS.firecrawlRateLimitRetries times). Rethrows the last error.
export async function withRateLimitRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (!isRateLimited(e) || attempt >= LIMITS.firecrawlRateLimitRetries) throw e;
      await new Promise((r) => setTimeout(r, retryAfterSeconds(e) * 1000));
    }
  }
}

export function gapReasonFromError(e: unknown): { reason: GapReason | "rate_limited"; message: string } {
  const message = e instanceof Error ? e.message : String(e);
  const status = e instanceof SdkError ? e.status : undefined;
  const lower = message.toLowerCase();
  if (isRateLimited(e)) return { reason: "rate_limited", message };
  if (lower.includes("not supported") || lower.includes("no longer supported")) {
    return { reason: "unsupported_by_scraper", message };
  }
  if (status === 404) return { reason: "404", message };
  if (status === 401 || status === 403) return { reason: "blocked", message };
  return { reason: "not_found", message };
}

export function gapReasonFromStatus(status: number): GapReason | "rate_limited" {
  if (status === 429) return "rate_limited";
  if (status === 404 || status === 410) return "404";
  if (status === 401) return "login_required";
  if (status === 402) return "paywall";
  return "blocked";
}
