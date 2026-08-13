import assert from "node:assert/strict";
import { test } from "node:test";

import { AGENT_KEYS } from "../src/contracts.js";
import { buildSpecialistInstructions } from "../src/policy.js";
import { listSpecialists } from "../src/registry.js";

test("registry contains exactly the eight Wave 1 specialists", () => {
  const specialists = listSpecialists();

  assert.equal(specialists.length, 8);
  assert.deepEqual(
    specialists.map((specialist) => specialist.key),
    [...AGENT_KEYS],
  );
});

test("every specialist has explicit routing, checks, prohibitions, and recommendations", () => {
  for (const specialist of listSpecialists()) {
    assert.ok(specialist.defaultTier);
    assert.ok(specialist.checks.length > 0);
    assert.ok(specialist.prohibitedActions.length > 0);
    assert.ok(specialist.allowedRecommendations.length > 0);
  }
});

test("every specialist inherits shared regulated-first and uncertainty policy", () => {
  for (const specialist of listSpecialists()) {
    const instructions = buildSpecialistInstructions(specialist);

    assert.match(instructions, /regulated-first/);
    assert.match(instructions, /Synthetic Production data is forbidden/);
    assert.match(instructions, /Missing evidence remains UNKNOWN/);
    assert.match(instructions, /Programme\/private behavioural data stays separate/);
    assert.match(instructions, /current site\/page structure as discoverable evidence/);
    assert.match(instructions, new RegExp(`Set agent to exactly "${specialist.key}"`));
  }
});
