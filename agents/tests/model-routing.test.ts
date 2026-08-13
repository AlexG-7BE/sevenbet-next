import assert from "node:assert/strict";
import { test } from "node:test";

import {
  estimateUpperBoundUsd,
  resolveModelRoute,
} from "../src/model-routing.js";
import { getSpecialist } from "../src/registry.js";

test("registry default model is explicit and observable", () => {
  const specialist = getSpecialist("compliance-gate");
  const route = resolveModelRoute(specialist.defaultTier);

  assert.equal(route.model, "gpt-5.6-sol");
  assert.equal(route.selectionSource, "REGISTRY_DEFAULT");
});

test("explicit cheaper tier never silently escalates", () => {
  const route = resolveModelRoute("high_consequence", { tier: "bulk" });

  assert.equal(route.tier, "bulk");
  assert.equal(route.model, "gpt-5.6-luna");
  assert.equal(route.selectionSource, "EXPLICIT_TIER");
});

test("explicit model is restricted to the closed catalogue", () => {
  assert.throws(() => resolveModelRoute("standard", { model: "unknown-model" }));
  assert.throws(() =>
    resolveModelRoute("standard", {
      tier: "bulk",
      model: "gpt-5.6-luna",
    }),
  );
});

test("cost estimate uses the selected model rates as a conservative upper bound", () => {
  const route = resolveModelRoute("bulk");
  const estimate = estimateUpperBoundUsd(route, {
    inputTokens: 1_000_000,
    outputTokens: 1_000_000,
  });

  assert.equal(estimate, 1.4);
});
