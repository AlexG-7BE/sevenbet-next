import { createHash } from "node:crypto";

import { HOME_SOURCE_COPY, homeTranslation } from "./home-catalog";
import { demoProfileCopy } from "./demo-profile-catalog";
import { learningMessages } from "./learning-center";
import { productPageMessages } from "./product-pages-catalog";
import { publicErrorMessages } from "./public-errors";
import { publicFooterMessages, publicShellMessages } from "./public-shell-catalog";
import { aboutMessages } from "./static-pages/about";
import { contactMessages } from "./static-pages/contact";
import { faqMessages } from "./static-pages/faq";
import { methodologyMessages } from "./static-pages/methodology";
import { tenStepsTranslation } from "./static-pages/ten-steps";
import { visualFixtureCopy } from "./visual-fixture-catalog";
import type { SupportedLocale } from "@/lib/market/registry";
import { FIRST_WAVE_MARKET_EVIDENCE } from "@/lib/market/first-wave-evidence";

export const EUROPEAN_MACHINE_TRANSLATED_LOCALES = [
  "de-DE", "it-IT", "es-ES", "pt-PT", "el-GR", "nl-NL", "sv-SE", "da-DK", "fi-FI", "nb-NO",
] as const satisfies readonly SupportedLocale[];

export type EuropeanMachineTranslatedLocale = typeof EUROPEAN_MACHINE_TRANSLATED_LOCALES[number];

export const LANGUAGE_QA_CHECKS = [
  "SOURCE_KEY_COMPLETENESS", "NON_EMPTY_STRINGS", "OBVIOUS_ENGLISH_UI_LEAKAGE", "WRONG_LOCALE_LEAKAGE",
  "PLACEHOLDER_AND_INTERPOLATION_INTEGRITY", "UNICODE_INTEGRITY", "HTML_TEXT_SAFETY", "TERMINOLOGY_CONSISTENCY",
  "B4GAMBLE_AND_SOURCE_NAME_PRESERVATION", "PROGRAMME_COMMERCIAL_SEPARATION", "NO_CLINICAL_CLAIM_SEMANTICS",
  "AFFILIATE_EDITORIAL_INDEPENDENCE",
  "CURATED_CONTROL_SEMANTICS",
  "NATURAL_PUBLIC_LANGUAGE",
] as const;

export type LanguageQaCheck = typeof LANGUAGE_QA_CHECKS[number];

export type LanguageQaLocaleResult = Readonly<{
  locale: EuropeanMachineTranslatedLocale;
  status: "PASS" | "FAIL";
  checkedStrings: number;
  checks: Readonly<Record<LanguageQaCheck, "PASS" | "FAIL">>;
  findings: readonly string[];
}>;

export type LanguageQaReport = Readonly<{
  schemaVersion: 1;
  generatedAt: "2026-08-30";
  assurance: "BOUNDED_AUTOMATED_LANGUAGE_QA_NOT_HUMAN_OR_LEGAL_REVIEW";
  sourceLocale: "en-GB";
  catalogDigest: string;
  status: "PASS" | "FAIL";
  locales: readonly LanguageQaLocaleResult[];
}>;

function snapshot(locale: SupportedLocale) {
  const learning = learningMessages(locale);
  const methodology = methodologyMessages(locale);
  return {
    shell: publicShellMessages(locale), footer: publicFooterMessages(locale),
    home: locale === "en-GB" ? HOME_SOURCE_COPY : homeTranslation(locale), product: productPageMessages(locale),
    demoProfile: demoProfileCopy(locale),
    errors: publicErrorMessages(locale), about: aboutMessages(locale), contact: contactMessages(locale), faq: faqMessages(locale),
    methodology: { metadataTitle: methodology.metadataTitle, metadataDescription: methodology.metadataDescription, text: [...methodology.copy.values()] },
    tenSteps: tenStepsTranslation(locale),
    visualFixture: visualFixtureCopy(locale),
    learning: { categories: learning.categories, articles: learning.articles, hub: learning.hub, template: learning.template, ui: learning.ui },
  };
}

function supplementalSnapshot(locale: SupportedLocale) {
  const firstWaveSafety = Object.values(FIRST_WAVE_MARKET_EVIDENCE)
    .find((profile) => profile.locale === locale)?.copy ?? null;
  return { firstWaveSafety };
}

