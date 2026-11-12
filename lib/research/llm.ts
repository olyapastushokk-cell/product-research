// Model calls with hard budget checks. Used only inside workflow steps.
import { generateText, NoObjectGeneratedError, Output, type SystemModelMessage } from "ai";
import type { z } from "zod";
import { estimateCost, estimateTokens, LIMITS } from "./config";
import type { ModelCallLog } from "./types";

// limitUsd: the run's cost limit (depends on product / topic mode), for messages.
export type BudgetLeft = { modelCalls: number; costUsd: number; limitUsd?: number };

export class BudgetStop extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetStop";
  }
}

// The model answered but the structured output could not be parsed (e.g. cut off at the
// output token limit). Carries the call log so the spend is still recorded.
export class GenerationFailed extends Error {
  call: ModelCallLog;
  finishReason: string;
  constructor(message: string, call: ModelCallLog, finishReason: string) {
    super(message);
    this.name = "GenerationFailed";
    this.call = call;
    this.finishReason = finishReason;
  }
}

// Anthropic prompt-cache breakpoint (forwarded by AI Gateway).
const CACHE = { anthropic: { cacheControl: { type: "ephemeral" as const } } };

export async function callModel<T>(opts: {
  purpose: string;
  model: string;
  instructions: string;
  // Large constant block (e.g. sources) sent as a cached system message after the instructions.
  cachedContext?: string;
  // true when an earlier call in this run sent the same instructions + cachedContext.
  contextLikelyCached?: boolean;
  prompt: string;
  schema: z.ZodType<T>;
  maxOutputTokens: number;
  // Realistic output size for the pre-call cost check (defaults to maxOutputTokens).
  expectedOutputTokens?: number;
  budget: BudgetLeft;
}): Promise<{ output: T; call: ModelCallLog }> {
  if (opts.budget.modelCalls < 1) {
    throw new BudgetStop(`Model call limit reached (${LIMITS.maxModelCalls})`);
  }
  // Estimate: cache reads cost 10% of input, cache writes 125%; output = expected size.
  const cachedChars = opts.cachedContext ? opts.instructions.length + opts.cachedContext.length : 0;
  const plainChars = opts.prompt.length + (opts.cachedContext ? 0 : opts.instructions.length);
  const cacheFactor = opts.contextLikelyCached ? 0.1 : 1.25;
  const estimate = estimateCost(
    opts.model,
    estimateTokens(plainChars) + Math.ceil(estimateTokens(cachedChars) * cacheFactor),
    Math.min(opts.expectedOutputTokens ?? opts.maxOutputTokens, opts.maxOutputTokens),
  );
  if (estimate > opts.budget.costUsd) {
    throw new BudgetStop(
      `Cost limit: next call "${opts.purpose}" is estimated at $${estimate.toFixed(3)}, ` +
        `only $${opts.budget.costUsd.toFixed(3)} of $${opts.budget.limitUsd ?? LIMITS.maxCostUsd} left`,
    );
  }

  const instructions: string | SystemModelMessage[] = opts.cachedContext
    ? [
        { role: "system", content: opts.instructions },
        { role: "system", content: opts.cachedContext, providerOptions: CACHE },
      ]
    : opts.instructions;

  let result;
  try {
    result = await generateText({
      model: opts.model,
      instructions,
      prompt: opts.prompt,
      output: Output.object({ schema: opts.schema }),
      maxOutputTokens: opts.maxOutputTokens,
      maxRetries: 1,
    });
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e)) {
      const inputTokens = e.usage?.inputTokens ?? 0;
      const outputTokens = e.usage?.outputTokens ?? 0;
      const finishReason = String(e.finishReason ?? "unknown");
      throw new GenerationFailed(
        `${opts.purpose}: could not parse the response (finish reason: ${finishReason}, ` +
          `${outputTokens} of ${opts.maxOutputTokens} output tokens)`,
        {
          purpose: `${opts.purpose} (failed: ${finishReason})`,
          model: opts.model,
          inputTokens,
          outputTokens,
          costUsd: estimateCost(opts.model, inputTokens, outputTokens),
          costSource: "estimate",
        },
        finishReason,
      );
    }
    throw e;
  }

  const inputTokens = result.usage.inputTokens ?? 0;
  const outputTokens = result.usage.outputTokens ?? 0;
  const gatewayCost = Number(
    (result.providerMetadata?.gateway as { cost?: unknown } | undefined)?.cost,
  );
  const hasGatewayCost = Number.isFinite(gatewayCost) && gatewayCost > 0;
  return {
    output: result.output as T,
    call: {
      purpose: opts.purpose,
      model: opts.model,
      inputTokens,
      outputTokens,
      costUsd: hasGatewayCost ? gatewayCost : estimateCost(opts.model, inputTokens, outputTokens),
      costSource: hasGatewayCost ? "gateway" : "estimate",
    },
  };
}
