import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { marketAccess } from "../lib/market-access/access";
import {
  ENABLE_TARGETS,
  MARKET_ACCESS_DECISION_REF,
  MARKET_ACCESS_RELEASE,
  assertMarketAccessApplyAuthority,
  derivedTrackingUrl,
  linkHash,
  planDisables,
  type PersistedActivation,
} from "../lib/market-access/release";

const row = (casinoSlug: string, marketCode: string, desiredState: "ACTIVE" | "DISABLED" = "ACTIVE"): PersistedActivation => ({
  id: `${casinoSlug}-${marketCode}`, casinoId: `${casinoSlug}-id`, casinoSlug, marketCode, desiredState,
});

test("the release disables active routes the register closes, and nothing else", () => {
  const plan = planDisables([
    row("casino-redkings", "DK"),
    row("playuzu", "DK"),
    row("goldenplay", "SE"),
    row("goldenplay", "NO"),
    row("playojo", "AT"),
    row("playojo", "DK"),
    row("goldenplay", "IE"),
    row("drueckglueck", "DE"),
    row("jackpotstar", "DK", "DISABLED"),
  ]);
  assert.deepEqual(plan.map(({ activation, closure }) => `${activation.casinoSlug}:${activation.marketCode}:${closure}`), [
    "playojo:AT:OPERATOR_BLOCKS",
    "casino-redkings:DK:OPERATOR_BLOCKS",
    "playuzu:DK:NO_LOCAL_LICENCE",
    "goldenplay:NO:PROHIBITED_BY_LAW",
    "goldenplay:SE:NO_LOCAL_LICENCE",
  ]);
});

test("the German advertising window never takes a licensed route down", () => {
  assert.deepEqual(planDisables([row("turbonino", "DE")]), []);
});

test("every market the release opens is licensed there", () => {
  const evening = new Date("2026-09-28T20:00:00Z");
  for (const target of ENABLE_TARGETS) {
    assert.deepEqual(marketAccess(target.casinoSlug, target.market, evening), { open: true }, `${target.casinoSlug} in ${target.market}`);
  }
  const keys = ENABLE_TARGETS.map((target) => `${target.casinoSlug}:${target.market}`);
  assert.equal(new Set(keys).size, keys.length, "each market is opened once");
});

test("a derived partner link changes only the named parameter and is identified by its hash", () => {
  const source = "https://site.example.invalid/index.php?aname=b4gamble&cg=english";
  const derived = derivedTrackingUrl(source, { cg: "german" });
  assert.equal(derived, "https://site.example.invalid/index.php?aname=b4gamble&cg=german");
  assert.equal(derivedTrackingUrl(source, undefined), source);
  assert.match(linkHash(derived), /^[0-9a-f]{64}$/);
});

test("apply refuses CI, Vercel, a missing confirmation and the wrong database", () => {
  const valid = {
    confirm: MARKET_ACCESS_RELEASE,
    decisionRef: MARKET_ACCESS_DECISION_REF,
    actorEmail: "founder@example.invalid",
    expectedDatabase: "abc",
    actualDatabase: "abc",
    env: {},
  };
  assert.doesNotThrow(() => assertMarketAccessApplyAuthority(valid));
  assert.throws(() => assertMarketAccessApplyAuthority({ ...valid, env: { CI: "true" } }), /FORBIDDEN_IN_CI/);
  assert.throws(() => assertMarketAccessApplyAuthority({ ...valid, env: { VERCEL_ENV: "production" } }), /FORBIDDEN_IN_VERCEL_BUILD/);
  assert.throws(() => assertMarketAccessApplyAuthority({ ...valid, confirm: undefined }), /--confirm/);
  assert.throws(() => assertMarketAccessApplyAuthority({ ...valid, decisionRef: "OTHER" }), /--decision-ref/);
  assert.throws(() => assertMarketAccessApplyAuthority({ ...valid, actorEmail: "nobody" }), /--actor-email/);
  assert.throws(() => assertMarketAccessApplyAuthority({ ...valid, expectedDatabase: "xyz" }), /DATABASE_MISMATCH/);
});

test("the release script never prints a raw partner URL", () => {
  const source = readFileSync("scripts/market-access-release.ts", "utf8");
  assert.match(source, /Output never contains a raw tracking URL/);
  assert.doesNotMatch(source, /console\.info\([^)]*trackingUrl\b(?!\()/);
  assert.doesNotMatch(source, /https:\/\/site\.|go\.superflypartners|record\.betsson/);
});

test("only a Founder-named target may replace a link staged earlier for its market", () => {
  const replacing = ENABLE_TARGETS.filter((target) => target.replacesStagedLink);
  assert.deepEqual(replacing.map((target) => `${target.casinoSlug}:${target.market}`), ["eucasino:DK"]);
  assert.ok(replacing.every((target) => target.replacesStagedLink?.startsWith(MARKET_ACCESS_DECISION_REF)));
  const source = readFileSync("scripts/market-access-release.ts", "utf8");
  assert.match(source, /staged && staged !== hash && !target\.replacesStagedLink/);
});

