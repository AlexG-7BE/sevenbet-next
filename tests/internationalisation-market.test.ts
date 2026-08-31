import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NextRequest } from "next/server";

import generatedPages from "../lib/final-handoff/generated-pages.json" with { type: "json" };
import { transformCommonHandoff, transformHomeHandoff, transformHomeHandoffCss, transformLearnHandoff, transformMethodologyHandoff, transformTenStepsHandoff } from "../lib/final-handoff/transforms";
import { HOME_SOURCE_COPY, homeMetadata, homeTranslation } from "../lib/i18n/home-catalog";
import { TRANSLATION_REVIEW_STATE, homeTranslationReady, publicCoreTranslationReady } from "../lib/i18n/review-state";
import { aboutMessages } from "../lib/i18n/static-pages/about";
import { faqMessages } from "../lib/i18n/static-pages/faq";
import { contactMessages } from "../lib/i18n/static-pages/contact";
import { METHODOLOGY_SOURCE_COPY, methodologyMessages } from "../lib/i18n/static-pages/methodology";
import { learningMessages, localizedLearningArticles } from "../lib/i18n/learning-center";
import { publicErrorMessages } from "../lib/i18n/public-errors";
import { TEN_STEPS_SOURCE_COPY, tenStepsTranslation } from "../lib/i18n/static-pages/ten-steps";
import { publicFooterMessages, publicShellMessages } from "../lib/i18n/public-shell-catalog";
import { formatProductMessage, productPageMessages } from "../lib/i18n/product-pages-catalog";
import { jurisdictionResolver } from "../lib/jurisdiction/resolver";
import {
  programAiMissionRegistry,
  programmeMissionTitles,
  programAiMissionSourcePresentation,
} from "../lib/programme/program-ai/mission-registry";
import { programAiMissionOneRewardPolicy } from "../lib/programme/program-ai/reward-policy";
import { programmePathForPresentationLocale } from "../lib/programme/presentation";
import {
  FOUNDER_PUBLICATION_ACCEPTED_MARKET_CODES,
  INITIAL_EUROPEAN_MARKET_PROFILES,
  MARKET_PROFILES,
  PUBLICATION_APPROVED_MARKET_PROFILES,
  publicMarketPath,
  marketProfileByCountry,
  marketProfileByRouteMarket,
  type SupportedLocale,
} from "../lib/market/registry";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import {
  commercialAuthorityForPresentation,
  localizedProductIndexingApproved,
  productHref,
  productMetadata,
  PRODUCT_TRANSLATION_REVIEW_STATE,
} from "../lib/market/product-context";
import {
  parsePresentationPreference,
  PRESENTATION_PREFERENCE_COOKIE,
  serializePresentationPreference,
} from "../lib/market/presentation-preference";
import {
  localizePublicHref,
  localizePublicPath,
  parsePublicMarketRoute,
  PUBLIC_LOCALIZATION_ROUTE_MANIFEST,
  PRESENTATION_CONTEXT_HEADER,
  PRESENTATION_LANGUAGE_HEADER,
  PRESENTATION_MARKET_HEADER,
  stripPublicMarketPrefix,
} from "../lib/market/routing";
import { POST as updatePresentationPreference } from "../app/api/presentation/route";
import { middleware } from "../middleware";
import { parsePublicComparisonQuery, serializePublicComparisonQuery } from "../lib/public-comparison/query";
import { allowJurisdictionAuthority } from "./market-authority.fixtures";

function middlewareRequestHeaders(response: { headers: Headers }) {
  const requestHeaders = new Headers();
  for (const [name, value] of response.headers) {
    if (name.startsWith("x-middleware-request-")) {
      requestHeaders.set(name.slice("x-middleware-request-".length), value);
    }
  }
  return requestHeaders;
}

function escapeTenStepsText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const englishTenStepsSignals = {
  startingPoint: /Starting Point/u,
  twoActions: /two actions/u,
  registrationZero: /Registration awards no XP/u,
  registrationAfterReady: /only follows when it is ready/u,
};

const tenStepsContractSignals: Record<SupportedLocale, {
  startingPoint: RegExp;
  twoActions: RegExp;
  registrationZero: RegExp;
  registrationAfterReady: RegExp;
}> = {
  "en-GB": englishTenStepsSignals,
  "de-DE": {
    startingPoint: /Ausgangspunkt/u,
    twoActions: /beiden Aktionen/u,
    registrationZero: /Registrierung bringt keine XP/u,
    registrationAfterReady: /folgt erst, wenn der Ausgangspunkt bereit ist/iu,
  },
  "it-IT": {
    startingPoint: /Punto di partenza/u,
    twoActions: /due azioni/u,
    registrationZero: /registrazione non assegna XP/iu,
    registrationAfterReady: /avviene solo quando il Punto di partenza è pronto/iu,
  },
  "es-ES": {
    startingPoint: /Punto de partida/u,
    twoActions: /dos acciones/u,
    registrationZero: /registro no otorga XP/iu,
    registrationAfterReady: /solo aparece cuando el Punto de partida está listo/iu,
  },
  "pt-PT": {
    startingPoint: /Ponto de partida/u,
    twoActions: /duas ações/u,
    registrationZero: /registo não atribui XP/iu,
    registrationAfterReady: /só acontece quando o Ponto de partida estiver pronto/iu,
  },
  "el-GR": {
    startingPoint: /Σημεί(?:ο|ου) Εκκίνησ/u,
    twoActions: /δύο ενέργειες/u,
    registrationZero: /εγγραφή δεν δίνει XP/iu,
    registrationAfterReady: /ακολουθεί μόνο όταν το Σημείο Εκκίνησης είναι έτοιμο/iu,
  },
  "nl-NL": {
    startingPoint: /Startpunt/u,
    twoActions: /twee acties/u,
    registrationZero: /registratie levert geen XP op/iu,
    registrationAfterReady: /registreert je pas als je Startpunt klaar is/iu,
  },
  "sv-SE": {
    startingPoint: /Startpunkt/u,
    twoActions: /två moment/u,
    registrationZero: /registreringen ger inga XP/iu,
    registrationAfterReady: /registrerar dig först när Startpunkten är klar/iu,
  },
  "da-DK": {
    startingPoint: /Udgangspunkt/u,
    twoActions: /to handlinger/u,
    registrationZero: /registreringen giver ingen XP/iu,
    registrationAfterReady: /registrerer dig først, når Udgangspunktet er klart/iu,
  },
  "fi-FI": {
    startingPoint: /Lähtökoh/u,
    twoActions: /kaksi toimintoa/u,
    registrationZero: /rekisteröitymisestä ei saa XP/iu,
    registrationAfterReady: /Rekisteröityminen seuraa vasta, kun Lähtökohta on valmis/u,
  },
  "nb-NO": {
    startingPoint: /Utgangspunkt/u,
    twoActions: /to handlinger/u,
    registrationZero: /registreringen gir ingen XP/iu,
    registrationAfterReady: /registrerer deg først når Utgangspunktet er klart/iu,
  },
  "en-CA": englishTenStepsSignals,
  "fr-CA": englishTenStepsSignals,
};

