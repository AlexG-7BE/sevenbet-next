import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { trustMessages } from "../lib/i18n/static-pages/can-you-trust-b4gamble";
import { withoutQuittingMessages } from "../lib/i18n/static-pages/control-without-quitting";
import {
  BRAND_STATEMENT,
  CONTROL_LOCALES,
  CONTROL_PAGES_UPDATED,
  CONTROL_PATHS,
  controlHubLinkLabel,
  controlLocale,
  controlRelatedLinks,
  controlSharedMessages,
  gamblingControlHubMessages,
} from "../lib/i18n/static-pages/gambling-control";
import { controlToolsMessages } from "../lib/i18n/static-pages/gambling-control-tools";
import { currentProgrammeJourney } from "../lib/i18n/static-pages/ten-steps";
import { homeMetadata } from "../lib/i18n/home-catalog";
import { parsePublicMarketRoute, publicRoutePolicy } from "../lib/market/routing";
import { RESEARCH_ACCESS_COOKIE } from "../lib/research-access";
import { buildLlmsTxt, llmsLaunchMarkets } from "../lib/seo/llms";
import { controlPageSchema } from "../lib/seo/control-page-schema";
import { organizationSchema } from "../lib/seo/structured-data";
import { coreRoutes } from "../lib/site";

// Founder decision, 15 October 2026 (docs/07_Decisions/AEO-CONTROL-PAGES-2026-10-15.md).
const read = (path: string) => readFileSync(path, "utf8");
const PAGES = {
  [CONTROL_PATHS.hub]: "app/(public)/gambling-control/page.tsx",
  [CONTROL_PATHS.withoutQuitting]: "app/(public)/control-without-quitting/page.tsx",
  [CONTROL_PATHS.tools]: "app/(public)/gambling-control-tools/page.tsx",
  [CONTROL_PATHS.trust]: "app/(public)/can-you-trust-b4gamble/page.tsx",
} as const;

function copyFor(locale: (typeof CONTROL_LOCALES)[number]) {
  return {
    shared: controlSharedMessages(locale),
    hub: gamblingControlHubMessages(locale),
    withoutQuitting: withoutQuittingMessages(locale),
    tools: controlToolsMessages(locale),
    trust: trustMessages(locale),
  };
}

function strings(value: unknown, path: string, output: Array<[string, string]> = []) {
  if (typeof value === "string") output.push([path, value]);
  else if (Array.isArray(value)) value.forEach((entry, index) => strings(entry, `${path}[${index}]`, output));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => strings(entry, `${path}.${key}`, output));
  return output;
}

/** The words a reader sees: hrefs and paths are addresses, not copy. */
function visibleText(locale: (typeof CONTROL_LOCALES)[number]) {
  return strings(copyFor(locale), locale).filter(([path]) => !/\.(?:href|path)$/.test(path));
}

test("every answer page has complete Swedish, Danish and English copy, and other languages read the English page", () => {
  for (const locale of CONTROL_LOCALES) {
    const all = strings(copyFor(locale), locale);
    assert.ok(all.length > 150, `${locale}: ${all.length} strings`);
    for (const [path, value] of all) assert.ok(value.trim().length > 0, `${path} is empty`);
    const { hub, withoutQuitting, tools, trust } = copyFor(locale);
    for (const faq of [hub.faq, withoutQuitting.faq, tools.faq, trust.faq]) {
      assert.ok(faq.length >= 3 && faq.length <= 5, `${locale}: 3–5 FAQ entries`);
      for (const [question, answer] of faq) assert.ok(question.endsWith("?") && answer.length > 20, `${locale}: ${question}`);
    }
    assert.equal(hub.cards.length, 6, locale);
    assert.deepEqual(hub.cards.map((card) => card.path), [CONTROL_PATHS.withoutQuitting, CONTROL_PATHS.tools, CONTROL_PATHS.trust, "/pause-plan", "/10-steps", "/help"], locale);
  }
  assert.equal(controlLocale("de-DE"), "en-GB");
  assert.equal(controlLocale("fi-FI"), "en-GB");
  assert.equal(withoutQuittingMessages("de-DE"), withoutQuittingMessages("en-GB"));
  assert.equal(controlHubLinkLabel("de-DE"), null, "a German page gets no English link label");
  assert.equal(controlHubLinkLabel("sv-SE", "moreLink"), "Fler raka svar om kontroll över spelet");
});

