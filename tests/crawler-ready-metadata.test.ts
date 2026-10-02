import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";

import robots from "../app/robots";
import { indexableMarketProductPaths, indexableReviewCards } from "../app/sitemap";
import { articleLanguageAlternates } from "../lib/articles/article-seo";
import type { PublicArticle } from "../lib/articles/article-types";
import { retiredArticleSuccessor } from "../lib/articles/retired-articles";
import { casinoProfileSchemas, casinoReviewMetadataCopy, trimAtWordBoundary } from "../lib/casino-profile/seo";
import generatedPages from "../lib/final-handoff/generated-pages.json";
import { transformLearnHandoff } from "../lib/final-handoff/transforms";
import { germanProhibitedTerms } from "../lib/i18n/german-terminology";
import { learningMessages } from "../lib/i18n/learning-center";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { productMetadata } from "../lib/market/product-context";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import { marketProfileByCountry, type MarketProfile } from "../lib/market/registry";
import type { PublicCasinoDTO } from "../lib/public-casino/public-casino.types";
import type { PublicOfferDTO, PublicOfferSearchResult } from "../lib/public-offer/public-offer.types";
import { CRAWLER_USER_AGENT_PATTERN } from "../lib/seo/crawler";
import {
  announceChangedUrls,
  casinoReviewUrls,
  indexNowEnabled,
  indexNowPayload,
  INDEXNOW_KEY,
  learnArticleUrls,
  submitIndexNow,
} from "../lib/seo/indexnow";
import { buildLlmsFullTxt, buildLlmsTxt, llmsLaunchMarkets } from "../lib/seo/llms";
import { loadLlmsFullMarket, type LlmsFullDependencies } from "../lib/seo/llms-full";
import { bonusDirectoryIndexable } from "../lib/seo/product-indexing";
import { programmeSearchMetadata } from "../lib/seo/programme-metadata";
import { DEFAULT_OPEN_GRAPH_IMAGES } from "../lib/seo/social-image";
import { modifiedNotBeforePublished, organizationSchema, ORGANIZATION_LOGO_PATH, websiteSchema } from "../lib/seo/structured-data";
import { absoluteUrl, siteUrl } from "../lib/site";

const read = (path: string) => readFileSync(path, "utf8");

function market(code: "GB" | "SE" | "DK" | "DE"): MarketProfile {
  const profile = marketProfileByCountry(code);
  assert.ok(profile);
  return profile;
}

const crawlerAndAgentUserAgents = [
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; MistralAI-User/1.0; +https://docs.mistral.ai/robots)",
  "GoogleOther",
  "Google-NotebookLM",
  "ModelContextProtocol/1.0 (Autonomous; +https://github.com/modelcontextprotocol/servers)",
  "python-requests/2.32.3",
  "curl/8.7.1",
  "node",
  "Go-http-client/2.0",
  "axios/1.7.7",
];

const browserUserAgents = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0",
];

// URL-based imports keep TypeScript from asking for declarations of the .mjs modules.
async function importMjs<T>(relativePath: string) {
  return await import(new URL(relativePath, import.meta.url).href) as T;
}

test("metadata is blocking (in <head>) for Next's own list, every crawler and AI agents", async () => {
  const nextConfig = (await importMjs<{ default: { htmlLimitedBots?: RegExp } }>("../next.config.mjs")).default;
  const htmlLimitedBots = nextConfig.htmlLimitedBots;
  assert.ok(htmlLimitedBots instanceof RegExp);
  assert.ok(htmlLimitedBots.flags.includes("i"));
  assert.ok(htmlLimitedBots.source.startsWith(HTML_LIMITED_BOT_UA_RE.source), "starts with Next's default list, verbatim");
  assert.ok(htmlLimitedBots.source.includes(`|${CRAWLER_USER_AGENT_PATTERN}|`), "mirrors lib/seo/crawler.ts");
  // Next serialises the RegExp to its source and rebuilds it with the i flag.
  const served = new RegExp(htmlLimitedBots.source, "i");
  for (const userAgent of crawlerAndAgentUserAgents) assert.ok(served.test(userAgent), userAgent);
  for (const userAgent of browserUserAgents) assert.equal(served.test(userAgent), false, userAgent);
});