test("initial market registry exposes the partner-readiness tranche without implying commercial authority", () => {
  assert.deepEqual(MARKET_PROFILES.map((profile) => profile.countryCode), ["GB", "DE", "IT", "ES", "PT", "GR", "NL", "SE", "DK", "FI", "NO", "CA"]);
  for (const profile of MARKET_PROFILES) {
    assert.equal(profile.commercialPresentationState, "AUTHORITY_REQUIRED");
  }
  assert.deepEqual(FOUNDER_PUBLICATION_ACCEPTED_MARKET_CODES, ["DE", "ES", "SE", "DK", "GR"]);
  assert.deepEqual(PUBLICATION_APPROVED_MARKET_PROFILES.map((profile) => profile.countryCode), ["GB", "DE", "ES", "GR", "SE", "DK"]);
  for (const profile of MARKET_PROFILES) {
    const expected: "LIVE_BASELINE" | "LIVE_LOCALIZED" | "LOCALIZATION_REQUIRED" = profile.countryCode === "GB"
      ? "LIVE_BASELINE"
      : (FOUNDER_PUBLICATION_ACCEPTED_MARKET_CODES as readonly string[]).includes(profile.countryCode)
        ? "LIVE_LOCALIZED"
        : "LOCALIZATION_REQUIRED";
    assert.equal(profile.editorialState, expected, profile.countryCode);
  }
  assert.equal(marketProfileByCountry("de")?.defaultLocale, "de-DE");
  assert.equal(marketProfileByCountry("it")?.defaultLocale, "it-IT");
  assert.equal(marketProfileByCountry("es")?.defaultLocale, "es-ES");
  assert.equal(marketProfileByCountry("pt")?.defaultLocale, "pt-PT");
  assert.equal(marketProfileByCountry("gr")?.defaultLocale, "el-GR");
  assert.equal(marketProfileByCountry("nl")?.defaultLocale, "nl-NL");
  assert.equal(marketProfileByRouteMarket("SE")?.countryCode, "SE");
});

test("all eleven European runtime profiles exist in their approved order", () => {
  assert.deepEqual(
    INITIAL_EUROPEAN_MARKET_PROFILES.map((profile) => `${profile.countryCode}:${profile.defaultLocale}`),
    ["GB:en-GB", "DE:de-DE", "IT:it-IT", "ES:es-ES", "PT:pt-PT", "GR:el-GR", "NL:nl-NL", "SE:sv-SE", "DK:da-DK", "FI:fi-FI", "NO:nb-NO"],
  );
});

test("canonical paths keep market primary and add a language only for secondary locales", () => {
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
  const gb = marketProfileByCountry("GB");
  assert.ok(gb);
  assert.equal(publicMarketPath(gb, "en-GB"), "/");
  assert.equal(publicMarketPath(germany, "de-DE"), "/de/");
  assert.equal(publicMarketPath(italy, "it-IT"), "/it/");
  assert.equal(publicMarketPath(spain, "es-ES"), "/es/");
  assert.equal(publicMarketPath(portugal, "pt-PT"), "/pt/");
  assert.equal(publicMarketPath(greece, "el-GR"), "/gr/");
  assert.equal(publicMarketPath(netherlands, "nl-NL"), "/nl/");
  assert.equal(publicMarketPath(germany, "de-DE", "/casinos"), "/de/casinos");
  assert.equal(publicMarketPath(canada, "en-CA", "/casinos"), "/ca/casinos");
  assert.equal(publicMarketPath(canada, "fr-CA", "/casinos"), "/ca/fr/casinos");
  assert.throws(() => publicMarketPath(germany, "en-GB"));
});

test("market-first parser distinguishes canonical, secondary, legacy and invalid paths", () => {
  const germany = marketProfileByCountry("DE");
  const portugal = marketProfileByCountry("PT");
  const spain = marketProfileByCountry("ES");
  assert.ok(germany);
  assert.ok(portugal);
  assert.ok(spain);
  const canada = marketProfileByCountry("CA");
  assert.ok(canada);
  assert.deepEqual(parsePublicMarketRoute("/de/casinos"), { kind: "MARKET_DEFAULT", market: germany, locale: "de-DE", pathname: "/casinos" });
  assert.deepEqual(parsePublicMarketRoute("/ca/fr/casinos"), { kind: "SECONDARY_LOCALE", market: canada, locale: "fr-CA", pathname: "/casinos" });
  assert.deepEqual(parsePublicMarketRoute("/pt/faq"), { kind: "MARKET_DEFAULT", market: portugal, locale: "pt-PT", pathname: "/faq" });
  assert.deepEqual(parsePublicMarketRoute("/de/contact"), { kind: "MARKET_DEFAULT", market: germany, locale: "de-DE", pathname: "/contact" });
  assert.deepEqual(parsePublicMarketRoute("/de/learn/casino-basics/online-casino-basics"), { kind: "MARKET_DEFAULT", market: germany, locale: "de-DE", pathname: "/learn/casino-basics/online-casino-basics" });
  assert.deepEqual(parsePublicMarketRoute("/de/de/casinos"), { kind: "LEGACY_REDUNDANT_LOCALE", market: germany, locale: "de-DE", pathname: "/casinos", canonicalPath: "/de/casinos" });
  assert.equal(parsePublicMarketRoute("/de/en/").kind, "INVALID");
  assert.equal(parsePublicMarketRoute("/gr/gr/").kind, "INVALID");
  assert.equal(parsePublicMarketRoute("/xx/").kind, "INVALID");
  assert.equal(parsePublicMarketRoute("/de/admin").kind, "INVALID");
  assert.equal(parsePublicMarketRoute("/de/api/private").kind, "INVALID");
  assert.equal(stripPublicMarketPrefix("/de/de/casinos"), "/casinos");
  assert.equal(localizePublicPath(spain, "es-ES", "/de/de/casinos"), "/es/casinos");
  assert.equal(localizePublicPath(germany, "de-DE", "/compare?casino=alpha&casino=beta"), "/de/compare?casino=alpha&casino=beta");
  assert.equal(localizePublicPath(spain, "es-ES", "/privacy"), "/es/");
  assert.equal(localizePublicHref("/casinos", "/de/", germany, "de-DE"), "/de/casinos");
  assert.equal(localizePublicHref("/help", "/de/", germany, "de-DE"), "/de/help");
  assert.equal(localizePublicPath(portugal, "pt-PT", "/help"), "/pt/");
  assert.ok(PUBLIC_LOCALIZATION_ROUTE_MANIFEST.some((entry) => entry.root === "api" && entry.policy === "INTERNAL"));
  assert.ok(PUBLIC_LOCALIZATION_ROUTE_MANIFEST.some((entry) => entry.root === "privacy" && entry.policy === "LEGAL_REVIEW_GATED"));
});

