import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  NAPP_REGISTER_URLS,
  UZ_LICENSED_OPERATORS_PATH,
  UZ_LICENSEES,
  UZ_REGISTER_READ_ON,
  formatRegisterDate,
  uzLicensedOperatorsLocale,
  uzLicensedOperatorsMessages,
} from "../lib/i18n/static-pages/uzbekistan-licensed-operators";
import { existingLanguageAlternates, productMetadata } from "../lib/market/product-context";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import { DEFAULT_MARKET_PROFILE, INITIAL_EUROPEAN_MARKET_PROFILES, marketIndexingApproved, marketProfileByCountry } from "../lib/market/registry";
import {
  isLocalizedPublicDestination,
  neutralRouteDestination,
  parsePublicMarketRoute,
  publicRoutePolicy,
} from "../lib/market/routing";
import { buildLlmsTxt, llmsLaunchMarkets } from "../lib/seo/llms";
import { coreRoutes } from "../lib/site";
import { coreRoutesForSite } from "../lib/site/core-routes";
import { classifySitePath, helpHostServes } from "../lib/site/host-routes";

const PATH = UZ_LICENSED_OPERATORS_PATH;
const PAGE = "app/(public)/uzbekistan-licensed-operators/page.tsx";
const read = (path: string) => readFileSync(path, "utf8");

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

function market(code: "GB" | "UZ" | "DE" | "SE" | "DK") {
  const profile = marketProfileByCountry(code);
  assert.ok(profile, code);
  return profile;
}

test("the register as read on 20 October 2026: two companies, four licences, one .uz domain each", () => {
  assert.equal(UZ_REGISTER_READ_ON, "2026-10-20");
  assert.deepEqual(UZ_LICENSEES.map((licensee) => [licensee.name, licensee.tin, licensee.domain]), [
    ["Olimpbet", "308547784", "www.olimpbet.uz"],
    ["Aurum Vale", "312278399", "www.oltinbet.uz"],
  ]);
  assert.deepEqual(UZ_LICENSEES.flatMap((licensee) => licensee.licences.map((licence) => [licence.index, licence.kind, licence.issuedOn, licence.validTo, licence.order])), [
    ["ITO # 001", "ONLINE_GAMES", "2026-07-31", "2031-07-30", "62"],
    ["BF # 001", "BOOKMAKING", "2026-07-31", "2031-07-30", "63"],
    ["ITO # 002", "ONLINE_GAMES", "2026-07-31", "2031-07-30", "64"],
    ["BF # 002", "BOOKMAKING", "2026-07-31", "2031-07-30", "65"],
  ]);
  assert.equal(formatRegisterDate("2031-07-30", "uz-UZ"), "30.07.2031");
  assert.equal(formatRegisterDate("2026-07-31", "en-GB"), "31 July 2026");
});

test("the Uzbek page states the register, the as-of date, the checks and the way to Help", () => {
  const uz = uzLicensedOperatorsMessages("uz-UZ");
  assert.equal(uzLicensedOperatorsLocale("uz-UZ"), "uz-UZ");
  const text = strings(uz).join("\n");
  for (const fact of [
    "“Olimpbet” MChJ",
    "“Aurum Vale” MChJ",
    "www.olimpbet.uz",
    "www.oltinbet.uz",
    "2026-yil 20-oktabr",
    "PF-68",
    "3638-son",
    "3639-son",
    "6 oydan 5 yilgacha",
    "10 foizidan",
    "4 foiz",
    "18 yosh",
    "APK",
    "dasturchi",
    "«Zerkalo»",
    "1xBet",
  ]) assert.ok(text.includes(fact), `the Uzbek page says ${fact}`);
  assert.equal(uz.sources.items[0].href, NAPP_REGISTER_URLS["uz-UZ"]);
  assert.ok(uz.site.steps.length >= 4);
  assert.ok(uz.app.steps.length >= 3);
  assert.equal(uz.faq.length, 4);
  const page = read(PAGE);
  assert.match(page, /productHref\(presentation, "\/help"\)/, "the page points to Help");
  assert.match(page, /productHref\(presentation, "\/responsible-gambling"\)/);
  assert.match(page, /dateTime=\{UZ_REGISTER_READ_ON\}/, "the as-of date is on the page");
  // Every other language gets the English text; only English and Uzbek exist.
  assert.equal(uzLicensedOperatorsLocale("de-DE"), "en-GB");
  assert.equal(uzLicensedOperatorsMessages("sv-SE"), uzLicensedOperatorsMessages("en-GB"));
});

