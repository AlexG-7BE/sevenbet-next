import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { checkAffiliateRouteHttp } from "../lib/affiliate-health/checker";
import { isPublicAddress } from "../lib/affiliate-health/public-network-url";
import { affiliateRouteHealthCasinoFilter } from "../lib/repositories/affiliate-route-health.repository";
import { affiliateRouteActionDecision, AffiliateRouteHealthService } from "../lib/services/affiliate-route-health.service";

const noNetworkValidation = async () => undefined;
const expectation = {
  expectedFinalHost: "casino.example",
  expectedPathPrefix: "/pe",
  requiredAttributionParameters: ["aff"],
};

function fetchSequence(...responses: Response[]) {
  return (async () => {
    const response = responses.shift();
    if (!response) throw new Error("unexpected fetch");
    return response;
  }) as typeof fetch;
}

const canonicalClaim = {
  activationId: "activation",
  activationVersion: 7,
  casinoId: "casino",
  casinoSlug: "casino",
  countryCode: "ZZ",
  marketCode: "ZZ",
  offerId: "offer",
  trackingLinkId: "tracking",
  redirectId: "redirect",
  redirectSlug: "casino-welcome",
  persistedVerificationStatus: "HEALTHY",
  persistedLastCheckedAt: new Date("2026-09-07T12:00:00.000Z"),
};

function actionDecision(overrides: Partial<Parameters<typeof affiliateRouteActionDecision>[0]> = {}) {
  return affiliateRouteActionDecision({
    verifierStatus: "HEALTHY",
    reason: "GET_FALLBACK_OK",
    verificationSource: "DIRECT",
    checkedAt: "2026-09-16T12:00:00.000Z",
    lastDirectSuccessAt: "2026-09-16T12:00:00.000Z",
    ...overrides,
  });
}

test("current direct success requires no action", () => {
  assert.deepEqual(actionDecision(), { actionRequired: false, actionReason: null });
});

test("confirmed non-challenge HTTP failure requires action", () => {
  const decision = actionDecision({ verifierStatus: "BROKEN", reason: "HTTP_500" });
  assert.equal(decision.actionRequired, true);
  assert.match(decision.actionReason ?? "", /Confirmed material route defect: HTTP_500/);
});

test("NETWORK_ERROR with a direct success one day ago requires no action", () => {
  const decision = actionDecision({
    verifierStatus: "BROKEN",
    reason: "NETWORK_ERROR",
    verificationSource: null,
    lastDirectSuccessAt: "2026-09-15T12:00:00.000Z",
  });
  assert.deepEqual(decision, { actionRequired: false, actionReason: null });
});

test("TIMEOUT with a direct success six days ago requires no action", () => {
  const decision = actionDecision({
    verifierStatus: "BROKEN",
    reason: "TIMEOUT",
    verificationSource: null,
    lastDirectSuccessAt: "2026-09-10T12:00:00.000Z",
  });
  assert.deepEqual(decision, { actionRequired: false, actionReason: null });
});

test("identified HTTP 403 challenge with a direct success five days ago requires no action", () => {
  const decision = actionDecision({
    verifierStatus: "EXTERNAL_CHALLENGE",
    reason: "HTTP_403",
    lastDirectSuccessAt: "2026-09-11T12:00:00.000Z",
  });
  assert.deepEqual(decision, { actionRequired: false, actionReason: null });
});

test("an inconclusive check requires action only after the universal seven-day window", () => {
  const atThreshold = actionDecision({
    verifierStatus: "DEGRADED",
    reason: "ROUTE_VERIFICATION_INCONCLUSIVE",
    verificationSource: null,
    lastDirectSuccessAt: "2026-09-09T12:00:00.000Z",
  });
  const older = actionDecision({
    verifierStatus: "DEGRADED",
    reason: "ROUTE_VERIFICATION_INCONCLUSIVE",
    verificationSource: null,
    lastDirectSuccessAt: "2026-09-09T11:59:59.999Z",
  });
  assert.equal(atThreshold.actionRequired, false);
  assert.equal(older.actionRequired, true);
  assert.match(older.actionReason ?? "", /7-day freshness threshold/);
});

test("an inconclusive check with no historical direct success requires action", () => {
  const decision = actionDecision({
    verifierStatus: "DEGRADED",
    reason: "ROUTE_VERIFICATION_INCONCLUSIVE",
    verificationSource: null,
    lastDirectSuccessAt: null,
  });
  assert.equal(decision.actionRequired, true);
  assert.match(decision.actionReason ?? "", /No direct successful verification is recorded/);
});

