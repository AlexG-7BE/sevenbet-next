import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  PublicCommercialActionResolver,
  type PublicCommercialActionSubject,
} from "../lib/commercial/public-commercial-action-resolver";
import type { CommercialJurisdictionAuthority } from "../lib/jurisdiction/commercial-authority";
import type { MarketActivationPublicRoute } from "../lib/market-activation/runtime";
import { temporaryDemoCasinoIds } from "../lib/demo-data/temporary-demo-authority";
import { allowOperatorAuthority, allowOperatorDecision } from "./market-authority.fixtures";

const now = new Date("2030-06-01T00:00:00.000Z");
const subject = { casinoId: "casino-id", casinoSlug: "published-casino", published: true } as const;

function authority(countryCode: string, allowed = true): CommercialJurisdictionAuthority {
  return {
    countryCode,
    commercialAllowed: allowed,
    referralAllowed: allowed,
    reasonCode: allowed ? "POLICY_APPROVED" : "MARKET_RESTRICTED",
    policyVersion: "resolver-test",
  };
}

function routeSource(
  resolve: (marketCode: string) => MarketActivationPublicRoute[] | Promise<MarketActivationPublicRoute[]>,
) {
  return {
    async listPublicRoutes(_casinoIds: string[], marketCode: string) {
      return resolve(marketCode);
    },
  };
}

async function decision(
  resolver: PublicCommercialActionResolver,
  input: Partial<{
    subject: PublicCommercialActionSubject;
    countryCode: string;
    marketCode: string;
    jurisdiction: CommercialJurisdictionAuthority | null;
  }> = {},
) {
  const selectedSubject = input.subject ?? subject;
  return (await resolver.resolveMany({
    subjects: [selectedSubject],
    authority: input.jurisdiction === undefined ? authority(input.countryCode ?? "PE") : input.jurisdiction,
    countryCode: input.countryCode ?? "PE",
    marketCode: input.marketCode ?? input.countryCode ?? "PE",
    product: "CASINO",
    now,
  })).get(selectedSubject.casinoId)!;
}

test("a valid canonical route produces the sole controlled public action", async () => {
  let requestedMarket = "";
  const resolver = new PublicCommercialActionResolver(routeSource((marketCode) => {
    requestedMarket = marketCode;
    return [{ casinoId: subject.casinoId, slug: "published-casino-pe" }];
  }), allowOperatorAuthority, () => true);

  const result = await decision(resolver);
  assert.equal(requestedMarket, "PE");
  assert.deepEqual(result, { action: { href: "/r/published-casino-pe" }, reasonCode: "AVAILABLE" });
  assert.doesNotMatch(JSON.stringify(result), /https?:\/\/|tracking|token|affiliateOffer/i);
});

test("legal denial is intrinsic and prevents the route source from authorizing", async () => {
  let routeReads = 0;
  const resolver = new PublicCommercialActionResolver(routeSource(() => {
    routeReads += 1;
    return [{ casinoId: subject.casinoId, slug: "must-not-authorize" }];
  }), allowOperatorAuthority, () => true);

  const result = await decision(resolver, { jurisdiction: authority("PE", false) });
  assert.equal(result.action, null);
  assert.equal(result.reasonCode, "MARKET_RESTRICTED");
  assert.equal(routeReads, 0);
});

test("publication, demo, redirect-engine and trusted-market failures remain non-actionable", async () => {
  const routes = routeSource(() => [{ casinoId: subject.casinoId, slug: "published-casino-pe" }]);
  const enabled = new PublicCommercialActionResolver(routes, allowOperatorAuthority, () => true);
  const disabled = new PublicCommercialActionResolver(routes, allowOperatorAuthority, () => false);
  assert.equal((await decision(enabled, { subject: { ...subject, published: false } })).reasonCode, "PRODUCT_NOT_PUBLISHED");
  assert.equal((await decision(enabled, {
    subject: { ...subject, casinoId: temporaryDemoCasinoIds[0] },
  })).reasonCode, "DEMONSTRATION_RECORD");
  assert.equal((await decision(disabled)).reasonCode, "REDIRECT_ENGINE_DISABLED");
  assert.equal((await decision(enabled, { jurisdiction: authority("DE") })).reasonCode, "MARKET_CONTEXT_INVALID");
});