function flatten(value: unknown, path = "", output: Record<string, string> = {}) {
  if (typeof value === "string") output[path] = value;
  else if (Array.isArray(value)) value.forEach((entry, index) => flatten(entry, `${path}[${index}]`, output));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => flatten(entry, path ? `${path}.${key}` : key, output));
  return output;
}

function placeholders(value: string) {
  return [...value.matchAll(/\{\{?[a-z][a-z0-9_-]*\}?\}/gi)].map((match) => match[0]).sort();
}

function hasMalformedUnicode(value: string) {
  return value.includes("�") || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value);
}

const englishUiLeakage = /\b(?:Skip to main content|Best Offers|Start Programme|No guides match|This choice changes|Casino offer comparison|Casino reviews for|Open protected Help|Name \(optional\)|Research|discovery|paywall)\b/i;
const localeMarkers: Record<EuropeanMachineTranslatedLocale, string> = {
  "de-DE": "verantwortungsvolles glücksspiel", "it-IT": "gioco responsabile", "es-ES": "juego responsable",
  "pt-PT": "jogo responsável", "el-GR": "υπεύθυνο παιχνίδι", "nl-NL": "verantwoord gokken", "sv-SE": "ansvarsfullt spel",
  "da-DK": "ansvarligt spil", "fi-FI": "vastuullinen pelaaminen", "nb-NO": "ansvarlig spill",
};
const semanticTerms: Record<EuropeanMachineTranslatedLocale, Readonly<{ programme: RegExp; commercial: RegExp; clinical: RegExp; affiliate: RegExp; editorial: RegExp }>> = {
  "de-DE": { programme: /programm/i, commercial: /kommerziell/i, clinical: /klinisch/i, affiliate: /affiliate/i, editorial: /redaktionell/i },
  "it-IT": { programme: /programma/i, commercial: /commercial/i, clinical: /clinic/i, affiliate: /affiliat/i, editorial: /editorial/i },
  "es-ES": { programme: /programa/i, commercial: /comercial/i, clinical: /clínic/i, affiliate: /afili/i, editorial: /editorial/i },
  "pt-PT": { programme: /programa/i, commercial: /comercial/i, clinical: /clínic/i, affiliate: /afili/i, editorial: /editorial/i },
  "el-GR": { programme: /πρόγραμμα/i, commercial: /εμπορ/i, clinical: /κλινικ/i, affiliate: /συνεργατ/i, editorial: /συντακτικ/i },
  "nl-NL": { programme: /programma/i, commercial: /commerci/i, clinical: /klinisch/i, affiliate: /affiliate/i, editorial: /redaction/i },
  "sv-SE": { programme: /program/i, commercial: /kommersi/i, clinical: /klinisk/i, affiliate: /affiliate/i, editorial: /redaktion/i },
  "da-DK": { programme: /program/i, commercial: /kommerci/i, clinical: /klinisk/i, affiliate: /affiliate/i, editorial: /redaktion/i },
  "fi-FI": { programme: /ohjelma/i, commercial: /kaupalli/i, clinical: /kliinis/i, affiliate: /kumppan/i, editorial: /toimituks/i },
  "nb-NO": { programme: /program/i, commercial: /kommer/i, clinical: /klinisk/i, affiliate: /affiliate/i, editorial: /redaksjon/i },
};
const protectedNames = ["B4GAMBLE", "NHS", "NICE", "Editor Score"] as const;
const internalRoutingLanguage: Record<EuropeanMachineTranslatedLocale, readonly RegExp[]> = {
  "de-DE": [/Anfrage-Autorität/i, /rohe Ziel-URL/i, /Autorität aus dem Browser/i, /Verfügbarkeit bleibt geschlossen/i, /abgeleitete Aktionen/i, /Beanspruchungsaktionen/i, /Weiterleitungsautorität/i, /kontrolliert freigegebene Anmelderoute/i, /kontrollierten kommerziellen Link/i, /Produktgrenze/i],
  "it-IT": [/autorizzazione separata al momento della richiesta/i, /URL di destinazione/i, /fornita dal browser/i, /disponibilità resta chiusa/i, /per questa richiesta/i, /percorso di registrazione autorizzato/i, /link commerciale controllato/i, /confine del prodotto/i],
  "es-ES": [/autorizzación independiente en el momento de la solicitud/i, /la disponibilidad falla de forma segura/i, /acciones (?:inferidas|supuestas|de oferta)/i, /ruta de registro autorizada/i, /autoridad de redirección/i, /enlace comercial controlado/i, /límite del producto/i],
  "pt-PT": [/autorização separada no momento do pedido/i, /URL de destino/i, /fornecida pelo navegador/i, /disponibilidade permanece bloqueada/i, /para este pedido/i, /rota de registo autorizada/i, /ligação comercial controlada/i, /limite do produto/i],
  "el-GR": [/ξεχωριστή έγκριση τη στιγμή του αιτήματος/i, /υποτιθέμενες ενέργειες/i, /ενέργειες προσφοράς/i, /εγκεκριμένη διαδρομή εγγραφής/i, /έγκριση ανακατεύθυνσης/i, /ελεγχόμενο εμπορικό σύνδεσμο/i, /όριο του προϊόντος/i],
  "nl-NL": [/afzonderlijke toestemming nodig op het moment van de aanvraag/i, /bestemmings-URL/i, /toestemming vanuit de browser/i, /actie geblokkeerd/i, /voor deze aanvraag/i, /beheerste aanmeldroute/i, /beheerste commerciële link/i, /productgrens/i],
  "sv-SE": [/separat behörighet vid varje begäran/i, /antagna åtgärder/i, /erbjudandeåtgärder/i, /godkänd registreringsväg/i, /omdirigering är godkänd/i, /styrd registreringsväg/i, /styrd kommersiell länk/i, /produktgränsen/i],
  "da-DK": [/særskilt godkendelse ved hver forespørgsel/i, /formodede handlinger/i, /tilbudshandlinger/i, /godkendt tilmeldingsvej/i, /viderestilling er godkendt/i, /styret tilmeldingsrute/i, /styret kommercielt link/i, /produktgrænsen/i],
  "fi-FI": [/aina, kun sitä pyydetään/i, /toiminto pysyy suljettuna/i, /tälle pyynnölle/i, /rekisteröitymisreitti/i, /hallitun kaupallisen linkin/i, /Tuoteraja/i],
  "nb-NO": [/hver gang du ber om å fortsette/i, /handlingen stengt/i, /for denne forespørselen/i, /registreringsvei/i, /styrt registreringsrute/i, /styrt kommersiell lenke/i, /produktgrensen/i],
};

