import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const form = readFileSync("components/discovery/InstantDiscoveryForm.tsx", "utf8");
const casinosPage = readFileSync("app/(public)/casinos/page.tsx", "utf8");
const collection = readFileSync("components/casino-discovery/CasinoCollection.tsx", "utf8");
const bonuses = readFileSync("components/bonus-directory/BonusDirectory.tsx", "utf8");
const mobileBonuses = readFileSync("components/bonus-directory/MobileBonusFilters.tsx", "utf8");
const mobileDirectoryFilters = readFileSync("components/directory-filters/MobileDirectoryFilters.tsx", "utf8");
const compare = readFileSync("components/comparison/ComparisonExperience.tsx", "utf8");

test("instant discovery progressively enhances real GET forms with URL-owned RSC navigation", () => {
  assert.match(form, /method="get"/);
  assert.match(form, /new FormData\(form\)/);
  assert.match(form, /params\.delete\("page"\)/);
  assert.match(form, /router\[mode\]\(target, \{ scroll: false \}\)/);
  assert.match(form, /navigate\(event\.currentTarget, "push"\)/);
  assert.match(form, /navigate\(form, "replace"\)/);
  assert.match(form, /debounceMs = 300/);
  assert.match(form, /aria-live="polite"/);
  assert.doesNotMatch(form, /fetch\(|localStorage|sessionStorage|@prisma\/client|prisma\./);
});

test("governed discovery routes use one narrow enhancer and keep server authority", () => {
  for (const source of [bonuses, compare]) assert.match(source, /InstantDiscoveryForm/);
  assert.match(bonuses, /DirectoryFilterSurface/);
  assert.match(bonuses, /debouncedFields=\{\["maxDeposit", "maxWagering"\]\}/);
  assert.match(compare, /name="casino"/);
  for (const source of [bonuses, compare]) {
    assert.doesNotMatch(source, /useState|useEffect|fetch\(|@prisma\/client|prisma\./);
  }
  // The casino directory filters the server-rendered page in the browser instead of re-querying, so
  // it keeps local state but must still hold no data authority of its own.
  assert.match(casinosPage, /publicCasinoDiscoveryService\.discover/);
  assert.match(collection, /useMemo\(\(\) => \{/);
  assert.doesNotMatch(collection, /fetch\(|useEffect|@prisma\/client|prisma\.|\/api\//);
});

test("bonus mobile filters use the shared shell and interaction contract", () => {
  assert.match(mobileBonuses, /MobileDirectoryFilters/);
  assert.match(mobileBonuses, /dialogId="bonus-filter-dialog"/);
  assert.match(mobileDirectoryFilters, /labels\?\.filters \?\? "Filters"/);
  assert.match(mobileDirectoryFilters, /labels\?\.refine \?\? "Refine results"/);
  assert.match(mobileDirectoryFilters, /dialog\.showModal\(\)/);
  assert.match(mobileDirectoryFilters, /document\.body\.style\.overflow = "hidden"/);
  assert.match(mobileDirectoryFilters, /triggerRef\.current\?\.focus\(\)/);
});

test("bonus mobile demo disclosure spans the result card instead of collapsing into a narrow grid cell", () => {
  assert.match(bonuses, /gridColumn: "1 \/ -1"/);
  assert.match(bonuses, /overflowWrap: "break-word"/);
  assert.match(bonuses, /wordBreak: "normal"/);
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
