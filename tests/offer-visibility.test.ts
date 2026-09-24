import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  OFFER_PRESENTATION_PROHIBITED_MARKETS,
  offerPresentationProhibitionReason,
  offersMayBePresented,
} from "../lib/public-offer/offer-visibility";

test("an unrecognised country may see published offers", () => {
  // Hiding every offer from a country we had not activated is what emptied
  // Bonuses and Best Offers for most of the world. RFC-039 separates
  // publication from route eligibility; no route means no button, not no page.
  assert.equal(offersMayBePresented("KZ"), true);
  assert.equal(offersMayBePresented(null), true);
  assert.equal(offersMayBePresented(undefined), true);
  assert.equal(offersMayBePresented(""), true);
  assert.equal(offersMayBePresented("ZZ"), true, "an unconfigured code is not a prohibition");
});

test("a country that prohibits gambling advertising sees no offer", () => {
  for (const market of ["NO", "FI", "IN", "AU", "TR", "RU", "ZA", "JP"]) {
    assert.equal(offersMayBePresented(market), false, `${market} must stay closed`);
    assert.ok(offerPresentationProhibitionReason(market), `${market} must state why`);
  }
});

test("every prohibited market carries a stated reason", () => {
  for (const [market, reason] of Object.entries(OFFER_PRESENTATION_PROHIBITED_MARKETS)) {
    assert.match(market, /^[A-Z]{2}$/);
    assert.ok(reason.trim().length > 30, `${market} needs a real reason, not a label`);
  }
});

test("the closed markets of the EGO source note are all covered", () => {
  // The Founder's closed-market register is the evidence behind this list;
  // a market dropping out of it silently would re-open advertising there.
  const note = readFileSync(new URL("../data/casino-ingestion/ego-skillonnet-source-20260922.md", import.meta.url), "utf8");
  const closed = note.slice(note.indexOf("## closed-markets"));
  for (const market of ["FI", "NO", "IN", "JP", "BG", "HR", "CZ", "HU", "SK", "ZA", "NZ"]) {
    assert.ok(closed.includes(`- ${market}:`), `${market} is expected in the source note`);
    assert.equal(offersMayBePresented(market), false, `${market} is closed in the note but open here`);
  }
});

test("both offer surfaces gate on the policy rather than on having a route", () => {
  for (const page of ["app/(public)/bonuses/page.tsx", "app/(public)/best-offers/page.tsx"]) {
    const source = readFileSync(new URL(`../${page}`, import.meta.url), "utf8");
    assert.match(source, /offersMayBePresented\(presentation\.marketCountryCode\)/, `${page} must consult the policy`);
    assert.doesNotMatch(
      source,
      /const marketUnavailable = !\w+ && !hasCanonicalAction &&/,
      `${page} must not hide every offer merely because no route exists`,
    );
  }
});

test("the Best Offers shortlist ranks a published offer without a partner route", async () => {
  // Requiring a governed action emptied every category wherever no partner
  // link existed, so the page showed "no partner link available" instead of a
  // ranking. Publication is not route eligibility.
  const { rankBestOffersForCategory, selectCommercialBestOfferPool } = await import("../lib/public-offer/best-offer-ranking");
  const offer = {
    dataClassification: "PUBLISHED_RECORD" as const,
    action: null,
    bonus: {
      slug: "unrouted-welcome", type: "WELCOME", percentage: 100, minimumDeposit: 10, maximumBonus: 200,
      maximumBet: 5, currency: "EUR", freeSpins: 50, wageringMultiplier: 30, wageringText: null,
      eligibility: "New players", importantConditions: ["Max bet 5"], termsUrl: null, expiresAt: null,
    },
    casino: { id: "c1", slug: "unrouted", name: "Unrouted", editorScore: 8.4, featured: false, recommended: false, payments: [], lastReviewedAt: null, publishedAt: null },
  } as unknown as Parameters<typeof rankBestOffersForCategory>[0][number];

  assert.equal(selectCommercialBestOfferPool([offer], {}).length, 0, "the route-gated pool still excludes it");
  assert.equal(selectCommercialBestOfferPool([offer], { includeWithoutRoute: true }).length, 1);
  assert.equal(rankBestOffersForCategory([offer], "best_overall", {}).length, 0);
  assert.equal(rankBestOffersForCategory([offer], "best_overall", { includeWithoutRoute: true }).length, 1);
});