test("robots.txt closes click redirects to every agent, keeps /api/ open and has no Host line", () => {
  const rules = robots();
  assert.equal("host" in rules, false);
  assert.equal(rules.sitemap, absoluteUrl("/sitemap.xml"));
  const groups = Array.isArray(rules.rules) ? rules.rules : [rules.rules];
  assert.equal(groups.length, 2);
  for (const group of groups) {
    assert.equal(group.allow, "/");
    assert.deepEqual(group.disallow, ["/r/", "/go/", "/outbound/"]);
    assert.ok(!([] as string[]).concat(group.disallow ?? []).some((path) => path.startsWith("/api")));
  }
  assert.ok((groups[1].userAgent as string[]).includes("GPTBot"));
  assert.ok((groups[1].userAgent as string[]).includes("ClaudeBot"));
});

test("one sitewide Organization and WebSite with a stable URL and a real logo", () => {
  const organization = organizationSchema();
  assert.equal(organization["@type"], "Organization");
  assert.equal(organization.url, siteUrl);
  assert.equal(organization.logo.url, absoluteUrl(ORGANIZATION_LOGO_PATH));
  assert.ok(existsSync(`public${ORGANIZATION_LOGO_PATH}`));
  // The brand's own profiles are tied to the site; every entry is an https profile URL.
  assert.equal(organization.legalName, "7BE Inc.");
  assert.ok(organization.sameAs.length >= 5);
  for (const profile of organization.sameAs) assert.match(profile, /^https:\/\/(?:www\.)?(?:facebook|x|instagram|threads|youtube|tiktok|pinterest|medium|producthunt|crunchbase|trustpilot)\.com\//, profile);
  assert.equal(new Set(organization.sameAs).size, organization.sameAs.length);
  const website = websiteSchema();
  assert.equal(website["@type"], "WebSite");
  assert.equal(website.name, "B4GAMBLE");
  assert.equal(website.url, siteUrl);
  assert.deepEqual(website.publisher, { "@id": organization["@id"] });
  // The Learn hub no longer emits a second, language-specific Organization.
  assert.doesNotMatch(read("app/(public)/learn/page.tsx"), /"@type": "Organization"/);
  assert.ok(existsSync("app/favicon.ico"));
  assert.ok(existsSync("app/opengraph-image.tsx"));
});

test("dateModified is never earlier than datePublished", () => {
  assert.equal(modifiedNotBeforePublished("2026-09-25T00:00:00.000Z", "2026-09-03T00:00:00.000Z"), "2026-09-25T00:00:00.000Z");
  assert.equal(modifiedNotBeforePublished("2026-09-03T00:00:00.000Z", "2026-09-25T10:00:00.000Z"), "2026-09-25T10:00:00.000Z");
  assert.equal(modifiedNotBeforePublished(null, null), null);
});

function reviewCasino(patch: Partial<PublicCasinoDTO> = {}): PublicCasinoDTO {
  return {
    source: "cms",
    id: "casino-id",
    slug: "betsson",
    name: "Betsson",
    title: "Betsson",
    summary: "A long English summary that must never reach a Swedish, Danish or German meta description.",
    reviewContent: "Published editorial review.",
    editorScore: 8.8,
    publishedAt: "2026-09-25T07:00:00.000Z",
    lastReviewedAt: "2026-09-03T00:00:00.000Z",
    dataClassification: "PUBLISHED_RECORD",
    seo: {
      title: "Betsson Review & Editor Score | B4GAMBLE",
      description: "Betsson review, 8.8 Editor Score, evidence limits and market-safe availability context.",
      canonical: "https://b4gamble.com/casino/betsson",
      robots: "index,follow",
      socialTitle: "Betsson Review | B4GAMBLE",
      socialDescription: "Social",
      socialImage: null,
      structuredData: null,
    },
    ...patch,
  } as unknown as PublicCasinoDTO;
}

test("review titles and descriptions: localized templates, CMS copy honoured in English, ≤155 characters", () => {
  const fallback = { title: "fallback", description: "fallback" };
  const copy = (locale: "en-GB" | "sv-SE" | "da-DK" | "de-DE", casino = reviewCasino(), editorial = null) => casinoReviewMetadataCopy({ casino, editorial, locale, fallback });

  assert.equal(copy("en-GB").title, "Betsson casino review 2026: bonus, payouts & licence | B4GAMBLE");
  assert.match(copy("sv-SE").title, /^Betsson casino recension 2026: /);
  assert.match(copy("da-DK").title, /^Betsson casino anmeldelse 2026: /);
  assert.equal(copy("de-DE").title, "Betsson Test 2026: Bonus, Auszahlung & Lizenz | B4GAMBLE");
  // A brand that already names itself a casino is not called "casino" twice.
  assert.equal(copy("en-GB", reviewCasino({ name: "Casino RedKings" })).title, "Casino RedKings review 2026: bonus, payouts & licence | B4GAMBLE");

  for (const locale of ["en-GB", "sv-SE", "da-DK", "de-DE"] as const) {
    const { description } = copy(locale, reviewCasino({ name: "Regency Casino Online" }));
    assert.ok(description.length <= 155, `${locale}: ${description.length}`);
    assert.match(description, / 18\+\.$/, locale);
    assert.doesNotMatch(description, /English summary/, locale);
  }
  // German copy follows the terminology guard; brand names are kept as they are.
  assert.deepEqual(germanProhibitedTerms(`${copy("de-DE").title} ${copy("de-DE").description}`), []);

  // Importer placeholders are not editor copy; an editor's own SEO copy wins on English pages only.
  const edited = reviewCasino({ seo: { ...reviewCasino().seo, title: "Betsson: our verdict | B4GAMBLE", description: "An editor's own description." } });
  assert.equal(copy("en-GB", edited).title, "Betsson: our verdict | B4GAMBLE");
  assert.equal(copy("en-GB", edited).description, "An editor's own description.");
  assert.match(copy("sv-SE", edited).title, /casino recension/);

  // The year is the year of the review's latest change, never earlier than publication.
  assert.match(copy("en-GB", reviewCasino({ publishedAt: "2025-12-30T00:00:00.000Z", lastReviewedAt: null })).title, / review 2025:/);
  assert.equal(trimAtWordBoundary("word ".repeat(60), 155).length <= 155, true);
});

test("review schema: the editorial team is an Organization and dateModified follows datePublished", () => {
  const casino = reviewCasino({
    reviewContent: "Review body.",
    licenses: [], regulatoryFootprint: [], countries: [], payments: [], providers: [], categories: [], bonuses: [], pros: [], cons: [],
    responsibleGamblingTools: [], marketProfiles: [], action: null,
    media: { logo: null, hero: null, screenshots: [], gallery: [], socialImage: null },
  } as Partial<PublicCasinoDTO>);
  const editorial = {
    version: 1, title: "Betsson review", summary: "Summary", author: "B4GAMBLE Editorial", sections: [], relatedCasinoIds: [],
    seo: { title: "", description: "" },
  } as const;
  const schemas = casinoProfileSchemas(casino, editorial as never);
  const review = schemas.find((schema) => schema["@type"] === "Review") as Record<string, unknown>;
  assert.ok(review);
  assert.deepEqual((review.author as Record<string, unknown>)["@type"], "Organization");
  assert.equal((review.author as Record<string, unknown>).name, "B4GAMBLE Editorial");
  assert.ok(new Date(String(review.dateModified)) >= new Date(String(review.datePublished)));
  const webPage = schemas.find((schema) => schema["@type"] === "WebPage") as Record<string, unknown>;
  assert.ok(new Date(String(webPage.dateModified)) >= new Date(String(webPage.datePublished)));
  // A named person in the byline stays a Person.
  const byPerson = casinoProfileSchemas(casino, { ...editorial, author: "Jane Doe" } as never).find((schema) => schema["@type"] === "Review") as Record<string, unknown>;
  assert.equal((byPerson.author as Record<string, unknown>)["@type"], "Person");
});

test("every product page carries the default large social image", () => {
  const metadata = productMetadata({ presentation: resolvePresentationContext({ routeLanguage: "en" }), pathname: "/casinos", title: "t", description: "d" });
  assert.deepEqual(metadata.openGraph?.images, DEFAULT_OPEN_GRAPH_IMAGES);
  assert.equal((metadata.twitter as { card?: string }).card, "summary_large_image");
  assert.equal(DEFAULT_OPEN_GRAPH_IMAGES[0].url, absoluteUrl("/opengraph-image"));
});

const article: PublicArticle = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "wagering-requirements",
  locale: "en-GB",
  title: "Wagering requirements explained",
  excerpt: "What a wagering requirement means before you accept a bonus.",
  category: "casino-bonuses",
  tags: [],
  status: "PUBLISHED",
  bodyBlocks: [{ id: "intro", type: "paragraph", text: "Body." }],
  heroImageUrl: null,
  heroImageAlt: null,
  seoTitle: null,
  seoDescription: null,
  canonicalUrl: null,
  readingTime: "4 min read",
  difficulty: "Beginner",
  publishedAt: "2026-09-15T00:00:00.000Z",
  lastReviewedAt: "2026-09-15T00:00:00.000Z",
  archivedAt: null,
  createdAt: "2026-09-15T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
  createdBy: "00000000-0000-4000-8000-000000000002",
  updatedBy: "00000000-0000-4000-8000-000000000002",
};

