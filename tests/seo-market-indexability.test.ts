import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { localizedIndexableMarketProfiles } from "../app/sitemap";
import {
  INDEXABLE_MARKET_PROFILES,
  MARKET_PUBLICATION_POLICY,
  marketIndexingApproved,
  marketProfileByCountry,
  type MarketProfile,
} from "../lib/market/registry";
import { productLanguageAlternatesForProfiles, productMetadata } from "../lib/market/product-context";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";

function profile(countryCode: "GB" | "SE" | "PE") {
  const value = marketProfileByCountry(countryCode);
  assert.ok(value);
  return value;
}

function withIndexable(value: MarketProfile): MarketProfile {
  return { ...value, publication: { ...value.publication, indexable: true, indexabilityBlocker: null } };
}

test("GB, SE, and PE expose one explicit routable/published/indexable policy", () => {
  assert.deepEqual(MARKET_PUBLICATION_POLICY.GB, {
    routable: true, published: true, indexable: true, indexabilityBlocker: null, reviewedAt: "2026-09-03",
  });
  assert.equal(MARKET_PUBLICATION_POLICY.SE.routable, true);
  assert.equal(MARKET_PUBLICATION_POLICY.SE.published, true);
  assert.equal(MARKET_PUBLICATION_POLICY.SE.indexable, false);
  assert.match(MARKET_PUBLICATION_POLICY.SE.indexabilityBlocker ?? "", /LEGAL_PRIVACY.*PLACEHOLDER/);
  assert.equal(MARKET_PUBLICATION_POLICY.PE.routable, true);
  assert.equal(MARKET_PUBLICATION_POLICY.PE.published, true);
  assert.equal(MARKET_PUBLICATION_POLICY.PE.indexable, false);
  assert.match(MARKET_PUBLICATION_POLICY.PE.indexabilityBlocker ?? "", /LEGAL_PRIVACY.*REAL_INVENTORY/);
  assert.deepEqual(INDEXABLE_MARKET_PROFILES.map((market) => market.countryCode), ["GB"]);
});

test("noindex languages keep self canonicals without contradictory hreflang", () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    for (const [market, language, locale, canonical] of [["SE", "sv", "sv-SE", "/sv/casinos"], ["PE", "es", "es-ES", "/es/casinos"]] as const) {
      const presentation = resolvePresentationContext({ routeMarket: market.toLowerCase(), routeLanguage: language });
      const metadata = productMetadata({ presentation, pathname: "/casinos", title: "Casinos", description: "Localized casinos" });
      assert.equal(presentation.locale, locale);
      assert.equal(presentation.market, null);
      assert.equal(new URL(String(metadata.alternates?.canonical)).pathname, canonical);
      assert.deepEqual(metadata.robots, { index: false, follow: true });
      assert.equal(metadata.alternates?.languages, undefined);
    }
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous;
  }
});

test("GB is indexable with canonical, reciprocal-ready hreflang, and x-default", () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    const presentation = resolvePresentationContext({ routeMarket: "gb", routeLanguage: "en" });
    const metadata = productMetadata({ presentation, pathname: "/casinos", title: "Casinos", description: "Casinos", robots: { index: true, follow: true } });
    assert.equal(new URL(String(metadata.alternates?.canonical)).pathname, "/en/casinos");
    assert.deepEqual(metadata.robots, { index: true, follow: true });
    const languages = metadata.alternates?.languages as Record<string, string>;
    assert.equal(new URL(languages.en).pathname, "/en/casinos");
    assert.equal(new URL(languages["x-default"]).pathname, "/casinos");
    assert.deepEqual(Object.keys(languages).sort(), ["en", "x-default"]);
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous;
  }
});

test("a future policy-only INDEX switch updates sitemap inputs while hreflang stays language-level", () => {
  const gb = profile("GB");
  const se = withIndexable(profile("SE"));
  const pe = withIndexable(profile("PE"));
  assert.equal(marketIndexingApproved(se), true);
  assert.equal(marketIndexingApproved(pe), true);
  assert.deepEqual(localizedIndexableMarketProfiles([gb, se, pe]).map((market) => market.countryCode), ["SE", "PE"]);
  const languages = productLanguageAlternatesForProfiles("/casinos", [gb, se, pe]);
  assert.equal(new URL(languages.en).pathname, "/en/casinos");
  assert.equal(new URL(languages.sv).pathname, "/sv/casinos");
  assert.equal(new URL(languages.es).pathname, "/es/casinos");
  assert.equal(new URL(languages["x-default"]).pathname, "/casinos");
});

test("layout, sitemap, robots metadata, and canonicalization use the centralized contract", () => {
  assert.match(readFileSync("app/layout.tsx", "utf8"), /<html lang=\{presentation\.locale\}>/);
  assert.match(readFileSync("app/sitemap.ts", "utf8"), /localizedIndexableMarketProfiles/);
  assert.match(readFileSync("lib/market/product-context.ts", "utf8"), /productIndexingApproved/);
  const middleware = readFileSync("middleware.ts", "utf8");
  assert.match(middleware, /publicPresentationAvailable/);
  assert.match(middleware, /languageRouteByPublicSlug/);
  assert.match(middleware, /withoutCountryQuery/);
  assert.match(readFileSync("app/robots.ts", "utf8"), /sitemap: absoluteUrl\("\/sitemap\.xml"\)/);
});