test("wrong destination, attribution failure, and expiry always require action", () => {
  for (const [verifierStatus, reason] of [
    ["CROSS_GEO", "UNEXPECTED_FINAL_DESTINATION"],
    ["ATTRIBUTION_FAILURE", "REQUIRED_ATTRIBUTION_PARAMETER_MISSING"],
    ["EXPIRED", "HTTP_410"],
  ] as const) {
    const decision = actionDecision({ verifierStatus, reason });
    assert.equal(decision.actionRequired, true, verifierStatus);
  }
});

test("a new direct success is recovery and returns actionRequired=false", () => {
  const decision = actionDecision({
    verifierStatus: "HEALTHY",
    reason: "GET_FALLBACK_OK",
    verificationSource: "DIRECT",
    lastDirectSuccessAt: "2026-09-01T12:00:00.000Z",
  });
  assert.deepEqual(decision, { actionRequired: false, actionReason: null });
});

test("health checker follows a finite chain and preserves required attribution", async () => {
  const result = await checkAffiliateRouteHttp({
    url: new URL("https://track.example/click?aff=42"),
    expectation,
    fetcher: fetchSequence(
      new Response(null, { status: 302, headers: { location: "https://casino.example/pe?campaign=42" } }),
      new Response(null, { status: 200 }),
    ),
    validateUrl: noNetworkValidation,
  });
  assert.equal(result.status, "HEALTHY");
  assert.equal(result.redirectCount, 1);
  assert.equal(result.finalHost, "casino.example");

  const wwwEquivalent = await checkAffiliateRouteHttp({
    url: new URL("https://track.example/click?aff=42"),
    expectation: { ...expectation, allowWwwEquivalentFinalHost: true },
    fetcher: fetchSequence(
      new Response(null, { status: 302, headers: { location: "https://www.casino.example/pe?aff=42" } }),
      new Response(null, { status: 200 }),
    ),
    validateUrl: noNetworkValidation,
  });
  assert.equal(wwwEquivalent.status, "HEALTHY");
  assert.equal(wwwEquivalent.finalHost, "www.casino.example");
});

test("4xx, 5xx, expiry, cross-GEO, attribution loss, and redirect loops are distinct", async () => {
  const headAndGet404 = await checkAffiliateRouteHttp({
    url: new URL("https://casino.example/pe?aff=42"), expectation,
    fetcher: fetchSequence(new Response(null, { status: 404 }), new Response(null, { status: 404 })),
    validateUrl: noNetworkValidation,
  });
  assert.equal(headAndGet404.status, "BROKEN");
  assert.equal(headAndGet404.reason, "HTTP_404");
  assert.equal(headAndGet404.method, "GET");

  const cases: Array<[number, string]> = [[500, "BROKEN"], [410, "EXPIRED"]];
  for (const [status, expected] of cases) {
    const result = await checkAffiliateRouteHttp({
      url: new URL("https://casino.example/pe?aff=42"), expectation,
      fetcher: fetchSequence(new Response(null, { status })), validateUrl: noNetworkValidation,
    });
    assert.equal(result.status, expected, String(status));
  }

  const crossGeo = await checkAffiliateRouteHttp({
    url: new URL("https://track.example/click?aff=42"), expectation,
    fetcher: fetchSequence(
      new Response(null, { status: 302, headers: { location: "https://casino.example/se?aff=42" } }),
      new Response(null, { status: 200 }),
    ), validateUrl: noNetworkValidation,
  });
  assert.equal(crossGeo.status, "CROSS_GEO");

  const attribution = await checkAffiliateRouteHttp({
    url: new URL("https://track.example/click"), expectation,
    fetcher: fetchSequence(
      new Response(null, { status: 302, headers: { location: "https://casino.example/pe" } }),
      new Response(null, { status: 200 }),
    ), validateUrl: noNetworkValidation,
  });
  assert.equal(attribution.status, "ATTRIBUTION_FAILURE");

  const loop = await checkAffiliateRouteHttp({
    url: new URL("https://track.example/a?aff=42"), expectation,
    fetcher: fetchSequence(
      new Response(null, { status: 302, headers: { location: "https://track.example/b?aff=42" } }),
      new Response(null, { status: 302, headers: { location: "https://track.example/a?aff=42" } }),
    ), validateUrl: noNetworkValidation,
  });
  assert.equal(loop.status, "BROKEN");
  assert.equal(loop.reason, "REDIRECT_LOOP");
});

