import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { assertDemoRetirementApplyAuthority } from "../scripts/demo-casino-retirement-core";
import {
  DEMO_CASINO_RETIREMENT_CONFIRMATION,
  demoAffiliateNetworkRetirementManifest,
  demoAffiliateRetirementManifest,
  demoCasinoRetirementManifest,
} from "../scripts/demo-casino-retirement.manifest";

test("retirement authority is a literal immutable allowlist of the 25 RFC-012 identities", () => {
  assert.equal(demoCasinoRetirementManifest.length, 25);
  assert.equal(new Set(demoCasinoRetirementManifest.map((casino) => casino.id)).size, 25);
  assert.equal(new Set(demoCasinoRetirementManifest.map((casino) => casino.slug)).size, 25);
  assert.deepEqual(demoCasinoRetirementManifest[0], {
    id: "00000001-0000-4000-8000-000000000001",
    slug: "demo-northstar",
    name: "Demo Northstar Casino",
    domain: "demo-northstar.example",
  });
  assert.deepEqual(demoCasinoRetirementManifest.at(-1), {
    id: "00000125-0000-4000-8000-000000000001",
    slug: "demo-canopy",
    name: "Demo Canopy Casino",
    domain: "demo-canopy.example",
  });
});

test("the exact RFC-012 affiliate graph is complete and collision-checkable", () => {
  assert.deepEqual(demoAffiliateNetworkRetirementManifest, {
    id: "00000009-0000-4000-8000-000000000001",
    slug: "demo-sevenbet-internal-network",
  });
  assert.equal(demoAffiliateRetirementManifest.length, 5);
  for (const graph of demoAffiliateRetirementManifest) {
    assert.ok(demoCasinoRetirementManifest.some((casino) => casino.id === graph.casinoId));
    assert.equal(new Set([
      graph.programId,
      graph.offerId,
      graph.trackingLinkId,
      graph.redirectId,
      graph.offerRevisionId,
      graph.trackingRevisionId,
      graph.redirectRevisionId,
    ]).size, 7);
  }
});

test("apply requires the exact confirmation, reviewed plan hash and environment confirmation", () => {
  assert.throws(() => assertDemoRetirementApplyAuthority({ confirmation: null, planSha256: null, environmentConfirmation: undefined }), /APPLY_CONFIRMATION_REQUIRED/);
  assert.throws(() => assertDemoRetirementApplyAuthority({ confirmation: DEMO_CASINO_RETIREMENT_CONFIRMATION, planSha256: "bad", environmentConfirmation: DEMO_CASINO_RETIREMENT_CONFIRMATION }), /PLAN_SHA256_REQUIRED/);
  assert.throws(() => assertDemoRetirementApplyAuthority({ confirmation: DEMO_CASINO_RETIREMENT_CONFIRMATION, planSha256: "a".repeat(64), environmentConfirmation: undefined }), /ENV_CONFIRMATION_REQUIRED/);
  assert.doesNotThrow(() => assertDemoRetirementApplyAuthority({ confirmation: DEMO_CASINO_RETIREMENT_CONFIRMATION, planSha256: "a".repeat(64), environmentConfirmation: DEMO_CASINO_RETIREMENT_CONFIRMATION }));
});

test("plan is read-only, apply is exact-ID only and ordinary builds cannot invoke deletion", () => {
  const cli = readFileSync("scripts/demo-casino-retirement.ts", "utf8");
  const core = readFileSync("scripts/demo-casino-retirement-core.ts", "utf8");
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
  assert.match(cli, /SET TRANSACTION READ ONLY/);
  assert.match(cli, /RepeatableRead/);
  assert.match(core, /plan\.planSha256 !== reviewedPlanSha256/);
  assert.match(core, /plan\.existingDemoCasinoCount === 0/);
  assert.match(core, /DELETE FROM "Casino" WHERE "id" = ANY\(\$1::uuid\[\]\)/);
  assert.doesNotMatch(core, /LIKE|startsWith|slug.*DELETE|deleteMany/);
  assert.doesNotMatch(packageJson.scripts.build, /demo-retirement|demo-casino-retirement/);
  assert.doesNotMatch(packageJson.scripts.postinstall, /demo-retirement|demo-casino-retirement/);
});

test("plan blocks unexpected dependencies and real Partner or commercial ownership", () => {
  const core = readFileSync("scripts/demo-casino-retirement-core.ts", "utf8");
  assert.match(core, /DEMO_RETIREMENT_UNEXPECTED_DEPENDENCY/);
  assert.match(core, /DEMO_RETIREMENT_REAL_DATA_CONFLICT/);
  for (const protectedTable of [
    "AffiliateLink",
    "CommercialOpportunity",
    "MarketActivation",
    "PartnerCasinoMarketSupport",
    "PartnerCasinoRelationship",
  ]) assert.match(core, new RegExp(`"${protectedTable}"`));
});

test("Production runtime has no RFC-012 classifier or recreation authority", () => {
  for (const file of [
    "lib/services/public-casino.service.ts",
    "lib/services/public-casino-discovery.service.ts",
    "lib/services/public-comparison.service.ts",
    "lib/services/public-offer.service.ts",
    "lib/commercial/public-commercial-action-resolver.ts",
    "scripts/logo-only-media-build-preflight.ts",
  ]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /isTemporaryDemoCasinoId|temporary-demo-authority|temporary-production-demo-casino\.manifest/);
  }
  const visualFixture = readFileSync("lib/final-handoff/visual-data-fixture.ts", "utf8");
  assert.match(visualFixture, /visual-casino-fixture-/);
  assert.doesNotMatch(visualFixture, /00000001-0000-4000-8000-000000000001|temporaryDemoCasinoIds/);
});
