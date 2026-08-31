import { createHash } from "node:crypto";

import {
  PROGRAMME_MESSAGE_KEYS,
  programmeCatalogueEntries,
  programmeMissionCopy,
  programmeText,
} from "@/lib/i18n/programme-catalog";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import {
  programAiMissionRegistry,
} from "@/lib/programme/program-ai/mission-registry";
import {
  PROGRAMME_LOCALES,
  type ProgrammeLocale,
} from "@/lib/programme/presentation";

export const PROGRAMME_LANGUAGE_QA_CHECKS = [
  "SOURCE_KEY_COMPLETENESS",
  "NON_EMPTY_TRANSLATIONS",
  "UNTRANSLATED_SOURCE_KEYS",
  "INTERPOLATION_INTEGRITY",
  "OBVIOUS_ENGLISH_SYSTEM_COPY_LEAKAGE",
  "WRONG_LOCALE_LEAKAGE",
  "UNICODE_INTEGRITY",
  "HTML_TEXT_SAFETY",
  "PROTECTED_NAME_INTEGRITY",
  "SEMANTIC_IDENTIFIER_SEPARATION",
  "ESTABLISHED_TERMINOLOGY_CONSISTENCY",
  "LOCALE_ORTHOGRAPHY",
  "NO_CLINICAL_CLAIM_SEMANTICS",
  "NO_COMMERCIAL_RECOMMENDATION_SEMANTICS",
] as const;

export type ProgrammeLanguageQaCheck = typeof PROGRAMME_LANGUAGE_QA_CHECKS[number];

export type ProgrammeLanguageQaLocaleResult = Readonly<{
  locale: ProgrammeLocale;
  status: "PASS" | "FAIL";
  checkedStrings: number;
  checks: Readonly<Record<ProgrammeLanguageQaCheck, "PASS" | "FAIL">>;
  findings: readonly string[];
}>;

export type ProgrammeLanguageQaReport = Readonly<{
  schemaVersion: 1;
  generatedAt: "2026-08-31";
  assurance: "BOUNDED_AUTOMATED_PROGRAMME_LANGUAGE_QA_NOT_LEGAL_REGULATORY_COMMERCIAL_OR_INDEXING_APPROVAL";
  sourceLocale: "en-GB";
  supportedLocales: readonly ProgrammeLocale[];
  checkedCatalogueKeys: number;
  catalogDigest: string;
  status: "AI_LANGUAGE_QA_PASSED" | "AI_LANGUAGE_QA_FAILED";
  userOwnedContentPolicy: "EXCLUDED_FROM_SYSTEM_COPY_LEAKAGE_CHECKS_AND_PRESERVED_VERBATIM";
  locales: readonly ProgrammeLanguageQaLocaleResult[];
}>;

const sourceEqualAllowlist: Readonly<Partial<Record<ProgrammeLocale, readonly string[]>>> = {
  "de-DE": ["Mission 01", "Mission {number} — {title}", "Mission", "Pause", "{label}: {status}"],
  "es-ES": ["{label}: {status}"],
  "sv-SE": ["Research", "{label}: {status}"],
  "da-DK": ["Mission 01", "Mission {number} — {title}", "Start Mission 01", "Start mission", "Research", "Mission", "mission", "Pause", "{label}: {status}"],
  "el-GR": ["Email", "{label}: {status}"],
  "it-IT": ["Home", "Email", "Password", "home", "{label}: {status}"],
  "pt-PT": ["Email", "{label}: {status}"],
  "nl-NL": ["Home", "home", "Help", "{label}: {status}", "Log in."],
  "fi-FI": ["{label}: {status}"],
  "nb-NO": ["Pause", "{label}: {status}"],
};

const localeMarkers: Readonly<Record<Exclude<ProgrammeLocale, "en-GB">, string>> = {
  "de-DE": "geschützte hilfe",
  "es-ES": "ayuda protegida",
  "sv-SE": "skyddad hjälp",
  "da-DK": "beskyttet hjælp",
  "el-GR": "προστατευμένη βοήθεια",
  "it-IT": "aiuto protetto",
  "pt-PT": "ajuda protegida",
  "nl-NL": "beschermde help",
  "fi-FI": "suojattu ohje",
  "nb-NO": "beskyttet hjelp",
};

