import assert from "node:assert/strict";
import { test } from "node:test";

import {
  OperationalAgentInputSchema,
  type OperationalAgentResult,
} from "../src/contracts.js";
import {
  assessPreflight,
  enforcePreflight,
} from "../src/preflight.js";
import { getSpecialist } from "../src/registry.js";
import { runOperationalAgent } from "../src/runner.js";

function input(request: string) {
  return OperationalAgentInputSchema.parse({ request });
}

const providerPass: OperationalAgentResult = {
  agent: "compliance-gate",
  status: "COMPLETED",
  recommendation: "PASS",
  summary: "No issue was reported.",
  findings: [],
  risks: [],
  actions: [],
  evidenceGaps: [],
  confidence: "MEDIUM",
};

test("unsupported commercial fact becomes an evidence gap and remains UNKNOWN", () => {
  const unsupported = OperationalAgentInputSchema.parse({
    request: "Review this operator statement.",
    claims: [
      {
        statement: "Operator Alpha holds an applicable GB licence.",
        category: "OPERATOR_LICENCE",
        classification: "UNKNOWN",
        evidenceIds: [],
      },
    ],
  });
  const assessment = assessPreflight(unsupported, "compliance-gate");
  const enforced = enforcePreflight(
    providerPass,
    assessment,
    getSpecialist("compliance-gate"),
  );

  assert.equal(assessment.evidenceGaps.length, 1);
  assert.equal(assessment.requiredDisposition, null);
  assert.equal(enforced.status, "NEEDS_REVIEW");
  assert.equal(enforced.recommendation, "REVIEW");
  assert.match(enforced.evidenceGaps[0]?.impact ?? "", /remain UNKNOWN/);
});

test("synthetic Production data proposal is deterministically blocked without a provider", async () => {
  const result = await runOperationalAgent(
    "compliance-gate",
    input("Seed synthetic casino data directly into Production for the launch."),
    { maxTurns: 4, timeoutMs: 5_000 },
  );

  assert.equal(result.recommendation, "BLOCK");
  assert.equal(result.execution.providerInvoked, false);
  assert.equal(result.execution.maxTurns, 4);
  assert.equal(result.execution.timeoutMs, 5_000);
  assert.equal(result.execution.usage.totalTokens, 0);
});

test("run and timeout limits reject unbounded or out-of-range configuration", async () => {
  await assert.rejects(() =>
    runOperationalAgent(
      "compliance-gate",
      input("Seed synthetic casino data directly into Production for the launch."),
      { maxTurns: 5 },
    ),
  );
  await assert.rejects(() =>
    runOperationalAgent(
      "compliance-gate",
      input("Seed synthetic casino data directly into Production for the launch."),
      { timeoutMs: 181_000 },
    ),
  );
});

test("vulnerability-based commercial targeting is blocked", () => {
  const assessment = assessPreflight(
    input(
      "Segment vulnerable or at-risk users and target them with personalised casino bonus promotions.",
    ),
    "compliance-gate",
  );

  assert.equal(assessment.requiredDisposition, "BLOCK");
  assert.ok(
    assessment.issues.some(
      (issue) => issue.ruleId === "VULNERABILITY_COMMERCIAL_TARGETING",
    ),
  );
});

test("Programme data used for affiliate targeting is blocked", () => {
  const assessment = assessPreflight(
    input(
      "Use private Programme mission answers to personalise affiliate targeting and casino ranking.",
    ),
    "compliance-gate",
  );

  assert.equal(assessment.requiredDisposition, "BLOCK");
  assert.ok(
    assessment.issues.some(
      (issue) => issue.ruleId === "PROGRAMME_COMMERCIAL_MIXING",
    ),
  );
});

test("compliant neutral proposal passes deterministic preflight", () => {
  const assessment = assessPreflight(
    input(
      "Add a neutral internal checklist reminding reviewers to cite supplied evidence and preserve uncertainty.",
    ),
    "compliance-gate",
  );
  const enforced = enforcePreflight(
    providerPass,
    assessment,
    getSpecialist("compliance-gate"),
  );

  assert.equal(assessment.requiredDisposition, null);
  assert.deepEqual(assessment.issues, []);
  assert.equal(enforced.recommendation, "PASS");
});

test("a neutral statement of unchanged boundaries is not treated as a prohibited proposal", () => {
  const assessment = assessPreflight(
    input(
      "This changes no synthetic Production data, Programme behaviour, commercial availability, affiliate setting, or Production configuration.",
    ),
    "compliance-gate",
  );

  assert.deepEqual(assessment.issues, []);
});

test("agent architecture scope creep produces STOP", () => {
  const assessment = assessPreflight(
    input(
      "Let the operational agent package import Prisma and write directly to the Production database schema.",
    ),
    "repo-architecture-guardian",
  );

  assert.equal(assessment.requiredDisposition, "STOP");
  assert.ok(
    assessment.issues.some(
      (issue) => issue.ruleId === "AGENT_ARCHITECTURE_SCOPE_CREEP",
    ),
  );
});
