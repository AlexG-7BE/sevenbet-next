import { dirname, resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import { chromium } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const outputRoot = resolve(process.env.LOCALIZATION_QA_OUTPUT ?? "/private/tmp/b4gamble-localization-quality-audit");
const fullPageScreenshots = process.env.LOCALIZATION_QA_FULL_PAGE !== "false";
const writeScreenshots = process.env.LOCALIZATION_QA_SCREENSHOTS !== "false";

const RELEASE_CRITICAL = "RELEASE_CRITICAL";
const DRAFT_QUALITY = "DRAFT_QUALITY";
const ARCHITECTURE_ONLY = "ARCHITECTURE_ONLY";
const GB_BASELINE_ONLY = "GB_BASELINE_ONLY";

const allLocales = [
  { market: "GB", locale: "en-GB", prefix: "", quality: RELEASE_CRITICAL },
  { market: "DE", locale: "de-DE", prefix: "/de", quality: RELEASE_CRITICAL },
  { market: "ES", locale: "es-ES", prefix: "/es", quality: RELEASE_CRITICAL },
  { market: "SE", locale: "sv-SE", prefix: "/se", quality: RELEASE_CRITICAL },
  { market: "DK", locale: "da-DK", prefix: "/dk", quality: RELEASE_CRITICAL },
  { market: "GR", locale: "el-GR", prefix: "/gr", quality: RELEASE_CRITICAL },
  { market: "IT", locale: "it-IT", prefix: "/it", quality: DRAFT_QUALITY },
  { market: "PT", locale: "pt-PT", prefix: "/pt", quality: DRAFT_QUALITY },
  { market: "NL", locale: "nl-NL", prefix: "/nl", quality: DRAFT_QUALITY },
  { market: "FI", locale: "fi-FI", prefix: "/fi", quality: DRAFT_QUALITY },
  { market: "NO", locale: "nb-NO", prefix: "/no", quality: DRAFT_QUALITY },
  { market: "CA", locale: "en-CA", prefix: "/ca", quality: ARCHITECTURE_ONLY },
  { market: "CA", locale: "fr-CA", prefix: "/ca/fr", quality: ARCHITECTURE_ONLY },
];

// Keep the Founder matrix literal: its height-sensitive and landscape-shaped
// cases cannot be replaced safely by width-only approximations.
const HOME_VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
  { width: 480, height: 900 },
  { width: 768, height: 1024 },
  { width: 820, height: 1180 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 960 },
  { width: 1920, height: 1080 },
  { width: 390, height: 667 },
];
const PUBLIC_CORE_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];
const DRAFT_SURFACE_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];
const ARTICLE_STRESS_VIEWPORTS = DRAFT_SURFACE_VIEWPORTS;
const STATE_VIEWPORTS = DRAFT_SURFACE_VIEWPORTS;
const MOBILE_NAVIGATION_VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
];
const LEARNING_EMPTY_QUERY = "localization-visual-no-current-guide-can-match";
const EXPECTED_MAIN_DOCUMENT_404_CONSOLE = "Failed to load resource: the server responded with a status of 404 (Not Found)";
const EXPECTED_MAIN_DOCUMENT_500_CONSOLE = "Failed to load resource: the server responded with a status of 500 (Internal Server Error)";
const EXPECTED_PRODUCTION_SERVER_COMPONENT_ERROR = "Error: An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.";

