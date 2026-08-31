import assert from "node:assert/strict";
import test from "node:test";

import { temporaryDemoCasinoProfiles } from "../lib/demo-data/temporary-demo-best-offers";
import {
  withHandoffCasinoEditorialData,
  withHandoffCasinoProfileData,
} from "../lib/final-handoff/visual-data-fixture";
import { demoProfileCopy } from "../lib/i18n/demo-profile-catalog";
import { INITIAL_EUROPEAN_MARKET_PROFILES } from "../lib/market/registry";

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

test("the local profile fixture localizes B4GAMBLE-authored copy across every European locale", () => {
  const seed = temporaryDemoCasinoProfiles()[0];
  assert.ok(seed);
  const englishProfile = withHandoffCasinoProfileData(seed, true, "en-GB");
  const englishEditorial = withHandoffCasinoEditorialData(null, true, "en-GB");
  assert.ok(englishEditorial);

  for (const market of INITIAL_EUROPEAN_MARKET_PROFILES) {
    const locale = market.defaultLocale;
    const profile = withHandoffCasinoProfileData(seed, true, locale);
    const editorial = withHandoffCasinoEditorialData(null, true, locale);
    assert.ok(editorial, locale);

    assert.equal(profile.id, englishProfile.id, locale);
    assert.equal(profile.name, englishProfile.name, locale);
    assert.equal(profile.editorScore, englishProfile.editorScore, locale);
    assert.equal(profile.licenses[0]?.authority, "MGA", locale);
    assert.equal(profile.providers[0]?.name, "Orbit Studios", locale);
    assert.equal(profile.affiliate.available, false, locale);
    assert.equal(profile.affiliate.href, null, locale);
    assert.equal(profile.bonuses[0]?.affiliate.available, false, locale);
    assert.equal(profile.bonuses[0]?.affiliate.href, null, locale);
    assert.equal(profile.bonuses[0]?.percentage, 100, locale);
    assert.equal(profile.bonuses[0]?.maximumBonus, 500, locale);
    assert.equal(profile.bonuses[0]?.freeSpins, 200, locale);
    assert.equal(profile.bonuses[0]?.wageringMultiplier, 35, locale);
    assert.equal(profile.bonuses[0]?.type, "WELCOME", locale);
    assert.equal(profile.bonuses[0]?.termsUrl, null, locale);
    assert.equal(profile.operator, null, locale);
    assert.equal(profile.domain, "example.invalid", locale);
    assert.deepEqual(profile.languages, [locale], locale);
    assert.deepEqual(profile.currencies, [market.currencyHints[0]], locale);
    assert.equal(profile.countries[0]?.countryCode, market.countryCode, locale);
    assert.equal(profile.countries[0]?.language, locale, locale);
    assert.equal(profile.seo.title, demoProfileCopy(locale).editorial.seoTitle, locale);
    assert.equal(profile.seo.structuredData, null, locale);
    assert.equal(profile.seo.socialImage, null, locale);
    assert.deepEqual(profile.media.screenshots, [], locale);
    assert.deepEqual(profile.media.gallery, [], locale);
    assert.equal(profile.media.socialImage, null, locale);
    assert.ok(profile.payments.every((payment) => payment.fees === null && payment.minimumWithdrawal === null && payment.maximumWithdrawal === null), locale);
    assert.ok(profile.payments.every((payment) => payment.depositProcessingTime === demoProfileCopy(locale).instant), locale);

    if (locale === "en-GB") continue;
    const localizedFields = [
      profile.title,
      profile.summary,
      profile.reviewContent,
      ...profile.pros,
      ...profile.cons,
      ...profile.responsibleGamblingTools,
      profile.payments[2]?.name,
      profile.categories[0]?.name,
      profile.bonuses[0]?.title,
      profile.bonuses[0]?.summary,
      profile.bonuses[0]?.wageringText,
      profile.bonuses[0]?.eligibility,
      ...(profile.bonuses[0]?.importantConditions ?? []),
      profile.media.logo?.alt,
      profile.media.hero?.alt,
    ];
    const englishFields = [
      englishProfile.title,
      englishProfile.summary,
      englishProfile.reviewContent,
      ...englishProfile.pros,
      ...englishProfile.cons,
      ...englishProfile.responsibleGamblingTools,
      englishProfile.payments[2]?.name,
      englishProfile.categories[0]?.name,
      englishProfile.bonuses[0]?.title,
      englishProfile.bonuses[0]?.summary,
      englishProfile.bonuses[0]?.wageringText,
      englishProfile.bonuses[0]?.eligibility,
      ...(englishProfile.bonuses[0]?.importantConditions ?? []),
      englishProfile.media.logo?.alt,
      englishProfile.media.hero?.alt,
    ];
    assert.equal(localizedFields.length, englishFields.length, locale);
    localizedFields.forEach((value, index) => {
      assert.ok(value?.trim(), `${locale} profile field ${index}`);
      assert.notEqual(value, englishFields[index], `${locale} profile field ${index} retained English source copy`);
    });

    const englishEditorialStrings = strings(englishEditorial);
    const localizedEditorialStrings = strings(editorial);
    for (const source of englishEditorialStrings.filter((value) => value.includes(" "))) {
      assert.equal(localizedEditorialStrings.includes(source), false, `${locale} retained editorial source copy: ${source}`);
    }
  }
});

test("profile-fixture localization is inert unless the local visual fixture is enabled", () => {
  const seed = temporaryDemoCasinoProfiles()[0];
  assert.ok(seed);
  assert.strictEqual(withHandoffCasinoProfileData(seed, false, "de-DE"), seed);
  const editorial = withHandoffCasinoEditorialData(null, false, "de-DE");
  assert.equal(editorial, null);
});

test("demo profile review-recency answers use reader-facing language in every European locale", () => {
  const expected = {
    "en-GB": "This is fixed test content for the interface, not a current operator review.",
    "de-DE": "Dies sind festgelegte Testinhalte für die Oberfläche, keine aktuelle Anbieterbewertung.",
    "it-IT": "Si tratta di contenuti di prova predefiniti per l’interfaccia, non di una recensione aggiornata di un operatore.",
    "es-ES": "Es contenido de prueba predefinido para la interfaz, no una reseña actualizada de un operador.",
    "pt-PT": "Trata-se de conteúdo de teste predefinido para a interface, não de uma análise atualizada de um operador.",
    "el-GR": "Πρόκειται για προκαθορισμένο δοκιμαστικό περιεχόμενο της διεπαφής, όχι για τρέχουσα αξιολόγηση παρόχου.",
    "nl-NL": "Dit is vaste testinhoud voor de interface, geen actuele beoordeling van een aanbieder.",
    "sv-SE": "Det här är fast testinnehåll för gränssnittet, inte en aktuell operatörsrecension.",
    "da-DK": "Dette er fast testindhold til brugerfladen, ikke en aktuel anmeldelse af en udbyder.",
    "fi-FI": "Kyse on käyttöliittymän kiinteästä testisisällöstä, ei rahapelitoimijan ajantasaisesta arviosta.",
    "nb-NO": "Dette er fast testinnhold for grensesnittet, ikke en aktuell operatøranmeldelse.",
  } as const;

  for (const [locale, answer] of Object.entries(expected)) {
    assert.equal(demoProfileCopy(locale as keyof typeof expected).editorial.faq[1][1], answer, locale);
  }
});
