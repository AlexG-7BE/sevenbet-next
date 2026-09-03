import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import { middleware } from "../middleware";
import { firstWaveMarketEvidence } from "../lib/market/first-wave-evidence";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import { productMetadata } from "../lib/market/product-context";
import {
  GEO_LOCALIZATION_INITIAL_PUBLIC_SLUGS,
  languageRouteByPublicSlug,
} from "../lib/market/registry";
import { parsePublicMarketRoute } from "../lib/market/routing";

test("public identity is language-only while BCP-47 variants remain registered internally", () => {
  assert.deepEqual(GEO_LOCALIZATION_INITIAL_PUBLIC_SLUGS, ["en", "sv", "es"]);
  assert.deepEqual(languageRouteByPublicSlug("es")?.localeVariants, ["es-ES", "es-PE"]);
  assert.equal(languageRouteByPublicSlug("en")?.published, true);
  assert.equal(languageRouteByPublicSlug("fr")?.published, false);
});

test("language and trusted market resolve independently for the required matrix", () => {
  const cases = [
    ["DE", "de", "DE", "de", "de-DE"],
    ["DE", "el", "DE", "el", "el-GR"],
    ["DE", "es", "DE", "es", "es-ES"],
    ["ES", "es", "ES", "es", "es-ES"],
    ["PE", "es", "PE", "es", "es-PE"],
  ] as const;
  for (const [geo, routeLanguage, market, language, locale] of cases) {
    const result = resolvePresentationContext({ routeLanguage, trustedCountryCode: geo });
    assert.equal(result.marketCountryCode, market);
    assert.equal(result.market?.countryCode, market);
    assert.equal(result.language, language);
    assert.equal(result.locale, locale);
    assert.equal(result.source, "EXPLICIT_ROUTE");
  }

  const preferred = resolvePresentationContext({ preference: { language: "el" }, trustedCountryCode: "DE" });
  assert.equal(preferred.market?.countryCode, "DE");
  assert.equal(preferred.language, "el");
  assert.equal(preferred.locale, "el-GR");
  assert.equal(preferred.source, "USER_PREFERENCE");

  const unknown = resolvePresentationContext({ acceptLanguage: "es-PE,es;q=0.9" });
  assert.equal(unknown.market, null);
  assert.equal(unknown.marketCountryCode, null);
  assert.equal(unknown.language, "es");
  assert.equal(unknown.locale, "es-ES");
  assert.equal(unknown.marketSource, "UNKNOWN");
});

test("URL, language preference and Accept-Language never grant another market", () => {
  const routeAttempt = resolvePresentationContext({ routeMarket: "pe", routeLanguage: "es", trustedCountryCode: "DE" });
  const cookieAttempt = resolvePresentationContext({ preference: { language: "es" }, trustedCountryCode: "DE" });
  const acceptAttempt = resolvePresentationContext({ trustedCountryCode: "DE", acceptLanguage: "es-PE" });
  for (const result of [routeAttempt, cookieAttempt, acceptAttempt]) {
    assert.equal(result.market?.countryCode, "DE");
    assert.equal(result.marketCountryCode, "DE");
  }
});

test("legacy BCP-47 and market paths migrate directly to language canonicals", () => {
  for (const [path, canonical] of [
    ["/es-es/casinos", "/es/casinos"],
    ["/es-pe/casinos", "/es/casinos"],
    ["/de/de/casinos", "/de/casinos"],
    ["/pe/casinos", "/es/casinos"],
    ["/gb/casinos", "/en/casinos"],
  ] as const) {
    const result = parsePublicMarketRoute(path);
    assert.equal(result.kind, "LEGACY_MARKET_ROUTE", path);
    if (result.kind === "LEGACY_MARKET_ROUTE") assert.equal(result.canonicalPath, canonical, path);
  }
});

test("legacy redirects are permanent, one-hop, strip country and preserve safe query", async () => {
  const response = await middleware(new NextRequest("http://127.0.0.1:4173/es-pe/casinos?country=PE&sort=score"));
  assert.equal(response.status, 308);
  const location = new URL(response.headers.get("location") ?? "http://invalid");
  assert.equal(`${location.pathname}${location.search}`, "/es/casinos?sort=score");
  assert.equal(parsePublicMarketRoute(location.pathname).kind, "CANONICAL_LOCALE");

  const retiredComparison = await middleware(new NextRequest("http://127.0.0.1:4173/es/compare?casino=alpha&country=PE"));
  assert.equal(retiredComparison.status, 308);
  const comparisonLocation = new URL(retiredComparison.headers.get("location") ?? "http://invalid");
  assert.equal(`${comparisonLocation.pathname}${comparisonLocation.search}`, "/es/casinos?casino=alpha");
});

test("market-sensitive responses and negotiation redirects isolate cache keys", async () => {
  const previous = {
    secret: process.env.BETTER_AUTH_SECRET,
    vercel: process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV,
  };
  process.env.BETTER_AUTH_SECRET = "geo-language-cache-isolation-test-secret";
  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "production";
  try {
    const canonical = await middleware(new NextRequest("https://b4gamble.com/es/casinos", {
      headers: { "x-vercel-ip-country": "PE" },
    }));
    assert.equal(canonical.status, 200);
    assert.equal(canonical.headers.get("content-language"), "es-PE");
    assert.match(canonical.headers.get("vary") ?? "", /X-Vercel-IP-Country/i);
    assert.match(canonical.headers.get("cache-control") ?? "", /private, no-store/);

    const negotiated = await middleware(new NextRequest("https://b4gamble.com/casinos", {
      headers: { "accept-language": "el", "x-vercel-ip-country": "DE" },
    }));
    assert.equal(negotiated.status, 307);
    assert.equal(new URL(negotiated.headers.get("location") ?? "http://invalid").pathname, "/el/casinos");
    assert.match(negotiated.headers.get("vary") ?? "", /X-Vercel-IP-Country/i);
    assert.match(negotiated.headers.get("vary") ?? "", /Accept-Language/i);
    assert.match(negotiated.headers.get("vary") ?? "", /Cookie/i);
  } finally {
    if (previous.secret === undefined) delete process.env.BETTER_AUTH_SECRET; else process.env.BETTER_AUTH_SECRET = previous.secret;
    if (previous.vercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = previous.vercel;
    if (previous.vercelEnv === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous.vercelEnv;
  }
});

test("language metadata is canonical, language-level and preserves noindex authority", () => {
  const presentation = resolvePresentationContext({ routeLanguage: "es", trustedCountryCode: "PE" });
  const metadata = productMetadata({
    presentation,
    pathname: "/casinos",
    title: "Casinos",
    description: "Registros publicados",
  });
  assert.equal(new URL(String(metadata.alternates?.canonical)).pathname, "/es/casinos");
  assert.equal(metadata.alternates?.languages, undefined);
  assert.deepEqual(metadata.robots, { index: false, follow: true });

  const peru = firstWaveMarketEvidence("PE");
  assert.ok(peru);
  assert.equal(peru.commercialState, "NOT_VERIFIED_FAIL_CLOSED");
  assert.equal(peru.evidence.every((entry) => entry.reviewedAt === "2026-09-03"), true);
});
