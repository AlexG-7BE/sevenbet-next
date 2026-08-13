import { z } from "zod";

import { OperationalAgentResultSchema } from "./contracts.js";
import {
  MODEL_PRICING_AS_OF,
  MODEL_PRICING_SOURCE,
  ModelIdSchema,
  ModelSelectionSourceSchema,
  ModelTierSchema,
} from "./model-routing.js";

export const UsageSchema = z
  .object({
    requests: z.number().int().nonnegative(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    totalTokens: z.number().int().nonnegative(),
  })
  .strict();

export const ExecutionMetadataSchema = z
  .object({
    providerInvoked: z.boolean(),
    modelTier: ModelTierSchema,
    model: ModelIdSchema,
    modelSelection: ModelSelectionSourceSchema,
    reasoningEffort: z.enum(["low", "medium", "high"]),
    maxTurns: z.number().int().min(1).max(4),
    timeoutMs: z.number().int().min(5_000).max(180_000),
    usage: UsageSchema,
    estimatedUpperBoundUsd: z.number().nonnegative(),
    pricingAsOf: z.literal(MODEL_PRICING_AS_OF),
    pricingSource: z.literal(MODEL_PRICING_SOURCE),
  })
  .strict();

export const OperationalRunResultSchema = OperationalAgentResultSchema.extend({
  execution: ExecutionMetadataSchema,
}).strict();

export type OperationalRunResult = z.infer<typeof OperationalRunResultSchema>;