test("Best Offers puts offers a reader can act on first and keeps editorial order within each group", async () => {
  // Founder decision of 24 September 2026: the route-less top three had left
  // Best Offers without a clickable offer in any market.
  const { rankBestOffersForCategory, selectCommercialBestOfferPool } = await import("../lib/public-offer/best-offer-ranking");
  type Offer = Parameters<typeof rankBestOffersForCategory>[0][number];
  const offer = (slug: string, score: number, linked: boolean) => ({
    dataClassification: "PUBLISHED_RECORD" as const,
    action: linked ? { href: `/r/${slug}` } : null,
    bonus: {
      slug: `${slug}-welcome`, type: "WELCOME", percentage: 100, minimumDeposit: 10, maximumBonus: 200,
      maximumBet: 5, currency: "EUR", freeSpins: 50, wageringMultiplier: 30, wageringText: null,
      eligibility: "New players", importantConditions: ["Max bet 5"], termsUrl: null, expiresAt: null,
    },
    casino: { id: slug, slug, name: slug, editorScore: score, featured: false, recommended: false, payments: [], lastReviewedAt: null, publishedAt: null },
  }) as unknown as Offer;

  const routeless = offer("routeless", 9.0, false);
  const linkedLow = offer("linked-low", 8.0, true);
  const linkedHigh = offer("linked-high", 8.5, true);
  const ranked = rankBestOffersForCategory([routeless, linkedLow, linkedHigh], "best_overall", { includeWithoutRoute: true });
  // The higher score still leads among linked offers; the route-less one follows them.
  assert.deepEqual(ranked.map((item) => item.casino.slug), ["linked-high", "linked-low", "routeless"]);

  // The pool is cut before categories rank it, so it must not let higher-scored
  // route-less offers crowd out every actionable one.
  const crowd = Array.from({ length: 6 }, (_, index) => offer(`routeless-${index}`, 9.5 - index / 10, false));
  const pool = selectCommercialBestOfferPool([...crowd, linkedLow], { includeWithoutRoute: true, limit: 3 });
  assert.equal(pool[0]?.casino.slug, "linked-low");
  assert.deepEqual(pool.slice(1).map((item) => item.casino.slug), ["routeless-0", "routeless-1"]);
});

test("the Best Offers commission answer discloses that linkable offers come first", async () => {
  // The ordering makes route availability — and so commission — part of the
  // order on this page, so the page's own answer about commission must say so in
  // every locale rather than claim the order is independent of it.
  const { productPageMessages } = await import("../lib/i18n/product-pages-catalog");
  const ranking = readFileSync(new URL("../lib/public-offer/best-offer-ranking.ts", import.meta.url), "utf8");
  assert.match(ranking, /function actionableFirst/);
  const english = productPageMessages("en-GB").bestOffers.faqCommissionAnswer;
  assert.match(english, /Offers we can link to are listed first/);
  assert.match(english, /Commission never changes the editorial score/);
  const retired = [
    /does not affect the editorial score or ranking/i,
    /does not determine the editorial score or natural ranking/i,
    /weder die redaktionelle Bewertung noch die Rangfolge/,
    /non influenza la valutazione editoriale né la classifica/,
    /no influye en la puntuación ni en el orden editorial/,
    /não influencia a pontuação nem a ordenação editorial/,
    /beïnvloedt de redactionele beoordeling of rangschikking niet/,
    /påverkar varken betyget eller den redaktionella ordningen/,
    /påvirker hverken vurderingen eller den redaktionelle rækkefølge/,
    /ei vaikuta toimitukselliseen arvioon eikä luonnolliseen järjestykseen/,
    /påvirker ikke den redaksjonelle vurderingen eller den naturlige rangeringen/,
    /δεν επηρεάζει τη συντακτική βαθμολογία ή την κατάταξη/i,
  ];
  for (const locale of ["en-GB", "de-DE", "it-IT", "es-ES", "es-PE", "pt-PT", "el-GR", "nl-NL", "sv-SE", "da-DK", "fi-FI", "nb-NO", "en-CA", "fr-CA"] as const) {
    const answer = productPageMessages(locale).bestOffers.faqCommissionAnswer;
    for (const claim of retired) assert.doesNotMatch(answer, claim, `${locale} still claims order is independent of commission`);
  }
});

test("the Best Offers page and component both stop gating on a route", () => {
  const service = readFileSync(new URL("../lib/services/public-offer.service.ts", import.meta.url), "utf8");
  assert.match(service, /offersMayBePresented\(country\)/, "the shortlist consults the visibility policy");
  const experience = readFileSync(new URL("../components/best-offers/BestOffersExperience.tsx", import.meta.url), "utf8");
  assert.match(experience, /includeWithoutRoute: true/, "categories must not re-filter on a route");
});
