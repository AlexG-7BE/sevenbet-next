import assert from "node:assert/strict";
import test from "node:test";

import { checkAffiliateRouteFromMarket, globalpingFetch } from "../lib/affiliate-health/globalping-fetch";

type Hop = { statusCode: number; headers?: Record<string, string>; body?: string; country?: string };

/** A fake Globalping API: each measurement answers with the next scripted hop. */
function fakeGlobalping(hops: Hop[]) {
  const requested: Array<{ country: string; host: string; path: string; query?: string }> = [];
  let next = 0;
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      requested.push({ country: body.locations[0].country, host: body.measurementOptions.request.host, path: body.measurementOptions.request.path, query: body.measurementOptions.request.query });
      return Response.json({ id: `m${requested.length}` }, { status: 202 });
    }
    assert.match(url, /\/v1\/measurements\/m\d+$/);
    const hop = hops[next++]!;
    return Response.json({
      status: "finished",
      results: [{
        probe: { country: hop.country ?? "DE", city: "Frankfurt", network: "Example" },
        result: { status: "finished", statusCode: hop.statusCode, headers: hop.headers ?? {}, rawBody: hop.body ?? "" },
      }],
    });
  }) as typeof fetch;
  return { fetcher, requested };
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