test("all eleven European product catalogs are complete Preview drafts without English object fallback", () => {
  const collect = (value: unknown): string[] => typeof value === "string"
    ? [value]
    : value && typeof value === "object"
      ? Object.values(value).flatMap(collect)
      : [];
  for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
    const values = collect(productPageMessages(profile.defaultLocale));
    assert.ok(values.length > 100, profile.defaultLocale);
    assert.ok(values.every((value) => value.trim().length > 0), `${profile.defaultLocale} contains empty product copy`);
    assert.equal(
      PRODUCT_TRANSLATION_REVIEW_STATE[profile.defaultLocale],
      profile.defaultLocale === "en-GB" ? "SOURCE_BASELINE" : "MACHINE_TRANSLATED",
    );
    const presentation = resolvePresentationContext({ routeMarket: profile.routeMarket, routeLanguage: profile.defaultLocale.split("-")[0] });
    for (const pathname of ["/best-offers", "/casinos", "/bonuses", "/casino/example", "/compare?casino=example"]) {
      assert.equal(productHref(presentation, pathname), publicMarketPath(profile, profile.defaultLocale, pathname));
    }
  }
  assert.notEqual(productPageMessages("es-ES").bestOffers.commissionNote, productPageMessages("en-GB").bestOffers.commissionNote);
  assert.notEqual(productPageMessages("el-GR").comparison.unavailable, productPageMessages("en-GB").comparison.unavailable);
});

test("localized product links, canonicals and reciprocal alternates preserve explicit presentation", () => {
  const presentation = resolvePresentationContext({ routeMarket: "de", routeLanguage: "de", trustedCountryCode: "GB" });
  assert.equal(productHref(presentation, "/casino/example?from=compare"), "/de/casino/example?from=compare");
  assert.equal(productHref(presentation, "/methodology"), "/de/methodology");
  const metadata = productMetadata({ presentation, pathname: "/casinos", title: "Titel", description: "Beschreibung" });
  assert.equal(new URL(String(metadata.alternates?.canonical)).pathname, "/de/casinos");
  const languages = metadata.alternates?.languages as Record<string, string>;
  assert.equal(new URL(languages["en-GB"]).pathname, "/casinos");
  assert.equal(new URL(languages["de-DE"]).pathname, "/de/casinos");
  assert.equal(new URL(languages["es-ES"]).pathname, "/es/casinos");
  assert.equal(Object.keys(languages).length, PUBLICATION_APPROVED_MARKET_PROFILES.length + 1);
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.equal(metadata.openGraph && "locale" in metadata.openGraph ? metadata.openGraph.locale : null, "de_DE");

  const gbPresentation = resolvePresentationContext({ routeMarket: "gb", routeLanguage: "en" });
  const gbMetadata = productMetadata({
    presentation: gbPresentation,
    pathname: "/casinos",
    title: "Casinos",
    description: "Published records",
    robots: { index: true, follow: true },
  });
  assert.deepEqual(gbMetadata.robots, { index: true, follow: true }, "the approved English baseline must retain its data-driven indexing policy");

  const differentGeo = resolvePresentationContext({ routeMarket: "de", routeLanguage: "de", trustedCountryCode: "NO" });
  const second = productMetadata({ presentation: differentGeo, pathname: "/casinos", title: "Titel", description: "Beschreibung" });
  assert.equal(second.alternates?.canonical, metadata.alternates?.canonical, "geo cannot mutate an explicit canonical");
});

test("Methodology, Contact, Learning and generic-error catalogs cover all eleven European locales", () => {
  for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
    const locale = profile.defaultLocale;
    assert.equal(methodologyMessages(locale).copy.size, METHODOLOGY_SOURCE_COPY.length, locale);
    assert.equal(localizedLearningArticles(locale).length, 13, locale);
    assert.equal(learningMessages(locale).hubCopy.size, 25, locale);
    if (locale !== "en-GB") assert.notEqual(learningMessages(locale).ui.learn, "Learn", locale);
    assert.ok(Object.values(contactMessages(locale)).every((value) => value.trim().length > 0), locale);
    assert.ok(Object.values(publicErrorMessages(locale)).every((value) => value.trim().length > 0), locale);
  }
  const methodology = transformMethodologyHandoff(
    transformCommonHandoff(generatedPages.methodology.html),
    methodologyMessages("de-DE"),
    (href) => `/de${href}`,
  );
  const methodologyText = [...methodology.matchAll(/>([^<>]+)</g)].map((match) => match[1]).join(" ");
  for (const source of METHODOLOGY_SOURCE_COPY) {
    assert.equal(methodologyText.includes(source.replaceAll("&", "&amp;")), false, `German Methodology leaked: ${source}`);
  }
  assert.match(methodology, /data-methodology-list-copy="" style="min-width: 0; overflow-wrap: anywhere;"/);
  const learn = transformLearnHandoff(transformCommonHandoff(generatedPages.learn.html, "/de/program"), "de-DE", (href) => `/de${href}`);
  assert.match(learn, /href="\/de\/learn\/casino-basics\/online-casino-basics"/);
  assert.match(learn, /href="\/de\/program\?entry=start"/);
  assert.doesNotMatch(learn, /href="\/program(?:\?entry=start)?"/);
  assert.match(learn, /data-learn-topic="all topics"/);
  assert.match(learn, /<span class="sc-interp">13<\/span> Leitfäden/);
  assert.doesNotMatch(learn, />All guides</);
  assert.doesNotMatch(learn, />Read →</);
});

test("presentation and commercial jurisdiction must match before any authority reaches a product service", () => {
  const gb = allowJurisdictionAuthority;
  const de = { ...gb, countryCode: "DE" } as const;
  assert.equal(commercialAuthorityForPresentation(gb, "DE"), null);
  assert.equal(commercialAuthorityForPresentation(de, "GB"), null);
  assert.equal(commercialAuthorityForPresentation(gb, "GB"), gb);
  const presentation = resolvePresentationContext({ routeMarket: "de", routeLanguage: "de", trustedCountryCode: "GB" });
  assert.equal("commercialAllowed" in presentation, false);
});

test("localized Compare defaults to its presentation country and preserves selection query", () => {
  const query = parsePublicComparisonQuery({ casino: ["alpha", "beta"], differences: "true" }, "DE");
  assert.equal(query.country, "DE");
  assert.equal(serializePublicComparisonQuery(query).toString(), "casino=alpha&casino=beta&country=DE&differences=true");
  const germany = marketProfileByCountry("DE");
  assert.ok(germany);
  assert.equal(localizePublicPath(germany, "de-DE", `/casinos?${serializePublicComparisonQuery(query)}`), "/de/casinos?casino=alpha&casino=beta&country=DE&differences=true");
});