function evaluateLocale(locale: EuropeanMachineTranslatedLocale, source: Record<string, string>): LanguageQaLocaleResult {
  const coreTarget = flatten(snapshot(locale));
  const target = { ...coreTarget, ...flatten(supplementalSnapshot(locale), "supplemental") };
  const findings: string[] = [];
  const checks = Object.fromEntries(LANGUAGE_QA_CHECKS.map((check) => [check, "PASS"])) as Record<LanguageQaCheck, "PASS" | "FAIL">;
  const fail = (check: LanguageQaCheck, finding: string) => { checks[check] = "FAIL"; if (findings.length < 50) findings.push(`${check}: ${finding}`); };

  const sourceKeys = Object.keys(source).sort();
  const targetKeys = Object.keys(coreTarget).sort();
  const allowedPlaceholders = new Set(Object.values(source).flatMap(placeholders));
  if (JSON.stringify(sourceKeys) !== JSON.stringify(targetKeys)) {
    const missing = sourceKeys.filter((key) => !(key in target));
    const extra = targetKeys.filter((key) => !(key in source));
    fail("SOURCE_KEY_COMPLETENESS", `missing=${missing.join(",") || "none"}; extra=${extra.join(",") || "none"}`);
  }
  for (const [path, value] of Object.entries(target)) {
    if (!value.trim()) fail("NON_EMPTY_STRINGS", path);
    if (englishUiLeakage.test(value)) fail("OBVIOUS_ENGLISH_UI_LEAKAGE", `${path}=${value}`);
    if (hasMalformedUnicode(value)) fail("UNICODE_INTEGRITY", path);
    if (/<\/?(?:script|iframe|object|embed)\b|javascript:/i.test(value)) fail("HTML_TEXT_SAFETY", path);
    if (/\[(?:translate|translation|todo|tbd)\]|\b(?:lorem ipsum|undefined|null)\b/i.test(value)) fail("HTML_TEXT_SAFETY", `${path} contains a draft marker`);
    const actual = placeholders(value);
    const expected = placeholders(source[path] ?? "");
    const unknown = actual.filter((placeholder) => !allowedPlaceholders.has(placeholder));
    const functionalExpected = expected.filter((placeholder) => placeholder !== "{market}");
    const functionalActual = actual.filter((placeholder) => placeholder !== "{market}");
    const bracesWithoutPlaceholder = value.replace(/\{\{?[a-z][a-z0-9_-]*\}?\}/gi, "");
    if (unknown.length || JSON.stringify(functionalActual) !== JSON.stringify(functionalExpected) || /[{}]/.test(bracesWithoutPlaceholder)) {
      fail("PLACEHOLDER_AND_INTERPOLATION_INTEGRITY", `${path}: functional expected=${functionalExpected.join("|") || "none"}; functional actual=${functionalActual.join("|") || "none"}; unknown=${unknown.join("|") || "none"}; malformed braces=${/[{}]/.test(bracesWithoutPlaceholder)}`);
    }
  }
  const corpus = Object.values(target).join("\n");
  for (const [path, value] of Object.entries(source)) {
    for (const name of protectedNames) {
      if (value.includes(name) && !coreTarget[path]?.includes(name)) {
        fail("B4GAMBLE_AND_SOURCE_NAME_PRESERVATION", `${path} dropped ${name}`);
      }
    }
  }
  for (const [otherLocale, marker] of Object.entries(localeMarkers)) if (otherLocale !== locale && corpus.toLocaleLowerCase(locale).includes(marker)) fail("WRONG_LOCALE_LEAKAGE", `contains ${otherLocale} marker: ${marker}`);
  if (locale === "de-DE") {
    const genericCasinoPaths = Object.entries(target)
      .filter(([path, value]) => /\b(?:Online-Casino|Casinos?)\b/i.test(value)
        && !(path.startsWith("demoProfile.") && value.includes("Solvane Casino")))
      .map(([path]) => path);
    if (genericCasinoPaths.length) fail("TERMINOLOGY_CONSISTENCY", `generic Casino/Online-Casino terminology remains at ${genericCasinoPaths.join(",")}`);
  }
  const terms = semanticTerms[locale];
  if (!terms.programme.test(corpus) || !terms.commercial.test(corpus)) fail("PROGRAMME_COMMERCIAL_SEPARATION", "required Programme/commercial separation vocabulary is absent");
  if (!terms.clinical.test(corpus)) fail("NO_CLINICAL_CLAIM_SEMANTICS", "bounded no-clinical-claim vocabulary is absent");
  if (!terms.affiliate.test(corpus) || !terms.editorial.test(corpus) || !corpus.includes("Editor Score")) fail("AFFILIATE_EDITORIAL_INDEPENDENCE", "affiliate/editorial independence vocabulary is absent");
  const selectorPaths = ["selectorBestOverall", "selectorLowWagering", "selectorLowDeposit", "selectorCrypto", "selectorNewest"];
  const selectorLabels = selectorPaths.map((key) => target[`product.bonuses.${key}`]);
  if (selectorLabels.some((label) => !label) || new Set(selectorLabels).size !== selectorPaths.length || selectorLabels.some((label) => /\b(?:Filter|Filtre|Filtro|Suodatin)\s*[1-5]\b/i.test(label))) {
    fail("CURATED_CONTROL_SEMANTICS", `bonus selector labels are missing, duplicated or generic: ${selectorLabels.join(" | ")}`);
  }
  for (const pattern of internalRoutingLanguage[locale]) {
    if (pattern.test(corpus)) fail("NATURAL_PUBLIC_LANGUAGE", `internal routing language remains: ${pattern}`);
  }
  return { locale, status: Object.values(checks).every((status) => status === "PASS") ? "PASS" : "FAIL", checkedStrings: Object.keys(target).length, checks, findings };
}

export function generateLanguageQaReport(): LanguageQaReport {
  const source = flatten(snapshot("en-GB"));
  const locales = EUROPEAN_MACHINE_TRANSLATED_LOCALES.map((locale) => evaluateLocale(locale, source));
  const catalogDigest = createHash("sha256").update(JSON.stringify({
    source,
    targets: EUROPEAN_MACHINE_TRANSLATED_LOCALES.map((locale) => ({
      core: snapshot(locale),
      supplemental: supplementalSnapshot(locale),
    })),
  })).digest("hex");
  return { schemaVersion: 1, generatedAt: "2026-08-30", assurance: "BOUNDED_AUTOMATED_LANGUAGE_QA_NOT_HUMAN_OR_LEGAL_REVIEW", sourceLocale: "en-GB", catalogDigest, status: locales.every((locale) => locale.status === "PASS") ? "PASS" : "FAIL", locales };
}
