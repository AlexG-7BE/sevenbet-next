import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  OperationalAgentInputSchema,
  type OperationalAgentInput,
  type OperationalAgentResult,
} from "../src/contracts.js";
import {
  assessPreflight,
  buildDeterministicBlockedResult,
  enforcePreflight,
} from "../src/preflight.js";
import { getSpecialist } from "../src/registry.js";

interface PartnerEvalCase {
  id: string;
  title: string;
  input: OperationalAgentInput;
  expected: {
    status: "COMPLETED" | "NEEDS_REVIEW" | "BLOCKED";
    recommendation: "DRAFT" | "REVIEW" | "BLOCK";
    ruleIds: string[];
    evidenceGapClaims: string[];
    assertions: string[];
  };
}

const partnerDraft: OperationalAgentResult = {
  agent: "partner-intelligence",
  status: "COMPLETED",
  recommendation: "DRAFT",
  summary: "The supplied evidence supports only a bounded research draft.",
  findings: [],
  risks: [],
  actions: [],
  evidenceGaps: [],
  confidence: "MEDIUM",
};

async function loadEvalCases(): Promise<PartnerEvalCase[]> {
  const fixture = await readFile(
    new URL("../fixtures/evals/partner-intelligence.json", import.meta.url),
    "utf8",
  );
  return JSON.parse(fixture) as PartnerEvalCase[];
}

test("Partner Intelligence eval corpus has the required bounded scenarios", async () => {
  const cases = await loadEvalCases();

  assert.deepEqual(
    cases.map((evalCase) => evalCase.id),
    [
      "current-operator-evidence-no-b4gamble-partnership",
      "operator-licence-missing-unknown",
      "affiliate-programme-without-b4gamble-approval",
      "contradictory-supplied-sources",
      "stale-or-undated-commercial-evidence",
      "exact-approval-details-missing",
      "programme-commercial-firewall",
      "neutral-non-commercial-partner-research",
    ],
  );
  assert.ok(cases.every((evalCase) => evalCase.expected.assertions.length > 0));
  const firstCase = cases[0];
  assert.ok(firstCase);
  assert.ok(
    firstCase.expected.assertions.some((assertion) =>
      /Great Britain relevance.*generic register entry/i.test(assertion),
    ),
  );
});

test("Partner Intelligence eval corpus preserves deterministic boundaries", async () => {
  const cases = await loadEvalCases();
  const definition = getSpecialist("partner-intelligence");

  for (const evalCase of cases) {
    const input = OperationalAgentInputSchema.parse(evalCase.input);
    const assessment = assessPreflight(input, "partner-intelligence");
    const result = assessment.requiredDisposition
      ? buildDeterministicBlockedResult(definition, assessment)
      : enforcePreflight(partnerDraft, assessment, definition);

    assert.equal(result.status, evalCase.expected.status, evalCase.id);
    assert.equal(result.recommendation, evalCase.expected.recommendation, evalCase.id);
    assert.deepEqual(
      assessment.issues.map((issue) => issue.ruleId),
      evalCase.expected.ruleIds,
      evalCase.id,
    );
    assert.deepEqual(
      result.evidenceGaps.map((gap) => gap.claim),
      evalCase.expected.evidenceGapClaims,
      evalCase.id,
    );
  }
});

test("Partner Intelligence keeps jurisdiction claims within supplied evidence", () => {
  const definition = getSpecialist("partner-intelligence");
  const instructions = [
    ...definition.checks,
    ...definition.prohibitedActions,
    definition.outputGuidance,
  ].join(" ");

  assert.match(instructions, /jurisdiction or market.*directly supported by supplied evidence/i);
  assert.match(instructions, /generic register entry/i);
  assert.match(instructions, /UNKNOWN.*evidence gap/i);
});
