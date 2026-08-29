import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NextRequest } from "next/server";

import generatedPages from "../lib/final-handoff/generated-pages.json" with { type: "json" };
import { transformCommonHandoff, transformHomeHandoff } from "../lib/final-handoff/transforms";
import { HOME_SOURCE_COPY, homeMetadata, homeTranslation } from "../lib/i18n/home-catalog";
import { publicFooterMessages, publicShellMessages } from "../lib/i18n/public-shell-catalog";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { jurisdictionResolver } from "../lib/jurisdiction/resolver";
import {
  INITIAL_EUROPEAN_MARKET_PROFILES,
  MARKET_PROFILES,
  localizedMarketPath,
  marketProfileByCountry,
  marketProfileByRouteMarket,
} from "../lib/market/registry";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import {
  commercialAuthorityForPresentation,
  localizedProductIndexingApproved,
  productHref,
  productMetadata,
  PRODUCT_TRANSLATION_REVIEW_STATE,
} from "../lib/market/product-context";
import {
  parsePresentationPreference,
  PRESENTATION_PREFERENCE_COOKIE,
  serializePresentationPreference,
} from "../lib/market/presentation-preference";
import {
  localizePublicHref,
  localizePublicPath,
  parseLocalizedPublicPath,
  PRESENTATION_LANGUAGE_HEADER,
  PRESENTATION_MARKET_HEADER,
  stripLocalizedPublicPrefix,
} from "../lib/market/routing";
import { POST as updatePresentationPreference } from "../app/api/presentation/route";
import { middleware } from "../middleware";
import { parsePublicComparisonQuery, serializePublicComparisonQuery } from "../lib/public-comparison/query";
import { allowJurisdictionAuthority } from "./market-authority.fixtures";

test("initial market registry exposes the partner-readiness tranche without implying commercial authority", () => {
  assert.deepEqual(MARKET_PROFILES.map((profile) => profile.countryCode), ["GB", "DE", "IT", "ES", "PT", "GR", "NL", "SE", "DK", "FI", "NO", "CA"]);
  for (const profile of MARKET_PROFILES) {
    assert.equal(profile.commercialPresentationState, "AUTHORITY_REQUIRED");
  }
  assert.equal(marketProfileByCountry("de")?.defaultLocale, "de-DE");
  assert.equal(marketProfileByCountry("it")?.defaultLocale, "it-IT");
  assert.equal(marketProfileByCountry("es")?.defaultLocale, "es-ES");
  assert.equal(marketProfileByCountry("pt")?.defaultLocale, "pt-PT");
  assert.equal(marketProfileByCountry("gr")?.defaultLocale, "el-GR");
  assert.equal(marketProfileByCountry("nl")?.defaultLocale, "nl-NL");
  assert.equal(marketProfileByRouteMarket("SE")?.countryCode, "SE");
});

test("all eleven European runtime profiles exist in their approved order", () => {
  assert.deepEqual(
    INITIAL_EUROPEAN_MARKET_PROFILES.map((profile) => `${profile.countryCode}:${profile.defaultLocale}`),
    ["GB:en-GB", "DE:de-DE", "IT:it-IT", "ES:es-ES", "PT:pt-PT", "GR:el-GR", "NL:nl-NL", "SE:sv-SE", "DK:da-DK", "FI:fi-FI", "NO:nb-NO"],
  );
});

test("localized paths keep market and language explicit", () => {
  const germany = marketProfileByCountry("DE");
  const italy = marketProfileByCountry("IT");
  const spain = marketProfileByCountry("ES");
  const portugal = marketProfileByCountry("PT");
  const greece = marketProfileByCountry("GR");
  const netherlands = marketProfileByCountry("NL");
  const canada = marketProfileByCountry("CA");
  assert.ok(germany);
  assert.ok(italy);
  assert.ok(spain);
  assert.ok(portugal);
  assert.ok(greece);
  assert.ok(netherlands);
  assert.ok(canada);
  assert.equal(localizedMarketPath(germany, "de-DE"), "/de/de/");
  assert.equal(localizedMarketPath(italy, "it-IT"), "/it/it/");
  assert.equal(localizedMarketPath(spain, "es-ES"), "/es/es/");
  assert.equal(localizedMarketPath(portugal, "pt-PT"), "/pt/pt/");
  assert.equal(localizedMarketPath(greece, "el-GR"), "/gr/el/");
  assert.equal(localizedMarketPath(netherlands, "nl-NL"), "/nl/nl/");
  assert.equal(localizedMarketPath(germany, "de-DE", "/casinos"), "/de/de/casinos");
  assert.equal(localizedMarketPath(canada, "fr-CA", "/help"), "/ca/fr/help");
  assert.throws(() => localizedMarketPath(germany, "en-GB"));
});