test("missing, failed, ambiguous and unsafe route output fails closed", async () => {
  const cases: Array<[string, () => MarketActivationPublicRoute[] | Promise<MarketActivationPublicRoute[]>, string]> = [
    ["missing", () => [], "NO_GOVERNED_ROUTE"],
    ["failed", async () => { throw new Error("route store unavailable"); }, "NO_GOVERNED_ROUTE"],
    ["ambiguous", () => [
      { casinoId: subject.casinoId, slug: "first-route" },
      { casinoId: subject.casinoId, slug: "second-route" },
    ], "AMBIGUOUS_GOVERNED_ROUTE"],
    ["unsafe", () => [{ casinoId: subject.casinoId, slug: "../tracking" }], "UNSAFE_GOVERNED_ROUTE"],
  ];
  for (const [label, routes, reasonCode] of cases) {
    const result = await decision(new PublicCommercialActionResolver(routeSource(routes), allowOperatorAuthority, () => true));
    assert.equal(result.action, null, label);
    assert.equal(result.reasonCode, reasonCode, label);
  }
});

test("GB operator protection and its evidence source both fail closed", async () => {
  const routes = routeSource(() => [{ casinoId: subject.casinoId, slug: "published-casino-gb" }]);
  const blockedOperator = {
    async evaluate() {
      return { ...allowOperatorDecision, referralEligible: false, reasonCodes: ["GB_REDIRECT_CONTRACT_INVALID" as const] };
    },
    async evaluateMany(casinoIds: string[]) {
      const blocked = await this.evaluate();
      return new Map(casinoIds.map((casinoId) => [casinoId, blocked]));
    },
  };
  const unavailableOperator = {
    async evaluate() { throw new Error("evidence unavailable"); },
    async evaluateMany() { throw new Error("evidence unavailable"); },
  };

  const input = { countryCode: "GB", marketCode: "GB", jurisdiction: authority("GB") };
  const blocked = await decision(new PublicCommercialActionResolver(routes, blockedOperator, () => true), input);
  const unavailable = await decision(new PublicCommercialActionResolver(routes, unavailableOperator, () => true), input);
  assert.deepEqual(blocked, { action: null, reasonCode: "GB_REDIRECT_CONTRACT_INVALID" });
  assert.deepEqual(unavailable, { action: null, reasonCode: "EVIDENCE_SOURCE_UNAVAILABLE" });
});

test("one market's missing route cannot suppress another market's valid action", async () => {
  const resolver = new PublicCommercialActionResolver(routeSource((marketCode) => (
    marketCode === "PE" ? [{ casinoId: subject.casinoId, slug: "published-casino-pe" }] : []
  )), allowOperatorAuthority, () => true);
  const peru = await decision(resolver, { countryCode: "PE", marketCode: "PE", jurisdiction: authority("PE") });
  const chile = await decision(resolver, { countryCode: "CL", marketCode: "CL", jurisdiction: authority("CL") });
  assert.deepEqual(peru.action, { href: "/r/published-casino-pe" });
  assert.equal(chile.action, null);
});

test("the canonical resolver has no CRM, MCP, media or raw destination dependency", () => {
  const source = readFileSync("lib/commercial/public-commercial-action-resolver.ts", "utf8");
  assert.doesNotMatch(source, /CommercialOpportunity|opportunityStage|MCP|MediaAsset|creative|trackingUrl|destinationUrl/);
  const activation = readFileSync("lib/market-activation/runtime.ts", "utf8");
  assert.match(activation, /routeVerificationStatus === "HEALTHY"/);
  assert.match(activation, /safeActivationDestination\(record\.primaryTrackingLink\.trackingUrl\)/);
  assert.match(activation, /safeActivationDestination\(record\.primaryTrackingLink\.destinationUrl\)/);
});