const allSurfaces = [
  {
    name: "home",
    suffix: "/",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "HOME_EXHAUSTIVE",
    dataDependency: "NONE",
    commercialDependency: "NONE",
    state: "AUTHORED_CONTENT",
  },
  {
    name: "best-offers",
    suffix: "/best-offers?visualFixture=true",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "OPTIONAL_LOCAL_VISUAL_FIXTURE",
    commercialDependency: "FAILS_CLOSED",
    state: "POPULATED_WHERE_AUTHORISED_OR_DESIGNED_EMPTY",
  },
  {
    name: "casinos",
    suffix: "/casinos?visualFixture=true",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "OPTIONAL_LOCAL_VISUAL_FIXTURE",
    commercialDependency: "FAILS_CLOSED",
    state: "POPULATED_WHERE_AUTHORISED_OR_DESIGNED_EMPTY",
  },
  {
    name: "casino-profile",
    suffix: "/casino/demo-plume?visualFixture=true",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "REPOSITORY_DEMO_EVIDENCE",
    commercialDependency: "FAILS_CLOSED",
    state: "DEMO_ONLY",
    genericEnglishScope: "PROFILE_SYSTEM_UI",
  },
  {
    name: "bonuses",
    suffix: "/bonuses?visualFixture=true",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "OPTIONAL_LOCAL_VISUAL_FIXTURE",
    commercialDependency: "FAILS_CLOSED",
    state: "POPULATED_WHERE_AUTHORISED_OR_DESIGNED_EMPTY",
  },
  {
    name: "compare",
    suffix: "/compare?casino=demo-northstar&casino=demo-summit",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "QUERY_REDIRECT_TO_CASINOS",
    commercialDependency: "FAILS_CLOSED",
    state: "CONTEXTUAL_COMPARISON",
    setup: "CONTEXTUAL_COMPARISON",
    expectedFinalSuffix: "/casinos",
    expectedSearchParams: { casino: ["demo-northstar", "demo-summit"] },
  },
  {
    name: "10-steps",
    suffix: "/10-steps",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "NONE",
    commercialDependency: "NONE",
    state: "AUTHORED_CONTENT",
  },
  {
    name: "about",
    suffix: "/about",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "NONE",
    commercialDependency: "NONE",
    state: "AUTHORED_CONTENT",
  },
  {
    name: "contact",
    suffix: "/contact",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "NONE",
    commercialDependency: "NONE",
    state: "AUTHORED_CONTENT",
  },
  {
    name: "faq",
    suffix: "/faq",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "NONE",
    commercialDependency: "NONE",
    state: "AUTHORED_CONTENT",
  },
  {
    name: "methodology",
    suffix: "/methodology",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "NONE",
    commercialDependency: "NONE",
    state: "AUTHORED_CONTENT",
  },
  {
    name: "learning",
    suffix: "/learn",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "REPOSITORY_EDITORIAL_CONTENT",
    commercialDependency: "NONE",
    state: "AUTHORED_CONTENT",
  },
  {
    name: "learning-category",
    suffix: "/learn/responsible-gambling",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "REPOSITORY_EDITORIAL_CONTENT",
    commercialDependency: "NONE",
    state: "AUTHORED_CONTENT",
  },
  {
    name: "learning-article",
    suffix: "/learn/responsible-gambling/responsible-gambling-tools",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "REPOSITORY_EDITORIAL_CONTENT",
    commercialDependency: "NONE",
    state: "LONG_LOCALIZED_ARTICLE",
    expectedFinalSuffix: "/learn/responsible-gambling/responsible-gambling-tools",
  },
  {
    name: "learning-article-bonus-terms",
    suffix: "/learn/casino-bonuses/welcome-bonus-terms",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "ARTICLE_STRESS",
    dataDependency: "REPOSITORY_EDITORIAL_CONTENT",
    commercialDependency: "NONE",
    state: "LONG_LOCALIZED_ARTICLE_STRESS",
    expectedFinalSuffix: "/learn/casino-bonuses/welcome-bonus-terms",
  },
  {
    name: "learning-article-casino-reviews",
    suffix: "/learn/casino-reviews/how-casino-reviews-work",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "ARTICLE_STRESS",
    dataDependency: "REPOSITORY_EDITORIAL_CONTENT",
    commercialDependency: "NONE",
    state: "LONG_LOCALIZED_ARTICLE_STRESS",
    expectedFinalSuffix: "/learn/casino-reviews/how-casino-reviews-work",
  },
  {
    name: "learning-article-country-guides",
    suffix: "/learn/country-guides/country-guide-structure",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "ARTICLE_STRESS",
    dataDependency: "REPOSITORY_EDITORIAL_CONTENT",
    commercialDependency: "NONE",
    state: "LONG_LOCALIZED_ARTICLE_STRESS",
    expectedFinalSuffix: "/learn/country-guides/country-guide-structure",
  },
  {
    name: "learning-search-empty",
    suffix: "/learn",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "STATE_ROUTE",
    dataDependency: "REPOSITORY_EDITORIAL_CONTENT",
    commercialDependency: "NONE",
    state: "FILTERED_EMPTY",
    setup: "LEARNING_SEARCH_EMPTY",
    expectedFinalSuffix: "/learn",
  },
  {
    name: "bonuses-empty",
    suffix: "/bonuses?payment=localization-visual-no-match",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "STATE_ROUTE",
    dataDependency: "DETERMINISTIC_ZERO_FILTER",
    commercialDependency: "FAILS_CLOSED",
    state: "FILTERED_EMPTY",
  },
  {
    name: "casinos-empty",
    suffix: "/casinos?q=localization-visual-no-match",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "STATE_ROUTE",
    dataDependency: "DETERMINISTIC_ZERO_FILTER",
    commercialDependency: "FAILS_CLOSED",
    state: "FILTERED_EMPTY",
  },
  {
    name: "casinos-pagination",
    suffix: "/casinos?page=2&visualFixture=true",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "STATE_ROUTE",
    dataDependency: "DETERMINISTIC_PAGINATION_BOUNDARY",
    commercialDependency: "FAILS_CLOSED",
    state: "PAGINATION_BOUNDARY",
  },
  {
    name: "bonuses-pagination",
    suffix: "/bonuses?page=2&sort=editorial&visualFixture=true",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "STATE_ROUTE",
    dataDependency: "DETERMINISTIC_PAGINATION_BOUNDARY",
    commercialDependency: "FAILS_CLOSED",
    state: "PAGINATION_BOUNDARY",
  },
  {
    name: "missing-casino",
    suffix: "/casino/localization-visual-missing",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "STATE_ROUTE",
    dataDependency: "DETERMINISTIC_MISSING_SLUG",
    commercialDependency: "NONE",
    state: "LOCALIZED_NOT_FOUND",
    expectedStatus: 404,
  },
  {
    name: "not-found",
    suffix: "/learn/localization-quality-missing/localization-quality-missing",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "STATE_ROUTE",
    dataDependency: "NONE",
    commercialDependency: "NONE",
    state: "LOCALIZED_NOT_FOUND",
    expectedStatus: 404,
  },
  ...[
    ["error-best-offers", "/best-offers?errorFixture=public-commercial", "best-offers"],
    ["error-bonuses", "/bonuses?errorFixture=public-commercial", "bonuses"],
    ["error-casinos", "/casinos?errorFixture=public-commercial", "casinos"],
    ["error-casino-profile", "/casino/demo-plume?errorFixture=public-commercial", "casino-profile"],
    ["error-compare", "/compare?errorFixture=public-commercial", "compare"],
  ].map(([name, suffix, errorSurface]) => ({
    name,
    suffix,
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "STATE_ROUTE",
    dataDependency: "LOCAL_ERROR_BOUNDARY_FIXTURE",
    commercialDependency: "FAILS_CLOSED",
    state: "LOCALIZED_ROUTE_ERROR",
    errorSurface,
    expectedStatus: 500,
  })),
  {
    name: "bonus-filters",
    suffix: "/bonuses?crypto=false&visualFixture=true",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "STATE_ROUTE",
    dataDependency: "OPTIONAL_LOCAL_VISUAL_FIXTURE",
    commercialDependency: "FAILS_CLOSED",
    state: "FILTER_DIALOG_OPEN",
    setup: "BONUS_FILTERS",
  },
  {
    name: "casino-filters",
    suffix: "/casinos?hasBonus=true&visualFixture=true",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "STATE_ROUTE",
    dataDependency: "OPTIONAL_LOCAL_VISUAL_FIXTURE",
    commercialDependency: "FAILS_CLOSED",
    state: "FILTER_DIALOG_OPEN",
    setup: "CASINO_FILTERS",
  },
  {
    name: "help",
    suffix: "/help",
    scope: "FIRST_WAVE_SAFETY_ONLY",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "FIRST_WAVE_EVIDENCE_PROFILE",
    commercialDependency: "PROHIBITED",
    state: "LOCAL_SAFETY_CONTENT",
  },
  {
    name: "responsible-gambling",
    suffix: "/responsible-gambling",
    scope: "FIRST_WAVE_SAFETY_ONLY",
    viewportPolicy: "PUBLIC_ROUTE",
    dataDependency: "FIRST_WAVE_EVIDENCE_PROFILE",
    commercialDependency: "PROHIBITED",
    state: "LOCAL_SAFETY_CONTENT",
  },
  {
    name: "mobile-navigation",
    suffix: "/",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "MOBILE_SHELL",
    dataDependency: "NONE",
    commercialDependency: "NONE",
    state: "MOBILE_DIALOG_OPEN",
    setup: "MOBILE_NAVIGATION",
  },
  {
    name: "market-selector",
    suffix: "/",
    scope: "AUTHORED_EUROPE",
    viewportPolicy: "DESKTOP_SHELL",
    dataDependency: "NONE",
    commercialDependency: "NONE",
    state: "SELECTOR_MENU_OPEN",
    setup: "MARKET_SELECTOR",
  },
  {
    name: "bonus-guide",
    suffix: "/bonus-guide",
    scope: GB_BASELINE_ONLY,
    viewportPolicy: "BOUNDARY_ROUTE",
    dataDependency: "REPOSITORY_EDITORIAL_CONTENT",
    commercialDependency: "NONE",
    state: "UNPREFIXED_CONTENT",
  },
  {
    name: "terms",
    suffix: "/terms",
    scope: GB_BASELINE_ONLY,
    viewportPolicy: "BOUNDARY_ROUTE",
    dataDependency: "OPERATIVE_LEGAL_DOCUMENT",
    commercialDependency: "NONE",
    state: "LEGAL_REVIEW_GATED_UNPREFIXED",
  },
  {
    name: "privacy",
    suffix: "/privacy",
    scope: GB_BASELINE_ONLY,
    viewportPolicy: "BOUNDARY_ROUTE",
    dataDependency: "OPERATIVE_LEGAL_DOCUMENT",
    commercialDependency: "NONE",
    state: "LEGAL_REVIEW_GATED_UNPREFIXED",
  },
  {
    name: "affiliate-disclosure",
    suffix: "/affiliate-disclosure",
    scope: GB_BASELINE_ONLY,
    viewportPolicy: "BOUNDARY_ROUTE",
    dataDependency: "OPERATIVE_LEGAL_DOCUMENT",
    commercialDependency: "DISCLOSURE_ONLY",
    state: "LEGAL_REVIEW_GATED_UNPREFIXED",
  },
  {
    name: "login",
    suffix: "/login",
    scope: GB_BASELINE_ONLY,
    viewportPolicy: "BOUNDARY_ROUTE",
    dataDependency: "AUTH_CONFIGURATION",
    commercialDependency: "NONE",
    state: "UNPREFIXED_CONTENT",
  },
  {
    name: "self-check",
    suffix: "/self-check",
    scope: GB_BASELINE_ONLY,
    viewportPolicy: "BOUNDARY_ROUTE",
    dataDependency: "NONE",
    commercialDependency: "PROHIBITED",
    state: "PROTECTED_UNPREFIXED",
  },
  {
    name: "budget-calculator",
    suffix: "/tools/budget-calculator",
    scope: GB_BASELINE_ONLY,
    viewportPolicy: "BOUNDARY_ROUTE",
    dataDependency: "NONE",
    commercialDependency: "PROHIBITED",
    state: "PROTECTED_UNPREFIXED",
  },
  {
    name: "outbound-unavailable",
    suffix: "/outbound/unavailable",
    scope: GB_BASELINE_ONLY,
    viewportPolicy: "BOUNDARY_ROUTE",
    dataDependency: "NONE",
    commercialDependency: "FAILS_CLOSED",
    state: "COMMERCIAL_UNAVAILABLE",
  },
  {
    name: "responsible-gaming-redirect",
    suffix: "/responsible-gaming",
    scope: GB_BASELINE_ONLY,
    viewportPolicy: "BOUNDARY_ROUTE",
    dataDependency: "NONE",
    commercialDependency: "PROHIBITED",
    state: "CANONICAL_REDIRECT",
    expectedFinalSuffix: "/responsible-gambling",
  },
  {
    name: "catalog-redirect",
    suffix: "/catalog",
    scope: GB_BASELINE_ONLY,
    viewportPolicy: "BOUNDARY_ROUTE",
    dataDependency: "PUBLIC_CASINO_DISCOVERY",
    commercialDependency: "FAILS_CLOSED",
    state: "CANONICAL_REDIRECT",
    expectedFinalSuffix: "/casinos",
  },
  {
    name: "help-article-redirect",
    suffix: "/help/self-exclusion",
    scope: GB_BASELINE_ONLY,
    viewportPolicy: "BOUNDARY_ROUTE",
    dataDependency: "PROTECTED_HELP_REGISTRY",
    commercialDependency: "PROHIBITED",
    state: "PROTECTED_CANONICAL_REDIRECT",
    expectedFinalHash: "#self-exclusion",
    expectedFinalSuffix: "/help",
  },
  {
    name: "responsible-gambling-legacy-redirect",
    suffix: "/responsible-gambling/self-exclusion",
    scope: GB_BASELINE_ONLY,
    viewportPolicy: "BOUNDARY_ROUTE",
    dataDependency: "RESPONSIBLE_GAMBLING_ROUTE_REGISTRY",
    commercialDependency: "PROHIBITED",
    state: "PROTECTED_CANONICAL_REDIRECT",
    expectedFinalHash: "#self-exclusion",
    expectedFinalSuffix: "/help",
  },
  {
    name: "programme-entry",
    suffix: "/program",
    scope: GB_BASELINE_ONLY,
    viewportPolicy: "BOUNDARY_ROUTE",
    dataDependency: "PROGRAMME_RUNTIME",
    commercialDependency: "SEPARATED",
    state: "PROTECTED_UNPREFIXED",
  },
];

