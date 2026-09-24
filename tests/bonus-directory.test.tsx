import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// /bonuses renders BonusOfferDirectory: a tabbed, offer-first directory over one
// server query. The faceted BonusDirectory this suite used to read was imported
// by no route and has been deleted, and with it the checks for its GET filter
// form, tri-state featured/recommended controls, no-JS filter links and shared
// pagination — none of which a reader can reach. Governed actions and
// demonstration labelling are rendered for real in
// commercial-availability-presentation; this suite holds the page contract.

const page = readFileSync("app/(public)/bonuses/page.tsx", "utf8");
const directory = readFileSync("components/bonus-directory/BonusOfferDirectory.tsx", "utf8");

test("FE-MIG-07 isolates Bonuses from the shared Best Offers presentation", () => {
  const bestOffers = readFileSync("app/(public)/best-offers/page.tsx", "utf8");
  assert.match(page, /components\/bonus-directory\/BonusOfferDirectory/);
  assert.doesNotMatch(page, /components\/best-offers\/BestOffersExperience/);
  assert.match(bestOffers, /components\/best-offers\/BestOffersExperience/);
  assert.doesNotMatch(bestOffers, /components\/bonus-directory/);
});

test("page source preserves SSR, metadata, canonical, noindex and ItemList positions", () => {
  assert.match(page, /dynamic = "force-dynamic"/);
  assert.match(page, /const loadBonusDirectory = cache/);
  assert.equal((page.match(/publicOfferService\.searchOffers\(/g) || []).length, 1);
  assert.match(page, /productMetadata\(\{\s*presentation,\s*pathname: "\/bonuses"/);
  // Nothing thin, filtered, demonstrative or unavailable is offered to search.
  assert.match(page, /robots: marketUnavailable \|\| unavailable \|\| containsDemo \|\| result\.total === 0 \|\| hasPublicOfferFilters\(legacyQuery\) \? \{ index: false, follow: true \}/);
  // Structured data describes published records only, positioned from one.
  assert.match(page, /const schema = result\.inventoryMode === "PUBLISHED_ONLY" && result\.total > 0 \? \{/);
  assert.match(page, /"@type": "ItemList"/);
  assert.match(page, /"@type": "ListItem",\s*position: index \+ 1/);
  assert.match(page, /messages\.bonuses\.unavailableTitleBody/);
  assert.match(page, /messages\.bonuses\.unavailableCopy/);
  assert.doesNotMatch(page, /@prisma\/client|staticOffers|demo-/);
});

test("bonus cards state their material terms before the action and keep type at or above 12px", () => {
  const styles = readFileSync("components/bonus-directory/BonusOfferDirectory.module.css", "utf8");
  const pageStyles = readFileSync("app/(public)/bonuses/BonusesPage.module.css", "utf8");
  // A reader sees wagering, deposit and bet limits before being offered the visit.
  assert.ok(directory.indexOf("<CommercialFacts") > 0, "material terms render on every card");
  assert.ok(directory.indexOf("<CommercialFacts") < directory.indexOf("className={styles.actions}"), "terms precede the action");
  assert.match(directory, /card\.logo \? <ResponsivePlacementImage[\s\S]*?: <span aria-hidden="true">\{card\.casinoName\.slice\(0, 1\)\}/);
  // The founder typography floor: design sizes below 12px map to 12px.
  for (const [name, css] of [["BonusOfferDirectory.module.css", styles], ["BonusesPage.module.css", pageStyles]] as const) {
    assert.doesNotMatch(css, /font-size:\s*(?:9|10|11)px/, name);
  }
});

test("pending and error states fail without invented offer truth", () => {
  const error = readFileSync("app/(public)/bonuses/error.tsx", "utf8");
  assert.match(error, /usePublicErrorContext/);
  assert.match(error, /messages\.title/);
  assert.match(error, /messages\.copy/);
  assert.match(error, /reset/);
  assert.doesNotMatch(error, /publicOfferService|maximum bonus|minimum deposit|wagering multiplier/i);
});