test("a Learn guide declares only the language it exists in", () => {
  assert.deepEqual(articleLanguageAlternates(article), {
    en: absoluteUrl("/en/learn/casino-bonuses/wagering-requirements"),
    "x-default": absoluteUrl("/en/learn/casino-bonuses/wagering-requirements"),
  });
  assert.deepEqual(Object.keys(articleLanguageAlternates({ ...article, locale: "de-DE" })), ["de"]);
  assert.match(read("app/(public)/learn/[category]/[slug]/page.tsx"), /languageAlternates: articleLanguageAlternates\(article\)/);
});

test("a guide's category crumb links the filtered hub itself, not the 308 category path", () => {
  const view = read("app/(public)/learn/[category]/[slug]/LearningArticleView.tsx");
  const page = read("app/(public)/learn/[category]/[slug]/page.tsx");
  for (const source of [view, page]) {
    assert.match(source, /`\/learn\?category=\$\{encodeURIComponent\(article\.category\)\}`/);
    assert.doesNotMatch(source, /`\/learn\/\$\{article\.category\}`/);
  }
});

test("a language without its own guides lists the English guides, marked and linked as English", () => {
  const messages = learningMessages("de-DE");
  const hub = transformLearnHandoff(generatedPages.learn.html, "de-DE", (href) => `/de${href}`, [article], "/de/program", {
    articleHrefFor: (href) => `/en${href}`,
    articleLanguage: { lang: "en", label: messages.englishGuide },
  });
  assert.doesNotMatch(hub, /data-learn-empty=""/);
  assert.match(hub, /href="\/en\/learn\/casino-bonuses\/wagering-requirements"/);
  assert.doesNotMatch(hub, /href="\/de\/learn\/casino-bonuses\/wagering-requirements"/);
  assert.match(hub, /data-learn-article-language="en">Auf Englisch</);
  assert.match(hub, /lang="en"[^>]*>Wagering requirements explained/);
  // With no guides in any language the hub keeps its truthful empty state.
  assert.match(transformLearnHandoff(generatedPages.learn.html, "de-DE", (href) => href, []), /data-learn-empty=""/);
  assert.equal(learningMessages("sv-SE").englishGuide, "På engelska");
  assert.equal(learningMessages("da-DK").englishGuide, "På engelsk");
});