test("localized sitemap publication is review-gated and its market loader has no request-path GB literal", () => {
  for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) assert.equal(localizedProductIndexingApproved(profile.defaultLocale), false);
  const source = readFileSync("app/sitemap.ts", "utf8");
  assert.match(source, /loadMarketSitemapSnapshot\(market/);
  assert.match(source, /defaultEditorialCountry: market\.countryCode/);
  assert.doesNotMatch(source, /country:\s*["']GB["']/);
  assert.match(source, /localizedProductIndexingApproved/);
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

test("presentation preference serialization is strict, stale-safe and contains no authority", () => {
  const germany = marketProfileByCountry("DE");
  assert.ok(germany);
  const serialized = serializePresentationPreference(germany, "de-DE");
  assert.equal(serialized, "v1.DE.de-DE");
  assert.deepEqual(parsePresentationPreference(serialized), { countryCode: "DE", locale: "de-DE" });
  assert.equal(parsePresentationPreference("v1.DE.en-GB"), null);
  assert.equal(parsePresentationPreference("v0.DE.de-DE"), null);
  assert.equal(parsePresentationPreference("commercialAllowed=true"), null);
});

test("a presentation preference cannot grant jurisdiction commercial or referral authority", async () => {
  const presentation = resolvePresentationContext({
    preference: { countryCode: "DE", locale: "de-DE" },
    trustedCountryCode: "GB",
  });
  const now = new Date("2026-08-29T12:00:00.000Z");
  const authority = await jurisdictionResolver.resolve({
    accountCountry: null,
    now,
    requestCountrySignal: { countryCode: "GB", observedAt: now, trust: "TRUSTED" },
    routeCountryOrMarketSlug: null,
    userSelectedCountry: null,
  });
  assert.equal(presentation.market.countryCode, "DE");
  assert.equal(authority.countryCode, "GB");
  assert.equal(authority.commercialAllowed, false);
  assert.equal(authority.referralAllowed, false);
});

test("trusted geo selects expanded partner-ready markets and unsupported geo falls back deterministically to GB", () => {
  const supported = INITIAL_EUROPEAN_MARKET_PROFILES.map((profile) => resolvePresentationContext({ trustedCountryCode: profile.countryCode }));
  const unsupported = resolvePresentationContext({ trustedCountryCode: "US" });
  assert.deepEqual(supported.map((result) => result.locale), INITIAL_EUROPEAN_MARKET_PROFILES.map((profile) => profile.defaultLocale));
  for (const result of supported) assert.equal(result.source, "TRUSTED_GEO");
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
      const footer = publicFooterMessages(locale);
      for (const value of Object.values(footer)) assert.ok(value.trim().length > 0, `${locale} contains an empty public-footer message`);
    }
  }
});

test("every European Home locale has complete localized copy and metadata", () => {
  for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
    const locale = profile.defaultLocale;
    const programmePath = programmePathForPresentationLocale(locale);
    const englishHtml = transformCommonHandoff(generatedPages.home.html, programmePath);
    const localizedHtml = transformHomeHandoff(englishHtml, locale);
    const localizedMetadata = homeMetadata(locale);
    assert.ok(localizedMetadata.title.trim());
    assert.ok(localizedMetadata.description.trim());
    assert.match(localizedHtml, /data-home-hero-kicker/, `${locale} is missing the responsive Home kicker hook`);
    const programmeHrefs = [...localizedHtml.matchAll(/href="([^"]*\/program(?:\?entry=start)?)"/g)].map((match) => match[1]);
    assert.ok(programmeHrefs.length > 0, `${locale} renders Programme entries`);
    assert.ok(programmeHrefs.every((href) => href === programmePath || href === `${programmePath}?entry=start`), `${locale} preserves its Programme route`);
    if (locale === "en-GB") continue;
    const translation = homeTranslation(locale);
    assert.ok(translation);
    for (const section of Object.keys(HOME_SOURCE_COPY) as Array<keyof typeof HOME_SOURCE_COPY>) {
      assert.equal(translation[section].length, HOME_SOURCE_COPY[section].length, `${locale}:${section}`);
    }
    assert.ok(localizedHtml.includes(translation.hero[1]));
    assert.equal(localizedHtml.includes(">Control<"), false, `${locale} leaked the English Home heading`);
  }
});

test("Home and public-core readiness are explicit and selector-safe", () => {
  const core = new Set(["GB", "DE", "ES", "GR", "SE", "DK"]);
  for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
    assert.equal(homeTranslationReady(profile.defaultLocale), true, profile.countryCode);
    assert.equal(publicCoreTranslationReady(profile.defaultLocale), core.has(profile.countryCode), profile.countryCode);
  }
  const header = readFileSync("components/public-shell/PublicHeader.tsx", "utf8");
  assert.match(header, /publicCoreTranslationReady\(profile\.defaultLocale\)/);
  assert.match(header, /VERCEL_ENV === "production"[\s\S]*PUBLICATION_APPROVED_MARKET_PROFILES/);
});

test("curated bonus selectors keep stable semantics and exact localized labels", () => {
  const expected = {
    "en-GB": ["Best Overall", "Low Wagering", "Low Deposit", "Crypto", "Newest"],
    "de-DE": ["Insgesamt am besten", "Niedrige Umsatzbedingung", "Niedrige Einzahlung", "Krypto", "Neueste"],
    "it-IT": ["Migliore in assoluto", "Requisito di puntata basso", "Deposito basso", "Criptovalute", "Più recenti"],
    "es-ES": ["Mejor en general", "Requisito de apuesta bajo", "Depósito bajo", "Cripto", "Más recientes"],
    "pt-PT": ["Melhor no geral", "Requisito de apostas baixo", "Depósito baixo", "Criptomoedas", "Mais recentes"],
    "el-GR": ["Καλύτερο συνολικά", "Χαμηλή απαίτηση στοιχηματισμού", "Χαμηλή κατάθεση", "Κρυπτονομίσματα", "Νεότερα"],
    "nl-NL": ["Beste algemeen", "Lage inzetvereiste", "Lage storting", "Crypto", "Nieuwste"],
    "sv-SE": ["Bäst totalt", "Lågt omsättningskrav", "Låg insättning", "Krypto", "Senaste"],
    "da-DK": ["Bedst samlet", "Lavt omsætningskrav", "Lav indbetaling", "Krypto", "Nyeste"],
    "fi-FI": ["Paras kokonaisuus", "Matala kierrätysvaatimus", "Pieni talletus", "Krypto", "Uusimmat"],
    "nb-NO": ["Best totalt", "Lavt omsetningskrav", "Lavt innskudd", "Krypto", "Nyeste"],
  } as const;
  for (const [locale, labels] of Object.entries(expected)) {
    const messages = productPageMessages(locale as keyof typeof TRANSLATION_REVIEW_STATE).bonuses;
    assert.deepEqual(
      [messages.selectorBestOverall, messages.selectorLowWagering, messages.selectorLowDeposit, messages.selectorCrypto, messages.selectorNewest],
      labels,
      locale,
    );
    assert.equal(new Set(labels).size, 5, locale);
  }
  const renderer = readFileSync("components/bonus-directory/CuratedBonusShortlist.tsx", "utf8");
  assert.doesNotMatch(renderer, /messages\.common\.filters[^\n]+selectors\.indexOf/);
  assert.doesNotMatch(renderer, /(?:Filter|Filtre|Filtro|Suodatin)\s*\{?\w*\}?\s*[+]?\s*1/i);
});