const excludedRouteFamilies = [
  { family: "/terms, /privacy, /affiliate-disclosure", reason: "LEGAL_REVIEW_GATED; localized operative legal copy is not authorised" },
  { family: "/program/**", reason: "PROTECTED; Programme remains unprefixed" },
  { family: "/help/** except exact /help", reason: "PROTECTED; only the exact first-wave Help hub is localizable" },
  { family: "/responsible-gambling/** except exact /responsible-gambling", reason: "UNPREFIXED_ONLY; only the exact first-wave safety page is localizable" },
  { family: "/launch-polish-error-harness", reason: "UNPREFIXED_ONLY legacy fixture; localized segment errors are exercised through the real public routes" },
  { family: "/bonus-guide, /catalog, /login, /self-check, /tools/**", reason: "UNPREFIXED_ONLY" },
  { family: "/admin/**, /api/**, /mcp/**, /.well-known/**, /editorial-preview/**, /go/**, /r/**, /outbound/**", reason: "INTERNAL_OR_MUTATION_BOUNDARY" },
];

const genericEnglishPatterns = [
  /\bBest offers\b/gi,
  /\bCompare casinos\b/gi,
  /\bHow we test\b/gi,
  /\bOpen protected Help\b/gi,
  /\bSource status\b/gi,
  /\bDirect answer\b/gi,
  /\bRead review\b/gi,
  /\bReview methodology\b/gi,
  /\bBrowse casino reviews\b/gi,
  /\bAll filters\b/gi,
  /\bDirectory controls\b/gi,
  /\bClose (?:all )?filters\b/gi,
  /\bNo comparison records\b/gi,
  /\bWhy\s+\d+(?:\.\d+)?\b/gi,
  /\bCurrent\s+Demonstration\b/gi,
];
const expectedSelectorValues = [
  "automatic",
  "GB|en-GB",
  "DE|de-DE",
  "ES|es-ES",
  "GR|el-GR",
  "SE|sv-SE",
  "DK|da-DK",
];
const textCandidates = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "a", "button", "label", "legend", "summary",
  "li", "dt", "dd", "small", "strong", "em", "span",
].join(",");
const intentionalOverflowAllowlist = [
  "[hidden]",
  "[aria-hidden='true']",
  ".srOnly",
  "[class*='srOnly']",
  "[class*='visuallyHidden']",
  "img",
  "picture",
  "video",
  "svg",
  "canvas",
  "[data-tphoto]",
];

function requestedValues(name) {
  return (process.env[name] ?? "").split(",").map((value) => value.trim()).filter(Boolean);
}

const localeFilter = requestedValues("LOCALIZATION_QA_LOCALE");
const surfaceFilter = requestedValues("LOCALIZATION_QA_SURFACE");
const locales = localeFilter.length
  ? allLocales.filter(({ locale }) => localeFilter.includes(locale))
  : allLocales;
const surfaces = surfaceFilter.length
  ? allSurfaces.filter(({ name }) => surfaceFilter.includes(name))
  : allSurfaces;
const unknownLocales = localeFilter.filter((locale) => !allLocales.some((candidate) => candidate.locale === locale));
const unknownSurfaces = surfaceFilter.filter((surface) => !allSurfaces.some((candidate) => candidate.name === surface));
if (unknownLocales.length || unknownSurfaces.length) {
  throw new Error(`Unknown localization QA filter(s): locales=${unknownLocales.join(",") || "none"}; surfaces=${unknownSurfaces.join(",") || "none"}`);
}

function suffixPath(prefix, suffix) {
  if (suffix === "/") return prefix ? `${prefix}/` : "/";
  return `${prefix}${suffix}` || suffix;
}

function viewportsFor(locale, surface) {
  if (locale.quality === ARCHITECTURE_ONLY) return [];
  if (surface.scope === GB_BASELINE_ONLY && locale.locale !== "en-GB") return [];
  if (surface.scope === "FIRST_WAVE_SAFETY_ONLY" && locale.quality !== RELEASE_CRITICAL) return [];
  if (surface.viewportPolicy === "HOME_EXHAUSTIVE") return HOME_VIEWPORTS;
  if (surface.viewportPolicy === "MOBILE_SHELL") return MOBILE_NAVIGATION_VIEWPORTS;
  if (surface.viewportPolicy === "DESKTOP_SHELL") return [{ width: 1440, height: 900 }];
  if (surface.viewportPolicy === "ARTICLE_STRESS") return ARTICLE_STRESS_VIEWPORTS;
  if (surface.viewportPolicy === "STATE_ROUTE") return STATE_VIEWPORTS;
  return locale.quality === RELEASE_CRITICAL ? PUBLIC_CORE_VIEWPORTS : DRAFT_SURFACE_VIEWPORTS;
}

const capturePlan = locales.flatMap((locale) => surfaces.flatMap((surface) => (
  viewportsFor(locale, surface).map((viewport) => ({ locale, surface, viewport }))
)));

function describeError(error) {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function classifyConsoleErrors(row, errors) {
  const unique = [...new Map(errors.map((error) => [`${error.text}\n${error.location.url}\n${error.location.lineNumber}\n${error.location.columnNumber}`, error])).values()];
  const expected = [];
  const unexpected = [];
  for (const error of unique) {
    let expectedMainDocument404 = false;
    let expectedErrorFixtureConsole = false;
    if (
      row.expectedStatus === 404
      && row.status === 404
      && row.finalUrl
      && error.text === EXPECTED_MAIN_DOCUMENT_404_CONSOLE
      && error.location.url
    ) {
      try {
        const finalUrl = new URL(row.finalUrl, baseUrl);
        const errorUrl = new URL(error.location.url, baseUrl);
        expectedMainDocument404 = errorUrl.origin === finalUrl.origin
          && errorUrl.pathname === finalUrl.pathname
          && errorUrl.search === finalUrl.search;
      } catch {
        expectedMainDocument404 = false;
      }
    }
    if (row.state === "LOCALIZED_ROUTE_ERROR" && row.expectedStatus === 500 && row.status === 500 && row.finalUrl) {
      try {
        const finalUrl = new URL(row.finalUrl, baseUrl);
        const errorUrl = new URL(error.location.url, baseUrl);
        const exactMainDocumentFailure = error.text === EXPECTED_MAIN_DOCUMENT_500_CONSOLE
          && errorUrl.origin === finalUrl.origin
          && errorUrl.pathname === finalUrl.pathname
          && errorUrl.search === finalUrl.search;
        const exactProductionRenderFailure = error.text === EXPECTED_PRODUCTION_SERVER_COMPONENT_ERROR
          && errorUrl.origin === finalUrl.origin
          && errorUrl.pathname.startsWith("/_next/static/chunks/");
        expectedErrorFixtureConsole = exactMainDocumentFailure || exactProductionRenderFailure;
      } catch {
        expectedErrorFixtureConsole = false;
      }
    }
    (expectedMainDocument404 || expectedErrorFixtureConsole ? expected : unexpected).push(error);
  }
  return {
    expected: expected.map(({ location, text }) => ({ message: text, url: location.url })),
    unexpected: unexpected.map(({ location, text }) => ({ message: text, url: location.url })),
  };
}

async function settlePage(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const image of document.images) image.loading = "eager";
    await Promise.allSettled(Array.from(document.images, (image) => image.decode()));
    await new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));
  });
}

