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
  const routeAttempt = resolvePresentationContext({ routeLanguage: "es", trustedCountryCode: "DE" });
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

// UKRAINIAN-LANGUAGE-2026-10-07: in Ukraine the country decides the language before the browser does.
test("a visitor in Ukraine opens Ukrainian whatever the browser asks for, unless they chose a language", () => {
  for (const acceptLanguage of ["ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7", "en-US,en;q=0.9", "uk-UA,uk;q=0.9", "de-DE", null]) {
    const result = resolvePresentationContext({ trustedCountryCode: "UA", acceptLanguage });
    assert.equal(result.language, "uk", String(acceptLanguage));
    assert.equal(result.locale, "uk-UA", String(acceptLanguage));
    assert.equal(result.source, "TRUSTED_GEO", String(acceptLanguage));
    assert.equal(result.market?.countryCode, "UA");
    assert.equal(result.marketDisplayName, "Україна");
  }
  const chosen = resolvePresentationContext({ preference: { language: "en" }, trustedCountryCode: "UA", acceptLanguage: "uk-UA" });
  assert.equal(chosen.language, "en");
  assert.equal(chosen.source, "USER_PREFERENCE");
  const explicit = resolvePresentationContext({ routeLanguage: "en", trustedCountryCode: "UA", acceptLanguage: "uk-UA" });
  assert.equal(explicit.language, "en");
  assert.equal(explicit.source, "EXPLICIT_ROUTE");
  assert.equal(explicit.market?.countryCode, "UA");

  // Every other market keeps the browser language first.
  const sweden = resolvePresentationContext({ trustedCountryCode: "SE", acceptLanguage: "en-US,en;q=0.9" });
  assert.equal(sweden.language, "en");
  assert.equal(sweden.source, "ACCEPT_LANGUAGE");
  // Ukrainian outside Ukraine follows the browser, like any language.
  const abroad = resolvePresentationContext({ trustedCountryCode: "PL", acceptLanguage: "uk-UA,uk;q=0.9,pl;q=0.8" });
  assert.equal(abroad.language, "uk");
  assert.equal(abroad.source, "ACCEPT_LANGUAGE");
  assert.equal(abroad.market, null);
});

test("Ukrainian lives at /uk, and the country-shaped addresses reach it in one hop", async () => {
  assert.equal(languageRouteByPublicSlug("uk")?.defaultLocale, "uk-UA");
  assert.equal(languageRouteByPublicSlug("uk")?.published, true);
  assert.equal(languageRouteByPublicSlug("uk")?.indexable, true);
  for (const path of ["/uk", "/uk/casinos", "/uk/bonuses", "/uk/best-offers", "/uk/learn", "/uk/10-steps", "/uk/help", "/uk/responsible-gambling", "/uk/wagering-calculator"]) {
    const result = parsePublicMarketRoute(path);
    assert.equal(result.kind, "CANONICAL_LOCALE", path);
    if (result.kind === "CANONICAL_LOCALE") {
      assert.equal(result.locale, "uk-UA", path);
      assert.equal(result.market.countryCode, "UA", path);
    }
  }
  for (const [path, canonical] of [
    ["/ua", "/uk"],
    ["/ua/casinos", "/uk/casinos"],
    ["/uk-ua/bonuses", "/uk/bonuses"],
    ["/ua/help", "/uk/help"],
  ] as const) {
    const result = parsePublicMarketRoute(path);
    assert.equal(result.kind, "LEGACY_MARKET_ROUTE", path);
    if (result.kind === "LEGACY_MARKET_ROUTE") assert.equal(result.canonicalPath, canonical, path);
  }
  const programme = await middleware(new NextRequest("http://127.0.0.1:4173/ua/program"));
  assert.equal(programme.status, 308);
  assert.equal(new URL(programme.headers.get("location") ?? "http://invalid").pathname, "/uk/program");

  const previous = { vercel: process.env.VERCEL, vercelEnv: process.env.VERCEL_ENV, secret: process.env.BETTER_AUTH_SECRET };
  process.env.BETTER_AUTH_SECRET = "ukraine-language-first-test-secret";
  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "production";
  try {
    for (const path of ["/", "/casinos", "/help"]) {
      const negotiated = await middleware(new NextRequest(`https://b4gamble.com${path}`, {
        headers: { "accept-language": "ru-RU,ru;q=0.9,en;q=0.8", "x-vercel-ip-country": "UA" },
      }));
      assert.equal(negotiated.status, 307, path);
      assert.equal(new URL(negotiated.headers.get("location") ?? "http://invalid").pathname, path === "/" ? "/uk" : `/uk${path}`, path);
    }
    const canonical = await middleware(new NextRequest("https://b4gamble.com/uk/casinos", { headers: { "x-vercel-ip-country": "UA" } }));
    assert.equal(canonical.status, 200);
    assert.equal(canonical.headers.get("content-language"), "uk-UA");
  } finally {
    if (previous.secret === undefined) delete process.env.BETTER_AUTH_SECRET; else process.env.BETTER_AUTH_SECRET = previous.secret;
    if (previous.vercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = previous.vercel;
    if (previous.vercelEnv === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous.vercelEnv;
  }
});

// RUSSIAN-LANGUAGE-2026-10-07: Russian follows the browser like every language; Ukraine keeps Ukrainian first.
test("Russian lives at /ru, follows the browser language and never displaces Ukrainian in Ukraine", () => {
  assert.equal(languageRouteByPublicSlug("ru")?.defaultLocale, "ru-RU");
  assert.equal(languageRouteByPublicSlug("ru")?.published, true);
  assert.equal(languageRouteByPublicSlug("ru")?.indexable, true);
  for (const path of ["/ru", "/ru/casinos", "/ru/bonuses", "/ru/best-offers", "/ru/learn", "/ru/10-steps", "/ru/wagering-calculator"]) {
    const result = parsePublicMarketRoute(path);
    assert.equal(result.kind, "CANONICAL_LOCALE", path);
    if (result.kind === "CANONICAL_LOCALE") assert.equal(result.locale, "ru-RU", path);
  }
  const legacy = parsePublicMarketRoute("/ru-ru/bonuses");
  assert.equal(legacy.kind, "LEGACY_MARKET_ROUTE");
  if (legacy.kind === "LEGACY_MARKET_ROUTE") assert.equal(legacy.canonicalPath, "/ru/bonuses");

  for (const country of ["DE", "LV", "KG", "RU", null]) {
    const result = resolvePresentationContext({ trustedCountryCode: country, acceptLanguage: "ru-RU,ru;q=0.9,en;q=0.8" });
    assert.equal(result.language, "ru", String(country));
    assert.equal(result.locale, "ru-RU", String(country));
  }
  const ukraine = resolvePresentationContext({ trustedCountryCode: "UA", acceptLanguage: "ru-RU,ru;q=0.9,en;q=0.8" });
  assert.equal(ukraine.language, "uk");
  const ukraineChoseRussian = resolvePresentationContext({ preference: { language: "ru" }, trustedCountryCode: "UA", acceptLanguage: "uk-UA" });
  assert.equal(ukraineChoseRussian.language, "ru");
  assert.equal(ukraineChoseRussian.source, "USER_PREFERENCE");
  // The anchor profile grants no market: a Russian page read from Germany stays a German-market page.
  const fromGermany = resolvePresentationContext({ routeLanguage: "ru", trustedCountryCode: "DE" });
  assert.equal(fromGermany.market?.countryCode, "DE");
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