test("localized routing validates market-language pairs and preserves supported public paths", () => {
  const germany = marketProfileByCountry("DE");
  const spain = marketProfileByCountry("ES");
  assert.ok(germany);
  assert.ok(spain);
  assert.deepEqual(parseLocalizedPublicPath("/de/de/"), { market: germany, locale: "de-DE", pathname: "/" });
  assert.equal(parseLocalizedPublicPath("/de/en/"), null);
  assert.equal(parseLocalizedPublicPath("/xx/xx/"), null);
  assert.equal(parseLocalizedPublicPath("/de/de/admin"), null);
  assert.equal(stripLocalizedPublicPrefix("/de/de/casinos"), "/casinos");
  assert.equal(localizePublicPath(spain, "es-ES", "/de/de/casinos"), "/es/es/casinos");
  assert.equal(localizePublicPath(germany, "de-DE", "/compare?casino=alpha&casino=beta"), "/de/de/compare?casino=alpha&casino=beta");
  assert.equal(localizePublicPath(spain, "es-ES", "/privacy"), "/es/es/");
  assert.equal(localizePublicHref("/learn", "/de/de/", germany, "de-DE"), "/de/de/learn");
  assert.equal(localizePublicHref("/help", "/de/de/", germany, "de-DE"), "/help");
});

test("all eleven European product catalogs are complete Preview drafts without English object fallback", () => {
  const collect = (value: unknown): string[] => typeof value === "string"
    ? [value]
    : value && typeof value === "object"
      ? Object.values(value).flatMap(collect)
      : [];
  for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
    const values = collect(productPageMessages(profile.defaultLocale));
    assert.ok(values.length > 100, profile.defaultLocale);
    assert.ok(values.every((value) => value.trim().length > 0), `${profile.defaultLocale} contains empty product copy`);
    assert.equal(
      PRODUCT_TRANSLATION_REVIEW_STATE[profile.defaultLocale],
      profile.defaultLocale === "en-GB" ? "APPROVED_BASELINE" : "MACHINE_DRAFT",
    );
    const presentation = resolvePresentationContext({ routeMarket: profile.routeMarket, routeLanguage: profile.defaultLocale.split("-")[0] });
    for (const pathname of ["/best-offers", "/casinos", "/bonuses", "/casino/example", "/compare?casino=example"]) {
      assert.equal(productHref(presentation, pathname), localizedMarketPath(profile, profile.defaultLocale, pathname));
    }
  }
  assert.notEqual(productPageMessages("es-ES").bestOffers.commissionNote, productPageMessages("en-GB").bestOffers.commissionNote);
  assert.notEqual(productPageMessages("el-GR").comparison.unavailable, productPageMessages("en-GB").comparison.unavailable);
});

test("localized product links, canonicals and reciprocal alternates preserve explicit presentation", () => {
  const presentation = resolvePresentationContext({ routeMarket: "de", routeLanguage: "de", trustedCountryCode: "GB" });
  assert.equal(productHref(presentation, "/casino/example?from=compare"), "/de/de/casino/example?from=compare");
  assert.equal(productHref(presentation, "/methodology"), "/methodology");
  const metadata = productMetadata({ presentation, pathname: "/casinos", title: "Titel", description: "Beschreibung" });
  assert.equal(new URL(String(metadata.alternates?.canonical)).pathname, "/de/de/casinos");
  const languages = metadata.alternates?.languages as Record<string, string>;
  assert.equal(new URL(languages["de-DE"]).pathname, "/de/de/casinos");
  assert.equal(new URL(languages["es-ES"]).pathname, "/es/es/casinos");
  assert.equal(Object.keys(languages).length, INITIAL_EUROPEAN_MARKET_PROFILES.length + 1);
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.equal(metadata.openGraph && "locale" in metadata.openGraph ? metadata.openGraph.locale : null, "de_DE");

  const differentGeo = resolvePresentationContext({ routeMarket: "de", routeLanguage: "de", trustedCountryCode: "NO" });
  const second = productMetadata({ presentation: differentGeo, pathname: "/casinos", title: "Titel", description: "Beschreibung" });
  assert.equal(second.alternates?.canonical, metadata.alternates?.canonical, "geo cannot mutate an explicit canonical");
});