async function prepareState(page, setup, viewport) {
  if (!setup) return null;
  if (setup === "LEARNING_SEARCH_EMPTY") {
    const search = page.locator("[data-learn-discovery-search] input[type='search']");
    if (await search.count() !== 1) return "Learning search input unavailable or ambiguous";
    const status = page.locator("[data-learn-results-status][role='status']");
    await status.waitFor({ state: "visible", timeout: 5_000 });
    await search.fill(LEARNING_EMPTY_QUERY);
    await page.waitForFunction((expectedQuery) => {
      const input = document.querySelector("[data-learn-discovery-search] input[type='search']");
      const resultStatus = document.querySelector("[data-learn-results-status][role='status']");
      const allGuides = document.querySelector("[data-learn-all-guides]");
      const guideSection = allGuides?.parentElement?.parentElement;
      const cards = guideSection ? Array.from(guideSection.querySelectorAll("a[data-learn-category]")) : [];
      const visibleCards = cards.filter((card) => {
        const style = getComputedStyle(card);
        const rect = card.getBoundingClientRect();
        return !card.hidden
          && style.display !== "none"
          && style.visibility !== "hidden"
          && rect.width > 0
          && rect.height > 0;
      });
      return input?.value === expectedQuery
        && Boolean(resultStatus?.textContent?.trim())
        && cards.length > 0
        && visibleCards.length === 0;
    }, LEARNING_EMPTY_QUERY, { timeout: 5_000 });
    return null;
  }
  if (setup === "CONTEXTUAL_COMPARISON") {
    const dialog = page.locator('dialog[data-runtime-renderer="contextual-comparison"][open]');
    await dialog.waitFor({ state: "visible", timeout: 10_000 });
    await page.waitForLoadState("networkidle", { timeout: 10_000 });
    await dialog.locator("h2").waitFor({ state: "visible", timeout: 5_000 });
    return null;
  }
  let trigger;
  if (setup === "MOBILE_NAVIGATION") {
    trigger = page.locator('button[aria-controls="public-mobile-navigation"]:visible').first();
  } else if (setup === "MARKET_SELECTOR") {
    trigger = page.locator('button[aria-controls="market-language-menu-desktop"]:visible').first();
  } else if (setup === "BONUS_FILTERS") {
    const id = viewport.width < 800 ? "bonus-filter-dialog" : "bonus-all-filters-dialog";
    trigger = page.locator(`button[aria-controls="${id}"]:visible`).first();
  } else if (setup === "CASINO_FILTERS") {
    const id = viewport.width < 800 ? "casino-filter-dialog" : "casino-all-filters-dialog";
    trigger = page.locator(`button[aria-controls="${id}"]:visible`).first();
  }
  if (!trigger || await trigger.count() !== 1) return `State trigger unavailable for ${setup}`;
  await trigger.click();
  const controlledId = await trigger.getAttribute("aria-controls");
  if (!controlledId) return `State trigger for ${setup} has no aria-controls`;
  const controlled = page.locator(`#${controlledId}`);
  await controlled.waitFor({ state: "visible", timeout: 5_000 });
  if (setup !== "MARKET_SELECTOR" && await controlled.evaluate((element) => element instanceof HTMLDialogElement && !element.open)) {
    return `Dialog ${controlledId} did not enter its open state`;
  }
  return null;
}

