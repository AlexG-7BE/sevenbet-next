import assert from "node:assert/strict";
import test from "node:test";

import { commercialUxMessages } from "../lib/commercial/commercial-ux-messages";
import { demoProfileCopy } from "../lib/i18n/demo-profile-catalog";
import { GERMAN_PROPER_NAME_ALLOWLIST, germanProhibitedTerms } from "../lib/i18n/german-terminology";
import { homeMetadata, homeTranslation } from "../lib/i18n/home-catalog";
import { learningMessages, localizedLearningCategories } from "../lib/i18n/learning-center";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { programmeCatalogueEntries } from "../lib/i18n/programme-catalog";
import { publicErrorMessages } from "../lib/i18n/public-errors";
import { publicFooterMessages, publicShellMessages } from "../lib/i18n/public-shell-catalog";
import { aboutMessages } from "../lib/i18n/static-pages/about";
import { contactMessages } from "../lib/i18n/static-pages/contact";
import { faqMessages } from "../lib/i18n/static-pages/faq";
import { methodologyMessages } from "../lib/i18n/static-pages/methodology";
import { currentProgrammeCopy, tenStepsTranslation } from "../lib/i18n/static-pages/ten-steps";
import { visualFixtureCopy } from "../lib/i18n/visual-fixture-catalog";
import { FIRST_WAVE_MARKET_EVIDENCE } from "../lib/market/first-wave-evidence";

const locale = "de-DE" as const;

function flatten(value: unknown, path: string, output: Map<string, string>) {
  if (typeof value === "string") output.set(path, value);
  else if (value instanceof Map) [...value.values()].forEach((entry, index) => flatten(entry, `${path}<${index}>`, output));
  else if (Array.isArray(value)) value.forEach((entry, index) => flatten(entry, `${path}[${index}]`, output));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => flatten(entry, `${path}.${key}`, output));
  return output;
}

function germanCatalogStrings() {
  const germany = FIRST_WAVE_MARKET_EVIDENCE.DE;
  const catalogs = {
    homeMetadata: homeMetadata(locale),
    home: homeTranslation(locale),
    shell: publicShellMessages(locale),
    footer: publicFooterMessages(locale),
    product: productPageMessages(locale),
    commercial: commercialUxMessages(locale),
    demoProfile: demoProfileCopy(locale),
    visualFixture: visualFixtureCopy(locale),
    errors: publicErrorMessages(locale),
    learning: learningMessages(locale),
    learningCategories: localizedLearningCategories(locale).map((category) => category.title),
    about: aboutMessages(locale),
    contact: contactMessages(locale),
    faq: faqMessages(locale),
    methodology: methodologyMessages(locale),
    tenSteps: tenStepsTranslation(locale),
    currentProgramme: currentProgrammeCopy(locale),
    programme: programmeCatalogueEntries(locale).map((entry) => entry.value),
    // Rendered German safety fields only; `terminology` is internal English guidance, not copy.
    firstWaveSafety: {
      authorityName: germany.authorityName,
      copy: germany.copy,
      resources: germany.resources,
      evidenceTitles: germany.evidence.map((record) => record.title),
    },
  };
  return flatten(catalogs, "de-DE", new Map());
}

test("the German terminology matcher catches generic Casino, jackpot and table-game wording", () => {
  const prohibited = [
    "Casino", "Casinos", "Online-Casino", "Online-Casinos", "Casino-Vergleich", "Casinobewertungen", "Casinoname",
    "Live-Casino", "Kasino", "Jackpot", "Jackpots", "Tischspiele", "Roulette", "Blackjack", "Baccarat", "Poker",
    "Video-Poker", "Live-Dealer", "Live-Tischen", "Croupier",
  ];
  for (const sample of prohibited) {
    assert.ok(germanProhibitedTerms(`Beispiel mit ${sample} im Satz.`).length > 0, sample);
  }
  const permitted = [
    "Beste Online-Spielotheken", "Anbietervergleich", "virtuelle Automatenspiele", "Slots", "Online-Glücksspiel",
    "Glücksspielanbieter", "B4GAMBLE", "Editor Score",
  ];
  for (const sample of permitted) assert.deepEqual(germanProhibitedTerms(sample), [], sample);
  for (const name of GERMAN_PROPER_NAME_ALLOWLIST) {
    assert.deepEqual(germanProhibitedTerms(`Bewertung von ${name}`), [], name);
  }
  assert.deepEqual(germanProhibitedTerms("EUcasino und ein Casino"), ["Casino"]);
});

test("German catalog copy never uses generic Casino wording or mentions jackpots or table games", () => {
  const strings = germanCatalogStrings();
  assert.ok(strings.size > 1_000, `expected the full German catalog set, found ${strings.size} strings`);
  const violations = [...strings]
    .map(([path, value]) => ({ path, terms: germanProhibitedTerms(value), value }))
    .filter((entry) => entry.terms.length > 0)
    .map((entry) => `${entry.path} [${entry.terms.join(", ")}]: ${entry.value}`);
  assert.deepEqual(violations, []);
});