test("presentation and commercial jurisdiction must match before any authority reaches a product service", () => {
  const gb = allowJurisdictionAuthority;
  const de = { ...gb, countryCode: "DE" } as const;
  assert.equal(commercialAuthorityForPresentation(gb, "DE"), null);
  assert.equal(commercialAuthorityForPresentation(de, "GB"), null);
  assert.equal(commercialAuthorityForPresentation(gb, "GB"), gb);
  const presentation = resolvePresentationContext({ routeMarket: "de", routeLanguage: "de", trustedCountryCode: "GB" });
  assert.equal("commercialAllowed" in presentation, false);
});

test("localized Compare defaults to its presentation country and preserves selection query", () => {
  const query = parsePublicComparisonQuery({ casino: ["alpha", "beta"], differences: "true" }, "DE");
  assert.equal(query.country, "DE");
  assert.equal(serializePublicComparisonQuery(query).toString(), "casino=alpha&casino=beta&country=DE&differences=true");
  const germany = marketProfileByCountry("DE");
  assert.ok(germany);
  assert.equal(localizePublicPath(germany, "de-DE", `/casinos?${serializePublicComparisonQuery(query)}`), "/de/de/casinos?casino=alpha&casino=beta&country=DE&differences=true");
});

test("localized sitemap publication is review-gated and its market loader has no request-path GB literal", () => {
  for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) assert.equal(localizedProductIndexingApproved(profile.defaultLocale), false);
  const source = readFileSync("app/sitemap.ts", "utf8");
  assert.match(source, /loadMarketSitemapSnapshot\(market/);
  assert.match(source, /defaultEditorialCountry: market\.countryCode/);
  assert.doesNotMatch(source, /country:\s*["']GB["']/);
  assert.match(source, /localizedProductIndexingApproved/);
});

test("explicit localized route wins over preference and trusted geo", () => {
  const result = resolvePresentationContext({
    routeMarket: "se",
    routeLanguage: "sv",
    preference: { countryCode: "DE", locale: "de-DE" },
    trustedCountryCode: "GB",
  });
  assert.equal(result.market.countryCode, "SE");
  assert.equal(result.locale, "sv-SE");
  assert.equal(result.source, "EXPLICIT_ROUTE");
  assert.equal(result.explicitRouteValid, true);
});

test("user presentation preference can select presentation but is not a commercial authority object", () => {
  const result = resolvePresentationContext({
    preference: { countryCode: "FI", locale: "fi-FI" },
    trustedCountryCode: "GB",
  });
  assert.equal(result.market.countryCode, "FI");
  assert.equal(result.locale, "fi-FI");
  assert.equal(result.source, "USER_PREFERENCE");
  assert.equal("commercialAllowed" in result, false);
  assert.equal("referralAllowed" in result, false);
});

test("presentation preference serialization is strict, stale-safe and contains no authority", () => {
  const germany = marketProfileByCountry("DE");
  assert.ok(germany);
  const serialized = serializePresentationPreference(germany, "de-DE");
  assert.equal(serialized, "v1.DE.de-DE");
  assert.deepEqual(parsePresentationPreference(serialized), { countryCode: "DE", locale: "de-DE" });
  assert.equal(parsePresentationPreference("v1.DE.en-GB"), null);
  assert.equal(parsePresentationPreference("v0.DE.de-DE"), null);
  assert.equal(parsePresentationPreference("commercialAllowed=true"), null);
});

test("a presentation preference cannot grant jurisdiction commercial or referral authority", async () => {
  const presentation = resolvePresentationContext({
    preference: { countryCode: "DE", locale: "de-DE" },
    trustedCountryCode: "GB",
  });
  const now = new Date("2026-08-29T12:00:00.000Z");
  const authority = await jurisdictionResolver.resolve({
    accountCountry: null,
    now,
    requestCountrySignal: { countryCode: "GB", observedAt: now, trust: "TRUSTED" },
    routeCountryOrMarketSlug: null,
    userSelectedCountry: null,
  });
  assert.equal(presentation.market.countryCode, "DE");
  assert.equal(authority.countryCode, "GB");
  assert.equal(authority.commercialAllowed, false);
  assert.equal(authority.referralAllowed, false);
});

test("trusted geo selects expanded partner-ready markets and unsupported geo falls back deterministically to GB", () => {
  const supported = INITIAL_EUROPEAN_MARKET_PROFILES.map((profile) => resolvePresentationContext({ trustedCountryCode: profile.countryCode }));
  const unsupported = resolvePresentationContext({ trustedCountryCode: "US" });
  assert.deepEqual(supported.map((result) => result.locale), INITIAL_EUROPEAN_MARKET_PROFILES.map((profile) => profile.defaultLocale));
  for (const result of supported) assert.equal(result.source, "TRUSTED_GEO");
  assert.equal(unsupported.market.countryCode, "GB");
  assert.equal(unsupported.locale, "en-GB");
  assert.equal(unsupported.source, "DEFAULT");
});

test("invalid explicit route never force-enables an unsupported market", () => {
  const result = resolvePresentationContext({ routeMarket: "xx", routeLanguage: "xx", trustedCountryCode: "DK" });
  assert.equal(result.market.countryCode, "DK");
  assert.equal(result.source, "TRUSTED_GEO");
  assert.equal(result.explicitRouteValid, false);
});

test("all registered locales have a complete public-shell catalog", () => {
  for (const profile of MARKET_PROFILES) {
    for (const locale of profile.supportedLocales) {
      const messages = publicShellMessages(locale);
      for (const value of Object.values(messages)) assert.ok(value.trim().length > 0, `${locale} contains an empty public-shell message`);
      const footer = publicFooterMessages(locale);
      for (const value of Object.values(footer)) assert.ok(value.trim().length > 0, `${locale} contains an empty public-footer message`);
    }
  }
});

test("every European Home locale has complete localized copy and metadata", () => {
  const englishHtml = transformCommonHandoff(generatedPages.home.html);
  for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
    const locale = profile.defaultLocale;
    const localizedHtml = transformHomeHandoff(englishHtml, locale);
    const localizedMetadata = homeMetadata(locale);
    assert.ok(localizedMetadata.title.trim());
    assert.ok(localizedMetadata.description.trim());
    if (locale === "en-GB") continue;
    const translation = homeTranslation(locale);
    assert.ok(translation);
    for (const section of Object.keys(HOME_SOURCE_COPY) as Array<keyof typeof HOME_SOURCE_COPY>) {
      assert.equal(translation[section].length, HOME_SOURCE_COPY[section].length, `${locale}:${section}`);
    }
    assert.ok(localizedHtml.includes(translation.hero[1]));
    assert.equal(localizedHtml.includes(">Control<"), false, `${locale} leaked the English Home heading`);
  }
});

test("localized middleware rewrites only validated public routes and preserves security headers", () => {
  const response = middleware(new NextRequest("http://127.0.0.1:4173/de/de/casinos?sort=score"));
  assert.equal(response.status, 200);
  const rewrite = new URL(response.headers.get("x-middleware-rewrite") ?? "http://invalid");
  assert.equal(`${rewrite.pathname}${rewrite.search}`, "/casinos?sort=score");
  assert.equal(response.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), "de");
  assert.equal(response.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), "de");
  assert.ok(response.headers.get("content-security-policy"));

  const invalid = middleware(new NextRequest("http://127.0.0.1:4173/de/en/"));
  assert.equal(invalid.headers.get("x-middleware-rewrite"), null);
  const protectedRoute = middleware(new NextRequest("http://127.0.0.1:4173/de/de/admin"));
  assert.equal(protectedRoute.headers.get("x-middleware-rewrite"), null);
});