test("Uzbek is written in the official Latin alphabet: U+02BB for oʻ and gʻ, U+02BC for the tutuq belgisi", () => {
  for (const value of strings(uzLicensedOperatorsMessages("uz-UZ"))) {
    assert.doesNotMatch(value, /['‘’`´]/, `no ASCII or typographic apostrophe: ${value.slice(0, 60)}`);
    assert.doesNotMatch(value, /[Ѐ-ӿ]/, `no Cyrillic: ${value.slice(0, 60)}`);
  }
  const text = strings(uzLicensedOperatorsMessages("uz-UZ")).join(" ");
  assert.ok(text.includes("oʻ") && text.includes("gʻ") && text.includes("maʼlumot"));
});

test("a neutral reference page: no offer, no ranking, no operator link, outbound links only to NAPP and lex.uz", () => {
  const page = read(PAGE);
  assert.doesNotMatch(page, /\/best-offers|\/casinos|\/bonuses|\/r\/|\/go\/|\/outbound/, "no commercial route");
  assert.doesNotMatch(page, /@\/lib\/commercial|@\/lib\/public-offer|@\/lib\/services|@\/lib\/market-access|@\/lib\/public-casino|@\/lib\/db\/prisma/, "no commercial import");
  assert.match(page, /data-clean-route-line/, "the page states the revenue model");
  for (const locale of ["uz-UZ", "en-GB"] as const) {
    const messages = uzLicensedOperatorsMessages(locale);
    const all = strings(messages);
    const hrefs = [...strings(messages.sources.items.map((item) => item.href))];
    for (const href of hrefs) {
      const host = new URL(href).hostname;
      assert.ok(host === "lex.uz" || (host === "napp.uz" && /^\/(?:oz|en)\/pages\/rbglr$/.test(new URL(href).pathname)), `${locale}: ${href} is the register or lex.uz`);
    }
    for (const value of all) {
      assert.doesNotMatch(value, /https?:\/\/(?:www\.)?(?:olimpbet|oltinbet)/i, `${locale}: an operator domain is never a link`);
      assert.doesNotMatch(value, /bonus|promo ?kod|promo ?code|free ?spin|eng yaxshi|reyting|ranking|best (?:casino|bookmaker|odds)|play now|hoziroq|bet now|yuklab oling/i, `${locale}: nothing persuasive: ${value.slice(0, 60)}`);
    }
  }
  // The operator domains are rendered as table text, not as anchors.
  assert.doesNotMatch(page, /href=\{licensee\.domain\}|href=\{`https?:\/\/\$\{licensee/);
});

test("the route exists in English and Uzbek only, on the main site only", () => {
  assert.equal(publicRoutePolicy(PATH), "MARKET_SCOPED_PUBLIC");
  assert.equal(isLocalizedPublicDestination(PATH, market("UZ")), true);
  assert.equal(isLocalizedPublicDestination(PATH, market("GB")), true);
  for (const code of ["DE", "SE", "DK"] as const) assert.equal(isLocalizedPublicDestination(PATH, market(code)), false, code);

  const uzRoute = parsePublicMarketRoute(`/uz${PATH}`);
  assert.equal(uzRoute.kind, "CANONICAL_LOCALE");
  assert.equal(uzRoute.kind === "CANONICAL_LOCALE" && uzRoute.locale, "uz-UZ");
  assert.equal(parsePublicMarketRoute(`/en${PATH}`).kind, "CANONICAL_LOCALE");
  assert.equal(parsePublicMarketRoute(`/de${PATH}`).kind, "INVALID");
  assert.equal(neutralRouteDestination(PATH, "uz-UZ"), `/uz${PATH}`);
  assert.equal(neutralRouteDestination(PATH, "de-DE"), `/en${PATH}`, "another language reads the English page");

  assert.equal(classifySitePath(PATH), "COMMERCIAL");
  assert.equal(helpHostServes(PATH), false);
  assert.equal(helpHostServes(`/uz${PATH}`), false);
});

test("indexable in Uzbek, in the sitemap and hreflang for English and Uzbek only, and in llms.txt", () => {
  assert.ok((coreRoutes as readonly string[]).includes(PATH));
  assert.ok(coreRoutesForSite("main", false).includes(PATH));
  assert.ok(coreRoutesForSite("main", true).includes(PATH));
  assert.equal(coreRoutesForSite("help", true).includes(PATH), false);
  // The sitemap lists a core route in each indexable language market where the route is
  // localizable (app/sitemap.ts; importing it here would load the database client).
  const sitemap = read("app/sitemap.ts");
  assert.match(sitemap, /countryCode !== DEFAULT_MARKET_PROFILE\.countryCode && marketIndexingApproved\(market\)/);
  assert.match(sitemap, /\.filter\(\(pathname\) => isLocalizedPublicDestination\(pathname, market\)\)/);
  const localized = INITIAL_EUROPEAN_MARKET_PROFILES
    .filter((profile) => profile.countryCode !== DEFAULT_MARKET_PROFILE.countryCode && marketIndexingApproved(profile))
    .filter((profile) => isLocalizedPublicDestination(PATH, profile))
    .map((profile) => profile.countryCode);
  assert.deepEqual(localized, ["UZ"]);

  const alternates = existingLanguageAlternates(PATH);
  assert.deepEqual(Object.keys(alternates).sort(), ["en", "uz", "x-default"]);
  assert.equal(new URL(alternates.uz).pathname, `/uz${PATH}`);
  assert.equal(new URL(alternates["x-default"]).pathname, `/en${PATH}`);

  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    const presentation = resolvePresentationContext({ routeLanguage: "uz", trustedCountryCode: "UZ" });
    const messages = uzLicensedOperatorsMessages(presentation.locale);
    const metadata = productMetadata({ presentation, pathname: PATH, title: messages.metadataTitle, description: messages.metadataDescription, languageAlternates: alternates });
    assert.equal(metadata.robots, undefined, "the Uzbek page is indexable");
    assert.equal(new URL(String(metadata.alternates?.canonical)).pathname, `/uz${PATH}`);
    assert.deepEqual(Object.keys(metadata.alternates?.languages ?? {}).sort(), ["en", "uz", "x-default"]);
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
  assert.doesNotMatch(read(PAGE), /index:\s*false/);

  const llms = buildLlmsTxt({ markets: llmsLaunchMarkets().map((entry) => ({ market: entry, productPages: [], reviews: [] })), articles: [] });
  assert.match(llms, new RegExp(`/en${PATH}\\)`));
  assert.match(llms, new RegExp(`\\[Oʻzbekcha\\]\\([^)]*/uz${PATH}\\)`));
});
