import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { earlyOfferBridgeIndex, offerBridgeKind } from "../lib/articles/article-bridges";
import type { ArticleBlock, PublicArticle } from "../lib/articles/article-types";
import { bonusGuideReadNextSelection, learnStartHereSelection } from "../lib/articles/learn-selection";
import generatedPages from "../lib/final-handoff/generated-pages.json";
import { transformBonusGuideHandoff, transformCommonHandoff, transformLearnHandoff } from "../lib/final-handoff/transforms";
import { learnBridgeMessages } from "../lib/i18n/learn-bridges-catalog";
import { learningMessages } from "../lib/i18n/learning-center";
import { learningCategories } from "../lib/learning-center";
import type { SupportedLocale } from "../lib/market/registry";

const require = createRequire(import.meta.url);
require.extensions[".css"] = (module) => { module.exports = {}; };

const read = (path: string) => readFileSync(path, "utf8");

const fixture: PublicArticle = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "clear-guide",
  locale: "en-GB",
  title: "A clear published guide",
  excerpt: "A sufficiently complete excerpt for a published Learning Center guide.",
  category: "casino-basics",
  tags: ["Security"],
  status: "PUBLISHED",
  bodyBlocks: [{ id: "intro", type: "paragraph", text: "Visible body." }],
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