test("public-core product copy resolves every supported runtime token", () => {
  for (const locale of ["en-GB", "de-DE", "es-ES", "el-GR", "sv-SE", "da-DK"] as const) {
    const formatted = JSON.stringify(productPageMessages(locale), (_key, value) => typeof value === "string"
      ? formatProductMessage(value, { market: "Test Market", page: 1, pages: 2, count: 1 })
      : value);
    assert.doesNotMatch(formatted, /\{\{?[a-z][a-z0-9_-]*\}?\}/i, locale);
    assert.doesNotMatch(formatted, /\b(?:Filter|Filtre|Filtro|Suodatin)\s*[1-5]\b/i, locale);
  }
  assert.deepEqual(homeTranslation("es-ES")?.recognition.slice(0, 2), ["¿Te resulta cada vez", "más difícil controlar el juego?"]);
  const homeCss = transformHomeHandoffCss("");
  assert.match(homeCss, /html\[lang="de-DE"\][\s\S]*\[data-hero\] h1/);
  assert.match(transformHomeHandoff(transformCommonHandoff(generatedPages.home.html), "de-DE"), /data-home-hero-kicker/);
});

test("translation review state records only first-wave Founder publication acceptance while keeping every translated locale noindex", () => {
  assert.deepEqual(TRANSLATION_REVIEW_STATE["en-GB"], {
    content: "SOURCE_BASELINE",
    publicExperience: "PUBLIC_CORE_READY",
    aiLanguageQa: "NOT_APPLICABLE_TO_SOURCE_BASELINE",
    founderPublication: "SOURCE_BASELINE_AUTHORITY",
    legalReview: "GB_SOURCE_REVIEWED",
    marketEvidenceReview: "GB_BASELINE",
    indexingAuthority: "GB_SOURCE_BASELINE",
  });
  for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES.filter((profile) => profile.countryCode !== "GB")) {
    assert.deepEqual(TRANSLATION_REVIEW_STATE[profile.defaultLocale], {
      content: "MACHINE_TRANSLATED",
      publicExperience: (FOUNDER_PUBLICATION_ACCEPTED_MARKET_CODES as readonly string[]).includes(profile.countryCode)
        ? "PUBLIC_CORE_READY"
        : "HOME_READY",
      aiLanguageQa: "AI_LANGUAGE_QA_PASSED",
      founderPublication: (FOUNDER_PUBLICATION_ACCEPTED_MARKET_CODES as readonly string[]).includes(profile.countryCode)
        ? "FOUNDER_PUBLICATION_ACCEPTED"
        : "FOUNDER_PUBLICATION_NOT_ACCEPTED",
      legalReview: "REQUIRED",
      marketEvidenceReview: ["DE", "ES", "SE", "DK", "GR"].includes(profile.countryCode) ? "FIRST_WAVE_EVIDENCE_REVIEWED" : "REQUIRED",
      indexingAuthority: "NOT_ACTIVATED",
    });
  }
});

test("About provides complete localized authored copy without changing safety boundaries", () => {
  for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
    const locale = profile.defaultLocale;
    const about = aboutMessages(locale);
    assert.ok(about.metadataTitle.trim());
    assert.equal(about.parts.length, 3);
    assert.equal(about.separationPoints.length, 3);
    assert.equal(about.boundaries.length, 3);
  }
});

test("Home presents the current 5–8-minute Mission guidance in every supported locale", () => {
  const supportedLocales = [...new Set(MARKET_PROFILES.flatMap((profile) => profile.supportedLocales))];

  for (const locale of supportedLocales) {
    const programmePath = programmePathForPresentationLocale(locale);
    const sourceRuntime = transformCommonHandoff(generatedPages.home.html, programmePath);
    const hero = homeTranslation(locale)?.hero ?? HOME_SOURCE_COPY.hero;
    const programme = homeTranslation(locale)?.programme ?? HOME_SOURCE_COPY.programme;
    const trust = homeTranslation(locale)?.trust ?? HOME_SOURCE_COPY.trust;
    const final = homeTranslation(locale)?.final ?? HOME_SOURCE_COPY.final;
    const localized = transformHomeHandoff(sourceRuntime, locale);
    assert.match(hero[5], /02–10/u, `${locale} Home timing applies only to Missions 02–10`);
    assert.match(hero[5], /5–8/u, `${locale} Home timing`);
    assert.doesNotMatch(hero[5], /5–15/u, `${locale} stale Home timing`);
    assert.ok(localized.includes(hero[5]), `${locale} renders the current Home timing`);
    assert.ok(localized.includes(programme[3]) && localized.includes(programme[4]), `${locale} renders the pace without an invented duration`);
    assert.ok(localized.includes(hero[6]) && localized.includes(programme[6]) && localized.includes(trust[4]), `${locale} qualifies the current Programme's free status`);
    assert.ok(localized.includes(final[1]) && localized.includes(final[2]), `${locale} presents the actual one-situation Starting Point flow`);
    assert.doesNotMatch(localized, /~2|weeks, your pace/u, `${locale} leaked the invented Home duration`);
    assert.doesNotMatch(localized, /no paywall inside, ever|now and always|honest minute|One question at a time/u, `${locale} leaked stale Home promises`);
    assert.doesNotMatch(localized, />10 missions · 5–15 minutes each</u, `${locale} leaked generated Home timing`);
  }
});

