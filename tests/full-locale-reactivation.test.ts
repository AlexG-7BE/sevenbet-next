import assert from "node:assert/strict";
import test from "node:test";

import { TRANSLATION_REVIEW_STATE } from "../lib/i18n/review-state";
import {
  MARKET_PUBLICATION_POLICY,
  PUBLISHED_LANGUAGE_ROUTE_PROFILES,
} from "../lib/market/registry";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import { PROGRAMME_LOCALES } from "../lib/programme/presentation";

const productionLocales = [
  "en-GB",
  "de-DE",
  "es-ES",
  "el-GR",
  "sv-SE",
  "da-DK",
  "it-IT",
  "pt-PT",
  "nl-NL",
  "fi-FI",
  "nb-NO",
] as const;

test("published locale routes activate all production-ready translations without granting market, legal, or evidence approval", () => {
  assert.deepEqual(PUBLISHED_LANGUAGE_ROUTE_PROFILES.map((profile) => profile.defaultLocale), productionLocales);
  assert.deepEqual(PROGRAMME_LOCALES, productionLocales);

  for (const locale of ["it-IT", "pt-PT", "nl-NL", "fi-FI", "nb-NO"] as const) {
    assert.deepEqual(TRANSLATION_REVIEW_STATE[locale], {
      content: "MACHINE_TRANSLATED",
      publicExperience: "PUBLIC_CORE_READY",
      aiLanguageQa: "AI_LANGUAGE_QA_PASSED",
      founderPublication: "FOUNDER_PUBLICATION_NOT_ACCEPTED",
      legalReview: "REQUIRED",
      marketEvidenceReview: "REQUIRED",
    });
  }

  for (const market of ["IT", "PT", "NL", "FI", "NO"] as const) {
    assert.equal(MARKET_PUBLICATION_POLICY[market].published, false, `${market} market publication remains separate`);
    assert.equal(MARKET_PUBLICATION_POLICY[market].indexable, false, `${market} market indexing remains blocked`);
  }
});

test("manual language selection never changes trusted commercial jurisdiction", () => {
  for (const routeLanguage of PUBLISHED_LANGUAGE_ROUTE_PROFILES.map((profile) => profile.language)) {
    const presentation = resolvePresentationContext({ routeLanguage, trustedCountryCode: "DE" });
    assert.equal(presentation.language, routeLanguage);
    assert.equal(presentation.marketCountryCode, "DE");
    assert.equal(presentation.market?.countryCode, "DE");
    assert.equal(presentation.marketSource, "TRUSTED_GEO");
  }
});
