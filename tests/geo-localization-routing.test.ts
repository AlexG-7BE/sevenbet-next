import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import { middleware } from "../middleware";
import { firstWaveMarketEvidence } from "../lib/market/first-wave-evidence";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import { productMetadata } from "../lib/market/product-context";
import {
  GEO_LOCALIZATION_INITIAL_PUBLIC_SLUGS,
  localeMarketRouteByPublicSlug,
  marketProfileByCountry,
} from "../lib/market/registry";

test("initial canonical registry binds the requested language and market identities", () => {
  assert.deepEqual(GEO_LOCALIZATION_INITIAL_PUBLIC_SLUGS, ["en-gb", "sv-se", "es-pe"]);
  for (const [slug, country, locale] of [
    ["en-gb", "GB", "en-GB"],
    ["sv-se", "SE", "sv-SE"],
    ["es-pe", "PE", "es-PE"],
  ] as const) {
    const entry = localeMarketRouteByPublicSlug(slug);
    assert.equal(entry?.market.countryCode, country);
    assert.equal(entry?.route.locale, locale);
    assert.equal(entry?.route.enabled, true);
  }
});

test("resolver precedence is explicit route, preference, trusted geo, then GB fallback", () => {
  assert.deepEqual(
    resolvePresentationContext({
      routeMarket: "se",
      routeLanguage: "sv",
      preference: { countryCode: "PE", locale: "es-PE" },
      trustedCountryCode: "GB",
      acceptLanguage: "es-PE,es;q=0.9",
    }),
    { market: marketProfileByCountry("SE"), locale: "sv-SE", source: "EXPLICIT_ROUTE", explicitRouteValid: true },
  );
  assert.equal(resolvePresentationContext({ preference: { countryCode: "PE", locale: "es-PE" }, trustedCountryCode: "SE" }).market.countryCode, "PE");
  assert.equal(resolvePresentationContext({ trustedCountryCode: "SE", acceptLanguage: "es-PE" }).locale, "sv-SE");
  assert.deepEqual(
    ["SE", "PE", "GB"].map((countryCode) => {
      const resolution = resolvePresentationContext({ trustedCountryCode: countryCode });
      return [resolution.market.countryCode, resolution.locale, resolution.source];
    }),
    [
      ["SE", "sv-SE", "TRUSTED_GEO"],
      ["PE", "es-PE", "TRUSTED_GEO"],
      ["GB", "en-GB", "TRUSTED_GEO"],
    ],
  );
  assert.deepEqual(
    { market: resolvePresentationContext({ trustedCountryCode: "ZZ" }).market.countryCode, locale: resolvePresentationContext({ trustedCountryCode: "ZZ" }).locale },
    { market: "GB", locale: "en-GB" },
  );
  assert.deepEqual(
    { market: resolvePresentationContext({ acceptLanguage: "es-PE,es;q=0.9" }).market.countryCode, locale: resolvePresentationContext({ acceptLanguage: "es-PE,es;q=0.9" }).locale },
    { market: "GB", locale: "en-GB" },
    "Accept-Language must never choose a market",
  );
});

test("legacy country query redirects once and explicit canonical route cannot be overridden", async () => {
  for (const [countryCode, expected] of [["SE", "/sv-se/casinos?sort=score"], ["PE", "/es-pe/casinos?sort=score"], ["GB", "/en-gb/casinos?sort=score"]] as const) {
    const legacy = await middleware(new NextRequest(`http://127.0.0.1:4173/casinos?country=${countryCode}&sort=score`));
    assert.equal(legacy.status, 308);
    const legacyLocation = new URL(legacy.headers.get("location") ?? "http://invalid");
    assert.equal(`${legacyLocation.pathname}${legacyLocation.search}`, expected);
  }

  const explicit = await middleware(new NextRequest("http://127.0.0.1:4173/sv-SE/casinos?country=PE&sort=score", {
    headers: { cookie: "b4gamble_presentation=v1.PE.es-PE", "accept-language": "es-PE" },
  }));
  assert.equal(explicit.status, 308);
  const explicitLocation = new URL(explicit.headers.get("location") ?? "http://invalid");
  assert.equal(`${explicitLocation.pathname}${explicitLocation.search}`, "/sv-se/casinos?sort=score");
});

test("retired comparison canonicalizes in one hop and disabled locales are not normalized", async () => {
  const comparison = await middleware(new NextRequest(
    "http://127.0.0.1:4173/compare?casino=demo-northstar&casino=demo-summit&country=GB",
  ));
  assert.equal(comparison.status, 308);
  const comparisonLocation = new URL(comparison.headers.get("location") ?? "http://invalid");
  assert.equal(
    `${comparisonLocation.pathname}${comparisonLocation.search}`,
    "/en-gb/casinos?casino=demo-northstar&casino=demo-summit",
  );

  const disabledLocale = await middleware(new NextRequest("http://127.0.0.1:4173/ca/"));
  assert.equal(disabledLocale.headers.get("location"), null);
});

test("Peru metadata is self-canonical, reciprocal, noindex and keeps safety non-commercial", () => {
  const presentation = resolvePresentationContext({ routeMarket: "pe", routeLanguage: "es" });
  const metadata = productMetadata({
    presentation,
    pathname: "/casinos",
    title: "Casinos en Perú",
    description: "Registros publicados para Perú",
  });
  assert.equal(new URL(String(metadata.alternates?.canonical)).pathname, "/es-pe/casinos");
  assert.equal(new URL((metadata.alternates?.languages as Record<string, string>)["sv-SE"]).pathname, "/sv-se/casinos");
  assert.deepEqual(metadata.robots, { index: false, follow: true });

  const peru = firstWaveMarketEvidence("PE");
  assert.ok(peru);
  assert.equal(peru.commercialState, "NOT_VERIFIED_FAIL_CLOSED");
  assert.equal(peru.resources.some((resource) => resource.kind === "SUPPORT"), false);
  assert.match(peru.copy.unavailable, /no se inventa uno/i);
});