test("HEAD rejection fallback and CDN challenges are handled without hiding server failures", async () => {
  const fallback = await checkAffiliateRouteHttp({
    url: new URL("https://casino.example/pe?aff=42"), expectation,
    fetcher: fetchSequence(new Response(null, { status: 405 }), new Response(null, { status: 200 })),
    validateUrl: noNetworkValidation,
  });
  assert.equal(fallback.status, "HEALTHY");
  assert.equal(fallback.method, "GET");

  const attempts: Array<{ method: string | undefined; userAgent: string | null }> = [];
  const head404Fallback = await checkAffiliateRouteHttp({
    url: new URL("https://casino.example/pe?aff=42"), expectation,
    fetcher: (async (_input, init) => {
      attempts.push({
        method: init?.method,
        userAgent: new Headers(init?.headers).get("user-agent"),
      });
      return new Response("<!doctype html><title>Casino welcome</title>", {
        status: attempts.length === 1 ? 404 : 200,
        headers: { "content-type": "text/html" },
      });
    }) as typeof fetch,
    validateUrl: noNetworkValidation,
  });
  assert.equal(head404Fallback.status, "HEALTHY");
  assert.equal(head404Fallback.method, "GET");
  assert.deepEqual(attempts.map((attempt) => attempt.method), ["HEAD", "GET"]);
  assert.match(attempts[1].userAgent ?? "", /^Mozilla\/5\.0 /);

  const head404ThenDisguisedError = await checkAffiliateRouteHttp({
    url: new URL("https://casino.example/pe?aff=42"), expectation,
    fetcher: fetchSequence(
      new Response(null, { status: 404 }),
      new Response("<!doctype html><title>Page not found</title>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    ),
    validateUrl: noNetworkValidation,
  });
  assert.equal(head404ThenDisguisedError.status, "BROKEN");
  assert.equal(head404ThenDisguisedError.reason, "TERMINAL_ERROR_PAGE");

  const challenge = await checkAffiliateRouteHttp({
    url: new URL("https://casino.example/pe?aff=42"), expectation,
    fetcher: fetchSequence(new Response(null, { status: 503, headers: { server: "cloudflare", "cf-ray": "fixture" } })),
    validateUrl: noNetworkValidation,
  });
  assert.equal(challenge.status, "EXTERNAL_CHALLENGE");

  const wrongHostChallenge = await checkAffiliateRouteHttp({
    url: new URL("https://track.example/click?aff=42"), expectation,
    fetcher: fetchSequence(
      new Response(null, { status: 302, headers: { location: "https://wrong.example/pe?aff=42" } }),
      new Response(null, { status: 403 }),
    ),
    validateUrl: noNetworkValidation,
  });
  assert.equal(wrongHostChallenge.status, "CROSS_GEO", "a challenge must not hide an unexpected destination");

  const ordinary503 = await checkAffiliateRouteHttp({
    url: new URL("https://casino.example/pe?aff=42"), expectation,
    fetcher: fetchSequence(new Response(null, { status: 503 })), validateUrl: noNetworkValidation,
  });
  assert.equal(ordinary503.status, "BROKEN");
});

test("new-destination inspection rejects same-host 200 error pages and JSON terminals", async () => {
  const pageNotFound = await checkAffiliateRouteHttp({
    url: new URL("https://casino.example/pe?aff=42"), expectation,
    fetcher: fetchSequence(
      new Response("<!doctype html><title>Page not found</title>", { status: 200, headers: { "content-type": "text/html" } }),
    ),
    validateUrl: noNetworkValidation,
    inspectTerminalContent: true,
  });
  assert.equal(pageNotFound.status, "BROKEN");
  assert.equal(pageNotFound.reason, "TERMINAL_ERROR_PAGE");

  const jsonError = await checkAffiliateRouteHttp({
    url: new URL("https://casino.example/pe?aff=42"), expectation,
    fetcher: fetchSequence(
      new Response('{"error":"invalid link"}', { status: 200, headers: { "content-type": "application/json" } }),
    ),
    validateUrl: noNetworkValidation,
    inspectTerminalContent: true,
  });
  assert.equal(jsonError.status, "BROKEN");
  assert.equal(jsonError.reason, "TERMINAL_JSON_RESPONSE");

  const challenge = await checkAffiliateRouteHttp({
    url: new URL("https://casino.example/pe?aff=42"), expectation,
    fetcher: fetchSequence(
      new Response("<!doctype html><title>Just a moment...</title>", { status: 200, headers: { "content-type": "text/html" } }),
    ),
    validateUrl: noNetworkValidation,
    inspectTerminalContent: true,
  });
  assert.equal(challenge.status, "BROKEN");
  assert.equal(challenge.reason, "TERMINAL_CHALLENGE_PAGE");

  const healthy = await checkAffiliateRouteHttp({
    url: new URL("https://casino.example/pe?aff=42"), expectation,
    fetcher: fetchSequence(
      new Response("<!doctype html><title>Casino welcome</title>", { status: 200, headers: { "content-type": "text/html" } }),
    ),
    validateUrl: noNetworkValidation,
    inspectTerminalContent: true,
  });
  assert.equal(healthy.status, "HEALTHY");
  assert.equal(healthy.method, "GET");
});

test("new-destination inspection uses an ordinary bounded GET rather than a tracker-hostile range prefetch", async () => {
  let observedHeaders = new Headers();
  const result = await checkAffiliateRouteHttp({
    url: new URL("https://casino.example/pe?aff=42"),
    expectation,
    fetcher: (async (_input, init) => {
      observedHeaders = new Headers(init?.headers);
      return new Response("<!doctype html><title>Casino welcome</title>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    }) as typeof fetch,
    validateUrl: noNetworkValidation,
    inspectTerminalContent: true,
  });

  assert.equal(result.status, "HEALTHY");
  assert.equal(observedHeaders.get("range"), null);
  assert.equal(observedHeaders.get("purpose"), null);
  assert.match(observedHeaders.get("user-agent") ?? "", /^Mozilla\/5\.0 /);
});

test("private, local, documentation, multicast, and IPv4-mapped private addresses are refused", () => {
  for (const address of [
    "127.0.0.1", "10.0.0.1", "169.254.169.254", "192.168.1.1",
    "192.0.2.1", "198.51.100.1", "203.0.113.1", "224.0.0.1",
    "::1", "fd00::1", "fec0::1", "ff02::1", "2001:db8::1",
    "::ffff:127.0.0.1", "::ffff:7f00:1",
  ]) {
    assert.equal(isPublicAddress(address), false, address);
  }
  assert.equal(isPublicAddress("1.1.1.1"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
});

test("an empty active-route set is a valid no-action report", async () => {
  const service = new AffiliateRouteHealthService(
    { listClaims: async () => [] },
    { verify: async () => { throw new Error("must not verify"); } },
  );
  const report = await service.run({ now: new Date("2026-09-03T12:00:00.000Z") });
  assert.equal(report.actionRequired, false);
  assert.equal(report.summary.totalRoutes, 0);
  assert.equal(report.summary.routesRequiringAction, 0);
  assert.equal(report.summary.routesNotRequiringAction, 0);
});

test("route-health service audits the exact canonical activation through its existing verifier", async () => {
  let observedActivationId: string | null = null;
  let observedCheckedAt: Date | null = null;
  const service = new AffiliateRouteHealthService(
    { listClaims: async () => [canonicalClaim] },
    { verify: async (activationId, checkedAt) => {
      observedActivationId = activationId;
      observedCheckedAt = checkedAt ?? null;
      return {
        status: "HEALTHY",
        reason: "GET_FALLBACK_OK",
        method: "GET",
        statusCode: 200,
        durationMs: 1,
        redirectCount: 1,
        finalHost: "www.casino.example",
        checkedAt: checkedAt ?? new Date(),
      };
    } },
  );
  const now = new Date("2026-09-08T12:00:00.000Z");
  const report = await service.run({ now });
  assert.equal(observedActivationId, "activation");
  assert.equal(observedCheckedAt, now);
  assert.equal(report.actionRequired, false);
  assert.equal(report.results[0].actionRequired, false);
  assert.equal(report.results[0].currentEvidence.finalHost, "www.casino.example");
  assert.equal(report.results[0].currentEvidence.verificationSource, "DIRECT");
  assert.equal(report.results[0].checkedAt, now.toISOString());
  assert.equal(report.results[0].lastDirectSuccessAt, now.toISOString());
  assert.equal(report.results[0].evidenceRevision, "market-activation:activation:v7");
});

test("canonical relationship gaps and inconclusive verification fail closed without legacy projection", async () => {
  let calls = 0;
  const missing = new AffiliateRouteHealthService(
    { listClaims: async () => [{ ...canonicalClaim, redirectId: null }] },
    { verify: async () => { calls += 1; throw new Error("must not verify incomplete claim"); } },
  );
  const missingReport = await missing.run();
  assert.equal(calls, 0);
  assert.equal(missingReport.results[0].actionRequired, true);
  assert.equal(missingReport.results[0].currentEvidence.verifierStatus, "BROKEN");
  assert.equal(missingReport.results[0].currentEvidence.reason, "ACTIVE_ACTIVATION_RELATIONSHIP_MISSING");

  const inconclusive = new AffiliateRouteHealthService(
    { listClaims: async () => [canonicalClaim] },
    { verify: async () => { throw new Error("MARKET_ACTIVATION_ROUTE_VERIFICATION_INCONCLUSIVE"); } },
  );
  const inconclusiveReport = await inconclusive.run({ now: new Date("2026-09-08T12:00:00.000Z") });
  assert.equal(inconclusiveReport.results[0].actionRequired, false);
  assert.equal(inconclusiveReport.results[0].currentEvidence.verifierStatus, "DEGRADED");
  assert.equal(inconclusiveReport.results[0].currentEvidence.reason, "ROUTE_VERIFICATION_INCONCLUSIVE");
  assert.equal(inconclusiveReport.results[0].currentEvidence.verificationSource, null);
  assert.equal(inconclusiveReport.results[0].lastDirectSuccessAt, "2026-09-07T12:00:00.000Z");
});

test("casino claim filters select either a UUID or a slug without an invalid mixed relation", () => {
  assert.deepEqual(affiliateRouteHealthCasinoFilter("rizk"), { casino: { slug: "rizk" } });
  assert.deepEqual(
    affiliateRouteHealthCasinoFilter("3fa466e8-7680-53ef-b92b-650d9d18b927"),
    { casino: { id: "3fa466e8-7680-53ef-b92b-650d9d18b927" } },
  );
  assert.deepEqual(affiliateRouteHealthCasinoFilter(), {});
});

test("claim selection follows canonical active MarketActivation and automation uses one deduplicated issue", () => {
  const repository = readFileSync("lib/repositories/affiliate-route-health.repository.ts", "utf8");
  assert.match(repository, /prisma\.marketActivation\.findMany/);
  assert.match(repository, /product:\s*"CASINO"[\s\S]*desiredState:\s*"ACTIVE"[\s\S]*status:\s*"ACTIVE"/);
  assert.match(repository, /version:\s*true[\s\S]*routeVerificationStatus:\s*true[\s\S]*routeLastCheckedAt:\s*true/);
  assert.doesNotMatch(repository, /productionEligible|workflowStatus|programme|program:/);
  const service = readFileSync("lib/services/affiliate-route-health.service.ts", "utf8");
  assert.match(service, /marketActivationRouteVerifier/);
  assert.match(service, /marketCode/);
  assert.match(service, /actionRequired/);
  assert.match(service, /verificationSource:\s*"DIRECT"/);
  assert.match(service, /affiliate-route-health-report\.v3/);
  assert.doesNotMatch(service, /PartnerRouteService|partnerRouteService|productionEligible|workflowStatus|marketActivationController|recordRouteVerification/);
  const verifier = readFileSync("lib/market-activation/verifier.ts", "utf8");
  assert.match(verifier, /allowWwwEquivalentFinalHost:\s*true/);
  assert.match(verifier, /inspectTerminalContent:\s*true/);
  assert.match(verifier, /activation\.marketCode/);
  const workflow = readFileSync(".github/workflows/affiliate-route-health.yml", "utf8");
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /GH_REPO: \$\{\{ github\.repository \}\}/);
  assert.match(workflow, /gh issue list --state open/);
  assert.match(workflow, /gh issue edit/);
  assert.match(workflow, /gh issue close/);
  assert.match(workflow, /affiliate-route-health-alert\.mjs/);
  assert.match(workflow, /steps\.alert\.outputs\.notify/);
  assert.match(workflow, /steps\.alert\.outputs\.action_required/);
  assert.doesNotMatch(workflow, /Updated by daily check/);
  assert.doesNotMatch(workflow, /workflow_healthy/);
  assert.doesNotMatch(workflow, /trackingUrl|destinationUrl|portal/i);
  const alert = readFileSync("scripts/affiliate-route-health-alert.mjs", "utf8");
  assert.match(alert, /item\.actionRequired/);
  assert.match(alert, /issueLifecycleAction/);
  assert.doesNotMatch(alert, /alertState|classifyRouteResult|routeFailureStates|ROUTE_BROKEN|VERIFIER_INCONCLUSIVE/);

  const monitoringSources = `${service}\n${alert}\n${workflow}`;
  assert.doesNotMatch(monitoringSources, /goldenplay|rizk/i, "monitoring has no Casino-specific condition");
  assert.doesNotMatch(service, /(?:casinoSlug|casinoId|marketCode|countryCode)\s*(?:===|!==)\s*["']/, "monitoring has no operator/GEO-specific branch");
  assert.doesNotMatch(monitoringSources, /\benum\s+[A-Za-z]/, "monitoring introduces no operational state enum");
});
