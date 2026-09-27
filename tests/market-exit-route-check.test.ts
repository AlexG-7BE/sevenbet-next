import assert from "node:assert/strict";
import test from "node:test";

import { checkAffiliateRouteFromMarket, globalpingFetch } from "../lib/affiliate-health/globalping-fetch";

type Hop = { statusCode: number; headers?: Record<string, string>; body?: string; country?: string; tags?: string[] };

/** A fake Globalping API: each measurement answers with the next scripted hop. */
function fakeGlobalping(hops: Hop[], options: { createStatuses?: number[] } = {}) {
  const requested: Array<{ country: string; host: string; path: string; query?: string }> = [];
  const locations: unknown[] = [];
  const createStatuses = [...options.createStatuses ?? []];
  let next = 0;
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      locations.push(body.locations);
      const status = createStatuses.shift() ?? 202;
      if (status !== 202) return Response.json({ error: { type: status === 422 ? "no_probes_found" : "error" } }, { status });
      requested.push({ country: body.locations[0].country, host: body.measurementOptions.request.host, path: body.measurementOptions.request.path, query: body.measurementOptions.request.query });
      return Response.json({ id: `m${requested.length}` }, { status: 202 });
    }
    assert.match(url, /\/v1\/measurements\/m\d+$/);
    const hop = hops[next++]!;
    return Response.json({
      status: "finished",
      results: [{
        probe: { country: hop.country ?? "DE", city: "Frankfurt", network: "Example", tags: hop.tags ?? ["datacenter-network"] },
        result: { status: "finished", statusCode: hop.statusCode, headers: hop.headers ?? {}, rawBody: hop.body ?? "" },
      }],
    });
  }) as typeof fetch;
  return { fetcher, requested, locations };
}

const fast = { pollIntervalMs: 0 };

test("each hop of a partner chain is requested from the market itself", async () => {
  const api = fakeGlobalping([
    { statusCode: 302, headers: { location: "http://site.partner.example/landing?aname=b4gamble" } },
    { statusCode: 301, headers: { location: "https://www.partner.example/" } },
    { statusCode: 200, headers: { "content-type": "text/html" }, body: "<title>Welcome</title>" },
  ]);
  const result = await checkAffiliateRouteFromMarket({
    url: new URL("https://site.tracker.example/index.php?aname=b4gamble&cg=german"),
    country: "DE",
    expectation: { expectedFinalHost: "partner.example", requiredAttributionParameters: ["aname"], allowWwwEquivalentFinalHost: true },
    globalping: { ...fast, fetcher: api.fetcher },
  });
  assert.equal(result.status, "HEALTHY");
  assert.equal(result.finalHost, "www.partner.example");
  assert.equal(result.redirectCount, 2);
  assert.deepEqual(api.requested.map((request) => request.country), ["DE", "DE", "DE"]);
  assert.deepEqual(api.requested[0], { country: "DE", host: "site.tracker.example", path: "/index.php", query: "aname=b4gamble&cg=german" });
  assert.equal(api.requested[2]?.query, undefined, "an empty query is not sent");
});

test("a SkillOnNet block page served with HTTP 200 is a broken route", async () => {
  const api = fakeGlobalping([{
    statusCode: 200,
    country: "DK",
    headers: { "content-type": "text/html;charset=UTF-8" },
    body: `<script>Object.defineProperty(window, 'SON_CONFIG', { value: Object.freeze({"skin":"CasinoRedKings","country":"DK","page":"danish-block"}) })</script><title>RedKings</title>`,
  }]);
  const result = await checkAffiliateRouteFromMarket({
    url: new URL("https://www.redkings.example/"),
    country: "DK",
    expectation: { expectedFinalHost: "www.redkings.example", requiredAttributionParameters: [] },
    globalping: { ...fast, fetcher: api.fetcher },
  });
  assert.equal(result.status, "BROKEN");
  assert.equal(result.reason, "OPERATOR_BLOCK_PAGE");
});

test("a probe outside the requested market is never trusted", async () => {
  const api = fakeGlobalping([{ statusCode: 200, country: "US" }]);
  await assert.rejects(() => globalpingFetch("DE", { ...fast, fetcher: api.fetcher })("https://www.partner.example/"), /GLOBALPING_PROBE_OUTSIDE_MARKET/);
});

test("the route itself must be HTTPS even though a partner hop may not be", async () => {
  const api = fakeGlobalping([]);
  const result = await checkAffiliateRouteFromMarket({
    url: new URL("http://site.tracker.example/"),
    country: "DE",
    expectation: { expectedFinalHost: "partner.example", requiredAttributionParameters: [] },
    globalping: { ...fast, fetcher: api.fetcher },
  });
  assert.equal(result.status, "BROKEN");
  assert.equal(result.reason, "UNSAFE_HEALTH_TARGET");
  assert.equal(api.requested.length, 0);
});

