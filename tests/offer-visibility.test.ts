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
