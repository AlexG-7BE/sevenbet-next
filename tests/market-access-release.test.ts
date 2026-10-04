import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { marketAccess } from "../lib/market-access/access";
import { CASINO_MARKETS, MARKET_RULES } from "../lib/market-access/register";
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
    row("hello-casino", "IE"),
    row("playojo", "IE"),
    row("drueckglueck", "DE"),
    row("jackpotstar", "DK", "DISABLED"),
    row("slotsmagic", "IE", "DISABLED"),
  ]);
  assert.deepEqual(plan.map(({ activation, closure }) => `${activation.casinoSlug}:${activation.marketCode}:${closure}`), [
    "playojo:AT:OPERATOR_BLOCKS",
    "casino-redkings:DK:OPERATOR_BLOCKS",
    "playuzu:DK:NO_LOCAL_LICENCE",
    "goldenplay:IE:NO_LOCAL_LICENCE",
    "hello-casino:IE:NO_LOCAL_LICENCE",
    "playojo:IE:NO_LOCAL_LICENCE",
    "goldenplay:NO:PROHIBITED_BY_LAW",
    "goldenplay:SE:NO_LOCAL_LICENCE",
  ]);
});

test("an open market's route left on the registration placeholder is taken down", () => {
  const placeholder = "https://partner-route.invalid/6017be37";
  const plan = planDisables([
    { ...row("goldenplay", "KZ"), trackingUrl: placeholder },
    { ...row("playojo", "GB"), trackingUrl: "https://site.gotoplayojo.com/index.php?aname=b4gamble" },
    { ...row("rizk", "KZ", "DISABLED"), trackingUrl: placeholder },
  ]);
  assert.deepEqual(plan.map(({ activation, closure }) => `${activation.casinoSlug}:${activation.marketCode}:${closure}`), [
    "goldenplay:KZ:PLACEHOLDER_LINK",
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

test("Ireland is closed: the release opens nothing there and takes every Irish route down", () => {
  const rule = MARKET_RULES.IE;
  assert.ok(rule?.regime === "LICENCE_REQUIRED", "Ireland requires an Irish licence (Founder decision, 4 Oct 2026)");
  assert.deepEqual(ENABLE_TARGETS.filter((target) => target.market === "IE"), []);
  const irishRoutes = Object.keys(CASINO_MARKETS).map((casinoSlug) => row(casinoSlug, "IE"));
  assert.equal(planDisables(irishRoutes).length, irishRoutes.length);
  // The Superfly GB routes still derive from the stored Irish link, which a disabled row keeps.
  assert.deepEqual(ENABLE_TARGETS.filter((target) => target.sourceMarket === "IE").map((target) => target.market), Array(6).fill("GB"));
});

test("a corrected local site is the domain the register cites for that market", () => {
  const corrected = ENABLE_TARGETS.filter((target) => target.localSite);
  assert.deepEqual(corrected.map((target) => `${target.casinoSlug}:${target.market}`), ["eucasino:DK"]);
  for (const target of corrected) {
    const site = new URL(target.localSite!);
    assert.equal(site.protocol, "https:");
    const cited = CASINO_MARKETS[target.casinoSlug]?.licensed[target.market] ?? "";
    assert.equal(site.hostname.replace(/^www\./, ""), cited.replace(/^www\./, "").split("/")[0], `${target.casinoSlug} in ${target.market}`);
  }
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