test("a language hub lists its own guides first, then the English guides marked as English", () => {
  const messages = learningMessages("sv-SE");
  const swedish = { ...article, id: "00000000-0000-4000-8000-000000000009", slug: "omsattningskrav-sa-fungerar-det", locale: "sv-SE", title: "Omsättningskrav: så fungerar det" };
  const hub = transformLearnHandoff(generatedPages.learn.html, "sv-SE", (href) => `/sv${href}`, [swedish, article], "/sv/program", {
    articleHrefFor: (href) => `/en${href}`,
    articleLanguage: { lang: "en", label: messages.englishGuide },
  });
  assert.match(hub, /href="\/sv\/learn\/casino-bonuses\/omsattningskrav-sa-fungerar-det"/);
  assert.match(hub, /href="\/en\/learn\/casino-bonuses\/wagering-requirements"/);
  assert.equal((hub.match(/data-learn-article-language="en">På engelska</g) ?? []).length, 1);
  assert.doesNotMatch(hub, /lang="en"[^>]*>Omsättningskrav/);
  assert.ok(hub.indexOf("Omsättningskrav") < hub.indexOf("Wagering requirements explained"));
  assert.match(read("app/(public)/learn/page.tsx"), /const articles = \[\.\.\.localizedArticles, \.\.\.englishArticles\];/);
});