async function inspectPage(page, surface, locale, viewport) {
  return page.evaluate(({ allowlist, englishPatternSources, expectedChoices, expectedLearningQuery, localeCode, profileScope, surfaceName, textSelector, tolerance, viewportHeight, viewportWidth }) => {
    const round = (value) => Math.round(value * 10) / 10;
    const hiddenOverflow = new Set(["hidden", "clip"]);
    const horizontalClippingOverflow = new Set(["auto", "clip", "hidden", "scroll"]);
    const isAllowed = (element) => allowlist.some((selector) => element.matches(selector) || Boolean(element.closest(selector)));
    const visible = (element) => {
      if (typeof element.checkVisibility === "function" && !element.checkVisibility()) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number.parseFloat(style.opacity || "1") > 0.01
        && rect.width > 0
        && rect.height > 0;
    };
    const isAccessibilityOnly = (element) => {
      for (let current = element; current && current !== document.body && current !== document.documentElement; current = current.parentElement) {
        if (current.hidden || current.getAttribute("aria-hidden") === "true") return true;
        const style = getComputedStyle(current);
        const rect = current.getBoundingClientRect();
        const clipped = style.clip !== "auto" || (style.clipPath !== "none" && style.clipPath !== "");
        const onePixel = rect.width <= 1.5 && rect.height <= 1.5;
        if (onePixel && clipped && hiddenOverflow.has(style.overflowX) && hiddenOverflow.has(style.overflowY)) return true;
      }
      return false;
    };
    const describe = (element) => {
      const id = element.id ? `#${element.id}` : "";
      const classes = typeof element.className === "string"
        ? element.className.split(/\s+/).filter(Boolean).slice(0, 2).map((name) => `.${name}`).join("")
        : "";
      return `${element.tagName.toLowerCase()}${id}${classes}`;
    };
    const textBounds = (element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
      if (!rects.length) return null;
      return {
        bottom: Math.max(...rects.map((rect) => rect.bottom)),
        left: Math.min(...rects.map((rect) => rect.left)),
        right: Math.max(...rects.map((rect) => rect.right)),
        top: Math.min(...rects.map((rect) => rect.top)),
      };
    };
    const intersectionArea = (first, second) => Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left))
      * Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
    const textRects = (element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
    };
    const photoQuad = (element) => {
      const bounds = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const matrix = new DOMMatrixReadOnly(style.transform === "none" ? undefined : style.transform);
      const [originX = element.offsetWidth / 2, originY = element.offsetHeight / 2] = style.transformOrigin
        .split(/\s+/)
        .map((value) => Number.parseFloat(value));
      const transformed = [
        [0, 0],
        [element.offsetWidth, 0],
        [element.offsetWidth, element.offsetHeight],
        [0, element.offsetHeight],
      ].map(([x, y]) => ({
        x: matrix.a * (x - originX) + matrix.c * (y - originY) + matrix.e + originX,
        y: matrix.b * (x - originX) + matrix.d * (y - originY) + matrix.f + originY,
      }));
      const minimumX = Math.min(...transformed.map((point) => point.x));
      const minimumY = Math.min(...transformed.map((point) => point.y));
      return transformed.map((point) => ({
        x: bounds.left + point.x - minimumX,
        y: bounds.top + point.y - minimumY,
      }));
    };
    const clipPolygon = (polygon, inside, intersect) => polygon.flatMap((point, index) => {
      const previous = polygon[(index + polygon.length - 1) % polygon.length];
      const pointInside = inside(point);
      const previousInside = inside(previous);
      if (pointInside && previousInside) return [point];
      if (pointInside) return [intersect(previous, point), point];
      if (previousInside) return [intersect(previous, point)];
      return [];
    });
    const polygonRectIntersectionArea = (polygon, bounds) => {
      const vertical = (boundary) => (from, to) => {
        const ratio = (boundary - from.x) / (to.x - from.x);
        return { x: boundary, y: from.y + (to.y - from.y) * ratio };
      };
      const horizontal = (boundary) => (from, to) => {
        const ratio = (boundary - from.y) / (to.y - from.y);
        return { x: from.x + (to.x - from.x) * ratio, y: boundary };
      };
      let clipped = clipPolygon(polygon, (point) => point.x >= bounds.left, vertical(bounds.left));
      clipped = clipPolygon(clipped, (point) => point.x <= bounds.right, vertical(bounds.right));
      clipped = clipPolygon(clipped, (point) => point.y >= bounds.top, horizontal(bounds.top));
      clipped = clipPolygon(clipped, (point) => point.y <= bounds.bottom, horizontal(bounds.bottom));
      return clipped.length < 3 ? 0 : Math.abs(clipped.reduce((area, point, index) => {
        const next = clipped[(index + 1) % clipped.length];
        return area + point.x * next.y - next.x * point.y;
      }, 0)) / 2;
    };
    const elementBounds = (element, renderedText = false) => {
      const value = renderedText ? textBounds(element) : element.getBoundingClientRect();
      return value ? { bottom: value.bottom, left: value.left, right: value.right, top: value.top } : null;
    };
    const isFullyOffCanvasInHorizontalScroller = (element, bounds) => {
      for (let ancestor = element.parentElement; ancestor && ancestor !== document.body && ancestor !== document.documentElement; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        if (!["auto", "scroll"].includes(style.overflowX) || ancestor.scrollWidth <= ancestor.clientWidth + tolerance) continue;
        const clip = ancestor.getBoundingClientRect();
        const visibleLeft = Math.max(0, clip.left);
        const visibleRight = Math.min(document.documentElement.clientWidth, clip.right);
        if (visibleRight <= visibleLeft) continue;
        return bounds.right <= visibleLeft + tolerance || bounds.left >= visibleRight - tolerance;
      }
      return false;
    };
    const visibleText = document.body.innerText;
    const metadataText = [document.title, document.querySelector('meta[name="description"]')?.getAttribute("content") ?? ""].join("\n");
    const documentElement = document.documentElement;
    const documentWidth = documentElement.scrollWidth;
    const clientWidth = documentElement.clientWidth;
    const documentOverflowOffenders = documentWidth <= clientWidth + tolerance ? [] : Array.from(document.querySelectorAll("body *"))
      .filter((element) => visible(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element: describe(element),
          left: round(rect.left),
          right: round(rect.right),
          text: element.innerText?.replace(/\s+/g, " ").trim().slice(0, 100) ?? "",
          width: round(rect.width),
        };
      })
      .filter(({ left, right }) => left < -tolerance || right > clientWidth + tolerance)
      .slice(0, 12);

    const clipping = [];
    for (const element of document.querySelectorAll(textSelector)) {
      if (!visible(element) || isAllowed(element) || isAccessibilityOnly(element)) continue;
      const text = element.innerText.replace(/\s+/g, " ").trim();
      if (!text) continue;
      const style = getComputedStyle(element);
      const bounds = textBounds(element);
      if (!bounds || isFullyOffCanvasInHorizontalScroller(element, bounds)) continue;
      const elementRect = element.getBoundingClientRect();
      const layoutHorizontalDelta = element.clientWidth > 0 ? element.scrollWidth - element.clientWidth : 0;
      const layoutVerticalDelta = element.clientHeight > 0 ? element.scrollHeight - element.clientHeight : 0;
      const renderedHorizontalDelta = Math.max(elementRect.left - bounds.left, bounds.right - elementRect.right, 0);
      const renderedVerticalDelta = Math.max(elementRect.top - bounds.top, bounds.bottom - elementRect.bottom, 0);
      if (layoutHorizontalDelta > tolerance && renderedHorizontalDelta > tolerance && hiddenOverflow.has(style.overflowX)) {
        clipping.push({
          delta: round(renderedHorizontalDelta),
          element: describe(element),
          kind: "SELF_HORIZONTAL_OVERFLOW",
          text: text.slice(0, 140),
        });
      }
      if (layoutVerticalDelta > tolerance && renderedVerticalDelta > tolerance && hiddenOverflow.has(style.overflowY)) {
        clipping.push({
          delta: round(renderedVerticalDelta),
          element: describe(element),
          kind: "SELF_VERTICAL_CLIP",
          text: text.slice(0, 140),
        });
      }
      if (bounds.left < -tolerance || bounds.right > clientWidth + tolerance) {
        clipping.push({
          element: describe(element),
          kind: "TEXT_OUTSIDE_VIEWPORT",
          left: round(bounds.left),
          right: round(bounds.right),
          text: text.slice(0, 140),
        });
      }
      for (let ancestor = element.parentElement; ancestor && ancestor !== document.body && ancestor !== documentElement; ancestor = ancestor.parentElement) {
        if (isAllowed(ancestor)) break;
        const ancestorStyle = getComputedStyle(ancestor);
        const clipsX = horizontalClippingOverflow.has(ancestorStyle.overflowX);
        const clipsY = hiddenOverflow.has(ancestorStyle.overflowY);
        if (!clipsX && !clipsY) continue;
        const clip = ancestor.getBoundingClientRect();
        const escaped = (clipsX && (bounds.left < clip.left - tolerance || bounds.right > clip.right + tolerance))
          || (clipsY && (bounds.top < clip.top - tolerance || bounds.bottom > clip.bottom + tolerance));
        if (escaped) {
          clipping.push({
            clipper: describe(ancestor),
            element: describe(element),
            kind: "ANCESTOR_CLIP",
            text: text.slice(0, 140),
          });
          break;
        }
      }
      if (clipping.length >= 40) break;
    }

    const criticalOverlaps = [];
    const addElementPair = (label, first, second, textFirst = true, textSecond = true) => {
      if (!first || !second || !visible(first) || !visible(second)) return;
      const firstRect = elementBounds(first, textFirst);
      const secondRect = elementBounds(second, textSecond);
      if (!firstRect || !secondRect) return;
      const area = intersectionArea(firstRect, secondRect);
      if (area > 1) criticalOverlaps.push({ area: round(area), first: describe(first), label, second: describe(second) });
    };
    const addPair = (label, firstSelector, secondSelector, textFirst = true, textSecond = true) => {
      addElementPair(label, document.querySelector(firstSelector), document.querySelector(secondSelector), textFirst, textSecond);
    };

    const homeSurface = ["home", "mobile-navigation", "market-selector"].includes(surfaceName);
    const hero = homeSurface ? document.querySelector("[data-screen-label='Hero']") : null;
    const homeStage = hero?.firstElementChild ?? null;
    const homeTitle = hero?.querySelector("[data-home-hero-title]") ?? homeStage?.querySelector("h1") ?? null;
    const homeKicker = hero?.querySelector("[data-home-hero-kicker]")
      ?? homeTitle?.previousElementSibling?.children.item(1)
      ?? null;
    const homeBody = hero?.querySelector("[data-home-hero-copy]") ?? homeTitle?.nextElementSibling ?? null;
    const homeCta = hero?.querySelector("[data-home-hero-cta]") ?? homeStage?.querySelector('a[href*="/program"]') ?? null;
    const homeMetadata = hero?.querySelector("[data-home-hero-meta]") ?? homeStage?.nextElementSibling ?? null;
    const homeHeader = document.querySelector("[data-public-shell='header']");
    const headerContrast = !surfaceName.startsWith("error-") ? null : (() => {
      const brand = homeHeader?.querySelector("a");
      if (!homeHeader || !brand) return { problem: "MISSING_PUBLIC_HEADER_OR_BRAND" };
      const parseColor = (value) => {
        const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
        return channels.length >= 3
          ? { red: channels[0], green: channels[1], blue: channels[2], alpha: channels[3] ?? 1 }
          : null;
      };
      const luminance = ({ red, green, blue }) => {
        const channel = (value) => {
          const normalized = value / 255;
          return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
        };
        return .2126 * channel(red) + .7152 * channel(green) + .0722 * channel(blue);
      };
      const foreground = parseColor(getComputedStyle(brand).color);
      const background = parseColor(getComputedStyle(homeHeader).backgroundColor);
      if (!foreground || !background || background.alpha < .8) {
        return { background: getComputedStyle(homeHeader).backgroundColor, problem: "NO_OPAQUE_HEADER_CONTRAST_SURFACE" };
      }
      const lighter = Math.max(luminance(foreground), luminance(background));
      const darker = Math.min(luminance(foreground), luminance(background));
      const ratio = (lighter + .05) / (darker + .05);
      return ratio >= 3 ? null : { problem: "HEADER_CONTRAST_BELOW_3_TO_1", ratio: round(ratio) };
    })();

    addElementPair("home:kicker/headline", homeKicker, homeTitle);
    addElementPair("home:headline/body", homeTitle, homeBody);
    addElementPair("home:body/cta", homeBody, homeCta);
    addElementPair("home:cta/metadata", homeCta, homeMetadata, true, false);
    addElementPair("home:header/kicker", homeHeader, homeKicker, false, true);
    addElementPair("home:header/headline", homeHeader, homeTitle, false, true);
    addPair("article:breadcrumbs/title", "[data-learning-article] header nav", "[data-learning-article] header h1");
    addPair("article:title/summary", "[data-learning-article] header h1", "[data-learning-article] header [class*='heroSummary']", true, false);

    const publicError = document.querySelector("[data-public-commercial-error] [role='alert']");
    if (homeHeader && publicError) {
      for (const textElement of publicError.querySelectorAll("h1, h2, h3, p, a, button")) {
        addElementPair("error:header/content", homeHeader, textElement, false, true);
      }
    }

    if (hero && visible(hero)) {
      const heroRect = hero.getBoundingClientRect();
      if (homeMetadata && visible(homeMetadata) && homeMetadata.getBoundingClientRect().bottom > heroRect.bottom + tolerance) {
        criticalOverlaps.push({
          amount: round(homeMetadata.getBoundingClientRect().bottom - heroRect.bottom),
          first: describe(homeMetadata),
          label: "home:metadata/section-boundary",
          second: describe(hero),
        });
      }
      const textElements = [homeKicker, homeTitle, homeBody, homeCta]
        .filter((element) => element && visible(element));
      const photos = Array.from(hero.querySelectorAll("[data-tphoto]"))
        .filter((element) => visible(element));
      for (const photo of photos) {
        const quadrilateral = photoQuad(photo);
        for (const copy of textElements) {
          const area = Math.max(0, ...textRects(copy).map((copyRect) => polygonRectIntersectionArea(quadrilateral, copyRect)));
          if (area > 1) criticalOverlaps.push({ area: round(area), first: describe(photo), label: "home:photo/text", second: describe(copy) });
        }
      }
    }

    const actionGroups = document.querySelectorAll("[class*='stateActions'], [class*='emptyActions'], [class*='protectedActions'], [class*='featureActions'], [class*='compactActions']");
    for (const group of actionGroups) {
      const actions = Array.from(group.querySelectorAll("a, button, [role='button']")).filter((element) => visible(element));
      for (let firstIndex = 0; firstIndex < actions.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < actions.length; secondIndex += 1) {
          const first = actions[firstIndex];
          const second = actions[secondIndex];
          const firstRect = elementBounds(first);
          const secondRect = elementBounds(second);
          if (!firstRect || !secondRect) continue;
          const area = intersectionArea(firstRect, secondRect);
          if (area > 1) criticalOverlaps.push({ area: round(area), first: describe(first), label: "actions:controls", second: describe(second) });
        }
      }
    }

    for (const dialog of document.querySelectorAll("dialog[open]")) {
      const heading = dialog.querySelector("h1, h2, h3");
      const close = dialog.querySelector("button[aria-label]");
      if (!heading || !close || !visible(heading) || !visible(close)) continue;
      const headingRect = elementBounds(heading, true);
      const closeRect = elementBounds(close);
      if (!headingRect || !closeRect) continue;
      const area = intersectionArea(headingRect, closeRect);
      if (area > 1) criticalOverlaps.push({ area: round(area), first: describe(heading), label: "dialog:heading/close", second: describe(close) });
    }

    for (const label of document.querySelectorAll("dialog[open] label")) {
      const labelText = label.querySelector(":scope > span");
      const control = label.querySelector(":scope > input, :scope > select, :scope > button");
      if (!labelText || !control || isAccessibilityOnly(labelText)) continue;
      addElementPair("filters:label/control", labelText, control);
    }

    for (const row of document.querySelectorAll("main dl > div")) {
      const term = row.querySelector(":scope > dt");
      const value = row.querySelector(":scope > dd");
      if (!term || !value || isAccessibilityOnly(term) || isAccessibilityOnly(value)) continue;
      addElementPair("data-row:label/value", term, value);
    }

    const pathologicalText = [];
    for (const element of document.querySelectorAll("main dl dt, main dl dd")) {
      if (!visible(element) || isAllowed(element) || isAccessibilityOnly(element)) continue;
      const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
      if (text.length < 3) continue;
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      const fontSize = Number.parseFloat(style.fontSize || "16");
      if (text.length >= 8 && bounds.width < Math.max(36, fontSize * 2.5)) {
        pathologicalText.push({ element: describe(element), kind: "PATHOLOGICAL_TEXT_COLUMN", text: text.slice(0, 120), width: round(bounds.width) });
        if (pathologicalText.length >= 20) break;
        continue;
      }
      if (style.hyphens === "auto") continue;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      let fragmentedWord = null;
      while (node && !fragmentedWord) {
        for (const match of node.data.matchAll(/[\p{L}\p{N}][\p{L}\p{M}\p{N}\u2010\u2011-]{7,}/gu)) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const fragments = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
          if (fragments.length > 1 && Math.min(...fragments.map((rect) => rect.width)) < fontSize * 2.5) {
            fragmentedWord = match[0];
            break;
          }
        }
        node = walker.nextNode();
      }
      if (fragmentedWord) pathologicalText.push({ element: describe(element), kind: "MID_WORD_FRAGMENT", text: fragmentedWord.slice(0, 120), width: round(bounds.width) });
      if (pathologicalText.length >= 20) break;
    }

    const englishScopeSelectors = profileScope === "PROFILE_SYSTEM_UI"
      ? [
          "[data-casino-decision-bar] > div",
          "#overview > [class*='sectionHeading']",
          "#offer-evidence > [class*='sectionHeading']",
          "#verdict > div:first-child > p",
          "#verdict-heading",
          "#faq > [class*='sectionHeading']",
          "[class*='relatedLinks']",
        ]
      : ["main"];
    const englishScopeText = englishScopeSelectors
      .flatMap((selector) => Array.from(document.querySelectorAll(selector), (element) => element.innerText))
      .join("\n");
    const genericEnglish = localeCode === "en-GB" ? [] : englishPatternSources.flatMap((source) => (
      Array.from(englishScopeText.matchAll(new RegExp(source, "gi")), (match) => match[0])
    ));
    const brokenImages = Array.from(document.images)
      .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
      .map((image) => ({ alt: image.alt, src: image.currentSrc || image.src }))
      .slice(0, 12);
    const outboundCommercialLinks = Array.from(document.querySelectorAll("main a[href]"))
      .map((link) => link.getAttribute("href"))
      .filter((href) => {
        if (!href) return false;
        try {
          const pathname = new URL(href, window.location.href).pathname;
          return pathname.startsWith("/r/")
            || pathname.startsWith("/go/")
            || (pathname.startsWith("/outbound/") && pathname !== "/outbound/unavailable");
        } catch {
          return false;
        }
      });
    const selectorValues = surfaceName === "market-selector"
      ? Array.from(document.querySelectorAll('[role="menu"] button[name="choice"]'), (button) => button.value)
      : [];
    const learningSearchState = surfaceName === "learning-search-empty"
      ? (() => {
          const input = document.querySelector("[data-learn-discovery-search] input[type='search']");
          const status = document.querySelector("[data-learn-results-status][role='status']");
          const allGuides = document.querySelector("[data-learn-all-guides]");
          const guideSection = allGuides?.parentElement?.parentElement;
          const cards = guideSection ? Array.from(guideSection.querySelectorAll("a[data-learn-category]")) : [];
          return {
            cardCount: cards.length,
            queryCorrect: input?.value === expectedLearningQuery,
            statusPopulated: Boolean(status?.textContent?.trim()),
            visibleCardCount: cards.filter((card) => visible(card) && !card.hidden).length,
          };
        })()
      : null;
    const requiredStructure = surfaceName.startsWith("learning-article")
        ? ["[data-learning-article]", "[data-learning-article] header h1", "[data-learning-article] header [class*='heroSummary']"]
        : surfaceName === "learning-search-empty"
          ? ["[data-learn-discovery-search] input[type='search']", "[data-learn-all-guides]", "[data-learn-results-status][role='status']"]
        : surfaceName === "bonuses-empty"
          ? [
              "[data-public-empty-state='filtered'][data-result-count='0']",
              "[data-public-empty-state='filtered'][data-result-count='0'] [data-empty-reset]",
            ]
        : surfaceName === "casinos-empty"
          ? [
              "#casino-results[data-result-count='0'] [data-public-empty-state='filtered'][data-result-count='0']",
              "#casino-results[data-result-count='0'] [data-public-empty-state='filtered'][data-result-count='0'] [data-empty-reset]",
            ]
        : surfaceName === "casinos-pagination"
          ? [
              "#casino-results[data-result-count='10']",
              "#casino-results [data-directory-pagination][data-current-page='2'][data-page-count='2']",
              "#casino-results [data-directory-pagination] a",
            ]
        : surfaceName === "bonuses-pagination"
          ? [
              "[data-directory-pagination][data-current-page='2'][data-page-count='2']",
              "[data-directory-pagination] a",
              "[data-bonus-directory-card]",
            ]
        : surfaceName.startsWith("error-")
          ? [
              `[data-public-commercial-error='${surfaceName.replace(/^error-/, "")}'] [role='alert']`,
              `[data-public-commercial-error='${surfaceName.replace(/^error-/, "")}'] [data-public-error-actions] button`,
              `[data-public-commercial-error='${surfaceName.replace(/^error-/, "")}'] [data-public-error-actions] a`,
            ]
        : surfaceName === "compare"
          ? [
              "dialog[data-runtime-renderer='contextual-comparison'][open]",
              "dialog[data-runtime-renderer='contextual-comparison'][open] h2",
              "dialog[data-runtime-renderer='contextual-comparison'][open] button[aria-label]",
            ]
        : surfaceName === "missing-casino"
          ? ["main h1"]
          : ["bonus-filters", "casino-filters", "mobile-navigation"].includes(surfaceName)
            ? ["dialog[open]"]
            : surfaceName === "market-selector"
              ? ["[role='menu']", "[role='menuitemradio']"]
              : [];
    const criticalStructureMissing = surfaceName === "home"
      ? [
          ["[data-screen-label='Hero']", hero],
          ["Home hero kicker", homeKicker],
          ["Home hero title", homeTitle],
          ["Home hero copy", homeBody],
          ["Home hero CTA", homeCta],
          ["Home hero metadata", homeMetadata],
          ["[data-tphoto='a']", hero?.querySelector("[data-tphoto='a']")],
          ["[data-tphoto='b']", hero?.querySelector("[data-tphoto='b']")],
        ].filter(([, element]) => !element).map(([label]) => label)
      : requiredStructure.filter((selector) => !document.querySelector(selector));
    const fakeControlPattern = /^(?:Filter|Filtre|Filtro|Suodatin)\s*[1-5]$/i;
    const fakeControl = Array.from(document.querySelectorAll("button, input, select, textarea, [role='button'], [role='checkbox'], [role='radio'], [role='switch']"))
      .filter((control) => visible(control) && !isAccessibilityOnly(control))
      .some((control) => {
        const labels = [
          control.getAttribute("aria-label"),
          control.getAttribute("title"),
          control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement ? control.placeholder : null,
          control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement ? control.value : null,
          control instanceof HTMLSelectElement ? control.selectedOptions.item(0)?.textContent : control.innerText,
        ];
        return labels.some((label) => label && fakeControlPattern.test(label.replace(/\s+/g, " ").trim()));
      });

    return {
      bodyTextLength: visibleText.length,
      brokenImages,
      clipping,
      criticalStructureMissing,
      criticalOverlaps,
      documentHeight: documentElement.scrollHeight,
      documentOverflowOffenders,
      documentWidth,
      fakeControl,
      genericEnglish: [...new Set(genericEnglish)],
      headerContrast,
      lang: documentElement.lang,
      learningSearchState,
      outboundCommercialLinks,
      pathologicalText,
      rawPlaceholder: /\{\{?[a-z][a-z0-9_.-]*\}?\}/i.test(`${visibleText}\n${metadataText}`),
      robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
      selectorMembershipCorrect: surfaceName !== "market-selector" || JSON.stringify(selectorValues) === JSON.stringify(expectedChoices),
      selectorValues,
      viewport: { height: viewportHeight, width: viewportWidth },
      viewportWidth: clientWidth,
    };
  }, {
    allowlist: intentionalOverflowAllowlist,
    englishPatternSources: genericEnglishPatterns.map((pattern) => pattern.source),
    expectedChoices: expectedSelectorValues,
    expectedLearningQuery: LEARNING_EMPTY_QUERY,
    localeCode: locale.locale,
    profileScope: surface.genericEnglishScope ?? "MAIN",
    surfaceName: surface.name,
    textSelector: textCandidates,
    tolerance: 2,
    viewportHeight: viewport.height,
    viewportWidth: viewport.width,
  });
}

