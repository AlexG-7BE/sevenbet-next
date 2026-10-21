import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { candidateOfferCountries, openOfferCountries, withOfferCountryChoice } from "../lib/public-offer/offer-country";
import { parseOfferCountryChoice } from "../lib/public-offer/offer-country-cookie";
import type { PublicOfferStore } from "../lib/repositories/public-offer.repository";
import { PublicOfferService } from "../lib/services/public-offer.service";

// 14:00 and 23:30 in Berlin: outside and inside the German advertising window.
const berlinAfternoon = new Date("2026-10-21T12:00:00.000Z");
const berlinNight = new Date("2026-10-21T21:30:00.000Z");

function presentation(country: string | null, language: "en" | "sv" = "en") {
  return {
    language,
    marketCountryCode: country,
    marketCode: country,
    marketDisplayName: country ?? "readers worldwide",
    editorialFallback: false,
  };
}

test("the cookie value is a two-letter country or nothing", () => {
  assert.equal(parseOfferCountryChoice("se"), "SE");
  assert.equal(parseOfferCountryChoice(" DK "), "DK");
  assert.equal(parseOfferCountryChoice("GBR"), null);
  assert.equal(parseOfferCountryChoice("S1"), null);
  assert.equal(parseOfferCountryChoice(undefined), null);
});

test("an offer names its own countries; a rest-of-world offer names none", () => {
  assert.deepEqual(candidateOfferCountries({ sourceScope: "MARKET", sourceCountryCode: "se", geoMode: "GLOBAL", allowedCountries: [] }), ["SE"]);
  assert.deepEqual(candidateOfferCountries({ sourceScope: "GLOBAL", sourceCountryCode: null, geoMode: "ALLOW", allowedCountries: ["br", "CL", "bad"] }), ["BR", "CL"]);
  assert.deepEqual(candidateOfferCountries({ sourceScope: "GLOBAL", sourceCountryCode: null, geoMode: "GLOBAL", allowedCountries: [] }), []);
  assert.deepEqual(candidateOfferCountries({ sourceScope: "GLOBAL", sourceCountryCode: null, geoMode: "BLOCK", allowedCountries: [] }), []);
});

test("the country list holds only countries the register lets the lists show now", () => {
  const pairs = [
    { casinoSlug: "nordicbet", countryCode: "SE" },
    { casinoSlug: "nordicbet", countryCode: "DK" },
    // Licensed in Sweden and Denmark only: its UK offer is closed.
    { casinoSlug: "nordicbet", countryCode: "GB" },
    { casinoSlug: "drueckglueck", countryCode: "DE" },
    // New Zealand prohibits presenting offers.
    { casinoSlug: "some-offshore-brand", countryCode: "NZ" },
    // No licence rule: open.
    { casinoSlug: "some-offshore-brand", countryCode: "TH" },
  ];
  assert.deepEqual(openOfferCountries(pairs, berlinAfternoon), ["DK", "SE", "TH"]);
  assert.deepEqual(openOfferCountries(pairs, berlinNight), ["DE", "DK", "SE", "TH"]);
});

test("without a choice the lists keep the visitor's view and offer the other countries", () => {
  const result = withOfferCountryChoice(presentation("GB"), { visitorCountryCode: "GB", choice: null, countries: ["SE", "DK", "GB"] });
  assert.equal(result.marketCountryCode, "GB");
  assert.equal(result.offerCountry?.countryCode, "GB");
  assert.equal(result.offerCountry?.chosen, false);
  assert.equal(result.offerCountry?.actionsElsewhere, false);
  assert.deepEqual(result.offerCountry?.options.map((option) => option.label), ["Denmark", "Sweden", "United Kingdom"]);
});

test("a chosen country moves the view and says the buttons belong to another country", () => {
  const result = withOfferCountryChoice(presentation("GB"), { visitorCountryCode: "GB", choice: "se", countries: ["SE", "DK"] });
  assert.equal(result.marketCountryCode, "SE");
  assert.equal(result.marketCode, "SE");
  assert.equal(result.marketDisplayName, "Sweden");
  assert.equal(result.offerCountry?.chosen, true);
  assert.equal(result.offerCountry?.defaultCountryCode, "GB");
  assert.equal(result.offerCountry?.actionsElsewhere, true);
});