test("Prisma Article is the only production Article content authority", () => {
  const schema = read("prisma/schema.prisma");
  const taxonomy = read("lib/learning-center.ts");
  const service = read("lib/services/article.service.ts");
  const genericApi = read("app/api/admin/[entity]/route.ts");
  assert.match(schema, /model Article \{/);
  for (const field of ["locale", "bodyBlocks", "heroImageUrl", "heroImageAlt", "publishedAt", "lastReviewedAt", "archivedAt"]) assert.match(schema, new RegExp(`\\b${field}\\b`));
  assert.match(service, /prisma\.article/);
  assert.match(service, /status: EditorialStatus\.PUBLISHED/);
  assert.match(service, /entityType: ARTICLE_ENTITY/);
  assert.doesNotMatch(taxonomy, /learningArticleManifest|articleTemplate|publishedLearningArticles|learningArticles\s*=/);
  assert.equal(existsSync("lib/cms/seed.ts"), false);
  assert.equal(existsSync("lib/cms/repository.ts"), false);
  assert.match(genericApi, /legacy generic CMS API is retired/i);
  assert.doesNotMatch(genericApi, /createCmsRecord|listCmsRecords/);
  assert.equal(learningCategories.length, 13);
});

test("the hub projects only supplied PostgreSQL records and has a truthful empty state", () => {
  const empty = transformLearnHandoff(generatedPages.learn.html, "en-GB", (href) => href, []);
  assert.match(empty, /data-learn-empty=""/);
  assert.equal((empty.match(/data-learn-category=/g) ?? []).length, 0);
  const populated = transformLearnHandoff(generatedPages.learn.html, "en-GB", (href) => `/en${href}`, [fixture]);
  assert.match(populated, /href="\/en\/learn\/casino-basics\/clear-guide"/);
  assert.match(populated, />A clear published guide</);
  assert.doesNotMatch(populated, /data-learn-empty=""/);
});

test("public routes are database, locale and publication-state owned", () => {
  const hub = read("app/(public)/learn/page.tsx");
  const category = read("app/(public)/learn/[category]/page.tsx");
  const article = read("app/(public)/learn/[category]/[slug]/page.tsx");
  const publicApi = read("app/api/public/[resource]/route.ts");
  assert.match(hub, /articleService\.listPublished\(articleLocale/);
  assert.match(category, /articleService\.listPublished\(locale, \{ category, take: 1 \}\)/);
  assert.match(article, /articleService\s*\.\s*getPublished/);
  assert.match(article, /getPublished\(category, slug, languageRouteByLocale\(locale\)\.defaultLocale\)/);
  assert.match(publicApi, /articleService\.listPublished\(locale/);
  assert.doesNotMatch(`${hub}${category}${article}${publicApi}`, /learningArticles|localizedLearningArticles/);
});

test("Article rendering is safe, structured and keeps protected Help non-commercial", () => {
  const view = read("app/(public)/learn/[category]/[slug]/LearningArticleView.tsx");
  const validation = read("lib/articles/article-validation.ts");
  assert.match(view, /block\.type === "paragraph"/);
  assert.match(view, /block\.type === "image"/);
  assert.doesNotMatch(view, /dangerouslySetInnerHTML|sanitizeHtml|iframe|<script/);
  assert.match(validation, /Unsupported block type/);
  assert.match(validation, /safePublicUrl/);
  assert.match(view, /article\.category === "responsible-gambling"/);
  assert.match(view, /hrefFor\("\/help"\)/);
  assert.doesNotMatch(view, /href="\/(?:r|go)\//);
});

test("Admin exposes explicit draft, review, publish, archive, preview and revision workflows", () => {
  const editor = read("components/admin/ArticleEditor.tsx");
  const action = read("app/api/admin/articles/[articleId]/action/route.ts");
  const revisions = read("app/api/admin/articles/[articleId]/revisions/route.ts");
  for (const label of ["Request review", "Return to draft", "Approve", "Publish", "Start new draft", "Archive", "Restore to draft"]) assert.ok(editor.includes(label), label);
  assert.match(editor, /beforeunload/);
  assert.match(editor, /expectedUpdatedAt/);
  assert.match(action, /article\.publish/);
  assert.match(revisions, /restoreRevision/);
  assert.match(editor, /Raw HTML, scripts, iframes and embedded code are not accepted/);
});

test("metadata, JSON-LD and sitemap use visible canonical Article fields", () => {
  const route = read("app/(public)/learn/[category]/[slug]/page.tsx");
  const sitemap = read("app/sitemap.ts");
  assert.match(route, /"@type": "Article"/);
  assert.match(route, /datePublished: article\.publishedAt/);
  assert.match(route, /dateModified: article\.updatedAt/);
  assert.match(route, /new URL\(article\.canonicalUrl, siteUrl\)\.href/);
  assert.doesNotMatch(route, /FAQPage|structuredData/);
  assert.match(sitemap, /articleService\.listPublished/);
  assert.match(sitemap, /articlePath\(article\)/);
});

test("Founder next steps: a Programme card after six guides, a mid-guide Programme block and gated offer bridges", async () => {
  const many = Array.from({ length: 12 }, (_, index) => ({ ...fixture, id: `00000000-0000-4000-8000-0000000001${String(index).padStart(2, "0")}`, slug: `guide-${index}`, title: `Guide ${index}` }));
  const hub = transformLearnHandoff(generatedPages.learn.html, "en-GB", (href) => href, many);
  assert.equal((hub.match(/data-learn-programme-bridge="inline"/g) ?? []).length, 1);
  const guideSlugs = [...hub.matchAll(/href="\/learn\/casino-basics\/(guide-\d+)"|data-learn-programme-bridge="inline"/g)].map((match) => match[1] ?? "bridge");
  // With no topic guides, "Start here" takes the four newest; All guides lists the rest once, with the card after its sixth guide.
  assert.deepEqual(guideSlugs, ["guide-0", "guide-1", "guide-2", "guide-3", "guide-4", "guide-5", "guide-6", "guide-7", "guide-8", "guide-9", "bridge", "guide-10", "guide-11"]);
  assert.match(hub, /data-learn-programme-bridge="inline"[\s\S]*?href="\/program\?entry=start"[^>]*>Start Programme<\/a>/);
  const german = transformLearnHandoff(generatedPages.learn.html, "de-DE", (href) => href, many);
  assert.match(german, /data-learn-programme-bridge="inline"[\s\S]*?Kostenlos nutzbar/);
  // Four in Start here leave six in All guides: no inline card.
  const few = transformLearnHandoff(generatedPages.learn.html, "en-GB", (href) => href, many.slice(0, 10));
  assert.doesNotMatch(few, /data-learn-programme-bridge="inline"/);
  const interactions = read("components/final-handoff/HandoffInteractions.tsx");
  assert.match(interactions, /learnProgrammeBridge\.hidden = filtered/);

  const { midArticleBridgeIndex } = await import("../lib/articles/article-bridges");
  const heading = (id: string) => ({ id, type: "heading" as const, level: 2 as const, text: id });
  const paragraph = (id: string) => ({ id, type: "paragraph" as const, text: id });
  assert.equal(midArticleBridgeIndex([paragraph("a"), heading("b"), paragraph("c"), paragraph("d"), heading("e"), paragraph("f")]), 4);
  assert.equal(midArticleBridgeIndex([paragraph("a"), paragraph("b")]), -1);

  const view = read("app/(public)/learn/[category]/[slug]/LearningArticleView.tsx");
  const article = read("app/(public)/learn/[category]/[slug]/page.tsx");
  assert.match(view, /const programmeBridgeAt = protectedCategory \|\| offerBridge \? -1 : midArticleBridgeIndex\(article\.bodyBlocks\);/);
  assert.match(view, /\{offerBridge && !protectedCategory \? <OfferBridge bridge=\{offerBridge\} \/> : null\}/);
  assert.match(article, /const kind = offerBridgeKind\(article\.category\);\s*if \(!kind \|\| !offersMayBePresented\(presentation\.marketCountryCode\)\) return null;/);
  assert.match(article, /disclosure: learning\.ui\.commercialDisclosure/);
});

const guide = (id: string, category: string, publishedAt: string, patch: Partial<PublicArticle> = {}): PublicArticle => ({
  ...fixture,
  id: `00000000-0000-4000-8000-${id.padStart(12, "0")}`,
  slug: `${category}-${id}`,
  title: `${category} guide ${id}`,
  category,
  publishedAt,
  ...patch,
});

test("package C: Start here is one guide per topic and All guides never repeats it", () => {
  // Newest first, as articleService.listPublished returns them.
  const articles = [
    guide("1", "payments", "2026-09-24T00:00:00.000Z"),
    guide("2", "responsible-gambling", "2026-09-23T00:00:00.000Z"),
    guide("3", "casino-basics", "2026-09-22T00:00:00.000Z"),
    guide("4", "casino-bonuses", "2026-09-21T00:00:00.000Z"),
    guide("5", "casino-safety", "2026-09-20T00:00:00.000Z"),
    guide("6", "casino-bonuses", "2026-09-19T00:00:00.000Z"),
    guide("7", "responsible-gambling", "2026-09-18T00:00:00.000Z"),
    guide("8", "game-guides", "2026-09-17T00:00:00.000Z"),
  ];
  assert.deepEqual(learnStartHereSelection(articles).map((article) => article.slug), [
    "casino-bonuses-4", "casino-safety-5", "payments-1", "responsible-gambling-2",
  ]);
  // A topic without a guide keeps its slot and takes the newest remaining guide.
  const withoutCasinoOrBanking = articles.filter((article) => !["casino-safety", "payments"].includes(article.category));
  assert.deepEqual(learnStartHereSelection(withoutCasinoOrBanking).map((article) => article.slug), [
    "casino-bonuses-4", "casino-basics-3", "casino-bonuses-6", "responsible-gambling-2",
  ]);
  assert.deepEqual(learnStartHereSelection(articles.slice(0, 2)).map((article) => article.slug), ["payments-1", "responsible-gambling-2"]);

  const hub = transformLearnHandoff(generatedPages.learn.html, "en-GB", (href) => href, articles);
  const startStart = hub.indexOf("data-learn-start-section");
  const catalogueStart = hub.indexOf("data-learn-catalogue-section");
  assert.ok(startStart > 0 && catalogueStart > startStart);
  const hrefs = (html: string) => [...html.matchAll(/<a href="(\/learn\/[^"]+)" data-learn-category="([^"]+)"/g)].map((match) => [match[1], match[2]]);
  assert.deepEqual(hrefs(hub.slice(startStart, catalogueStart)), [
    ["/learn/casino-bonuses/casino-bonuses-4", "bonuses"],
    ["/learn/casino-safety/casino-safety-5", "casinos"],
    ["/learn/payments/payments-1", "banking"],
    ["/learn/responsible-gambling/responsible-gambling-2", "responsible play"],
  ]);
  assert.deepEqual(hrefs(hub.slice(catalogueStart)).map(([href]) => href), [
    "/learn/casino-basics/casino-basics-3",
    "/learn/casino-bonuses/casino-bonuses-6",
    "/learn/responsible-gambling/responsible-gambling-7",
    "/learn/game-guides/game-guides-8",
  ]);
  // Every published guide appears exactly once in the server HTML, and the count still names them all.
  for (const article of articles) assert.equal(hub.split(`href="/learn/${article.category}/${article.slug}"`).length - 1, 1, article.slug);
  assert.match(hub, /<span class="sc-interp">8<\/span> guides/);

  // The topic filter still covers the Start here guides: a matching copy joins the filtered list.
  const interactions = read("components/final-handoff/HandoffInteractions.tsx");
  assert.match(interactions, /querySelectorAll<HTMLAnchorElement>\("\[data-learn-start-section\] a\[data-learn-category\]"\)/);
  assert.match(interactions, /learnStartCards\.forEach\(\(card, index\) => \{\s*const matches = cardMatches\(card\);\s*if \(matches\) visible \+= 1;/);
  assert.match(interactions, /if \(echo && filtered && matches\) shownEchoes\.push\(echo\);/);
  assert.match(interactions, /if \(learnGrid && shownEchoes\.length\) learnGrid\.prepend\(\.\.\.shownEchoes\);/);
  // Unfiltered, the copies leave the document, so every guide link stays unique.
  assert.equal((interactions.match(/for \(const echo of learnStartEchoes\) echo\.remove\(\);/g) ?? []).length, 2);
});

const heading = (id: string) => ({ id, type: "heading" as const, level: 2 as const, text: id });
const paragraph = (id: string) => ({ id, type: "paragraph" as const, text: id });

async function renderArticle(article: PublicArticle, offerBridge: import("../app/(public)/learn/[category]/[slug]/LearningArticleView").LearnOfferBridge | null) {
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const { LearningArticleView } = await import("../app/(public)/learn/[category]/[slug]/LearningArticleView");
  return renderToStaticMarkup(React.createElement(LearningArticleView, {
    article: { ...article, status: "PUBLISHED" },
    categoryTitle: "Category title",
    hrefFor: (href: string) => href,
    messages: learningMessages("en-GB"),
    offerBridge,
    programmePath: "/program",
    relatedArticlesSlot: null,
  }));
}

test("package C: bonus, casino-choice and payment guides get an early and a closing offer bridge; protected guides never do", async () => {
  assert.equal(offerBridgeKind("casino-bonuses"), "bonuses");
  assert.equal(offerBridgeKind("casino-safety"), "casinos");
  assert.equal(offerBridgeKind("payments"), "casinos");
  for (const category of ["responsible-gambling", "casino-basics", "crypto-casinos", "game-guides", "toString", "__proto__"]) assert.equal(offerBridgeKind(category), null, category);

  // The early bridge goes before the first section heading after the introduction.
  const blocks: ArticleBlock[] = [paragraph("intro"), paragraph("lead"), heading("first"), paragraph("a"), heading("second"), paragraph("b")];
  assert.equal(earlyOfferBridgeIndex(blocks), 2);
  assert.equal(earlyOfferBridgeIndex([heading("opening"), paragraph("a"), heading("next")]), 2);
  assert.equal(earlyOfferBridgeIndex([paragraph("a"), paragraph("b")]), -1);

  const disclosure = learningMessages("en-GB").ui.commercialDisclosure;
  const bridges = learnBridgeMessages("en-GB");
  const bonusBridge = { kind: "bonuses" as const, title: "READY TO APPLY THE CHECKLIST?", body: bridges.offerBridgeBody, lead: bridges.offerBridgeLead, primaryLabel: "Bonuses", primaryHref: "/bonuses", bestOffersLabel: "Best Offers", bestOffersHref: "/best-offers", disclosure };
  const casinoBridge = { ...bonusBridge, kind: "casinos" as const, title: bridges.casinoBridgeTitle, body: bridges.casinoBridgeBody, lead: bridges.casinoBridgeLead, primaryLabel: "Casinos", primaryHref: "/casinos" };

  const bonus = await renderArticle({ ...fixture, category: "casino-bonuses", bodyBlocks: blocks }, bonusBridge);
  const early = bonus.indexOf('data-learn-offer-bridge="early"');
  assert.ok(early > bonus.indexOf(">lead</p>") && early < bonus.indexOf('<h2 id="first-first">'), "early bridge sits between the introduction and the first heading");
  assert.equal((bonus.match(/data-learn-offer-bridge="early"/g) ?? []).length, 1);
  assert.equal((bonus.match(/data-learn-offer-bridge=""/g) ?? []).length, 1);
  assert.ok(bonus.indexOf('data-learn-offer-bridge=""') > bonus.indexOf(">b</p>"), "closing bridge follows the body");
  assert.match(bonus, /data-learn-offer-bridge="early"><p>Compare current bonuses by their terms<\/p><div><a data-learn-offer-bridge-link="bonuses" href="\/bonuses">Bonuses <span aria-hidden="true">→<\/span><\/a><a data-learn-offer-bridge-link="best-offers" href="\/best-offers">Best Offers <span aria-hidden="true">→<\/span><\/a><\/div><small>Commercial disclosure:/);
  assert.doesNotMatch(bonus, /data-learn-programme-bridge="article"/);

  for (const category of ["casino-safety", "payments"]) {
    const html = await renderArticle({ ...fixture, category, bodyBlocks: blocks }, casinoBridge);
    assert.equal((html.match(/data-learn-offer-bridge-link="casinos" href="\/casinos"/g) ?? []).length, 2, category);
    assert.equal((html.match(/data-learn-offer-bridge-link="best-offers" href="\/best-offers"/g) ?? []).length, 2, category);
    assert.doesNotMatch(html, /data-learn-offer-bridge-link="bonuses"/);
    assert.match(html, /aria-label="Ready to compare casinos\?"/);
    assert.match(html, /Compare the casinos we review by their terms/);
    assert.equal((html.match(/Commercial disclosure:/g) ?? []).length, 2, category);
    // The offer bridges replace the mid-guide Programme block; the closing Programme block stays.
    assert.doesNotMatch(html, /data-learn-programme-bridge="article"/);
    assert.match(html, />Start Programme<\/a>/);
    assert.doesNotMatch(html, /href="\/(?:r|go)\//);
  }

  // Without the gate (null bridge) ordinary guides keep the mid-guide Programme block and no offer links.
  const gated = await renderArticle({ ...fixture, category: "payments", bodyBlocks: blocks }, null);
  assert.doesNotMatch(gated, /data-learn-offer-bridge/);
  assert.match(gated, /data-learn-programme-bridge="article"/);
  // Protected guides stay commercial-free even if a bridge were supplied.
  const protectedGuide = await renderArticle({ ...fixture, category: "responsible-gambling", bodyBlocks: blocks }, bonusBridge);
  assert.doesNotMatch(protectedGuide, /data-learn-offer-bridge|href="\/(?:bonuses|casinos|best-offers)"/);

  // The route supplies the bridge only for these categories and only where offers may be presented.
  const route = read("app/(public)/learn/[category]/[slug]/page.tsx");
  assert.match(route, /primaryHref: productHref\(presentation, casinos \? "\/casinos" : "\/bonuses"\)/);
  assert.match(route, /bestOffersHref: productHref\(presentation, "\/best-offers"\)/);
  assert.match(route, /lead: casinos \? bridges\.casinoBridgeLead : bridges\.offerBridgeLead/);

  // Every locale has the new copy.
  const locales: SupportedLocale[] = ["en-GB", "de-DE", "it-IT", "es-ES", "es-PE", "pt-PT", "el-GR", "nl-NL", "sv-SE", "da-DK", "fi-FI", "nb-NO", "en-CA", "fr-CA"];
  for (const locale of locales) {
    const copy = learnBridgeMessages(locale);
    for (const key of ["offerBridgeBody", "offerBridgeLead", "casinoBridgeTitle", "casinoBridgeBody", "casinoBridgeLead"] as const) assert.ok(copy[key].trim(), `${locale} ${key}`);
  }
  assert.doesNotMatch(Object.values(learnBridgeMessages("de-DE")).join(" "), /casino|kasino/i);
});

test("package C: article first screen, header autohide and the Bonus Guide read next use real data", async () => {
  const html = await renderArticle({ ...fixture, category: "casino-basics" }, null);
  assert.match(html, /data-header-autohide=""/);
  // The breadcrumb names the category; the hero no longer repeats it above the title.
  assert.equal((html.match(/Category title/g) ?? []).length, 1);
  const view = read("app/(public)/learn/[category]/[slug]/LearningArticleView.tsx");
  assert.match(view, /\{preview \? <p className=\{styles\.kicker\}>Authenticated draft preview<\/p> : null\}/);
  assert.match(read("app/(public)/learn/[category]/[slug]/article-handoff.module.css"), /\.breadcrumbs \{[^}]*align-items:baseline;/);
  assert.match(read("app/(public)/learn/page.tsx"), /<HandoffPage headerAutoHide name="learn"/);
  assert.match(read("app/(public)/bonus-guide/page.tsx"), /<HandoffPage headerAutoHide name="article"/);
  assert.match(read("components/final-handoff/HandoffPage.tsx"), /data-header-autohide=\{headerAutoHide \? "" : undefined\}/);

  const articles = [
    guide("11", "responsible-gambling", "2026-09-25T00:00:00.000Z"),
    guide("12", "payments", "2026-09-24T00:00:00.000Z", { title: "Customer funds", readingTime: "3 min read" }),
    guide("13", "casino-basics", "2026-09-23T00:00:00.000Z"),
    guide("14", "casino-bonuses", "2026-09-22T00:00:00.000Z", { title: "Wagering requirements", readingTime: "4 min read" }),
    guide("15", "casino-bonuses", "2026-09-21T00:00:00.000Z", { title: "Welcome bonus terms", readingTime: "5 min read" }),
  ];
  const readNext = bonusGuideReadNextSelection(articles);
  assert.deepEqual(readNext.map((article) => article.slug), ["casino-bonuses-14", "casino-bonuses-15", "payments-12"]);
  assert.deepEqual(bonusGuideReadNextSelection([articles[0], articles[2]]).map((article) => article.slug), ["casino-basics-13"]);
  assert.deepEqual(bonusGuideReadNextSelection([articles[0]]), []);

  const common = transformCommonHandoff(generatedPages.article.html);
  const fakeTitles = /Free spins: value, weighting and the fine print|How casino payouts really work|Session limits that actually hold|\/learn\?category=/;
  const withGuides = transformBonusGuideHandoff(common, { readNext });
  assert.doesNotMatch(withGuides, fakeTitles);
  const cards = [...withGuides.matchAll(/<a href="([^"]+)" class="scp2" data-bonus-guide-read-next="" style="([^"]+)">[\s\S]*?<div [^>]*>([^<]+)<\/div>\s*<div [^>]*>([^<]+)<\/div>\s*<div [^>]*>([^<]+)<\/div>/g)];
  assert.deepEqual(cards.map((match) => [match[1], match[3], match[4], match[5]]), [
    ["/learn/casino-bonuses/casino-bonuses-14", "Casino Bonuses", "Wagering requirements", "4 min read"],
    ["/learn/casino-bonuses/casino-bonuses-15", "Casino Bonuses", "Welcome bonus terms", "5 min read"],
    ["/learn/payments/payments-12", "Payments", "Customer funds", "3 min read"],
  ]);
  // Dark ink on the cream card: the capture's global acid link colour never reaches the titles.
  for (const match of cards) assert.match(match[2], /color: rgb\(16, 15, 15\)/);
  assert.ok(withGuides.indexOf("data-bonus-guide-read-next") > withGuides.indexOf("Read next"));

  // Fewer guides render fewer cards; none removes the row instead of faking it.
  const one = transformBonusGuideHandoff(common, { readNext: readNext.slice(0, 1) });
  assert.equal((one.match(/data-bonus-guide-read-next=""/g) ?? []).length, 1);
  const none = transformBonusGuideHandoff(common);
  assert.doesNotMatch(none, fakeTitles);
  assert.doesNotMatch(none, /data-screen-label="Read next"|data-bonus-guide-read-next/);
  assert.match(read("app/(public)/bonus-guide/page.tsx"), /bonusGuideReadNextSelection\(await articleService\.listPublished\("en-GB", \{ take: 100 \}\)\.catch\(\(\) => \[\]\)\)/);
});