test("the retired odds guide moves permanently to its successor", () => {
  assert.deepEqual(retiredArticleSuccessor("sports-betting-basics", "sports-betting-odds-basics"), {
    category: "sports-betting-basics",
    slug: "sportsbook-bonus-basics",
    path: "/learn/sports-betting-basics/sportsbook-bonus-basics",
  });
  assert.equal(retiredArticleSuccessor("casino-bonuses", "wagering-requirements"), null);
  assert.match(read("app/(public)/learn/[category]/[slug]/page.tsx"), /permanentRedirect\(/);
});

test("the Programme is indexed only in the languages open to search", () => {
  const copy = { title: "Programme", description: "Programme" };
  const spanish = programmeSearchMetadata("es-ES", copy);
  assert.deepEqual(spanish.robots, { index: false, follow: true });
  assert.equal(spanish.alternates?.languages, undefined);
  const german = programmeSearchMetadata("de-DE", copy);
  assert.equal(german.robots, undefined);
  assert.deepEqual(Object.keys(german.alternates?.languages ?? {}).sort(), ["da-DK", "de-DE", "en-GB", "sv-SE", "x-default"]);
});

test("German and Danish product titles use the terms people search, stay country-free and short", () => {
  const de = productPageMessages("de-DE");
  assert.match(de.casinos.title, /^Online-Spielotheken im Vergleich/);
  assert.match(de.bonuses.title, /^Spielothek-Bonus/);
  assert.match(de.bestOffers.title, /Slots/);
  const da = productPageMessages("da-DK");
  assert.match(da.casinos.title, /online casino/i);
  assert.match(da.bonuses.title, /^Casinobonusser/);
  assert.doesNotMatch(`${da.casinos.title} ${da.bonuses.title} ${da.bestOffers.title}`, /kasino/i);
  for (const messages of [de, da]) {
    for (const page of [messages.casinos, messages.bonuses, messages.bestOffers]) {
      assert.ok(page.title.length <= 60, page.title);
      assert.doesNotMatch(`${page.title} ${page.description}`, /\{market\}/, page.title);
    }
  }
  assert.deepEqual(germanProhibitedTerms([de.casinos, de.bonuses, de.bestOffers].map((page) => `${page.title} ${page.description}`).join(" ")), []);
});

test("the Bonuses page and the sitemap share one indexing rule, so /de/bonuses is listed whenever it is indexable", () => {
  assert.equal(bonusDirectoryIndexable({ total: 3, inventoryMode: "PUBLISHED_ONLY" }), true);
  assert.equal(bonusDirectoryIndexable({ total: 0, inventoryMode: "PUBLISHED_ONLY" }), false);
  assert.equal(bonusDirectoryIndexable({ total: 3, inventoryMode: "MIXED" }), false);
  assert.equal(bonusDirectoryIndexable(null), false);
  const snapshot = {
    market: market("DE"),
    casinos: [],
    discovery: null,
    bestOffers: null,
    bonuses: { total: 12, inventoryMode: "PUBLISHED_ONLY" },
  } as unknown as Parameters<typeof indexableMarketProductPaths>[0];
  assert.deepEqual(indexableMarketProductPaths(snapshot, true).routes, ["/de/bonuses"]);
  assert.match(read("app/(public)/bonuses/page.tsx"), /!bonusDirectoryIndexable\(result\)/);
  const sitemap = read("app/sitemap.ts");
  assert.match(sitemap, /bonusDirectoryIndexable\(snapshot\.bonuses\)/);
  // The crawler's view: no market closure, so Germany's daytime window cannot drop the page.
  assert.match(sitemap, /searchOffers\(parsePublicOfferQuery\(\{\}, 1\), null\)\)/);
});