test("10 Steps localizes the active RFC-025 path and Mission 01 reward boundary for every supported locale", () => {
  const supportedLocales = [...new Set(MARKET_PROFILES.flatMap((profile) => profile.supportedLocales))];
  const expectedSections = ["hero", "programme-builds", "mission-map", "account-boundary", "final-action"];

  assert.equal(TEN_STEPS_SOURCE_COPY.length, 50);
  assert.equal(programmeMissionTitles.length, 10);
  assert.equal(supportedLocales.length, 13);
  assert.equal(
    programAiMissionOneRewardPolicy.situationSubmitted.xp + programAiMissionOneRewardPolicy.startingPointComplete.xp,
    40,
  );
  assert.equal(programAiMissionOneRewardPolicy.registration.xp, 0);

  const english = tenStepsTranslation("en-GB");
  assert.deepEqual(
    Array.from({ length: 10 }, (_, index) => english.text[20 + index * 2]),
    programmeMissionTitles,
  );
  assert.deepEqual(
    Array.from({ length: 9 }, (_, index) => english.text[23 + index * 2]),
    programAiMissionRegistry.map((mission) => programAiMissionSourcePresentation(mission.missionNumber).purpose),
  );
  assert.deepEqual(tenStepsTranslation("en-CA"), english);
  assert.deepEqual(tenStepsTranslation("fr-CA"), english);

  for (const locale of supportedLocales) {
    const programmePath = programmePathForPresentationLocale(locale);
    const sourceRuntime = transformCommonHandoff(generatedPages.tenSteps.html, programmePath);
    const messages = tenStepsTranslation(locale);
    const signals = tenStepsContractSignals[locale];
    const missionPairs = Array.from({ length: 10 }, (_, index) => ({
      title: messages.text[20 + index * 2],
      description: messages.text[21 + index * 2],
    }));

    assert.equal(messages.text.length, 50, locale);
    assert.equal(missionPairs.length, 10, locale);
    for (const [index, mission] of missionPairs.entries()) {
      assert.ok(mission.title.trim(), `${locale} Mission ${index + 1} title`);
      assert.ok(mission.description.trim(), `${locale} Mission ${index + 1} description`);
    }

    assert.match(messages.text[4], /5\s*(?:[–-]|y|e)\s*8/u, `${locale} current Mission timing`);
    assert.doesNotMatch(messages.text[4], /15/u, `${locale} stale 5–15-minute timing`);
    assert.match(`${messages.text[46]} ${messages.text[47]}`, signals.startingPoint, `${locale} closing Starting Point`);
    assert.doesNotMatch(`${messages.text[46]} ${messages.text[47]}`, /minut|λεπτ/iu, `${locale} stale one-minute claim`);
    assert.match(messages.text[48], signals.twoActions, `${locale} two Mission 01 actions`);
    assert.match(messages.text[48], /40 XP/u, `${locale} Mission 01 reward`);
    assert.match(messages.text[48], signals.registrationZero, `${locale} registration-zero boundary`);
    assert.match(messages.text[48], signals.registrationAfterReady, `${locale} post-result registration boundary`);
    assert.ok(messages.text[48].search(signals.twoActions) < messages.text[48].indexOf("40 XP"), `${locale} actions precede reward`);
    assert.ok(messages.text[48].indexOf("40 XP") < messages.text[48].search(signals.registrationZero), `${locale} registration follows reward`);

    const localized = transformTenStepsHandoff(sourceRuntime, locale, programmePath);
    assert.deepEqual(
      [...localized.matchAll(/data-ten-steps-section="([^"]+)"/g)].map((match) => match[1]),
      expectedSections,
      `${locale} active section order`,
    );
    assert.equal((localized.match(/role="list" aria-labelledby="ten-steps-path-title" data-ten-steps-mission-list/g) ?? []).length, 1, locale);
    assert.equal((localized.match(/role="listitem" data-ten-steps-mission/g) ?? []).length, 10, locale);

    let missionCursor = localized.indexOf('data-ten-steps-mission-list=""');
    const missionSectionEnd = localized.indexOf('data-ten-steps-section="account-boundary"', missionCursor);
    assert.ok(missionCursor >= 0 && missionSectionEnd > missionCursor, `${locale} Mission path bounds`);
    for (const [index, mission] of missionPairs.entries()) {
      const numberIndex = localized.indexOf(`>${String(index + 1).padStart(2, "0")}</span>`, missionCursor);
      const titleIndex = localized.indexOf(`>${escapeTenStepsText(mission.title)}</div>`, numberIndex);
      const descriptionIndex = localized.indexOf(`>${escapeTenStepsText(mission.description)}</div>`, titleIndex);
      assert.ok(numberIndex >= missionCursor, `${locale} Mission ${index + 1} number order`);
      assert.ok(titleIndex > numberIndex, `${locale} Mission ${index + 1} title order`);
      assert.ok(descriptionIndex > titleIndex && descriptionIndex < missionSectionEnd, `${locale} Mission ${index + 1} description order`);
      missionCursor = descriptionIndex;
    }

    assert.ok(localized.includes(escapeTenStepsText(messages.text[4])), `${locale} current overview`);
    assert.ok(localized.includes(escapeTenStepsText(messages.text[43])), `${locale} privacy boundary`);
    assert.ok(localized.includes(escapeTenStepsText(messages.text[48])), `${locale} current reward boundary`);
    assert.ok(localized.includes(`alt="${escapeTenStepsText(messages.text.at(-1) ?? "")}"`), `${locale} image alternative`);
    assert.ok(localized.includes(`href="${programmePath}?entry=start"`), `${locale} canonical Programme entry`);
    assert.doesNotMatch(localized, programmePath === "/program" ? /href="\/[^\"]+\/program/ : /href="\/program(?:\?entry=start)?"/, `${locale} does not leak another Programme route`);
    assert.doesNotMatch(localized, />Each mission takes 5–15 minutes</u, `${locale} leaked source timing`);
    assert.doesNotMatch(localized, />Mission 01 takes about</u, `${locale} leaked source closing claim`);
    assert.doesNotMatch(localized, />one minute\.</u, `${locale} leaked source one-minute claim`);

    for (const source of TEN_STEPS_SOURCE_COPY.slice(20, 40)) {
      if (messages.text.slice(20, 40).includes(source)) continue;
      assert.equal(localized.includes(`>${escapeTenStepsText(source)}<`), false, `${locale} leaked source Mission copy: ${source}`);
    }
    if (locale !== "en-GB" && locale !== "en-CA" && locale !== "fr-CA") {
      assert.equal(localized.includes(">The Programme, step by step<"), false, `${locale} leaked the 10 Steps heading`);
      assert.equal(localized.includes(">Start Mission 01<"), false, `${locale} leaked the 10 Steps CTA`);
    }
  }
});

test("FAQ provides complete localized trust copy without changing commercial or protected-data boundaries", () => {
  for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
    const locale = profile.defaultLocale;
    const faq = faqMessages(locale);
    assert.ok(faq.metadataTitle.trim());
    assert.equal(faq.groups.length, 5);
    assert.equal(faq.groups.reduce((total, group) => total + group.items.length, 0), 12);
    const fullText = JSON.stringify(faq);
    assert.match(fullText, /B4GAMBLE/);
    assert.match(fullText, /Editor Score/);
    if (locale !== "en-GB") {
      assert.notEqual(faq.titleLead, "Clear", `${locale} leaked the FAQ heading`);
      assert.notEqual(faq.groups[0].items[0][0], "What is B4GAMBLE?", `${locale} leaked the primary FAQ question`);
    }
  }
});

