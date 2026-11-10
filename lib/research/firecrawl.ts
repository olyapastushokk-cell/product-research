// Firecrawl helpers. Used only inside workflow steps.
import Firecrawl, { SdkError } from "@mendable/firecrawl-js";
import { FatalError } from "workflow";
import type { GapReason } from "./types";

let client: Firecrawl | undefined;

export function firecrawl() {
  if (!client) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new FatalError("FIRECRAWL_API_KEY is not set");
    client = new Firecrawl({ apiKey, maxRetries: 1, timeoutMs: 90_000 });
  }
  return client;
}

// Account-level problems (bad key, no credits) must stop the run.
export function failOnAccountError(e: unknown) {
  if (e instanceof SdkError && (e.status === 401 || e.status === 402)) {
    throw new FatalError(`Firecrawl: ${e.message} (HTTP ${e.status})`);
  }
}

export function gapReasonFromError(e: unknown): { reason: GapReason; message: string } {
  const message = e instanceof Error ? e.message : String(e);
  const status = e instanceof SdkError ? e.status : undefined;
  const lower = message.toLowerCase();
  if (lower.includes("not supported") || lower.includes("no longer supported")) {
    return { reason: "unsupported_by_scraper", message };
  }
  if (status === 404) return { reason: "404", message };
  if (status === 401 || status === 403) return { reason: "blocked", message };
  return { reason: "not_found", message };
}

export function gapReasonFromStatus(status: number): GapReason {
  if (status === 404 || status === 410) return "404";
  if (status === 401) return "login_required";
  if (status === 402) return "paywall";
  return "blocked";
}
