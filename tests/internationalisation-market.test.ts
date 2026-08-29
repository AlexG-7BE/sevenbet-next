import assert from "node:assert/strict";
import test from "node:test";

import { publicShellMessages } from "../lib/i18n/public-shell-catalog";
import {
  MARKET_PROFILES,
  localizedMarketPath,
  marketProfileByCountry,
  marketProfileByRouteMarket,
} from "../lib/market/registry";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";

test("initial market registry exposes the partner-readiness tranche without implying commercial authority", () => {
  assert.deepEqual(MARKET_PROFILES.map((profile) => profile.countryCode), ["GB", "DE", "IT", "ES", "PT", "GR", "NL", "SE", "DK", "FI", "NO", "CA"]);
  for (const profile of MARKET_PROFILES) {
    assert.equal(profile.commercialPresentationState, "AUTHORITY_REQUIRED");
  }
  assert.equal(marketProfileByCountry("de")?.defaultLocale, "de-DE");
  assert.equal(marketProfileByCountry("it")?.defaultLocale, "it-IT");
  assert.equal(marketProfileByCountry("es")?.defaultLocale, "es-ES");
  assert.equal(marketProfileByCountry("pt")?.defaultLocale, "pt-PT");
  assert.equal(marketProfileByCountry("gr")?.defaultLocale, "el-GR");
  assert.equal(marketProfileByCountry("nl")?.defaultLocale, "nl-NL");
  assert.equal(marketProfileByRouteMarket("SE")?.countryCode, "SE");
});

test("localized paths keep market and language explicit", () => {
  const germany = marketProfileByCountry("DE");
  const italy = marketProfileByCountry("IT");
  const spain = marketProfileByCountry("ES");
  const portugal = marketProfileByCountry("PT");
  const greece = marketProfileByCountry("GR");
  const netherlands = marketProfileByCountry("NL");
  const canada = marketProfileByCountry("CA");
  assert.ok(germany);
  assert.ok(italy);
  assert.ok(spain);
  assert.ok(portugal);
  assert.ok(greece);
  assert.ok(netherlands);
  assert.ok(canada);
  assert.equal(localizedMarketPath(germany, "de-DE"), "/de/de/");
  assert.equal(localizedMarketPath(italy, "it-IT"), "/it/it/");
  assert.equal(localizedMarketPath(spain, "es-ES"), "/es/es/");
  assert.equal(localizedMarketPath(portugal, "pt-PT"), "/pt/pt/");
  assert.equal(localizedMarketPath(greece, "el-GR"), "/gr/el/");
  assert.equal(localizedMarketPath(netherlands, "nl-NL"), "/nl/nl/");
  assert.equal(localizedMarketPath(germany, "de-DE", "/casinos"), "/de/de/casinos");
  assert.equal(localizedMarketPath(canada, "fr-CA", "/help"), "/ca/fr/help");
  assert.throws(() => localizedMarketPath(germany, "en-GB"));
});

test("explicit localized route wins over preference and trusted geo", () => {
  const result = resolvePresentationContext({
    routeMarket: "se",
    routeLanguage: "sv",
    preference: { countryCode: "DE", locale: "de-DE" },
    trustedCountryCode: "GB",
  });
  assert.equal(result.market.countryCode, "SE");
  assert.equal(result.locale, "sv-SE");
  assert.equal(result.source, "EXPLICIT_ROUTE");
  assert.equal(result.explicitRouteValid, true);
});

test("user presentation preference can select presentation but is not a commercial authority object", () => {
  const result = resolvePresentationContext({
    preference: { countryCode: "FI", locale: "fi-FI" },
    trustedCountryCode: "GB",
  });
  assert.equal(result.market.countryCode, "FI");
  assert.equal(result.locale, "fi-FI");
  assert.equal(result.source, "USER_PREFERENCE");
  assert.equal("commercialAllowed" in result, false);
  assert.equal("referralAllowed" in result, false);
});

test("trusted geo selects expanded partner-ready markets and unsupported geo falls back deterministically to GB", () => {
  const italy = resolvePresentationContext({ trustedCountryCode: "IT" });
  const spain = resolvePresentationContext({ trustedCountryCode: "ES" });
  const portugal = resolvePresentationContext({ trustedCountryCode: "PT" });
  const greece = resolvePresentationContext({ trustedCountryCode: "GR" });
  const netherlands = resolvePresentationContext({ trustedCountryCode: "NL" });
  const unsupported = resolvePresentationContext({ trustedCountryCode: "US" });
  assert.equal(italy.locale, "it-IT");
  assert.equal(spain.locale, "es-ES");
  assert.equal(portugal.locale, "pt-PT");
  assert.equal(greece.locale, "el-GR");
  assert.equal(netherlands.locale, "nl-NL");
  for (const result of [italy, spain, portugal, greece, netherlands]) assert.equal(result.source, "TRUSTED_GEO");
  assert.equal(unsupported.market.countryCode, "GB");
  assert.equal(unsupported.locale, "en-GB");
  assert.equal(unsupported.source, "DEFAULT");
});

test("invalid explicit route never force-enables an unsupported market", () => {
  const result = resolvePresentationContext({ routeMarket: "xx", routeLanguage: "xx", trustedCountryCode: "DK" });
  assert.equal(result.market.countryCode, "DK");
  assert.equal(result.source, "TRUSTED_GEO");
  assert.equal(result.explicitRouteValid, false);
});

test("all registered locales have a complete public-shell catalog", () => {
  for (const profile of MARKET_PROFILES) {
    for (const locale of profile.supportedLocales) {
      const messages = publicShellMessages(locale);
      for (const value of Object.values(messages)) assert.ok(value.trim().length > 0, `${locale} contains an empty public-shell message`);
    }
  }
});