test("preference endpoint persists only a validated presentation choice and can clear it", async () => {
  const selected = await updatePresentationPreference(new NextRequest("https://b4gamble.com/api/presentation", {
    method: "POST",
    body: new URLSearchParams({ choice: "ES|es-ES", returnTo: "/de/de/casinos" }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  }));
  assert.equal(selected.status, 303);
  assert.equal(selected.headers.get("location"), "/es/es/casinos");
  const selectedCookie = selected.headers.get("set-cookie") ?? "";
  assert.match(selectedCookie, new RegExp(`${PRESENTATION_PREFERENCE_COOKIE}=v1\\.ES\\.es-ES`));
  assert.match(selectedCookie, /HttpOnly/);
  assert.doesNotMatch(selectedCookie, /commercial|referral|programme|help/i);

  const cleared = await updatePresentationPreference(new NextRequest("https://b4gamble.com/api/presentation", {
    method: "POST",
    body: new URLSearchParams({ choice: "automatic", returnTo: "/es/es/learn" }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  }));
  assert.equal(cleared.status, 303);
  assert.equal(cleared.headers.get("location"), "/learn");
  assert.match(cleared.headers.get("set-cookie") ?? "", /Max-Age=0/);

  const invalid = await updatePresentationPreference(new NextRequest("https://b4gamble.com/api/presentation", {
    method: "POST",
    body: new URLSearchParams({ choice: "DE|en-GB", returnTo: "/" }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  }));
  assert.equal(invalid.status, 400);
});