const obviousEnglishSystemCopy = /\b(?:Loading your private Programme session|Programme page not found|This Programme page is unavailable|Return to My Programme|Open protected Help|Read Privacy Notice|Verifying access|Enter Mission|Start mission|Review mission|Resume mission|Current mission|Move up|Move down|Mission progress|Complete Mission|Log out of B4GAMBLE|Forgot password|Checking account|New here)\b/i;

const clinicalClaims: Readonly<Record<ProgrammeLocale, readonly RegExp[]>> = {
  "en-GB": [/\byou (?:have|are diagnosed with) (?:a )?(?:gambling disorder|gambling addiction)\b/i, /\byour risk score is\b/i, /\bit is safe to gamble\b/i],
  "de-DE": [/\bdu (?:hast|leidest an) (?:einer )?glücksspielsucht\b/i, /\bdein risikowert ist\b/i, /\bes ist sicher zu spielen\b/i],
  "es-ES": [/\btienes (?:un )?(?:trastorno de juego|adicción al juego)\b/i, /\btu puntuación de riesgo es\b/i, /\bes seguro jugar\b/i],
  "sv-SE": [/\bdu har spelberoende\b/i, /\bdin riskpoäng är\b/i, /\bdet är säkert att spela\b/i],
  "da-DK": [/\bdu har ludomani\b/i, /\bdin risikoscore er\b/i, /\bdet er sikkert at spille\b/i],
  "el-GR": [/έχεις (?:διαταραχή|εθισμό).*(?:τζόγ|παιχν)/i, /η βαθμολογία κινδύνου σου είναι/i, /είναι ασφαλές να παίξεις/i],
  "it-IT": [/\bhai (?:un )?(?:disturbo da gioco|dipendenza dal gioco)\b/i, /\bil tuo punteggio di rischio è\b/i, /\bè sicuro giocare\b/i],
  "pt-PT": [/\btens (?:uma )?(?:perturbação do jogo|dependência do jogo)\b/i, /\ba tua pontuação de risco é\b/i, /\bé seguro jogar\b/i],
  "nl-NL": [/\bje hebt (?:een )?(?:gokstoornis|gokverslaving)\b/i, /\bje risicoscore is\b/i, /\bhet is veilig om te spelen\b/i],
  "fi-FI": [/\bsinulla on peliriippuvuus\b/i, /\briskipisteesi on\b/i, /\bon turvallista pelata\b/i],
  "nb-NO": [/\bdu har spilleavhengighet\b/i, /\brisikoscoren din er\b/i, /\bdet er trygt å spille\b/i],
};

const commercialRecommendations: Readonly<Record<ProgrammeLocale, readonly RegExp[]>> = {
  "en-GB": [/\b(?:we|b4gamble) recommend(?:s)? (?:a |an )?(?:casino|operator|bonus)\b/i, /\bchoose the safest (?:casino|operator|bonus)\b/i],
  "de-DE": [/\b(?:wir|b4gamble) empfehl\w+ (?:ein\w+ )?(?:casino|glücksspielanbieter|bonus)\b/i],
  "es-ES": [/\b(?:recomendamos|b4gamble recomienda) (?:un )?(?:casino|operador|bono)\b/i],
  "sv-SE": [/\b(?:vi|b4gamble) rekommenderar (?:ett |en )?(?:kasino|casino|operatör|bonus)\b/i],
  "da-DK": [/\b(?:vi|b4gamble) anbefaler (?:et |en )?(?:kasino|casino|operatør|bonus)\b/i],
  "el-GR": [/(?:προτείνουμε|το b4gamble προτείνει).*(?:καζίνο|πάροχο|μπόνους)/i],
  "it-IT": [/\b(?:consigliamo|b4gamble consiglia) (?:un )?(?:casinò|operatore|bonus)\b/i],
  "pt-PT": [/\b(?:recomendamos|a b4gamble recomenda) (?:um )?(?:casino|operador|bónus)\b/i],
  "nl-NL": [/\b(?:wij|b4gamble) (?:raden|raadt) (?:een )?(?:casino|aanbieder|bonus) aan\b/i],
  "fi-FI": [/(?:suosittelemme|b4gamble suosittelee).*(?:kasino|peliyhtiö|bonus)/i],
  "nb-NO": [/\b(?:vi|b4gamble) anbefaler (?:et |en )?(?:kasino|casino|operatør|bonus)\b/i],
};

