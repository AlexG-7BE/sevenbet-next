import assert from "node:assert/strict";
import test from "node:test";

import { homeTranslation } from "../lib/i18n/home-catalog";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { faqMessages } from "../lib/i18n/static-pages/faq";
import { FIRST_WAVE_MARKET_EVIDENCE } from "../lib/market/first-wave-evidence";

const acceptedLocales = ["en-GB", "de-DE", "es-ES", "sv-SE", "da-DK", "el-GR"] as const;
const europeanLocales = ["en-GB", "de-DE", "it-IT", "es-ES", "pt-PT", "el-GR", "nl-NL", "sv-SE", "da-DK", "fi-FI", "nb-NO"] as const;

function productCorpus(locale: (typeof acceptedLocales)[number]) {
  return Object.values(productPageMessages(locale))
    .flatMap((section) => Object.values(section))
    .join("\n");
}

test("accepted product catalogs do not expose internal commercial-routing language", () => {
  const internalLanguage: Record<(typeof acceptedLocales)[number], readonly RegExp[]> = {
    "en-GB": [
      /request[- ]time authority/i,
      /raw destination URL/i,
      /browser-supplied authority/i,
      /availability fails closed/i,
      /inferred actions/i,
      /claim actions/i,
      /redirect authority/i,
      /governed (?:visit|signup route|links?)/i,
    ],
    "de-DE": [
      /Anfrage-Autorität/i,
      /rohe Ziel-URL/i,
      /Autorität aus dem Browser/i,
      /Verfügbarkeit bleibt geschlossen/i,
      /abgeleitete Aktionen/i,
      /Beanspruchungsaktionen/i,
      /Weiterleitungsautorität/i,
    ],
    "es-ES": [
      /autorización independiente en el momento de la solicitud/i,
      /la disponibilidad falla de forma segura/i,
      /acciones (?:inferidas|supuestas|de oferta)/i,
      /ruta de registro autorizada/i,
      /autoridad de redirección/i,
    ],
    "sv-SE": [
      /separat behörighet vid varje begäran/i,
      /antagna åtgärder/i,
      /erbjudandeåtgärder/i,
      /godkänd registreringsväg/i,
      /omdirigering är godkänd/i,
    ],
    "da-DK": [
      /særskilt godkendelse ved hver forespørgsel/i,
      /formodede handlinger/i,
      /tilbudshandlinger/i,
      /godkendt tilmeldingsvej/i,
      /viderestilling er godkendt/i,
    ],
    "el-GR": [
      /ξεχωριστή έγκριση τη στιγμή του αιτήματος/i,
      /υποτιθέμενες ενέργειες/i,
      /ενέργειες προσφοράς/i,
      /εγκεκριμένη διαδρομή εγγραφής/i,
      /έγκριση ανακατεύθυνσης/i,
    ],
  };

  for (const locale of acceptedLocales) {
    const corpus = productCorpus(locale);
    for (const pattern of internalLanguage[locale]) {
      assert.doesNotMatch(corpus, pattern, `${locale} exposes ${pattern}`);
    }
  }
});

test("accepted product catalogs use natural profile year labels and truthful partner-link states", () => {
  assert.deepEqual(
    acceptedLocales.map((locale) => productPageMessages(locale).profile.founded),
    ["Founded", "Gründungsjahr", "Año de fundación", "Grundat", "Grundlagt", "Έτος ίδρυσης"],
  );

  const partnerLinkTerms: Record<(typeof acceptedLocales)[number], RegExp> = {
    "en-GB": /partner link/i,
    "de-DE": /Partnerlink/i,
    "es-ES": /enlace/i,
    "sv-SE": /partnerlänk/i,
    "da-DK": /partnerlink/i,
    "el-GR": /σύνδεσμ/i,
  };

  for (const locale of acceptedLocales) {
    const messages = productPageMessages(locale);
    for (const value of [
      messages.common.commercialUnavailable,
      messages.common.reviewAvailableNoAction,
      messages.casinos.reviewOnlyNotice,
      messages.bestOffers.availabilityFailsClosed,
    ]) {
      assert.match(value, partnerLinkTerms[locale], `${locale}: ${value}`);
    }
  }
});

