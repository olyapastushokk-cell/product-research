// Model calls with hard budget checks. Used only inside workflow steps.
import { generateText, Output } from "ai";
import type { z } from "zod";
import { estimateCost, estimateTokens, LIMITS } from "./config";
import type { ModelCallLog } from "./types";

export type BudgetLeft = { modelCalls: number; costUsd: number };

export class BudgetStop extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetStop";
  }
}

export async function callModel<T>(opts: {
  purpose: string;
  model: string;
  instructions: string;
  prompt: string;
  schema: z.ZodType<T>;
  maxOutputTokens: number;
  budget: BudgetLeft;
}): Promise<{ output: T; call: ModelCallLog }> {
  if (opts.budget.modelCalls < 1) {
    throw new BudgetStop(`Model call limit reached (${LIMITS.maxModelCalls})`);
  }
  const worstCase = estimateCost(
    opts.model,
    estimateTokens(opts.instructions.length + opts.prompt.length),
    opts.maxOutputTokens,
  );
  if (worstCase > opts.budget.costUsd) {
    throw new BudgetStop(
      `Cost limit: next call "${opts.purpose}" may cost up to $${worstCase.toFixed(3)}, ` +
        `only $${opts.budget.costUsd.toFixed(3)} of $${LIMITS.maxCostUsd} left`,
    );
  }

  const result = await generateText({
    model: opts.model,
    instructions: opts.instructions,
    prompt: opts.prompt,
    output: Output.object({ schema: opts.schema }),
    maxOutputTokens: opts.maxOutputTokens,
    maxRetries: 1,
  });

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
