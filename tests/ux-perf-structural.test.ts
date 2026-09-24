import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// /casinos and /bonuses render server-fetched records and filter them in the
// browser. The GET-form enhancer, the faceted bonus directory, its mobile filter
// drawer and the comparison experience were imported by no route and have been
// deleted, along with the checks that could only read them.
const casinosPage = readFileSync("app/(public)/casinos/page.tsx", "utf8");
const collection = readFileSync("components/casino-discovery/CasinoCollection.tsx", "utf8");
const bonusesPage = readFileSync("app/(public)/bonuses/page.tsx", "utf8");
const bonuses = readFileSync("components/bonus-directory/BonusOfferDirectory.tsx", "utf8");
const bonusesStyles = readFileSync("app/(public)/bonuses/BonusesPage.module.css", "utf8");

test("discovery directories filter server-rendered records and hold no data authority", () => {
  // Both directories filter the server-rendered page in the browser instead of
  // re-querying, so each keeps local view state but no data authority of its own.
  assert.match(casinosPage, /publicCasinoDiscoveryService\.discover/);
  assert.match(collection, /useMemo\(\(\) => \{/);
  assert.match(bonusesPage, /publicOfferService\.searchOffers/);
  assert.match(bonuses, /useMemo\(\(\) => offersForBonusView\(offers, view\)/);
  for (const source of [collection, bonuses]) {
    assert.doesNotMatch(source, /fetch\(|useEffect|@prisma\/client|prisma\.|\/api\//);
  }
});

test("the bonus demonstration disclosure never collapses into a narrow grid cell", () => {
  // The disclosure sits above the directory on the live page. Its text column may
  // shrink without overflowing, and on a phone it stacks to the full width.
  assert.match(bonusesStyles, /\.demoDirectoryDisclosure \{[^}]*grid-template-columns: auto minmax\(0, 1fr\)/);
  assert.match(bonusesStyles, /@media \(max-width: 640px\) \{[\s\S]*?\.demoDirectoryDisclosure \{ grid-template-columns: 1fr; \}/);
});

test("casino directory imagery stays deferred and dimensioned so the list does not shift", () => {
  assert.match(collection, /<ResponsivePlacementImage alt="" height=\{card\.logo\.height \?\? 76\} loading="lazy"/);
  assert.match(collection, /width=\{card\.logo\.width \?\? 152\}/);
  // A missing logo falls back to a decorative initial rather than an unsized placeholder request.
  assert.match(collection, /<span aria-hidden="true">\{card\.name\.slice\(0, 1\)\}<\/span>/);
});

test("editorial query projections never load commercial relations", () => {
  const types = readFileSync("lib/public-casino-discovery/public-casino-discovery.types.ts", "utf8");
  const casinoRepository = readFileSync("lib/repositories/public-casino-discovery.repository.ts", "utf8");
  const offerRepository = readFileSync("lib/repositories/public-offer.repository.ts", "utf8");
  const actionResolver = readFileSync("lib/commercial/public-commercial-action-resolver.ts", "utf8");
  const comparisonPage = readFileSync("app/(public)/compare/page.tsx", "utf8");
  const comparisonApi = readFileSync("app/api/public/comparison/route.ts", "utf8");
  assert.doesNotMatch(types, /includeCommercial|affiliateOffer|affiliateRedirect/);
  assert.doesNotMatch(casinoRepository, /includeCommercial|affiliateOffer|affiliateRedirect|MarketActivation/);
  assert.doesNotMatch(offerRepository, /includeCommercial|affiliateOffer|affiliateRedirect|MarketActivation/);
  assert.match(actionResolver, /this\.routes\.listPublicRoutes/);
  assert.match(comparisonPage, /permanentRedirect\(productHref\(presentation, `\/casinos/);
  assert.match(comparisonApi, /resolveServerJurisdiction/);
  assert.match(
    comparisonApi,
    /publicComparisonService\.compare\(query, authority, languageForLocale\(locale\), requestSignal\?\.marketCode\)/,
  );
});
