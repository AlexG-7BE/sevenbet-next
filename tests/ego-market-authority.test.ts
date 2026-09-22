import assert from "node:assert/strict";
import test from "node:test";

import { egoFounderGbAuthorityApplies } from "../lib/current-partner-worldwide-authority/ego-market-authority";
import { worldwideFounderGbAuthorityApplies, worldwideLegalDecisionForGeo } from "../lib/current-partner-worldwide-authority/inventory";

test("GB authority covers the 12 UKGC-registered EGO brands and nothing else", () => {
  for (const slug of ["playojo", "regencycasino", "turbonino", "megawayscasino"]) {
    assert.equal(egoFounderGbAuthorityApplies(slug), true, slug);
    assert.equal(worldwideFounderGbAuthorityApplies(slug), true, slug);
  }
  assert.equal(egoFounderGbAuthorityApplies("playuzu"), false);
  assert.equal(egoFounderGbAuthorityApplies("betsson"), false);
});

test("DE opens only for the GGL-whitelisted EGO casinos", () => {
  assert.equal(worldwideLegalDecisionForGeo("DE", "drueckglueck").legalState, "ALLOWED");
  assert.equal(worldwideLegalDecisionForGeo("DE", "turbonino").legalState, "ALLOWED");
  assert.match(worldwideLegalDecisionForGeo("DE", "turbonino").evidence, /gluecksspiel-behoerde\.de/);
  assert.equal(worldwideLegalDecisionForGeo("DE", "playojo").legalState, "ACTION_REQUIRED_REGULATORY");
  assert.equal(worldwideLegalDecisionForGeo("DE").legalState, "ACTION_REQUIRED_REGULATORY");
});

test("GR, Canadian provinces and legally blocked markets stay closed", () => {
  assert.equal(worldwideLegalDecisionForGeo("GR", "regencycasino").legalState, "ACTION_REQUIRED_REGULATORY");
  assert.equal(worldwideLegalDecisionForGeo("CA-QC", "eucasino").legalState, "ACTION_REQUIRED_REGULATORY");
  assert.equal(worldwideLegalDecisionForGeo("FI", "drueckglueck").legalState, "BLOCKED_BY_LAW");
});
