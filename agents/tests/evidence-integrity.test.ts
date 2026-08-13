import assert from "node:assert/strict";
import { test } from "node:test";

import {
  OperationalAgentInputSchema,
  OperationalAgentResultSchema,
} from "../src/contracts.js";
import {
  AgentCoreError,
  assertProviderOutputIntegrity,
} from "../src/runner.js";

const input = OperationalAgentInputSchema.parse({
  request: "Review the supplied evidence.",
  evidence: [
    {
      id: "brief",
      kind: "SUPPLIED_FILE",
      title: "Review brief",
      source: "Founder review",
    },
  ],
});

const baseResult = OperationalAgentResultSchema.parse({
  agent: "compliance-gate",
  status: "COMPLETED",
  recommendation: "PASS",
  summary: "The supplied evidence supports the result.",
  findings: [],
  risks: [],
  actions: [],
  evidenceGaps: [],
  confidence: "HIGH",
});

function assertProviderOutputInvalid(result: typeof baseResult): void {
  assert.throws(
    () => assertProviderOutputIntegrity(result, "compliance-gate", input),
    (error) =>
      error instanceof AgentCoreError &&
      error.code === "PROVIDER_OUTPUT_INVALID",
  );
}

test("invented finding evidence IDs are rejected", () => {
  assertProviderOutputInvalid({
    ...baseResult,
    findings: [
      {
        classification: "DETECTED",
        severity: "LOW",
        statement: "A finding.",
        evidenceIds: ["invented"],
      },
    ],
  });
});

test("invented risk evidence IDs are rejected", () => {
  assertProviderOutputInvalid({
    ...baseResult,
    risks: [
      {
        severity: "LOW",
        description: "A risk.",
        evidenceIds: ["invented"],
      },
    ],
  });
});

test("DETECTED findings without evidence are rejected", () => {
  assertProviderOutputInvalid({
    ...baseResult,
    findings: [
      {
        classification: "DETECTED",
        severity: "LOW",
        statement: "A finding.",
        evidenceIds: [],
      },
    ],
  });
});

test("INFERRED findings without evidence are rejected", () => {
  assertProviderOutputInvalid({
    ...baseResult,
    findings: [
      {
        classification: "INFERRED",
        severity: "LOW",
        statement: "A finding.",
        evidenceIds: [],
      },
    ],
  });
});

test("valid supplied evidence references are accepted", () => {
  assert.doesNotThrow(() =>
    assertProviderOutputIntegrity(
      {
        ...baseResult,
        findings: [
          {
            classification: "DETECTED",
            severity: "LOW",
            statement: "A finding.",
            evidenceIds: ["brief"],
          },
        ],
        risks: [
          {
            severity: "LOW",
            description: "A risk.",
            evidenceIds: ["brief"],
          },
        ],
      },
      "compliance-gate",
      input,
    ),
  );
});

test("UNKNOWN findings without evidence remain valid", () => {
  assert.doesNotThrow(() =>
    assertProviderOutputIntegrity(
      {
        ...baseResult,
        findings: [
          {
            classification: "UNKNOWN",
            severity: "LOW",
            statement: "A finding.",
            evidenceIds: [],
          },
        ],
      },
      "compliance-gate",
      input,
    ),
  );
});
