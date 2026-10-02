import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { indexableMarketProductPaths, localizedIndexableMarketProfiles } from "../app/sitemap";
import type { PublicCasinoCardDto } from "../lib/public-casino-discovery/public-casino-discovery.types";
import { coreRoutes } from "../lib/site";
import {
  INDEXABLE_MARKET_PROFILES,
  MARKET_PUBLICATION_POLICY,
  marketIndexingApproved,
  marketProfileByCountry,
  type MarketProfile,
} from "../lib/market/registry";
import { localizedProductIndexingApproved, productLanguageAlternatesForProfiles, productMetadata } from "../lib/market/product-context";
import { PROGRAMME_ROUTES } from "../lib/programme/presentation";
import { programmeSearchMetadata } from "../lib/seo/programme-metadata";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";

function profile(countryCode: "GB" | "SE" | "PE") {
  const value = marketProfileByCountry(countryCode);
  assert.ok(value);
  return value;
}

function withIndexable(value: MarketProfile): MarketProfile {
  return { ...value, publication: { ...value.publication, indexable: true, indexabilityBlocker: null } };
}

test("GB, SE, DE, DK and PE expose one explicit routable/published/indexable policy", () => {
  assert.deepEqual(MARKET_PUBLICATION_POLICY.GB, {
    routable: true, published: true, indexable: true, indexabilityBlocker: null, reviewedAt: "2026-09-03",
  });
  assert.equal(MARKET_PUBLICATION_POLICY.SE.routable, true);
  assert.equal(MARKET_PUBLICATION_POLICY.SE.published, true);
  // SEO-INDEX-DE-SV-DA-2026-09-27: the Founder opened the launch markets to search.
  for (const market of ["SE", "DE", "DK"] as const) {
    assert.deepEqual(MARKET_PUBLICATION_POLICY[market], {
      routable: true, published: true, indexable: true, indexabilityBlocker: null, reviewedAt: "2026-09-27",
    }, market);
  }
  assert.equal(MARKET_PUBLICATION_POLICY.PE.routable, true);
  assert.equal(MARKET_PUBLICATION_POLICY.PE.published, true);
  assert.equal(MARKET_PUBLICATION_POLICY.PE.indexable, false);
  assert.match(MARKET_PUBLICATION_POLICY.PE.indexabilityBlocker ?? "", /LEGAL_PRIVACY.*REAL_INVENTORY/);
  assert.deepEqual(INDEXABLE_MARKET_PROFILES.map((market) => market.countryCode).sort(), ["DE", "DK", "GB", "SE"]);
});

