import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const form = readFileSync("components/discovery/InstantDiscoveryForm.tsx", "utf8");
const casinos = readFileSync("components/casino-discovery/CasinoDiscovery.tsx", "utf8");
const bonuses = readFileSync("components/bonus-directory/BonusDirectory.tsx", "utf8");
const compare = readFileSync("components/comparison/ComparisonExperience.tsx", "utf8");
const casinoCard = readFileSync("components/casino-discovery/CasinoDiscoveryCard.tsx", "utf8");

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
  for (const source of [casinos, bonuses, compare]) assert.match(source, /InstantDiscoveryForm/);
  assert.match(casinos, /debouncedFields=\{\["q"\]\}/);
  assert.match(bonuses, /debouncedFields=\{\["maxDeposit", "maxWagering"\]\}/);
  assert.match(compare, /name="casino"/);
  for (const source of [casinos, bonuses, compare]) {
    assert.doesNotMatch(source, /useState|useEffect|fetch\(|@prisma\/client|prisma\./);
  }
});

test("measured casino theatre image uses the Next image pipeline and bounded responsive candidates", () => {
  assert.match(casinoCard, /import Image from "next\/image"/);
  assert.match(casinoCard, /sizes="\(max-width: 760px\) 1px, \(max-width: 1280px\) 100vw, 1280px"/);
  assert.doesNotMatch(casinoCard, /<img alt="" aria-hidden="true" className=\{classNames\.featureMedia\}/);
});

test("query projections can omit commercial relations after policy denial", () => {
  const types = readFileSync("lib/public-casino-discovery/public-casino-discovery.types.ts", "utf8");
  const casinoRepository = readFileSync("lib/repositories/public-casino-discovery.repository.ts", "utf8");
  const offerRepository = readFileSync("lib/repositories/public-offer.repository.ts", "utf8");
  const comparisonPage = readFileSync("app/(public)/compare/page.tsx", "utf8");
  const comparisonApi = readFileSync("app/api/public/comparison/route.ts", "utf8");
  assert.match(types, /includeCommercial\?: boolean/);
  assert.match(casinoRepository, /includeCommercial \? prisma\.affiliateOffer\.findMany/);
  assert.match(casinoRepository, /includeCommercial \? prisma\.affiliateRedirectSlug\.findMany/);
  assert.match(offerRepository, /options\.includeCommercial \?\? true/);
  assert.match(comparisonPage, /permanentRedirect\(`\/casinos/);
  assert.match(comparisonApi, /resolveServerJurisdiction/);
  assert.match(comparisonApi, /publicComparisonService\.compare\(query, authority\)/);
});