test("market-first middleware redirects legacy paths and rewrites only validated public routes", async () => {
  const legacy = await middleware(new NextRequest("http://127.0.0.1:4173/de/de/casinos?sort=score"));
  assert.equal(legacy.status, 308);
  const legacyLocation = new URL(legacy.headers.get("location") ?? "http://invalid");
  assert.equal(`${legacyLocation.pathname}${legacyLocation.search}`, "/de/casinos?sort=score");

  const response = await middleware(new NextRequest("http://127.0.0.1:4173/de/casinos?sort=score"));
  assert.equal(response.status, 200);
  const rewrite = new URL(response.headers.get("x-middleware-rewrite") ?? "http://invalid");
  assert.equal(`${rewrite.pathname}${rewrite.search}`, "/casinos?sort=score");
  assert.equal(response.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), "de");
  assert.equal(response.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), "de");
  const localCsp = response.headers.get("content-security-policy") ?? "";
  assert.ok(localCsp);
  assert.doesNotMatch(localCsp, /upgrade-insecure-requests/);

  const secureResponse = await middleware(new NextRequest("https://b4gamble.com/casinos"));
  assert.match(secureResponse.headers.get("content-security-policy") ?? "", /upgrade-insecure-requests/);

  const inheritedHeaders = middlewareRequestHeaders(response);
  const rewrittenResponse = await middleware(new NextRequest(rewrite, { headers: inheritedHeaders }));
  assert.equal(rewrittenResponse.headers.get("x-middleware-rewrite"), null);
  assert.equal(rewrittenResponse.headers.get("content-language"), "de-DE");
  assert.equal(rewrittenResponse.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), "de");
  assert.equal(rewrittenResponse.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), "de");
  assert.equal(rewrittenResponse.headers.get("x-middleware-request-x-b4gamble-internal-presentation-token"), null);

  const spoofedInternalRewrite = await middleware(new NextRequest("http://127.0.0.1:4173/casinos", {
    headers: {
      [PRESENTATION_CONTEXT_HEADER]: "public-v1",
      [PRESENTATION_MARKET_HEADER]: "de",
      [PRESENTATION_LANGUAGE_HEADER]: "de",
      "x-b4gamble-internal-presentation-token": "client-supplied",
    },
  }));
  assert.equal(spoofedInternalRewrite.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), "gb");
  assert.equal(spoofedInternalRewrite.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), "en");

  const marketHome = await middleware(new NextRequest("http://127.0.0.1:4173/de/"));
  assert.equal(marketHome.status, 200);
  assert.equal(new URL(marketHome.headers.get("x-middleware-rewrite") ?? "http://invalid").pathname, "/");
  const unslashedMarketHome = await middleware(new NextRequest("http://127.0.0.1:4173/de"));
  assert.equal(unslashedMarketHome.status, 308);
  assert.equal(new URL(unslashedMarketHome.headers.get("location") ?? "http://invalid").pathname, "/de/");

  const gb = await middleware(new NextRequest("http://127.0.0.1:4173/casinos"));
  assert.equal(gb.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), "gb");
  assert.equal(gb.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), "en");

  const gbAlias = await middleware(new NextRequest("http://127.0.0.1:4173/gb/en/"));
  assert.equal(gbAlias.status, 308);
  assert.equal(new URL(gbAlias.headers.get("location") ?? "http://invalid").pathname, "/");

  const invalid = await middleware(new NextRequest("http://127.0.0.1:4173/de/en/"));
  assert.equal(invalid.headers.get("x-middleware-rewrite"), null);
  const architectureOnly = await middleware(new NextRequest("http://127.0.0.1:4173/ca/fr/casinos"));
  assert.equal(architectureOnly.headers.get("x-middleware-rewrite"), null);
  assert.equal(architectureOnly.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), null);
  assert.equal(architectureOnly.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), null);
  const ordinaryTrailingSlash = await middleware(new NextRequest("http://127.0.0.1:4173/terms/"));
  assert.equal(ordinaryTrailingSlash.status, 308);
  assert.equal(new URL(ordinaryTrailingSlash.headers.get("location") ?? "http://invalid").pathname, "/terms");
  const protectedRoute = await middleware(new NextRequest("http://127.0.0.1:4173/de/admin", {
    headers: {
      [PRESENTATION_MARKET_HEADER]: "de",
      [PRESENTATION_LANGUAGE_HEADER]: "de",
    },
  }));
  assert.equal(protectedRoute.headers.get("x-middleware-rewrite"), null);
  assert.equal(protectedRoute.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), null);
  assert.equal(protectedRoute.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), null);
});

test("signed presentation continuations are bound to the exact query and a narrow issuance window", async () => {
  const previousVercelEnvironment = process.env.VERCEL_ENV;
  const previousBetterAuthSecret = process.env.BETTER_AUTH_SECRET;
  const previousDateNow = Date.now;
  const issuedAt = 2_000_000_000_000;
  process.env.VERCEL_ENV = "production";
  process.env.BETTER_AUTH_SECRET = "internationalisation-middleware-binding-test-secret";
  Date.now = () => issuedAt;

  try {
    const firstPass = await middleware(new NextRequest("https://b4gamble.com/de/casinos?sort=score&page=2"));
    const rewrite = new URL(firstPass.headers.get("x-middleware-rewrite") ?? "http://invalid");
    assert.equal(`${rewrite.pathname}${rewrite.search}`, "/casinos?sort=score&page=2");

    const continuationHeaders = middlewareRequestHeaders(firstPass);
    assert.ok(continuationHeaders.get("x-b4gamble-internal-presentation-token"));

    const exactReplay = await middleware(new NextRequest(rewrite, {
      headers: new Headers(continuationHeaders),
    }));
    assert.equal(exactReplay.headers.get("content-language"), "de-DE");
    assert.equal(exactReplay.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), "de");
    assert.equal(exactReplay.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), "de");
    assert.equal(exactReplay.headers.get("x-middleware-request-x-b4gamble-internal-presentation-token"), null);

    const queryMutation = await middleware(new NextRequest("https://b4gamble.com/casinos?sort=score&page=3", {
      headers: new Headers(continuationHeaders),
    }));
    assert.equal(queryMutation.headers.get("x-middleware-rewrite"), null);
    assert.equal(queryMutation.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), "gb");
    assert.equal(queryMutation.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), "en");
    assert.equal(queryMutation.headers.get("x-middleware-request-x-b4gamble-internal-presentation-token"), null);

    Date.now = () => issuedAt + 30_001;
    const expiredReplay = await middleware(new NextRequest(rewrite, {
      headers: new Headers(continuationHeaders),
    }));
    assert.equal(expiredReplay.headers.get("x-middleware-rewrite"), null);
    assert.equal(expiredReplay.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), "gb");
    assert.equal(expiredReplay.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), "en");
    assert.equal(expiredReplay.headers.get("x-middleware-request-x-b4gamble-internal-presentation-token"), null);

    Date.now = () => issuedAt - 5_001;
    const futureReplay = await middleware(new NextRequest(rewrite, {
      headers: new Headers(continuationHeaders),
    }));
    assert.equal(futureReplay.headers.get("x-middleware-rewrite"), null);
    assert.equal(futureReplay.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), "gb");
    assert.equal(futureReplay.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), "en");
    assert.equal(futureReplay.headers.get("x-middleware-request-x-b4gamble-internal-presentation-token"), null);
  } finally {
    Date.now = previousDateNow;
    if (previousVercelEnvironment === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previousVercelEnvironment;
    if (previousBetterAuthSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
    else process.env.BETTER_AUTH_SECRET = previousBetterAuthSecret;
  }
});

