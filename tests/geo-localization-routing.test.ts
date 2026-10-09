import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import { middleware } from "../middleware";
import { firstWaveMarketEvidence } from "../lib/market/first-wave-evidence";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import { productMetadata } from "../lib/market/product-context";
import {
  GEO_LOCALIZATION_INITIAL_PUBLIC_SLUGS,
  PUBLISHED_LANGUAGE_ROUTE_PROFILES,
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

// LANGUAGES-HIDDEN-2026-10-09: Ukrainian and Russian are withdrawn from the public site. The
// translations stay in the repository; nothing chooses them for a visitor.
test("a hidden language is never chosen for a visitor: not by country, browser or saved choice", () => {
  for (const hidden of ["uk", "ru"] as const) {
    assert.equal(languageRouteByPublicSlug(hidden)?.published, false, hidden);
    assert.equal(languageRouteByPublicSlug(hidden)?.indexable, false, hidden);
    assert.equal(languageRouteByPublicSlug(hidden)?.publicationBlocker, "WITHDRAWN_BY_FOUNDER", hidden);
    assert.ok(!PUBLISHED_LANGUAGE_ROUTE_PROFILES.map((profile): string => profile.language).includes(hidden), hidden);
  }

  // Ukraine: the country no longer decides, and neither Ukrainian nor Russian in the browser is taken.
  for (const acceptLanguage of ["ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7", "en-US,en;q=0.9", "uk-UA,uk;q=0.9", "uk-UA,uk;q=0.9,ru;q=0.8", null]) {
    const result = resolvePresentationContext({ trustedCountryCode: "UA", acceptLanguage });
    assert.equal(result.language, "en", String(acceptLanguage));
    assert.equal(result.locale, "en-GB", String(acceptLanguage));
    assert.equal(result.market?.countryCode, "UA");
    assert.equal(result.marketDisplayName, "Ukraine", "the country is named in the page language");
  }
  // The next language the browser asks for is used.
  const german = resolvePresentationContext({ trustedCountryCode: "UA", acceptLanguage: "uk-UA,uk;q=0.9,de;q=0.8" });
  assert.equal(german.language, "de");
  assert.equal(german.source, "ACCEPT_LANGUAGE");

  // Russian in the browser, from anywhere.
  for (const country of ["DE", "LV", "KG", "RU", null]) {
    const result = resolvePresentationContext({ trustedCountryCode: country, acceptLanguage: "ru-RU,ru;q=0.9,en;q=0.8" });
    assert.equal(result.language, "en", String(country));
  }
  assert.equal(resolvePresentationContext({ trustedCountryCode: "DE", acceptLanguage: "ru-RU,ru;q=0.9" }).language, "de", "the market language follows a hidden browser language");
  const russia = resolvePresentationContext({ trustedCountryCode: "RU", acceptLanguage: "ru-RU,ru;q=0.9" });
  assert.equal(russia.language, "en");
  assert.equal(russia.source, "DEFAULT");
  assert.equal(russia.marketDisplayName, "Russia");

  // A choice saved while the language was public no longer applies.
  for (const hidden of ["uk", "ru"] as const) {
    const saved = resolvePresentationContext({ preference: { language: hidden }, trustedCountryCode: "UA", acceptLanguage: "uk-UA" });
    assert.equal(saved.language, "en", hidden);
    assert.notEqual(saved.source, "USER_PREFERENCE", hidden);
  }

  // The same rule keeps French, which was never published, out of negotiation.
  assert.equal(resolvePresentationContext({ acceptLanguage: "fr-CA,fr;q=0.9,sv;q=0.8" }).language, "sv");

  // Published languages are untouched.
  const sweden = resolvePresentationContext({ trustedCountryCode: "SE", acceptLanguage: "en-US,en;q=0.9" });
  assert.equal(sweden.language, "en");
  assert.equal(sweden.source, "ACCEPT_LANGUAGE");
  assert.equal(resolvePresentationContext({ trustedCountryCode: "DE" }).marketDisplayName, "Deutschland");
  const chosen = resolvePresentationContext({ preference: { language: "el" }, trustedCountryCode: "UA", acceptLanguage: "uk-UA" });
  assert.equal(chosen.language, "el");
  assert.equal(chosen.source, "USER_PREFERENCE");
});

test("Production serves no address of a hidden language and sends nobody to one", async () => {
  const hiddenPaths = [
    "/uk", "/uk/casinos", "/uk/help", "/uk/program",
    "/ru", "/ru/bonuses", "/ru/program",
    // The country-shaped addresses that used to redirect to them.
    "/ua", "/ua/casinos", "/ua/program", "/uk-ua/bonuses", "/ru-ru/bonuses",
  ];
  const previous = { vercel: process.env.VERCEL, vercelEnv: process.env.VERCEL_ENV, secret: process.env.BETTER_AUTH_SECRET };
  process.env.BETTER_AUTH_SECRET = "hidden-language-test-secret";
  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "production";
  try {
    for (const headers of [
      { "accept-language": "ru-RU,ru;q=0.9,en;q=0.8", "x-vercel-ip-country": "UA" },
      { "accept-language": "uk-UA,uk;q=0.9", "x-vercel-ip-country": "UA" },
      { "accept-language": "ru-RU,ru;q=0.9", "x-vercel-ip-country": "RU" },
      { "accept-language": "ru-RU,ru;q=0.9", "x-vercel-ip-country": "LV" },
    ]) {
      for (const path of ["/", "/casinos", "/help"]) {
        const negotiated = await middleware(new NextRequest(`https://b4gamble.com${path}`, { headers }));
        assert.equal(negotiated.status, 307, `${path} ${JSON.stringify(headers)}`);
        assert.equal(
          new URL(negotiated.headers.get("location") ?? "http://invalid").pathname,
          path === "/" ? "/en" : `/en${path}`,
          `${path} ${JSON.stringify(headers)}`,
        );
      }
    }

    // No rewrite to a page and no redirect: the application answers these as unknown paths.
    for (const path of hiddenPaths) {
      const response = await middleware(new NextRequest(`https://b4gamble.com${path}`, { headers: { "x-vercel-ip-country": "UA" } }));
      assert.equal(response.headers.get("x-middleware-next"), "1", path);
      assert.equal(response.headers.get("x-middleware-rewrite"), null, path);
      assert.equal(response.headers.get("location"), null, path);
      assert.equal(response.headers.get("content-language"), null, path);
    }

    const published = await middleware(new NextRequest("https://b4gamble.com/de/casinos", { headers: { "x-vercel-ip-country": "UA" } }));
    assert.equal(published.headers.get("content-language"), "de-DE");

    // Outside Production the translations still render at their own address, so they can be reviewed and restored.
    delete process.env.VERCEL_ENV;
    for (const [path, locale] of [["/uk/casinos", "uk-UA"], ["/ru/casinos", "ru-RU"]] as const) {
      assert.equal(parsePublicMarketRoute(path).kind, "CANONICAL_LOCALE", path);
      const preview = await middleware(new NextRequest(`https://b4gamble.com${path}`));
      assert.equal(preview.headers.get("content-language"), locale, path);
    }
  } finally {
    if (previous.secret === undefined) delete process.env.BETTER_AUTH_SECRET; else process.env.BETTER_AUTH_SECRET = previous.secret;
    if (previous.vercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = previous.vercel;
    if (previous.vercelEnv === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous.vercelEnv;
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

// 7 Oct 2026: `/help` with `Accept-Language: it` answered 307 → `/it/help`, a 404.
test("the neutral redirect of Help and Responsible Gambling always lands on a page that exists", async () => {
  const previous = { vercel: process.env.VERCEL, vercelEnv: process.env.VERCEL_ENV };
  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "production";
  try {
    for (const pathname of ["/help", "/responsible-gambling"]) {
      // Ukrainian and Russian are hidden (LANGUAGES-HIDDEN-2026-10-09): their readers get the English page too.
      for (const [language, country] of [["it", "IT"], ["pt", "PT"], ["nl", "NL"], ["fi", "FI"], ["nb", "NO"], ["uk", "UA"], ["ru", "RU"]] as const) {
        const signals: Record<string, string>[] = [
          { "accept-language": `${language}-${country},${language};q=0.9` },
          { "x-vercel-ip-country": country },
          { "accept-language": language, "x-vercel-ip-country": country },
        ];
        for (const headers of signals) {
          const response = await middleware(new NextRequest(`https://b4gamble.com${pathname}?from=footer`, { headers }));
          assert.equal(response.status, 307, `${pathname} ${JSON.stringify(headers)}`);
          const location = new URL(response.headers.get("location") ?? "http://invalid");
          assert.equal(`${location.pathname}${location.search}`, `/en${pathname}?from=footer`, `${pathname} ${JSON.stringify(headers)}`);
          assert.equal(parsePublicMarketRoute(location.pathname).kind, "CANONICAL_LOCALE", location.pathname);
        }
      }
      // A language with verified local safety evidence keeps its own page.
      for (const [language, country] of [["de", "DE"], ["es", "ES"], ["es", "PE"], ["sv", "SE"], ["da", "DK"], ["el", "GR"], ["en", "GB"]] as const) {
        const response = await middleware(new NextRequest(`https://b4gamble.com${pathname}`, {
          headers: { "accept-language": language, "x-vercel-ip-country": country },
        }));
        assert.equal(response.status, 307, `${pathname} ${language}`);
        const location = new URL(response.headers.get("location") ?? "http://invalid");
        assert.equal(location.pathname, `/${language}${pathname}`);
        assert.equal(parsePublicMarketRoute(location.pathname).kind, "CANONICAL_LOCALE", location.pathname);
      }
    }
    // The fallback is for the two safety pages only: the visitor's language still serves everything else.
    const casinos = await middleware(new NextRequest("https://b4gamble.com/casinos", { headers: { "accept-language": "it" } }));
    assert.equal(new URL(casinos.headers.get("location") ?? "http://invalid").pathname, "/it/casinos");
  } finally {
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