test("noindex languages keep self canonicals without contradictory hreflang", () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    for (const [_market, language, locale, canonical] of [["PE", "es", "es-ES", "/es/casinos"], ["GR", "el", "el-GR", "/el/casinos"]] as const) {
      const presentation = resolvePresentationContext({ routeLanguage: language });
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

test("GB is indexable with canonical, reciprocal-ready hreflang, and an x-default that never redirects", () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    const presentation = resolvePresentationContext({ routeLanguage: "en", trustedCountryCode: "GB" });
    const metadata = productMetadata({ presentation, pathname: "/casinos", title: "Casinos", description: "Casinos", robots: { index: true, follow: true } });
    assert.equal(new URL(String(metadata.alternates?.canonical)).pathname, "/en/casinos");
    assert.deepEqual(metadata.robots, { index: true, follow: true });
    const languages = metadata.alternates?.languages as Record<string, string>;
    assert.equal(new URL(languages.en).pathname, "/en/casinos");
    assert.equal(new URL(languages["x-default"]).pathname, "/en/casinos");
    assert.equal(new URL(languages.sv).pathname, "/sv/casinos");
    assert.deepEqual(Object.keys(languages).sort(), ["da", "de", "en", "sv", "x-default"]);
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
  assert.equal(new URL(languages["x-default"]).pathname, "/en/casinos");
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

test("the sitemap lists no page that asks search engines not to index it", () => {
  for (const route of coreRoutes) {
    const page = [`app/(public)${route}/page.tsx`, `app${route}/page.tsx`].find((file) => existsSync(file));
    if (page) assert.doesNotMatch(readFileSync(page, "utf8"), /index:\s*false/, `${route} is noindex but listed in the sitemap`);
  }
  for (const route of ["/privacy", "/terms"]) {
    assert.match(readFileSync(`app/(public)${route}/page.tsx`, "utf8"), /index:\s*false/);
    assert.equal((coreRoutes as readonly string[]).includes(route), false);
  }

  const card = (slug: string, indexable: boolean) => ({ slug, dataClassification: "PUBLISHED_RECORD", indexable, publishedAt: null, editorialUpdatedAt: null }) as PublicCasinoCardDto;
  const snapshot = {
    market: profile("GB"),
    casinos: [card("alpha", true), card("starcasino", false)],
    discovery: null,
    bonuses: null,
    bestOffers: null,
  } as unknown as Parameters<typeof indexableMarketProductPaths>[0];
  const { casinoRoutes } = indexableMarketProductPaths(snapshot, true);
  assert.deepEqual(casinoRoutes.map((entry) => new URL(entry.url).pathname), ["/en/casino/alpha"]);
});

// Semrush Site Audit, 2 Oct 2026: 27 incorrect hreflang links and 3 hreflang conflicts.
test("only an indexable canonical page names its language versions", () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    const presentation = resolvePresentationContext({ routeLanguage: "en", trustedCountryCode: "GB" });
    const base = { presentation, pathname: "/casino/starcasino", title: "Review", description: "Review" };
    const indexable = productMetadata({ ...base, robots: { index: true, follow: true } });
    assert.ok(indexable.alternates?.languages);
    for (const robots of [{ index: false, follow: true }, "noindex, follow", "none"] as const) {
      assert.equal(productMetadata({ ...base, robots }).alternates?.languages, undefined, `robots ${JSON.stringify(robots)}`);
    }
    const filtered = productMetadata({ ...base, pathname: "/learn", queryVariant: true });
    assert.equal(new URL(String(filtered.alternates?.canonical)).pathname, "/en/learn");
    assert.equal(filtered.alternates?.languages, undefined);
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous;
  }
  const copy = { title: "Programme", description: "Programme" };
  assert.ok(programmeSearchMetadata("de-DE", copy).alternates?.languages);
  const start = programmeSearchMetadata("de-DE", copy, { queryVariant: true });
  assert.equal(new URL(String(start.alternates?.canonical)).pathname, "/de/program");
  assert.equal(start.alternates?.languages, undefined);
  assert.match(readFileSync("app/program/page.tsx", "utf8"), /queryVariant: Object\.keys\(query\)\.length > 0/);
  assert.match(readFileSync("app/(public)/learn/page.tsx", "utf8"), /queryVariant: Object\.keys\(query\)\.length > 0/);
});

test("every hreflang target is a page that answers 200: no unprefixed x-default", () => {
  const languages = programmeSearchMetadata("en-GB", { title: "Programme", description: "Programme" }).alternates?.languages as Record<string, string>;
  assert.equal(new URL(languages["x-default"]).pathname, "/program");
  const home = productLanguageAlternatesForProfiles("/", [profile("GB"), profile("SE")]);
  assert.equal(new URL(home["x-default"]).pathname, "/en");
  assert.equal(home["x-default"], home.en);
});

test("the sitemap lists the Programme in every language it indexes", () => {
  const localized = PROGRAMME_ROUTES.filter((route) => localizedProductIndexingApproved(route.locale)).map((route) => route.path);
  assert.deepEqual([...localized].sort(), ["/da/program", "/de/program", "/sv/program"]);
  assert.match(readFileSync("app/sitemap.ts", "utf8"), /\.\.\.localizedProgrammeRoutes,/);
});

test("listing pages never publish an empty ItemList", () => {
  assert.match(readFileSync("app/(public)/best-offers/page.tsx", "utf8"), /PUBLISHED_ONLY" && schemaOffers\.length > 0 \?/);
  assert.match(readFileSync("app/(public)/bonuses/page.tsx", "utf8"), /PUBLISHED_ONLY" && result\.records\.length > 0 \?/);
  assert.match(readFileSync("app/(public)/casinos/page.tsx", "utf8"), /PUBLISHED_ONLY" && result\.items\.length > 0 \?/);
});
