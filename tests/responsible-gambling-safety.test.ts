import assert from "node:assert/strict";
import test from "node:test";

import {
  genericSafetyResources,
  safetyResponseFor,
} from "../lib/responsible-gambling/safety";

test("configured safety responses are deterministic and suppress commercial content", () => {
  for (const severity of ["SUPPORT", "URGENT", "EMERGENCY"] as const) {
    const response = safetyResponseFor(severity);
    assert.ok(response);
    assert.equal(response.severity, severity);
    assert.ok(response.actions.includes("SUPPRESS_COMMERCIAL_CONTENT"));
    assert.ok(response.actions.includes("ALLOW_SAFE_EXIT"));
  }
});

test("unconfigured values never infer a safety or clinical state", () => {
  assert.equal(safetyResponseFor(undefined), null);
  assert.equal(safetyResponseFor("unknown"), null);
  assert.equal(safetyResponseFor({ severity: "EMERGENCY" }), null);
});

test("generic fallback help avoids ungoverned local hotline claims", () => {
  assert.ok(genericSafetyResources.length >= 3);
  assert.ok(genericSafetyResources.every((resource) => !/\+?\d{3}[\d -]{5,}/.test(resource)));
});
