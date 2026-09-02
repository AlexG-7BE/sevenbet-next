import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { checkAffiliateRouteHttp } from "../lib/affiliate-health/checker";
import { isPublicAddress } from "../lib/affiliate-health/public-network-url";
import { AffiliateRouteHealthService } from "../lib/services/affiliate-route-health.service";

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
});

test("4xx, 5xx, expiry, cross-GEO, attribution loss, and redirect loops are distinct", async () => {
  const cases: Array<[number, string]> = [[404, "BROKEN"], [500, "BROKEN"], [410, "EXPIRED"]];
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

test("HEAD fallback and CDN challenges are handled without hiding server failures", async () => {
  const fallback = await checkAffiliateRouteHttp({
    url: new URL("https://casino.example/pe?aff=42"), expectation,
    fetcher: fetchSequence(new Response(null, { status: 405 }), new Response(null, { status: 200 })),
    validateUrl: noNetworkValidation,
  });
  assert.equal(fallback.status, "HEALTHY");
  assert.equal(fallback.method, "GET");

  const challenge = await checkAffiliateRouteHttp({
    url: new URL("https://casino.example/pe?aff=42"), expectation,
    fetcher: fetchSequence(new Response(null, { status: 503, headers: { server: "cloudflare", "cf-ray": "fixture" } })),
    validateUrl: noNetworkValidation,
  });
  assert.equal(challenge.status, "EXTERNAL_CHALLENGE");

  const ordinary503 = await checkAffiliateRouteHttp({
    url: new URL("https://casino.example/pe?aff=42"), expectation,
    fetcher: fetchSequence(new Response(null, { status: 503 })), validateUrl: noNetworkValidation,
  });
  assert.equal(ordinary503.status, "BROKEN");
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

test("an empty active-route set is a valid healthy report", async () => {
  const service = new AffiliateRouteHealthService(
    { listClaims: async () => [] },
    { resolve: async () => { throw new Error("must not resolve"); } },
  );
  const report = await service.run({ now: new Date("2026-09-03T12:00:00.000Z") });
  assert.equal(report.healthy, true);
  assert.equal(report.noActiveRoutes, true);
  assert.equal(report.summary.routes, 0);
});

test("claim selection is active-only and automation alerts through one deduplicated issue", () => {
  const repository = readFileSync("lib/repositories/affiliate-route-health.repository.ts", "utf8");
  assert.match(repository, /productionEligible:\s*true/);
  assert.match(repository, /trackingLink:\s*\{[\s\S]*active:\s*true[\s\S]*offer:\s*\{[\s\S]*status:\s*"ACTIVE"[\s\S]*workflowStatus:\s*"PUBLISHED"/);
  const service = readFileSync("lib/services/affiliate-route-health.service.ts", "utf8");
  assert.match(service, /PRODUCTION_AUTHORITY_EXPIRED/);
  assert.match(service, /destinationUrl/);
  const workflow = readFileSync(".github/workflows/affiliate-route-health.yml", "utf8");
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /gh issue list --state open/);
  assert.match(workflow, /gh issue edit/);
  assert.match(workflow, /gh issue close/);
  assert.doesNotMatch(workflow, /trackingUrl|destinationUrl|portal/i);
});