test("European product catalogs preserve the Editor Score product term in commission answers", () => {
  for (const locale of europeanLocales) {
    assert.match(productPageMessages(locale).casinos.faqCommissionAnswer, /Editor Score/, locale);
  }
});

test("European bonus editorial filters are explicit, distinct and never fall back to English", () => {
  const keys = ["featuredFilter", "featuredTrue", "featuredFalse", "recommendedFilter", "recommendedTrue", "recommendedFalse"] as const;
  const english = productPageMessages("en-GB").bonuses;

  for (const locale of europeanLocales) {
    const bonuses = productPageMessages(locale).bonuses;
    const values = keys.map((key) => bonuses[key]);
    assert.equal(new Set(values).size, keys.length, `${locale} must distinguish both fields and both boolean states`);
    for (const [index, value] of values.entries()) {
      assert.ok(value.trim().length > 0, `${locale}.${keys[index]} must be visible copy`);
      if (locale !== "en-GB") assert.notEqual(value, english[keys[index]], `${locale}.${keys[index]} fell back to English`);
    }
  }
});

test("reviewed copy does not regress to implementation jargon or the corrected calques", () => {
  const forbiddenFaqLanguage = /governed signup|governed commercial|kontrolliert(?:e[rmn]?|en) kommerziell|styret kommercielt|beheerste commerciële|hallitun kaupallisen|styrt kommersiell/i;
  for (const locale of europeanLocales) {
    const faq = faqMessages(locale);
    const reviewedAnswers = [faq.groups[2]?.items[1]?.[1], faq.groups[3]?.items[0]?.[1], faq.groups[3]?.items[1]?.[1], faq.groups[4]?.items[1]?.[1]].filter(Boolean).join("\n");
    assert.doesNotMatch(reviewedAnswers, forbiddenFaqLanguage, locale);
  }

  assert.equal(productPageMessages("de-DE").common.breadcrumb, "Navigationspfad");
  assert.equal(productPageMessages("es-ES").common.saferGamblingInformation, "Información sobre juego seguro");
  assert.equal(productPageMessages("nl-NL").common.visitAvailability, "Beschikbaarheid van partnerlink");
  assert.equal(productPageMessages("fi-FI").common.cryptoSupported, "Kryptovaluuttoja tuetaan");
  assert.equal(productPageMessages("nb-NO").outbound.continueAction, "Fortsett til operatøren →");
});

test("home and first-wave safety copy retains the reviewed reader-facing formulations", () => {
  assert.equal(homeTranslation("de-DE")?.evidence[7], "Eine Grundlage für klar eingegrenzte Formulierungen im Programm und für Risikokontrollen.");
  assert.equal(homeTranslation("sv-SE")?.hero[8], "Skrolla ↓");
  assert.equal(homeTranslation("el-GR")?.recognition[0], "Γίνεται όλο και πιο");
  assert.equal(homeTranslation("fi-FI")?.trust[1], "Kaksi toiminta-aluetta.");
  assert.equal(homeTranslation("nb-NO")?.trust[8], "Dokumentasjonen og begrensningene for anmeldelsen oppgis.");

  assert.equal(FIRST_WAVE_MARKET_EVIDENCE.DE.copy.helpTitle, "Hilfe, die von kommerziellen Inhalten getrennt bleibt.");
  assert.equal(FIRST_WAVE_MARKET_EVIDENCE.SE.copy.helpTitle, "Hjälp som hålls skild från kommersiellt innehåll.");
  assert.equal(FIRST_WAVE_MARKET_EVIDENCE.DK.copy.helpTitle, "Hjælp, der holdes adskilt fra kommercielt indhold.");
  assert.equal(FIRST_WAVE_MARKET_EVIDENCE.GR.copy.disclaimer, "Η B4GAMBLE δεν είναι ρυθμιστική αρχή ή πάροχος θεραπείας. Έλεγξε τις υπηρεσίες και την πολιτική απορρήτου κάθε φορέα.");
});