test("a visitor shown another country by language can pick their own, where buttons work", () => {
  // A reader in Thailand on /en is shown the United Kingdom by default (lib/market/editorial-market.ts).
  const result = withOfferCountryChoice({ ...presentation("GB"), editorialFallback: true }, { visitorCountryCode: "TH", choice: "TH", countries: ["TH", "SE"] });
  assert.equal(result.marketCountryCode, "TH");
  assert.equal(result.editorialFallback, false);
  assert.equal(result.offerCountry?.actionsElsewhere, false);
});

test("country names follow the page language", () => {
  const result = withOfferCountryChoice(presentation("SE", "sv"), { visitorCountryCode: "SE", choice: "DK", countries: ["DK", "GB"] });
  assert.equal(result.marketDisplayName, "Danmark");
  assert.deepEqual(result.offerCountry?.options.map((option) => option.label), ["Danmark", "Storbritannien", "Sverige"]);
});

test("a choice the lists cannot show, or the default itself, changes nothing", () => {
  const unknown = withOfferCountryChoice(presentation("GB"), { visitorCountryCode: "GB", choice: "DE", countries: ["SE"] });
  assert.equal(unknown.marketCountryCode, "GB");
  assert.equal(unknown.offerCountry?.chosen, false);
  const same = withOfferCountryChoice(presentation("GB"), { visitorCountryCode: "GB", choice: "GB", countries: ["GB", "SE"] });
  assert.equal(same.offerCountry?.chosen, false);
});

test("visitors from a country that prohibits offers get no filter and no other country's list", () => {
  const visitor = withOfferCountryChoice(presentation("NL"), { visitorCountryCode: "NL", choice: "SE", countries: ["SE", "DK"] });
  assert.equal(visitor.marketCountryCode, "NL");
  assert.equal(visitor.offerCountry, null);
  // Even when the language view would show another country.
  const fallback = withOfferCountryChoice({ ...presentation("GB"), editorialFallback: true }, { visitorCountryCode: "AU", choice: "SE", countries: ["SE"] });
  assert.equal(fallback.marketCountryCode, "GB");
  assert.equal(fallback.offerCountry, null);
});

test("with one country, or none, there is nothing to choose", () => {
  assert.equal(withOfferCountryChoice(presentation("GB"), { visitorCountryCode: "GB", choice: null, countries: ["GB"] }).offerCountry, null);
  assert.equal(withOfferCountryChoice(presentation(null), { visitorCountryCode: null, choice: "SE", countries: ["SE", "DK"] }).offerCountry, null);
});

test("the service lists open offer countries and survives a store failure", async () => {
  const store = (pairs: () => Promise<{ casinoSlug: string; countryCode: string }[]>): PublicOfferStore => ({ listOffers: async () => [], listOfferMarkets: pairs });
  const service = new PublicOfferService(store(async () => [{ casinoSlug: "nordicbet", countryCode: "SE" }, { casinoSlug: "x", countryCode: "AU" }]), { cmsEnabled: true });
  assert.deepEqual(await service.listOfferCountries(berlinAfternoon), ["SE"]);
  const failing = new PublicOfferService(store(async () => { throw new Error("unavailable"); }), { cmsEnabled: true });
  assert.deepEqual(await failing.listOfferCountries(berlinAfternoon), []);
  const disabled = new PublicOfferService(store(async () => [{ casinoSlug: "nordicbet", countryCode: "SE" }]), { cmsEnabled: false });
  assert.deepEqual(await disabled.listOfferCountries(berlinAfternoon), []);
});

test("the choice never reaches the jurisdiction resolver or a partner action", () => {
  const server = readFileSync("lib/public-offer/offer-country.server.ts", "utf8");
  const choice = readFileSync("lib/public-offer/offer-country.ts", "utf8");
  for (const source of [server, choice]) {
    assert.doesNotMatch(source, /userSelectedCountry|resolveServerJurisdiction|jurisdictionResolver/);
  }
  // Every commercial page keeps asking for actions with the trusted jurisdiction, not the choice.
  for (const page of ["app/(public)/bonuses/page.tsx", "app/(public)/casinos/page.tsx", "app/(public)/best-offers/page.tsx", "app/(public)/casino/[slug]/page.tsx"]) {
    const source = readFileSync(page, "utf8");
    assert.match(source, /resolveServerOfferPresentation\(\)/);
    assert.match(source, /resolveServerJurisdiction\(\)/);
  }
});