test("an AWS WAF bot challenge on the expected brand host counts as reaching the brand, a geo-block does not", async () => {
  const challenge = `<!DOCTYPE html><html><head><title>Human Verification</title><script>window.awsWafCookieDomainList = []; window.gokuProps = {"key":"x"};</script></head></html>`;
  const reach = (statusCode: number, body: string, host = "www.brand.example") => checkAffiliateRouteFromMarket({
    url: new URL("https://go.partner.example/c/abc"),
    country: "GB",
    expectation: { expectedFinalHost: "brand.example", requiredAttributionParameters: [], allowWwwEquivalentFinalHost: true },
    globalping: { ...fast, fetcher: fakeGlobalping([
      { statusCode: 302, country: "GB", headers: { location: `https://${host}/` } },
      { statusCode, country: "GB", headers: { "content-type": "text/html", server: "CloudFront" }, body },
    ]).fetcher },
  });
  const healthy = await reach(405, challenge);
  assert.equal(healthy.status, "HEALTHY");
  assert.equal(healthy.reason, "AWS_WAF_CHALLENGE_ON_EXPECTED_HOST");
  assert.equal((await reach(405, "<title>Method Not Allowed</title>")).status, "BROKEN", "a plain 405 stays broken");
  assert.equal((await reach(403, "<title>Forbidden</title>")).status, "EXTERNAL_CHALLENGE", "a 403 geo-block is never healthy");
  assert.equal((await reach(405, challenge, "www.other.example")).status, "CROSS_GEO", "a challenge on the wrong host is not the brand");
});


test("an eyeball-network probe is asked for first and recorded when it answers", async () => {
  const api = fakeGlobalping([{ statusCode: 200, country: "GB", tags: ["eyeball-network"], headers: { "content-type": "text/html" }, body: "<title>Welcome</title>" }]);
  const probes: Array<{ eyeballNetwork: boolean }> = [];
  const result = await checkAffiliateRouteFromMarket({
    url: new URL("https://www.brand.example/"),
    country: "GB",
    expectation: { expectedFinalHost: "brand.example", requiredAttributionParameters: [], allowWwwEquivalentFinalHost: true },
    globalping: { ...fast, fetcher: api.fetcher, preferEyeballNetwork: true, onProbe: (probe) => probes.push(probe) },
  });
  assert.equal(result.status, "HEALTHY");
  assert.deepEqual(api.locations, [[{ country: "GB", tags: ["eyeball-network"] }]]);
  assert.deepEqual(probes.map((probe) => probe.eyeballNetwork), [true]);
});

test("a market without an eyeball-network probe falls back to any probe in that market", async () => {
  const api = fakeGlobalping([{ statusCode: 200, country: "SI", headers: { "content-type": "text/html" }, body: "<title>Welcome</title>" }], { createStatuses: [422] });
  const probes: Array<{ country: string; eyeballNetwork: boolean }> = [];
  const result = await checkAffiliateRouteFromMarket({
    url: new URL("https://www.brand.example/"),
    country: "SI",
    expectation: { expectedFinalHost: "brand.example", requiredAttributionParameters: [], allowWwwEquivalentFinalHost: true },
    globalping: { ...fast, fetcher: api.fetcher, preferEyeballNetwork: true, onProbe: (probe) => probes.push(probe) },
  });
  assert.equal(result.status, "HEALTHY");
  assert.deepEqual(api.locations, [[{ country: "SI", tags: ["eyeball-network"] }], [{ country: "SI" }]]);
  assert.deepEqual(probes, [{ country: "SI", city: "Frankfurt", network: "Example", eyeballNetwork: false }]);
});

test("without the eyeball preference the request is unchanged for existing scripts", async () => {
  const api = fakeGlobalping([{ statusCode: 200, headers: { "content-type": "text/html" }, body: "<title>Welcome</title>" }]);
  await globalpingFetch("DE", { ...fast, fetcher: api.fetcher })("https://www.partner.example/");
  assert.deepEqual(api.locations, [[{ country: "DE" }]]);
});

test("Globalping quota, outage and missing probes surface as GLOBALPING_* with no HTTP status", async () => {
  const check = (createStatuses: number[]) => checkAffiliateRouteFromMarket({
    url: new URL("https://www.brand.example/"),
    country: "GB",
    expectation: { expectedFinalHost: "brand.example", requiredAttributionParameters: [] },
    globalping: { ...fast, fetcher: fakeGlobalping([], { createStatuses }).fetcher, preferEyeballNetwork: true },
  });
  for (const [createStatuses, reason] of [
    [[422, 422], "GLOBALPING_NO_PROBE"],
    [[429], "GLOBALPING_RATE_LIMITED"],
    [[500], "GLOBALPING_UNAVAILABLE"],
    [[422, 429], "GLOBALPING_RATE_LIMITED"],
  ] as const) {
    const result = await check([...createStatuses]);
    assert.equal(result.status, "BROKEN", reason);
    assert.equal(result.reason, reason);
    assert.equal(result.statusCode, null);
  }
});

test("the route deadline stops a measurement that never finishes", async () => {
  const fetcher = (async (_input: RequestInfo | URL, init?: RequestInit) => (init?.method === "POST"
    ? Response.json({ id: "m1" }, { status: 202 })
    : Response.json({ status: "in-progress", results: [] }))) as typeof fetch;
  const started = Date.now();
  const result = await checkAffiliateRouteFromMarket({
    url: new URL("https://www.brand.example/"),
    country: "GB",
    expectation: { expectedFinalHost: "brand.example", requiredAttributionParameters: [] },
    globalping: { fetcher, pollIntervalMs: 10, timeoutMs: 60_000 },
    timeoutMs: 80,
  });
  assert.equal(result.status, "BROKEN");
  assert.equal(result.reason, "TIMEOUT");
  assert.equal(result.statusCode, null);
  assert.ok(Date.now() - started < 2_000, "the route timeout, not Globalping's own, ends the check");
});