function findingsFor(row) {
  const findings = [];
  if (row.runtimeError) findings.push({ kind: "RUNTIME_ERROR", detail: row.runtimeError });
  if (row.status !== row.expectedStatus) findings.push({ kind: "STATUS", actual: row.status, expected: row.expectedStatus });
  if (row.lang !== row.locale) findings.push({ kind: "LANGUAGE", actual: row.lang, expected: row.locale });
  if (row.rawPlaceholder) findings.push({ kind: "RAW_PLACEHOLDER" });
  if (row.fakeControl) findings.push({ kind: "FAKE_CONTROL" });
  if (row.documentWidth > row.viewportWidth + 2) findings.push({ kind: "DOCUMENT_OVERFLOW", offenders: row.documentOverflowOffenders });
  if (row.clipping?.length) findings.push({ kind: "TEXT_CLIPPING", offenders: row.clipping });
  if (row.pathologicalText?.length) findings.push({ kind: "PATHOLOGICAL_TEXT_FRAGMENTATION", offenders: row.pathologicalText });
  if (row.criticalStructureMissing?.length) findings.push({ kind: "STRUCTURE_MISSING", selectors: row.criticalStructureMissing });
  if (row.criticalOverlaps?.length) findings.push({ kind: "CRITICAL_OVERLAP", offenders: row.criticalOverlaps });
  if (row.headerContrast) findings.push({ kind: "HEADER_CONTRAST", detail: row.headerContrast });
  if (row.genericEnglish?.length) findings.push({ kind: "GENERIC_ENGLISH_UI", matches: row.genericEnglish });
  if (row.brokenImages?.length) findings.push({ kind: "BROKEN_IMAGES", images: row.brokenImages });
  if (row.consoleErrors?.length) findings.push({ kind: "BROWSER_CONSOLE", messages: row.consoleErrors });
  if (row.pageErrors?.length) findings.push({ kind: "PAGE_ERROR", messages: row.pageErrors });
  if (row.setupError) findings.push({ kind: "STATE_SETUP", detail: row.setupError });
  if (row.surface === "learning-search-empty" && (
    !row.learningSearchState
    || row.learningSearchState.cardCount === 0
    || !row.learningSearchState.queryCorrect
    || !row.learningSearchState.statusPopulated
    || row.learningSearchState.visibleCardCount !== 0
  )) {
    findings.push({ kind: "LEARNING_FILTER_STATE", actual: row.learningSearchState ?? null });
  }
  if (row.finalUrl && (row.expectedFinalPath || row.expectedFinalHash || row.expectedSearchParams)) {
    const finalUrl = new URL(row.finalUrl, baseUrl);
    if (row.expectedFinalPath && finalUrl.pathname !== row.expectedFinalPath) {
      findings.push({ kind: "FINAL_PATH", actual: finalUrl.pathname, expected: row.expectedFinalPath });
    }
    if (row.expectedFinalHash && finalUrl.hash !== row.expectedFinalHash) {
      findings.push({ kind: "FINAL_HASH", actual: finalUrl.hash, expected: row.expectedFinalHash });
    }
    for (const [name, expectedValues] of Object.entries(row.expectedSearchParams ?? {})) {
      const actualValues = finalUrl.searchParams.getAll(name);
      if (JSON.stringify(actualValues) !== JSON.stringify(expectedValues)) {
        findings.push({ kind: "FINAL_SEARCH_PARAMS", name, actual: actualValues, expected: expectedValues });
      }
    }
  }
  if (!row.selectorMembershipCorrect) findings.push({ kind: "SELECTOR_MEMBERSHIP", actual: row.selectorValues, expected: expectedSelectorValues });
  if (row.locale !== "en-GB" && row.expectedStatus === 200 && !/noindex\s*,?\s*follow/i.test(row.robots)) {
    findings.push({ kind: "NON_GB_INDEXING", actual: row.robots, expected: "noindex, follow" });
  }
  if (row.market !== "GB" && row.outboundCommercialLinks?.length) {
    findings.push({ kind: "NON_GB_COMMERCIAL_ACTION", links: row.outboundCommercialLinks });
  }
  return findings;
}

