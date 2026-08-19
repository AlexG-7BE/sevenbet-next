import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { AgentKeySchema } from "../src/contracts.js";
import { getSpecialist } from "../src/registry.js";
import { PartnerSafeCrmOperationSchema } from "../src/partner-operations-contract.js";

interface EvalCase { id: string; scenario: string; expectedClassification: string; expectedStage: string; requiredSafety: string[] }

async function corpus() { return JSON.parse(await readFile(new URL("../fixtures/evals/partner-operations.json", import.meta.url), "utf8")) as EvalCase[]; }

test("Partner Operations is canonical and Partner Intelligence is a compatibility alias", () => {
  assert.equal(AgentKeySchema.parse("partner-operations"), "partner-operations");
  assert.equal(getSpecialist("partner-operations").key, "partner-operations");
  assert.equal(getSpecialist("partner-intelligence").key, "partner-operations");
});

test("Partner Operations eval corpus contains all 18 required safety scenarios", async () => {
  const cases = await corpus(); assert.equal(cases.length, 18); assert.equal(new Set(cases.map((item) => item.id)).size, 18);
  for (const item of cases) { assert.ok(item.scenario.length > 8, item.id); assert.ok(item.requiredSafety.length >= 2, item.id); }
  assert.ok(cases.some((item) => item.requiredSafety.includes("COMMERCIAL_FIREWALL_BLOCK")));
  assert.ok(cases.some((item) => item.requiredSafety.includes("NO_EXTERNAL_SEND")));
  assert.ok(cases.some((item) => item.requiredSafety.includes("AGENT_CANNOT_SET_APPROVED")));
  assert.ok(cases.some((item) => item.requiredSafety.includes("NO_ACTIVE")));
});

test("closed operation contract makes authority and external actions impossible", () => {
  const base = { operationId: "eval-op", idempotencyKey: "eval-operation-0001", payload: {} };
  for (const type of ["SET_APPROVED", "SET_ACTIVE", "ACCEPT_TERMS", "SEND_EMAIL", "SUBMIT_APPLICATION", "ENABLE_TRACKING", "ACTIVATE_PROGRAMME", "DEPLOY", "MUTATE_PRODUCTION"]) {
    assert.equal(PartnerSafeCrmOperationSchema.safeParse({ ...base, type }).success, false, type);
  }
});