function reviewCards(names: string[]) {
  return names.map((name) => ({ name, slug: name.toLowerCase().replace(/\s+/g, "-"), score: 8.1 }));
}

test("llms.txt is commercial-first, factual and uses canonical URLs only", async () => {
  const { llmsArticleCount } = await importMjs<{ llmsArticleCount: (text: string) => number }>("../scripts/production-smoke.mjs");
  const markets = llmsLaunchMarkets();
  assert.deepEqual(markets.map((profile) => profile.countryCode), ["GB", "SE", "DK", "DE"]);
  const body = buildLlmsTxt({
    markets: markets.map((profile) => ({ market: profile, productPages: ["/casinos", "/bonuses", "/best-offers"], reviews: reviewCards(["Betsson", "PlayOJO"]) })),
    articles: [article],
  });
  assert.match(body, /^# B4GAMBLE\n\n> B4GAMBLE compares online casinos and their bonus terms/);
  assert.match(body, /the United Kingdom, Sweden, Denmark and Germany/);
  assert.match(body, /wagering requirements, minimum deposit, maximum bet and expiry/);
  assert.match(body, /editor score from 0 to 10/);
  assert.ok(body.indexOf("## Markets") < body.indexOf("## 10-Step Control Programme"));
  for (const path of ["/en/bonuses", "/sv/best-offers", "/da/casinos", "/de/bonuses", "/sv/casino/betsson", "/de/casino/playojo"]) {
    assert.ok(body.includes(`(${absoluteUrl(path)})`), path);
  }
  assert.ok(body.includes(`(${absoluteUrl("/llms-full.txt")})`));
  assert.equal((body.match(/\/casino\/[a-z-]+\)/g) ?? []).length, 8, "one line per published review and language");
  assert.doesNotMatch(body, /fictional|demonstration|secondary resources/i);
  // No link hops through the language-neutral redirect.
  const links = [...body.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((match) => new URL(match[1]).pathname);
  for (const pathname of links) {
    assert.ok(/^\/(?:en|de|sv|da)(?:\/|$)/.test(pathname) || ["/program", "/bonus-guide", "/affiliate-disclosure", "/privacy", "/terms", "/llms-full.txt"].includes(pathname), pathname);
  }
  // The Production smoke still counts the Learning Center articles.
  assert.equal(llmsArticleCount(body), 1);
});

function offer(slug: string, patch: Partial<PublicOfferDTO["bonus"]> = {}): PublicOfferDTO {
  return {
    casino: {
      id: `${slug}-id`, slug, name: slug.toUpperCase(), summary: "", logo: null, hero: null, editorScore: 8.4, featured: false, recommended: false,
      publishedAt: "2026-09-20T00:00:00.000Z", lastReviewedAt: null, countries: [], licenses: [], payments: [], responsibleGamblingTools: [],
    },
    bonus: {
      id: `${slug}-bonus`, slug: `${slug}-welcome`, title: "Welcome", summary: "", type: "WELCOME", percentage: 100, maximumBonus: 100, currency: "EUR",
      freeSpins: null, minimumDeposit: 10, maximumBet: 5, wageringMultiplier: 35, wageringText: null, eligibility: null,
      importantConditions: ["Slots only"], termsUrl: "https://operator.example/terms", startsAt: null, expiresAt: null,
      ...patch,
    },
    action: { href: `/r/${slug}` } as never,
    dataClassification: "PUBLISHED_RECORD",
  };
}

function searchResult(records: PublicOfferDTO[]): PublicOfferSearchResult {
  return { records, total: records.length, page: 1, pageSize: 100, pageCount: 1, query: {} as never, facets: {} as never, inventoryMode: "PUBLISHED_ONLY" };
}

test("llms-full.txt lists what each market's page shows now, from the market itself, with no partner links", async () => {
  const calls: Array<{ authorityCountry: string; editorialCountry: string; language: string }> = [];
  const dependencies = (records: PublicOfferDTO[]): LlmsFullDependencies => ({
    resolveAuthority: async (countryCode) => ({ countryCode, commercialAllowed: true, referralAllowed: true, reasonCode: "POLICY_APPROVED", policyVersion: "v" }),
    searchOffers: async (authority, options) => {
      calls.push({ authorityCountry: authority?.countryCode ?? "", editorialCountry: options.defaultEditorialCountry, language: options.presentationLanguage });
      return searchResult(records);
    },
  });

  // 10:00 in Berlin: German rules close offers.
  const berlinMorning = new Date("2026-09-28T08:00:00.000Z");
  const germanyMorning = await loadLlmsFullMarket(market("DE"), berlinMorning, dependencies([]));
  assert.equal(germanyMorning.state, "OUTSIDE_ADVERTISING_WINDOW");
  assert.match(germanyMorning.note ?? "", /21:00 and 06:00 \(Europe\/Berlin\)/);

  // 22:00 in Berlin: the page shows its offers.
  const berlinEvening = new Date("2026-09-28T20:00:00.000Z");
  const germanyEvening = await loadLlmsFullMarket(market("DE"), berlinEvening, dependencies([offer("alpha"), offer("beta", { wageringMultiplier: 10 })]));
  assert.equal(germanyEvening.state, "OFFERS");
  assert.equal(germanyEvening.offers.length, 2);
  assert.deepEqual(calls.at(-1), { authorityCountry: "DE", editorialCountry: "DE", language: "de" });

  const sweden = await loadLlmsFullMarket(market("SE"), berlinEvening, dependencies([offer("gamma", { currency: "SEK", minimumDeposit: 100 })]));
  const body = buildLlmsFullTxt({ generatedAt: berlinEvening, markets: [sweden, germanyMorning, germanyEvening] });
  assert.match(body, /## Sweden — .*\/sv\/bonuses/);
  assert.match(body, /Wagering: 35×/);
  assert.match(body, /Minimum deposit: /);
  assert.match(body, /Maximum bet: /);
  assert.ok(body.includes(`Review: ${absoluteUrl("/sv/casino/gamma")}`));
  assert.ok(body.includes(`Review: ${absoluteUrl("/de/casino/alpha")}`));
  assert.doesNotMatch(body, /\/r\/|\/go\/|operator\.example/);

  // A market whose country prohibits offer presentation shows none, without asking for offers.
  const before = calls.length;
  const prohibited = await loadLlmsFullMarket({ ...market("SE"), countryCode: "NO" as never }, berlinEvening, dependencies([offer("delta")]));
  assert.equal(prohibited.state, "PROHIBITED");
  assert.equal(calls.length, before);

  // The route resolves the authority from the market with a trusted signal, never from the request.
  const route = read("app/llms-full.txt/route.ts");
  assert.match(route, /requestCountrySignal: \{ countryCode, marketCode: countryCode, trust: "TRUSTED", observedAt: now \}/);
  assert.doesNotMatch(route, /headers\(|request\.headers|x-vercel-ip-country/);
  assert.doesNotMatch(read("app/llms.txt/route.ts"), /headers\(|x-vercel-ip-country/);
});

test("the sitemap and llms.txt list the same published reviews", () => {
  const cards = [
    { slug: "alpha", name: "Alpha", dataClassification: "PUBLISHED_RECORD", indexable: true },
    { slug: "hidden", name: "Hidden", dataClassification: "PUBLISHED_RECORD", indexable: false },
    { slug: "demo", name: "Demo", dataClassification: "DEMO_FIXTURE", indexable: true },
  ] as const;
  assert.deepEqual(indexableReviewCards(cards).map((card) => card.slug), ["alpha"]);
  assert.match(read("app/llms.txt/route.ts"), /indexableReviewCards\(snapshot\.casinos\)/);
});

test("IndexNow: a public key file, Production-only announcements and review URLs in every indexed language", async () => {
  const keyRoutes = readdirSync("app").filter((name) => /^[0-9a-f]{32}\.txt$/.test(name));
  assert.deepEqual(keyRoutes, [`${INDEXNOW_KEY}.txt`]);
  assert.match(read(`app/${INDEXNOW_KEY}.txt/route.ts`), /return new Response\(INDEXNOW_KEY/);

  assert.equal(indexNowEnabled({ VERCEL_ENV: "production" }), true);
  assert.equal(indexNowEnabled({ VERCEL_ENV: "preview" }), false);
  assert.equal(indexNowEnabled({}), false);
  assert.equal(indexNowEnabled({ VERCEL_ENV: "production", INDEXNOW_DISABLED: "true" }), false);
  assert.equal(announceChangedUrls(casinoReviewUrls("betsson"), {}), false);

  assert.deepEqual(casinoReviewUrls("betsson").map((url) => new URL(url).pathname), ["/en/casino/betsson", "/de/casino/betsson", "/sv/casino/betsson", "/da/casino/betsson"]);
  assert.deepEqual(learnArticleUrls("casino-bonuses", "wagering-requirements").map((url) => new URL(url).pathname), ["/en/learn/casino-bonuses/wagering-requirements", "/en/learn"]);

  const payload = indexNowPayload([...casinoReviewUrls("betsson"), "https://elsewhere.example/page", casinoReviewUrls("betsson")[0]]);
  assert.equal(payload.key, INDEXNOW_KEY);
  assert.equal(payload.keyLocation, absoluteUrl(`/${INDEXNOW_KEY}.txt`));
  assert.equal(payload.urlList.length, 4, "same host only, no duplicates");

  const sent: string[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    sent.push(`${url} ${init?.body}`);
    return new Response(null, { status: 202 });
  }) as unknown as typeof fetch;
  assert.deepEqual(await submitIndexNow(casinoReviewUrls("betsson"), { environment: { VERCEL_ENV: "preview" }, fetchImpl }), { submitted: 0, status: null });
  assert.equal(sent.length, 0);
  assert.deepEqual(await submitIndexNow(casinoReviewUrls("betsson"), { environment: { VERCEL_ENV: "production" }, fetchImpl }), { submitted: 4, status: 202 });
  assert.match(sent[0], /^https:\/\/api\.indexnow\.org\/indexnow /);

  // Publishing hooks announce what changed.
  assert.match(read("lib/public-casino/cache.ts"), /announceChangedUrls\(casinoSlug \? casinoReviewUrls\(casinoSlug\) : productDirectoryUrls\(\)\)/);
  assert.match(read("lib/articles/cache.ts"), /announceChangedUrls\(learnArticleUrls\(category, slug\)\)/);
});

test("switching language on a guide that is not published in the target language lands on that language's Learn hub", async () => {
  const { NextRequest } = await import("next/server");
  const { POST } = await import("../app/api/presentation/route");
  const switchTo = (choice: string, returnTo: string) => POST(new NextRequest("https://b4gamble.com/api/presentation", {
    method: "POST",
    body: new URLSearchParams({ choice, returnTo }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  }));
  // No German guide can be confirmed (here: no database), so the German hub, not a 404.
  const guide = await switchTo("de", "/en/learn/casino-bonuses/wagering-requirements?ref=x");
  assert.equal(guide.status, 303);
  assert.equal(guide.headers.get("location"), "/de/learn");
  const category = await switchTo("sv", "/en/learn/casino-bonuses");
  assert.equal(category.headers.get("location"), "/sv/learn");
  // Other pages keep their path and query.
  const casinos = await switchTo("da", "/en/casinos?sort=score");
  assert.equal(casinos.headers.get("location"), "/da/casinos?sort=score");
});