test("the one phrase opens the hub, names B4GAMBLE in each first answer, and the questions are the ones people ask", () => {
  assert.equal(BRAND_STATEMENT["en-GB"], "B4GAMBLE (Before Gamble) is a free 10-step programme that helps adults keep online gambling under control without having to quit.");
  assert.equal(withoutQuittingMessages("en-GB").question, "How can I keep my gambling under control without quitting?");
  assert.equal(withoutQuittingMessages("sv-SE").question, "Hur får jag kontroll över mitt spelande utan att sluta?");
  assert.equal(withoutQuittingMessages("da-DK").question, "Hvordan får jeg styr på mit spil uden at stoppe?");
  for (const locale of CONTROL_LOCALES) {
    const { hub, withoutQuitting, tools, trust } = copyFor(locale);
    assert.ok(hub.answer.startsWith(BRAND_STATEMENT[locale]), `${locale}: the hub opens with the phrase`);
    for (const answer of [withoutQuitting.answer, tools.answer, trust.answer]) {
      assert.ok(answer.includes(BRAND_STATEMENT[locale]), `${locale}: the first answer names B4GAMBLE with the phrase`);
      const sentences = answer.split(/(?<=[.?!])\s+(?=[A-ZÅÄÖÆØ0-9])/).length;
      assert.ok(sentences >= 2 && sentences <= 4, `${locale}: ${sentences} sentences in the first answer`);
    }
    assert.equal(`${withoutQuitting.titleLead} ${withoutQuitting.titleEmphasis}`, withoutQuitting.question);
  }
  assert.match(withoutQuittingMessages("en-GB").control.line, /^You don't have to quit\. You have to be in control\.$/);
  assert.equal(withoutQuittingMessages("sv-SE").control.line, "Du behöver inte sluta. Du behöver ha kontrollen.");
  assert.equal(withoutQuittingMessages("da-DK").control.line, "Du behøver ikke stoppe. Du skal bevare kontrollen.");
});

test("no casino, bonus, /r/ or affiliate link, no 'best' claim, and no label of addiction for the reader", () => {
  const commercialPath = /\/(?:r|go|outbound)\/|\/casinos\b|\/casino\/|\/bonuses\b|\/best-offers\b|\/compare\b|\/bonus-guide\b|\/wagering-calculator\b/;
  for (const locale of CONTROL_LOCALES) {
    const all = strings(copyFor(locale), locale);
    for (const [path, value] of all) assert.doesNotMatch(value, commercialPath, `${path}: ${value}`);
    for (const [path, value] of visibleText(locale)) {
      assert.doesNotMatch(value, /(?<!\p{L})(?:best|bästa|bedste|ledande|førende|leading|number one)(?!\p{L})|#\s?1(?!\d)/iu, `${path}: no "best" claim`);
      assert.doesNotMatch(value.replaceAll("Center for Ludomani", ""), /addict|spelberoend|spelmissbruk|ludoman|spilafhængig/i, `${path}: no addiction label`);
      assert.doesNotMatch(value, /\b(?:cures?|bota[rs]?|helbred\w*|kur)\b/i, `${path}: B4GAMBLE cures nothing`);
    }
  }
  const sources = ["app/(public)/gambling-control/ControlPage.tsx", ...Object.values(PAGES)].map(read).join("\n");
  assert.doesNotMatch(sources, commercialPath);
  assert.doesNotMatch(sources, /@\/lib\/commercial|@\/lib\/public-offer|@\/lib\/services|@\/lib\/market-access|@\/lib\/public-casino|@\/lib\/db\/prisma|@prisma\/client|"use client"/);
  assert.doesNotMatch(sources, /document\.cookie|localStorage|sessionStorage|fetch\(/);
});

test("the four pages are localizable public routes in the sitemap, built like the pause plan", () => {
  for (const [route, file] of Object.entries(PAGES)) {
    assert.equal(publicRoutePolicy(route), "LOCALIZABLE_PUBLIC", route);
    assert.ok((coreRoutes as readonly string[]).includes(route), `${route} is in the sitemap`);
    for (const prefix of ["en", "sv", "da", "de"]) assert.equal(parsePublicMarketRoute(`/${prefix}${route}`).kind, "CANONICAL_LOCALE", `/${prefix}${route}`);
    const page = read(file);
    assert.match(page, new RegExp(`productMetadata\\(\\{ presentation, pathname: CONTROL_PATHS\\.`), file);
    assert.match(page, /productCanonicalPath\(presentation, CONTROL_PATHS\./, file);
    assert.match(page, /<JsonLd data=\{schema\} \/>/, file);
    assert.match(page, /\?entry=start`/, file);
    assert.match(page, /<ControlStart href=\{startHref\}/, file);
    assert.match(page, /lang=\{contentLocale === presentation\.locale \? undefined : "en"\}/, file);
  }
  assert.match(read("app/sitemap.ts"), /coreRoutes/);
  const parts = read("app/(public)/gambling-control/ControlPage.tsx");
  assert.match(parts, /data-clean-route-line>\{shared\.revenueLine\}/, "the revenue model is stated in the header");
  assert.match(parts, /<time dateTime=\{CONTROL_PAGES_UPDATED\}>\{shared\.updatedDate\}<\/time>/, "a visible update line");
  assert.equal(CONTROL_PAGES_UPDATED, "2026-10-15");
  assert.equal(controlSharedMessages("en-GB").updatedDate, "15 October 2026");
  assert.equal(controlSharedMessages("sv-SE").updatedDate, "15 oktober 2026");
  assert.equal(controlSharedMessages("da-DK").updatedDate, "15. oktober 2026");
  assert.deepEqual(controlRelatedLinks("en-GB", CONTROL_PATHS.tools).map((link) => link.href), [CONTROL_PATHS.hub, CONTROL_PATHS.withoutQuitting, CONTROL_PATHS.trust]);
});

test("each page carries WebPage, FAQPage and BreadcrumbList structured data with the FAQ it shows", () => {
  const faq = withoutQuittingMessages("sv-SE").faq;
  const schema = controlPageSchema({ name: "Q", description: "D", url: "https://b4gamble.com/sv/control-without-quitting", inLanguage: "sv-SE", faq, breadcrumbs: [{ name: "Hem", item: "https://b4gamble.com/sv" }, { name: "Q", item: "https://b4gamble.com/sv/control-without-quitting" }] });
  assert.deepEqual(schema.map((entry) => entry["@type"]), ["WebPage", "FAQPage", "BreadcrumbList"]);
  const [webPage, faqPage, breadcrumbs] = schema as unknown as [Record<string, unknown>, { mainEntity: Array<Record<string, unknown>> }, { itemListElement: Array<Record<string, unknown>> }];
  assert.equal(webPage.dateModified, "2026-10-15");
  assert.equal(webPage.isAccessibleForFree, true);
  assert.equal(faqPage.mainEntity.length, faq.length);
  for (const [index, entry] of faqPage.mainEntity.entries()) {
    assert.equal(entry["@type"], "Question");
    assert.equal(entry.name, faq[index][0]);
    assert.deepEqual(entry.acceptedAnswer, { "@type": "Answer", text: faq[index][1] });
  }
  assert.deepEqual(breadcrumbs.itemListElement.map((item) => item.position), [1, 2]);
  for (const file of Object.values(PAGES)) assert.match(read(file), /faq: messages\.faq,/, `${file}: the schema FAQ is the visible FAQ`);
});

test("the tools table compares every tool for its market, B4GAMBLE in its own row, each with its sources", () => {
  const expected = {
    "en-GB": ["gamstop", "gamban", "betblocker", "bank", "operator-limits", "helpline", "b4gamble"],
    "sv-SE": ["spelpaus", "gamban", "betblocker", "bank", "operator-limits", "helpline", "b4gamble"],
    "da-DK": ["rofus", "gamban", "betblocker", "bank", "operator-limits", "helpline", "treatment", "b4gamble"],
  } as const;
  const officialSource = { "en-GB": /gamstop\.co\.uk/, "sv-SE": /spelpaus\.se/, "da-DK": /rofus\.nu/ } as const;
  for (const locale of CONTROL_LOCALES) {
    const messages = controlToolsMessages(locale);
    assert.deepEqual(messages.rows.map((row) => row.id), expected[locale], locale);
    for (const row of messages.rows) for (const cell of [row.does, row.cost, row.notCovered, row.fits]) assert.ok(cell.length > 3, `${locale} ${row.id}`);
    const own = messages.rows.find((row) => row.id === "b4gamble")!;
    assert.match(own.cost, /^(?:Free|Gratis)\.$/, locale);
    assert.match(own.notCovered, /blocks nothing|blockerar ingenting|blokerer ingenting/, locale);
    assert.equal(own.fitsLink?.path, "/pause-plan", locale);
    assert.match(messages.sourcesHeading, /15/, `${locale}: the sources name the day they were checked`);
    assert.ok(messages.sources.some((source) => officialSource[locale].test(source.href)), locale);
    for (const source of messages.sources) assert.match(source.href, /^https:\/\//, source.href);
    assert.ok(messages.sources.some((source) => /gamban\.com/.test(source.href)) && messages.sources.some((source) => /betblocker\.org/.test(source.href)), locale);
  }
  // Facts read on 15 October 2026; changing one means reading the source again.
  const sv = JSON.stringify(controlToolsMessages("sv-SE"));
  assert.match(sv, /10 dagar \(sedan 29 juni 2026\)/);
  assert.match(sv, /Knappt 138 000 personer var avstängda via Spelpaus\.se vid utgången av juni 2026/);
  assert.match(sv, /020-81 91 00/);
  assert.match(sv, /höjning gäller tidigast efter 72 timmar/);
  const da = JSON.stringify(controlToolsMessages("da-DK"));
  assert.match(da, /68\.026 danskere/);
  assert.match(da, /70 22 28 25/);
  assert.match(da, /70 11 18 10/);
  assert.match(da, /tidligst i kraft efter 24 timer/);
  const en = JSON.stringify(controlToolsMessages("en-GB"));
  assert.match(en, /0808 8020 133/);
  assert.match(en, /£4\.99 a month or £29\.99 a year/);
  for (const locale of ["sv-SE", "da-DK"] as const) {
    const messages = controlToolsMessages(locale);
    // Neither Nordic helpline is open around the clock; the FAQ says so when asked.
    assert.doesNotMatch(JSON.stringify(messages.rows), /dygnet runt|hele døgnet/, locale);
    for (const [question, answer] of messages.faq) if (/dygnet runt|hele døgnet/.test(question)) assert.match(answer, /^Nej\./, question);
  }
  const page = read(PAGES[CONTROL_PATHS.tools]);
  assert.match(page, /<table className=\{styles\.table\} data-control-tools-table>/);
  assert.match(page, /<th scope="row">/);
  assert.match(page, /data-label=\{columns\.does\}/);
});

test("the control page lists the Programme's real steps, and the trust page states what the code does", () => {
  const page = read(PAGES[CONTROL_PATHS.withoutQuitting]);
  assert.match(page, /const steps = currentProgrammeJourney\(contentLocale\);/, "the steps come from the catalogue");
  for (const locale of CONTROL_LOCALES) assert.equal(currentProgrammeJourney(locale).length, 10);
  assert.equal(currentProgrammeJourney("en-GB")[2].title, "Research responsibly");

  for (const locale of CONTROL_LOCALES) {
    const text = JSON.stringify(trustMessages(locale));
    assert.ok(text.includes(RESEARCH_ACCESS_COOKIE), `${locale}: names the one cookie step 3 sets`);
    assert.ok(text.includes(currentProgrammeJourney(locale)[2].title), `${locale}: names step 3 by its catalogue title`);
    assert.match(text, /privacy@7be\.io/);
  }
  const research = read("lib/research-access.ts");
  assert.match(research, /RESEARCH_ACCESS_OPEN = "open"/, "the cookie holds the word the page quotes");
  for (const root of ["/best-offers", "/casinos", "/bonuses"]) assert.ok(research.includes(`"${root}"`), `${root} is a public research page`);
  const mission = read("components/programme/ProgramAiMissionExperience.tsx");
  assert.match(mission, /mission\.missionNumber === 10 \? <CommercialNext/, "the last screen of step 10 links to the research pages");
  assert.match(read("lib/analytics/excluded-paths.ts"), /help\|self-check\|admin/, "Google Analytics never runs on Help");
  assert.match(read("lib/analytics/google-analytics.ts"), /allow_google_signals:false,allow_ad_personalization_signals:false/);
});

test("llms.txt opens with the phrase and the Organization carries it", () => {
  const body = buildLlmsTxt({ markets: llmsLaunchMarkets().map((market) => ({ market, productPages: [], reviews: [] })), articles: [] });
  const firstParagraph = body.split("\n\n")[1];
  assert.ok(firstParagraph.startsWith(`> ${BRAND_STATEMENT["en-GB"]} `), firstParagraph);
  assert.match(body, /\n## Gambling control answers\n/);
  for (const route of Object.keys(PAGES)) {
    for (const prefix of ["en", "sv", "da"]) assert.ok(body.includes(`/${prefix}${route})`), `${prefix}${route} in llms.txt`);
  }
  assert.equal(organizationSchema().description, BRAND_STATEMENT["en-GB"]);
});

test("the home description leads with the phrase's meaning and stays metadata only", () => {
  assert.equal(homeMetadata("en-GB").description, "A free 10-step programme that helps adults keep online gambling under control without having to quit, and a transparent comparison of licensed casinos.");
  assert.match(homeMetadata("sv-SE").description, /^Ett gratis program i 10 steg som hjälper vuxna att hålla sitt spelande på nätet under kontroll utan att behöva sluta/);
  assert.match(homeMetadata("da-DK").description, /^Et gratis program i 10 trin, der hjælper voksne med at holde styr på deres pengespil på nettet uden at skulle stoppe/);
  for (const locale of ["de-DE", "it-IT", "es-ES", "es-PE", "pt-PT", "el-GR", "nl-NL", "fi-FI", "nb-NO"] as const) {
    assert.match(homeMetadata(locale).description, /10/, `${locale} names the ten steps`);
  }
  const home = read("app/(public)/page.tsx");
  assert.equal(home.match(/homeMetadata\(/g)?.length, 1, "only generateMetadata reads it");
  assert.doesNotMatch(read("lib/final-handoff/transforms.ts"), /homeMetadata/);
});

test("10 Steps, the pause plan and Responsible Gambling link to the hub; Help and the footer do not change", () => {
  const tenSteps = read("app/(public)/10-steps/page.tsx");
  assert.match(tenSteps, /productHref\(presentation, CONTROL_PATHS\.hub\)/);
  assert.match(read("app/(public)/10-steps/TenStepsPage.tsx"), /\{control \? <Link className=\{styles\.controlLink\} data-ten-steps-control-link href=\{control\.href\}/);
  assert.doesNotMatch(read("app/start/page.tsx"), /control=/, "the help-ad landing passes no hub link");
  assert.match(read("app/(public)/pause-plan/page.tsx"), /data-pause-plan-control-link href=\{productHref\(presentation, CONTROL_PATHS\.hub\)\}/);
  assert.match(read("lib/final-handoff/transforms.ts"), /data-rg-control-link="" href="\/gambling-control"/);
  const safety = read("components/market-safety/FirstWaveSafetyPage.tsx");
  assert.match(safety, /variant === "responsible" \? controlHubLinkLabel\(presentation\.locale, "moreLink"\) : null/);
  for (const untouched of ["app/help/page.tsx", "components/public-shell/PublicFooter.tsx"]) {
    assert.doesNotMatch(read(untouched), /gambling-control|CONTROL_PATHS/, untouched);
  }
});
