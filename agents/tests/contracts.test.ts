import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EvidenceClassificationSchema,
  OperationalAgentInputSchema,
  OperationalAgentResultSchema,
} from "../src/contracts.js";
import { OperationalRunResultSchema } from "../src/run-result.js";

const validResult = {
  agent: "compliance-gate",
  status: "COMPLETED",
  recommendation: "PASS",
  summary: "The supplied neutral proposal stays within the reviewed boundary.",
  findings: [
    {
      classification: "PROPOSED",
      severity: "LOW",
      statement: "The change is a neutral explanatory note.",
      evidenceIds: ["brief"],
    },
  ],
  risks: [],
  actions: [],
  evidenceGaps: [],
  confidence: "HIGH",
} as const;

test("input contract rejects extra properties and missing evidence references", () => {
  assert.equal(
    OperationalAgentInputSchema.safeParse({ request: "Review this.", extra: true })
      .success,
    false,
  );

  assert.equal(
    OperationalAgentInputSchema.safeParse({
      request: "Review this.",
      claims: [
        {
          statement: "A claim",
          category: "GENERAL",
          classification: "PROPOSED",
          evidenceIds: ["missing"],
        },
      ],
    }).success,
    false,
  );
});

test("evidence classifications cannot represent unsupported verified certainty", () => {
  assert.equal(EvidenceClassificationSchema.safeParse("VERIFIED").success, false);
  assert.equal(EvidenceClassificationSchema.safeParse("UNKNOWN").success, true);
});

test("shared result contract is strict and accepts the required envelope", () => {
  assert.equal(OperationalAgentResultSchema.safeParse(validResult).success, true);
  assert.equal(
    OperationalAgentResultSchema.safeParse({ ...validResult, extra: true }).success,
    false,
  );
});

test("run result requires deterministic model, usage, and cost observability", () => {
  const parsed = OperationalRunResultSchema.parse({
    ...validResult,
    execution: {
      providerInvoked: true,
      modelTier: "bulk",
      model: "gpt-5.6-luna",
      modelSelection: "EXPLICIT_TIER",
      reasoningEffort: "low",
      maxTurns: 2,
      timeoutMs: 90_000,
      usage: {
        requests: 1,
        inputTokens: 1_000,
        outputTokens: 200,
        totalTokens: 1_200,
      },
      estimatedUpperBoundUsd: 0.00044,
      pricingAsOf: "2026-08-13",
      pricingSource: "https://developers.openai.com/api/docs/models",
    },
  });

  assert.equal(parsed.execution.model, "gpt-5.6-luna");
  assert.equal(parsed.execution.usage.totalTokens, 1_200);
});