async function inspectArchitectureOnly(browser) {
  const architectureLocales = locales.filter(({ quality }) => quality === ARCHITECTURE_ONLY);
  if (!architectureLocales.length) return [];
  const request = await browser.newContext();
  try {
    return await Promise.all(architectureLocales.flatMap((locale) => ["/", "/casinos"].map(async (suffix) => {
      const pathname = suffixPath(locale.prefix, suffix);
      try {
        const response = await request.request.get(`${baseUrl}${pathname}`, { maxRedirects: 0 });
        const body = await response.text();
        const contentLanguage = response.headers()["content-language"] ?? "";
        const localizedHtml = new RegExp(`<html[^>]+lang=["']${locale.locale.replace("-", "[-]")}["']`, "i").test(body);
        const localizedRenderer = /data-(?:handoff-page|runtime-renderer)=["'](?:home|casino-discovery|casinos)["']/i.test(body);
        const findings = [];
        if (response.status() !== 404) findings.push({ kind: "ARCHITECTURE_STATUS", actual: response.status(), expected: 404 });
        if (contentLanguage) findings.push({ kind: "ARCHITECTURE_CONTENT_LANGUAGE", actual: contentLanguage, expected: "absent" });
        if (localizedHtml || localizedRenderer) findings.push({ kind: "ARCHITECTURE_RUNTIME_EXPOSURE" });
        return {
          locale: locale.locale,
          market: locale.market,
          path: pathname,
          quality: locale.quality,
          status: response.status(),
          contentLanguage,
          localizedHtml,
          localizedRenderer,
          selectorStatus: "HIDDEN_BY_PUBLIC_SELECTOR_CONTRACT",
          indexingStatus: "PUBLICATION_HIDDEN",
          findings,
        };
      } catch (error) {
        return {
          locale: locale.locale,
          market: locale.market,
          path: pathname,
          quality: locale.quality,
          status: 0,
          findings: [{ kind: "RUNTIME_ERROR", detail: describeError(error) }],
        };
      }
    })));
  } finally {
    await request.close();
  }
}

function routeMatrixRows() {
  return surfaces.map((surface) => ({
    route: surface.suffix,
    surface: surface.name,
    localizationScope: surface.scope,
    dataDependency: surface.dataDependency,
    commercialDependency: surface.commercialDependency,
    state: surface.state,
    viewportPolicy: surface.viewportPolicy,
    expectedStatus: surface.expectedStatus ?? 200,
  }));
}

function groupCounts(rows, key) {
  return Object.fromEntries([...new Set(rows.map((row) => row[key]))].map((value) => [value, rows.filter((row) => row[key] === value).length]));
}

function failureLine(row) {
  return `- ${row.locale} ${row.surface} ${row.viewport.width}x${row.viewport.height} ${row.path}: ${JSON.stringify(row.findings)}`;
}

async function writeReport(rows, architectureRows, completed) {
  const failures = rows.filter((row) => row.findings.length);
  const architectureFailures = architectureRows.filter((row) => row.findings.length);
  const report = {
    generatedAt: new Date().toISOString(),
    completed,
    baseUrl,
    configuration: {
      fullPageScreenshots,
      writeScreenshots,
      localeFilter,
      surfaceFilter,
    },
    matrix: {
      founderHomeViewports: HOME_VIEWPORTS,
      publicCoreViewports: PUBLIC_CORE_VIEWPORTS,
      articleStressViewports: ARTICLE_STRESS_VIEWPORTS,
      draftSurfaceViewports: DRAFT_SURFACE_VIEWPORTS,
      plannedCaptures: capturePlan.length,
      completedCaptures: rows.length,
      captureCountsByLocale: groupCounts(rows, "locale"),
      captureCountsBySurface: groupCounts(rows, "surface"),
      routes: routeMatrixRows(),
      excludedRouteFamilies,
    },
    rows,
    architectureRows,
    failures,
    architectureFailures,
  };
  await writeFile(resolve(outputRoot, "metrics.json"), `${JSON.stringify(report, null, 2)}\n`);

  const routeTable = routeMatrixRows().map((route) => (
    `| ${route.surface} | \`${route.route}\` | ${route.localizationScope} | ${route.state} | ${route.viewportPolicy} |`
  )).join("\n");
  const exclusions = excludedRouteFamilies.map(({ family, reason }) => `- \`${family}\`: ${reason}`).join("\n");
  const failureLines = [
    ...failures.map(failureLine),
    ...architectureFailures.map((row) => `- ${row.locale} architecture ${row.path}: ${JSON.stringify(row.findings)}`),
  ];
  const readme = `# Localization visual review\n\n`
    + `- Runtime: ${baseUrl}\n`
    + `- Status: ${completed ? "COMPLETE" : "IN PROGRESS"}\n`
    + `- Planned captures: ${capturePlan.length}\n`
    + `- Completed captures: ${rows.length}\n`
    + `- Screenshot mode: ${writeScreenshots ? (fullPageScreenshots ? "full-page" : "viewport") : "disabled"}\n`
    + `- Founder Home viewports: ${HOME_VIEWPORTS.map(({ height, width }) => `${width}x${height}`).join(", ")}\n`
    + `- Public-core route viewports: ${PUBLIC_CORE_VIEWPORTS.map(({ height, width }) => `${width}x${height}`).join(", ")}\n`
    + `- Long-article stress viewports: ${ARTICLE_STRESS_VIEWPORTS.map(({ height, width }) => `${width}x${height}`).join(", ")}\n`
    + `- Draft authored-surface viewports: ${DRAFT_SURFACE_VIEWPORTS.map(({ height, width }) => `${width}x${height}`).join(", ")}\n`
    + `- Mobile-navigation viewports: ${MOBILE_NAVIGATION_VIEWPORTS.map(({ height, width }) => `${width}x${height}`).join(", ")}\n`
    + `- Rendered failures: ${failures.length}\n`
    + `- Architecture-only failures: ${architectureFailures.length}\n\n`
    + `## Route matrix\n\n`
    + `| Surface | Route/state | Localization scope | State | Viewport policy |\n`
    + `| --- | --- | --- | --- | --- |\n${routeTable}\n\n`
    + `## Deliberate exclusions\n\n${exclusions}\n\n`
    + `## Detector coverage\n\n`
    + `Each rendered capture checks response status, canonical redirect destination/query where applicable, document language, unresolved tokens, fake controls, non-GB noindex, non-GB commercial-action absence, generic-English UI leakage, broken visible images, page/console errors, document overflow, rendered text overflow, clipping by hidden/clip/scrolling ancestors, pathological definition-list columns, unhyphenated mid-word fragmentation, critical sibling/action/dialog intersections, Home photo/copy intersections and Home metadata/section containment. Paint visibility is verified before geometry so closed disclosure descendants are not treated as rendered. True one-pixel accessibility-only text and fully off-canvas children of horizontal scroll rails are excluded from rendered-text findings. A main-document 404 console message is classified as expected only when its exact URL and message match an expected 404 response; subresource and all other console errors remain failures. Selector-state captures verify the exact public selector membership, Learning search-state captures require a populated localized result status with every real guide hidden, comparison captures require the settled contextual dialog, and localized error captures execute the real route-segment boundaries through a local-only fail-closed fixture.\n\n`
    + `## Evidence boundary and limitations\n\n`
    + `- Canada is architecture-only and deliberately receives no localized screenshot. Direct CA Home and Casinos requests are instead asserted to remain 404 without Content-Language or a localized renderer.\n`
    + `- Local commercial visual data remains a data-only fixture and is available only when the reviewed server was started with \`B4GAMBLE_HANDOFF_VISUAL_FIXTURE=true\`; the sweep never fabricates records itself. Truthful fail-closed empty pages remain valid audit targets.\n`
    + `- Localized route errors are injected only when the reviewed local server enables the guarded error harness; the same real route-segment boundaries and responsive error UI are used by the application.\n`
    + `- Automated geometry can reject clipping and intersections, but it cannot judge crop quality, hierarchy, whitespace or awkward line breaks. The generated Chromium corpus must still receive the required model-assisted visual inspection before closure.\n\n`
    + `## Findings\n\n${failureLines.length ? failureLines.join("\n") : completed ? "All captures and architecture-only checks passed the automated contracts." : "No findings in the completed subset."}\n`;
  await writeFile(resolve(outputRoot, "README.md"), readme);
}

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const rows = [];
let architectureRows = [];
try {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.addInitScript(() => window.sessionStorage.clear());
  let currentConsoleErrors = [];
  let currentPageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      currentConsoleErrors.push({ location: message.location(), text: message.text() });
    }
  });
  page.on("pageerror", (error) => currentPageErrors.push(describeError(error)));

  try {
    for (const [index, item] of capturePlan.entries()) {
      const { locale, surface, viewport } = item;
      const path = suffixPath(locale.prefix, surface.suffix);
      const expectedStatus = surface.expectedStatus ?? 200;
      const screenshotRelative = `${locale.locale}/${surface.name}/${viewport.width}x${viewport.height}.jpg`;
      const row = {
        market: locale.market,
        locale: locale.locale,
        quality: locale.quality,
        surface: surface.name,
        state: surface.state,
        path,
        expectedStatus,
        expectedFinalHash: surface.expectedFinalHash ?? null,
        expectedFinalPath: surface.expectedFinalSuffix ? suffixPath(locale.prefix, surface.expectedFinalSuffix) : null,
        expectedSearchParams: surface.expectedSearchParams ?? null,
        viewport,
        screenshot: writeScreenshots ? screenshotRelative : null,
      };
      currentConsoleErrors = [];
      currentPageErrors = [];
      try {
        await page.setViewportSize(viewport);
        const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
        await settlePage(page);
        const setupError = await prepareState(page, surface.setup, viewport);
        await settlePage(page);
        const metrics = await inspectPage(page, surface, locale, viewport);
        Object.assign(row, metrics, {
          status: response?.status() ?? 0,
          finalUrl: page.url(),
          setupError,
          pageErrors: [...new Set(currentPageErrors)],
        });
        if (writeScreenshots) {
          const screenshotPath = resolve(outputRoot, screenshotRelative);
          await mkdir(dirname(screenshotPath), { recursive: true });
          await page.screenshot({
            animations: "disabled",
            fullPage: surface.setup ? false : fullPageScreenshots,
            path: screenshotPath,
            quality: 84,
            type: "jpeg",
          });
        }
      } catch (error) {
        Object.assign(row, {
          status: row.status ?? 0,
          lang: row.lang ?? "",
          documentWidth: row.documentWidth ?? 0,
          viewportWidth: row.viewportWidth ?? viewport.width,
          runtimeError: describeError(error),
          pageErrors: [...new Set(currentPageErrors)],
        });
      }
      const consoleErrors = classifyConsoleErrors(row, currentConsoleErrors);
      row.consoleErrors = consoleErrors.unexpected;
      row.expectedConsoleErrors = consoleErrors.expected;
      row.findings = findingsFor(row);
      rows.push(row);
      if ((index + 1) % 25 === 0 || index + 1 === capturePlan.length) {
        console.log(`Localization visual review ${index + 1}/${capturePlan.length}`);
        await writeReport(rows, architectureRows, false);
      }
    }
  } finally {
    await page.close();
    await context.close();
  }
  architectureRows = await inspectArchitectureOnly(browser);
} finally {
  await browser.close();
}

await writeReport(rows, architectureRows, true);
const failures = rows.filter((row) => row.findings.length);
const architectureFailures = architectureRows.filter((row) => row.findings.length);
if (failures.length || architectureFailures.length) {
  console.error(`Localization visual review failed: ${failures.length + architectureFailures.length} finding row(s). See ${resolve(outputRoot, "README.md")}`);
  process.exitCode = 1;
} else {
  console.log(`PASS ${rows.length} screenshots/captures and ${architectureRows.length} architecture-only checks; ${resolve(outputRoot, "README.md")}`);
}