test("Preview and Production fail closed when the presentation signing secret is missing", async () => {
  const previousVercelEnvironment = process.env.VERCEL_ENV;
  const previousBetterAuthSecret = process.env.BETTER_AUTH_SECRET;
  const previousVercelUrl = process.env.VERCEL_URL;
  const previousVercelBranchUrl = process.env.VERCEL_BRANCH_URL;
  delete process.env.BETTER_AUTH_SECRET;

  try {
    const scenarios = [
      {
        environment: "production",
        url: "https://b4gamble.com/de/casinos?sort=score",
      },
      {
        environment: "preview",
        url: "https://sevenbet-next-git-i18n.vercel.app/de/casinos?sort=score",
      },
    ] as const;

    for (const scenario of scenarios) {
      process.env.VERCEL_ENV = scenario.environment;
      if (scenario.environment === "preview") {
        process.env.VERCEL_URL = "sevenbet-next-a1b2c3.vercel.app";
        process.env.VERCEL_BRANCH_URL = "sevenbet-next-git-i18n.vercel.app";
      } else {
        delete process.env.VERCEL_URL;
        delete process.env.VERCEL_BRANCH_URL;
      }

      const response = await middleware(new NextRequest(scenario.url));
      assert.equal(response.status, 200, scenario.environment);
      assert.equal(response.headers.get("x-middleware-rewrite"), null, scenario.environment);
      assert.equal(response.headers.get("content-language"), null, scenario.environment);
      assert.equal(
        response.headers.get("x-middleware-request-x-b4gamble-internal-presentation-token"),
        null,
        scenario.environment,
      );
    }
  } finally {
    if (previousVercelEnvironment === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previousVercelEnvironment;
    if (previousBetterAuthSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
    else process.env.BETTER_AUTH_SECRET = previousBetterAuthSecret;
    if (previousVercelUrl === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = previousVercelUrl;
    if (previousVercelBranchUrl === undefined) delete process.env.VERCEL_BRANCH_URL;
    else process.env.VERCEL_BRANCH_URL = previousVercelBranchUrl;
  }
});

test("Production routing and preference selection expose only Founder-publication-approved markets", async () => {
  const previousVercelEnvironment = process.env.VERCEL_ENV;
  const previousBetterAuthSecret = process.env.BETTER_AUTH_SECRET;
  process.env.VERCEL_ENV = "production";
  process.env.BETTER_AUTH_SECRET = "internationalisation-middleware-test-secret";
  try {
    const approved = await middleware(new NextRequest("https://b4gamble.com/de/casinos"));
    assert.equal(new URL(approved.headers.get("x-middleware-rewrite") ?? "http://invalid").pathname, "/casinos");
    assert.equal(approved.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), "de");

    const approvedHeaders = middlewareRequestHeaders(approved);
    const mutatedHeaders = new Headers(approvedHeaders);
    mutatedHeaders.set(PRESENTATION_MARKET_HEADER, "it");
    mutatedHeaders.set(PRESENTATION_LANGUAGE_HEADER, "it");
    const mutated = await middleware(new NextRequest("https://b4gamble.com/casinos", { headers: mutatedHeaders }));
    assert.equal(mutated.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), "gb");
    assert.equal(mutated.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), "en");

    const crossPathReplay = await middleware(new NextRequest("https://b4gamble.com/bonuses", { headers: approvedHeaders }));
    assert.equal(crossPathReplay.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), "gb");
    assert.equal(crossPathReplay.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), "en");

    const crossHostReplay = await middleware(new NextRequest("https://attacker.example/casinos", { headers: approvedHeaders }));
    assert.equal(crossHostReplay.status, 308);
    assert.equal(crossHostReplay.headers.get("location"), "https://b4gamble.com/casinos");

    for (const market of ["it", "pt", "nl", "fi", "no", "ca"]) {
      const denied = await middleware(new NextRequest(`https://b4gamble.com/${market}/`));
      assert.equal(denied.headers.get("x-middleware-rewrite"), null, market);
      assert.equal(denied.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), null, market);
      assert.equal(denied.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), null, market);
    }

    const acceptedSelection = await updatePresentationPreference(new NextRequest("https://b4gamble.com/api/presentation", {
      method: "POST",
      body: new URLSearchParams({ choice: "DE|de-DE", returnTo: "/casinos" }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
    }));
    assert.equal(acceptedSelection.status, 303);
    assert.equal(acceptedSelection.headers.get("location"), "/de/casinos");

    const unapprovedSelection = await updatePresentationPreference(new NextRequest("https://b4gamble.com/api/presentation", {
      method: "POST",
      body: new URLSearchParams({ choice: "IT|it-IT", returnTo: "/casinos" }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
    }));
    assert.equal(unapprovedSelection.status, 400);
  } finally {
    if (previousVercelEnvironment === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previousVercelEnvironment;
    if (previousBetterAuthSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
    else process.env.BETTER_AUTH_SECRET = previousBetterAuthSecret;
  }
});

test("preference endpoint persists only a validated presentation choice and can clear it", async () => {
  const selected = await updatePresentationPreference(new NextRequest("https://b4gamble.com/api/presentation", {
    method: "POST",
    body: new URLSearchParams({ choice: "ES|es-ES", returnTo: "/de/casinos?page=2&country=DE&sort=score" }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  }));
  assert.equal(selected.status, 303);
  assert.equal(selected.headers.get("location"), "/es/casinos?page=2&sort=score");
  const selectedCookie = selected.headers.get("set-cookie") ?? "";
  assert.match(selectedCookie, new RegExp(`${PRESENTATION_PREFERENCE_COOKIE}=v1\\.ES\\.es-ES`));
  assert.match(selectedCookie, /HttpOnly/);
  assert.doesNotMatch(selectedCookie, /commercial|referral|programme|help/i);

  const cleared = await updatePresentationPreference(new NextRequest("https://b4gamble.com/api/presentation", {
    method: "POST",
    body: new URLSearchParams({ choice: "automatic", returnTo: "/es/bonuses?type=welcome&country=ES" }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  }));
  assert.equal(cleared.status, 303);
  assert.equal(cleared.headers.get("location"), "/bonuses?type=welcome");
  assert.match(cleared.headers.get("set-cookie") ?? "", /Max-Age=0/);

  const invalid = await updatePresentationPreference(new NextRequest("https://b4gamble.com/api/presentation", {
    method: "POST",
    body: new URLSearchParams({ choice: "DE|en-GB", returnTo: "/" }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  }));
  assert.equal(invalid.status, 400);

  const external = await updatePresentationPreference(new NextRequest("https://b4gamble.com/api/presentation", {
    method: "POST",
    body: new URLSearchParams({ choice: "DE|de-DE", returnTo: "https://evil.example/steal" }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  }));
  assert.equal(external.status, 400);

  for (const returnTo of ["/de%2Fadmin", "/de\\admin", `/casinos?${"x".repeat(2_100)}`]) {
    const unsafe = await updatePresentationPreference(new NextRequest("https://b4gamble.com/api/presentation", {
      method: "POST",
      body: new URLSearchParams({ choice: "DE|de-DE", returnTo }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
    }));
    assert.equal(unsafe.status, 400, returnTo.slice(0, 80));
  }
});