function placeholders(value: string) {
  return [...value.matchAll(/\{[a-z][a-z0-9_-]*\}/gi)].map((match) => match[0]).sort();
}

function hasMalformedUnicode(value: string) {
  return value.includes("�") || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value);
}

function staticStrings(locale: ProgrammeLocale) {
  const catalogue = programmeCatalogueEntries(locale);
  const missions = Array.from({ length: 10 }, (_, index) => programmeMissionCopy(locale, index + 1))
    .flatMap((mission, index) => [
      { key: `mission.${index + 1}.title`, value: mission.title },
      { key: `mission.${index + 1}.description`, value: mission.description },
    ]);
  return [...catalogue, ...missions];
}

function semanticRegistryIsPresentationFree() {
  const missionKeys = ["actions", "artifactVersion", "missionNumber", "prerequisite"];
  const actionKeys = ["id", "xp"];
  return programAiMissionRegistry.every((mission) => (
    JSON.stringify(Object.keys(mission).sort()) === JSON.stringify(missionKeys)
    && mission.actions.every((action) => (
      JSON.stringify(Object.keys(action).sort()) === JSON.stringify(actionKeys)
      && /^[a-z0-9_]+$/.test(action.id)
    ))
  ));
}

function evaluateLocale(locale: ProgrammeLocale, source: ReturnType<typeof staticStrings>): ProgrammeLanguageQaLocaleResult {
  const target = staticStrings(locale);
  const findings: string[] = [];
  const checks = Object.fromEntries(PROGRAMME_LANGUAGE_QA_CHECKS.map((check) => [check, "PASS"])) as Record<ProgrammeLanguageQaCheck, "PASS" | "FAIL">;
  const fail = (check: ProgrammeLanguageQaCheck, finding: string) => {
    checks[check] = "FAIL";
    if (findings.length < 80) findings.push(`${check}: ${finding}`);
  };
  const sourceMap = new Map(source.map((entry) => [entry.key, entry.value]));
  const targetMap = new Map(target.map((entry) => [entry.key, entry.value]));
  const sourceKeys = [...sourceMap.keys()].sort();
  const targetKeys = [...targetMap.keys()].sort();

  if (sourceKeys.length !== new Set(sourceKeys).size || JSON.stringify(sourceKeys) !== JSON.stringify(targetKeys)) {
    const missing = sourceKeys.filter((key) => !targetMap.has(key));
    const extra = targetKeys.filter((key) => !sourceMap.has(key));
    fail("SOURCE_KEY_COMPLETENESS", `missing=${missing.join(",") || "none"}; extra=${extra.join(",") || "none"}`);
  }

  const reviewedSourceEquals = new Set(sourceEqualAllowlist[locale] ?? []);
  for (const [key, value] of targetMap) {
    const sourceValue = sourceMap.get(key) ?? "";
    if (!value.trim()) fail("NON_EMPTY_TRANSLATIONS", key);
    if (locale !== "en-GB" && value === sourceValue && !reviewedSourceEquals.has(key)) {
      fail("UNTRANSLATED_SOURCE_KEYS", key);
    }
    const expectedPlaceholders = placeholders(sourceValue);
    const actualPlaceholders = placeholders(value);
    const rendered = actualPlaceholders.reduce((result, placeholder) => result.replaceAll(placeholder, "QA_VALUE"), value);
    if (JSON.stringify(expectedPlaceholders) !== JSON.stringify(actualPlaceholders) || /\{[^}]*\}|\}/.test(rendered)) {
      fail("INTERPOLATION_INTEGRITY", `${key}: expected=${expectedPlaceholders.join("|") || "none"}; actual=${actualPlaceholders.join("|") || "none"}`);
    }
    if (locale !== "en-GB" && obviousEnglishSystemCopy.test(value) && !(value === sourceValue && reviewedSourceEquals.has(key))) {
      fail("OBVIOUS_ENGLISH_SYSTEM_COPY_LEAKAGE", `${key}=${value}`);
    }
    if (hasMalformedUnicode(value) || value.normalize("NFC") !== value) fail("UNICODE_INTEGRITY", key);
    if (/<\/?[a-z][^>]*>|javascript:|&(?:lt|gt|#x?0*3[ce]);/i.test(value)) fail("HTML_TEXT_SAFETY", key);
    for (const name of ["B4GAMBLE", "Google", "XP"] as const) {
      if (sourceValue.includes(name) && !value.includes(name)) fail("PROTECTED_NAME_INTEGRITY", `${key} dropped ${name}`);
    }
  }

  if (locale !== "en-GB") {
    const corpus = target.map((entry) => entry.value).join("\n").toLocaleLowerCase(locale);
    const ownMarker = localeMarkers[locale];
    if (!corpus.includes(ownMarker)) fail("ESTABLISHED_TERMINOLOGY_CONSISTENCY", `missing locale marker ${ownMarker}`);
    for (const [otherLocale, marker] of Object.entries(localeMarkers)) {
      if (otherLocale !== locale && corpus.includes(marker)) fail("WRONG_LOCALE_LEAKAGE", `contains ${otherLocale} marker ${marker}`);
    }
  }

  const shell = publicShellMessages(locale);
  for (const [key, expected] of [
    ["Best offers", shell.bestOffers],
    ["Bonuses", shell.bonuses],
    ["Open Help", shell.openHelp],
  ] as const) {
    if (programmeText(locale, key) !== expected && !(locale === "en-GB" && key === "Best offers" && programmeText(locale, key).toLocaleLowerCase(locale) === expected.toLocaleLowerCase(locale))) {
      fail("ESTABLISHED_TERMINOLOGY_CONSISTENCY", `${key} differs from the public shell`);
    }
  }

  if (!semanticRegistryIsPresentationFree()) fail("SEMANTIC_IDENTIFIER_SEPARATION", "structural mission registry contains presentation fields or translated IDs");

  if (locale === "es-ES") {
    for (const [key, sourceValue] of sourceMap) {
      const targetValue = targetMap.get(key) ?? "";
      if (sourceValue.includes("?") && (!targetValue.includes("¿") || !targetValue.includes("?"))) {
        fail("LOCALE_ORTHOGRAPHY", `${key} lacks paired Spanish question punctuation`);
      }
    }
  }
  if (locale === "el-GR" && !target.some((entry) => /\p{Script=Greek}/u.test(entry.value))) {
    fail("LOCALE_ORTHOGRAPHY", "Greek corpus contains no Greek glyphs");
  }

  const corpus = target.map((entry) => entry.value).join("\n");
  if (clinicalClaims[locale].some((pattern) => pattern.test(corpus))) {
    fail("NO_CLINICAL_CLAIM_SEMANTICS", "contains a bounded diagnosis, risk-score or safe-to-gamble claim");
  }
  if (commercialRecommendations[locale].some((pattern) => pattern.test(corpus))) {
    fail("NO_COMMERCIAL_RECOMMENDATION_SEMANTICS", "contains a bounded casino/operator/bonus recommendation claim");
  }

  return {
    locale,
    status: Object.values(checks).every((status) => status === "PASS") ? "PASS" : "FAIL",
    checkedStrings: target.length,
    checks,
    findings,
  };
}

export function generateProgrammeLanguageQaReport(): ProgrammeLanguageQaReport {
  const source = staticStrings("en-GB");
  const locales = PROGRAMME_LOCALES.map((locale) => evaluateLocale(locale, source));
  const catalogDigest = createHash("sha256")
    .update(JSON.stringify(PROGRAMME_LOCALES.map((locale) => staticStrings(locale))))
    .digest("hex");
  return {
    schemaVersion: 1,
    generatedAt: "2026-08-31",
    assurance: "BOUNDED_AUTOMATED_PROGRAMME_LANGUAGE_QA_NOT_LEGAL_REGULATORY_COMMERCIAL_OR_INDEXING_APPROVAL",
    sourceLocale: "en-GB",
    supportedLocales: PROGRAMME_LOCALES,
    checkedCatalogueKeys: PROGRAMME_MESSAGE_KEYS.length,
    catalogDigest,
    status: locales.every((locale) => locale.status === "PASS")
      ? "AI_LANGUAGE_QA_PASSED"
      : "AI_LANGUAGE_QA_FAILED",
    userOwnedContentPolicy: "EXCLUDED_FROM_SYSTEM_COPY_LEAKAGE_CHECKS_AND_PRESERVED_VERBATIM",
    locales,
  };
}
