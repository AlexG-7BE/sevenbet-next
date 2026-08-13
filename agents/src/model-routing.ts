import { z } from "zod";

export const ModelTierSchema = z.enum([
  "bulk",
  "standard",
  "high_consequence",
]);

export const ModelIdSchema = z.enum([
  "gpt-5.6-luna",
  "gpt-5.6-terra",
  "gpt-5.6-sol",
]);

export type ModelTier = z.infer<typeof ModelTierSchema>;
export type ModelId = z.infer<typeof ModelIdSchema>;
export type ReasoningEffort = "low" | "medium" | "high";

export interface ModelRoute {
  tier: ModelTier;
  model: ModelId;
  reasoningEffort: ReasoningEffort;
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
}

export const MODEL_PRICING_AS_OF = "2026-08-13";
export const MODEL_PRICING_SOURCE =
  "https://developers.openai.com/api/docs/models";

export const MODEL_ROUTES: Readonly<Record<ModelTier, ModelRoute>> = {
  bulk: {
    tier: "bulk",
    model: "gpt-5.6-luna",
    reasoningEffort: "low",
    inputUsdPerMillionTokens: 0.2,
    outputUsdPerMillionTokens: 1.2,
  },
  standard: {
    tier: "standard",
    model: "gpt-5.6-terra",
    reasoningEffort: "medium",
    inputUsdPerMillionTokens: 2,
    outputUsdPerMillionTokens: 12,
  },
  high_consequence: {
    tier: "high_consequence",
    model: "gpt-5.6-sol",
    reasoningEffort: "high",
    inputUsdPerMillionTokens: 5,
    outputUsdPerMillionTokens: 30,
  },
};

export const ModelSelectionSourceSchema = z.enum([
  "REGISTRY_DEFAULT",
  "EXPLICIT_TIER",
  "EXPLICIT_MODEL",
]);

export type ModelSelectionSource = z.infer<
  typeof ModelSelectionSourceSchema
>;

export interface ResolvedModelRoute extends ModelRoute {
  selectionSource: ModelSelectionSource;
}

export interface ModelOverride {
  tier?: string | undefined;
  model?: string | undefined;
}

export function resolveModelRoute(
  defaultTier: ModelTier,
  override: ModelOverride = {},
): ResolvedModelRoute {
  if (override.tier && override.model) {
    throw new Error("Choose either a tier or a model override, not both.");
  }

  if (override.model) {
    const model = ModelIdSchema.parse(override.model);
    const route = Object.values(MODEL_ROUTES).find(
      (candidate) => candidate.model === model,
    );

    if (!route) {
      throw new Error("The selected model is not in the approved catalogue.");
    }

    return { ...route, selectionSource: "EXPLICIT_MODEL" };
  }

  if (override.tier) {
    const tier = ModelTierSchema.parse(override.tier);
    return { ...MODEL_ROUTES[tier], selectionSource: "EXPLICIT_TIER" };
  }

  return {
    ...MODEL_ROUTES[defaultTier],
    selectionSource: "REGISTRY_DEFAULT",
  };
}

export interface TokenUsage {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export function estimateUpperBoundUsd(
  route: ModelRoute,
  usage: Pick<TokenUsage, "inputTokens" | "outputTokens">,
): number {
  const estimate =
    (usage.inputTokens * route.inputUsdPerMillionTokens +
      usage.outputTokens * route.outputUsdPerMillionTokens) /
    1_000_000;

  return Number(estimate.toFixed(8));
}
