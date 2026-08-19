import process from "node:process";

import { z } from "zod";

import {
  AgentKeySchema,
  OperationalAgentInputSchema,
  OperationalAgentResultSchema,
  type AgentKey,
  type OperationalAgentInput,
  type OperationalAgentResult,
} from "./contracts.js";
import {
  MODEL_PRICING_AS_OF,
  MODEL_PRICING_SOURCE,
  estimateUpperBoundUsd,
  resolveModelRoute,
  type ModelOverride,
  type ResolvedModelRoute,
  type TokenUsage,
} from "./model-routing.js";
import { buildSpecialistInstructions, serializeUntrustedInput } from "./policy.js";
import {
  assessPreflight,
  buildDeterministicBlockedResult,
  enforcePreflight,
  type PreflightAssessment,
} from "./preflight.js";
import { getSpecialist } from "./registry.js";
import {
  OperationalRunResultSchema,
  type OperationalRunResult,
} from "./run-result.js";

const RunLimitsSchema = z
  .object({
    maxTurns: z.number().int().min(1).max(4).default(2),
    timeoutMs: z.number().int().min(5_000).max(180_000).default(90_000),
  })
  .strict();

export interface OperationalRunOptions extends ModelOverride {
  maxTurns?: number | undefined;
  timeoutMs?: number | undefined;
}

export class AgentCoreError extends Error {
  constructor(
    readonly code:
      | "OPENAI_API_KEY_REQUIRED"
      | "PROVIDER_OUTPUT_INVALID"
      | "PROVIDER_RUN_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "AgentCoreError";
  }
}

function buildExecutionMetadata(
  providerInvoked: boolean,
  route: ResolvedModelRoute,
  limits: z.infer<typeof RunLimitsSchema>,
  usage: TokenUsage,
) {
  return {
    providerInvoked,
    modelTier: route.tier,
    model: route.model,
    modelSelection: route.selectionSource,
    reasoningEffort: route.reasoningEffort,
    maxTurns: limits.maxTurns,
    timeoutMs: limits.timeoutMs,
    usage,
    estimatedUpperBoundUsd: estimateUpperBoundUsd(route, usage),
    pricingAsOf: MODEL_PRICING_AS_OF,
    pricingSource: MODEL_PRICING_SOURCE,
  } as const;
}

function assertKnownEvidenceReferences(
  evidenceIds: readonly string[],
  suppliedEvidenceIds: ReadonlySet<string>,
): void {
  if (evidenceIds.some((evidenceId) => !suppliedEvidenceIds.has(evidenceId))) {
    throw new AgentCoreError(
      "PROVIDER_OUTPUT_INVALID",
      "The provider result cited evidence that was not supplied.",
    );
  }
}

export function assertProviderOutputIntegrity(
  result: OperationalAgentResult,
  agent: AgentKey,
  input: OperationalAgentInput,
): void {
  const definition = getSpecialist(agent);

  if (result.agent !== agent) {
    throw new AgentCoreError(
      "PROVIDER_OUTPUT_INVALID",
      "The provider result named a different specialist.",
    );
  }

  if (!definition.allowedRecommendations.includes(result.recommendation)) {
    throw new AgentCoreError(
      "PROVIDER_OUTPUT_INVALID",
      "The provider result used a recommendation outside the specialist contract.",
    );
  }

  const suppliedEvidenceIds = new Set(input.evidence.map((item) => item.id));

  for (const finding of result.findings) {
    if (
      (finding.classification === "DETECTED" ||
        finding.classification === "INFERRED") &&
      finding.evidenceIds.length === 0
    ) {
      throw new AgentCoreError(
        "PROVIDER_OUTPUT_INVALID",
        "Detected and inferred findings require supplied evidence.",
      );
    }

    assertKnownEvidenceReferences(finding.evidenceIds, suppliedEvidenceIds);
  }

  for (const risk of result.risks) {
    assertKnownEvidenceReferences(risk.evidenceIds, suppliedEvidenceIds);
  }
}

function buildProviderInput(
  input: OperationalAgentInput,
  preflight: PreflightAssessment,
): string {
  return serializeUntrustedInput({
    input,
    deterministicPreflight: preflight,
  });
}

function requireRuntimeApiKey(): void {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new AgentCoreError(
      "OPENAI_API_KEY_REQUIRED",
      "A live run requires OPENAI_API_KEY in the process environment.",
    );
  }
}

export async function runOperationalAgent(
  agentValue: unknown,
  inputValue: unknown,
  options: OperationalRunOptions = {},
): Promise<OperationalRunResult> {
  const parsedAgentKey = AgentKeySchema.parse(agentValue);
  const agentKey: AgentKey = parsedAgentKey === "partner-intelligence" ? "partner-operations" : parsedAgentKey;
  const input = OperationalAgentInputSchema.parse(inputValue);
  const definition = getSpecialist(agentKey);
  const limits = RunLimitsSchema.parse({
    maxTurns: options.maxTurns,
    timeoutMs: options.timeoutMs,
  });
  const route = resolveModelRoute(definition.defaultTier, {
    tier: options.tier,
    model: options.model,
  });
  const preflight = assessPreflight(input, agentKey);
  const zeroUsage: TokenUsage = {
    requests: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  };

  if (preflight.requiredDisposition) {
    return OperationalRunResultSchema.parse({
      ...buildDeterministicBlockedResult(definition, preflight),
      execution: buildExecutionMetadata(false, route, limits, zeroUsage),
    });
  }

  requireRuntimeApiKey();

  try {
    const { Agent, Runner, setTracingDisabled } = await import("@openai/agents");

    setTracingDisabled(true);

    const agent = new Agent({
      name: definition.name,
      instructions: buildSpecialistInstructions(definition),
      model: route.model,
      modelSettings: {
        maxTokens: 6_000,
        reasoning: { effort: route.reasoningEffort },
        retry: { maxRetries: 0 },
        store: false,
        text: { verbosity: "low" },
      },
      outputType: OperationalAgentResultSchema,
      tools: [],
      handoffs: [],
    });
    const runner = new Runner({
      tracingDisabled: true,
      traceIncludeSensitiveData: false,
    });
    const result = await runner.run(agent, buildProviderInput(input, preflight), {
      maxTurns: limits.maxTurns,
      signal: AbortSignal.timeout(limits.timeoutMs),
    });

    if (!result.finalOutput) {
      throw new AgentCoreError(
        "PROVIDER_OUTPUT_INVALID",
        "The provider returned no final structured output.",
      );
    }

    const providerResult = OperationalAgentResultSchema.parse(result.finalOutput);
    assertProviderOutputIntegrity(providerResult, agentKey, input);

    const finalResult = enforcePreflight(providerResult, preflight, definition);
    const usage: TokenUsage = {
      requests: result.state.usage.requests,
      inputTokens: result.state.usage.inputTokens,
      outputTokens: result.state.usage.outputTokens,
      totalTokens: result.state.usage.totalTokens,
    };

    return OperationalRunResultSchema.parse({
      ...finalResult,
      execution: buildExecutionMetadata(true, route, limits, usage),
    });
  } catch (error) {
    if (error instanceof AgentCoreError) {
      throw error;
    }

    throw new AgentCoreError(
      "PROVIDER_RUN_FAILED",
      "The bounded provider run failed. No raw provider error was logged.",
    );
  }
}
