import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { PublicArticle } from "../lib/articles/article-types";
import generatedPages from "../lib/final-handoff/generated-pages.json";
import { transformBonusGuideHandoff, transformCommonHandoff } from "../lib/final-handoff/transforms";

const read = (path: string) => readFileSync(path, "utf8");
const route = read("app/(public)/bonus-guide/page.tsx");
const document = transformBonusGuideHandoff(transformCommonHandoff(generatedPages.article.html));
const publishedGuide = (slug: string, category: string, title: string): PublicArticle => ({
  id: `00000000-0000-4000-8000-${String(slug.length).padStart(12, "0")}`,
  slug,
  locale: "en-GB",
  title,
  excerpt: "A published guide used as a Read next fixture.",
  category,
  tags: [],
  status: "PUBLISHED",
  bodyBlocks: [{ id: "intro", type: "paragraph", text: "Visible body." }],
  heroImageUrl: null,
  heroImageAlt: null,
  seoTitle: null,
  seoDescription: null,
  canonicalUrl: null,
  readingTime: "4 min read",
  difficulty: null,
  publishedAt: "2026-09-17T00:00:00.000Z",
  lastReviewedAt: null,
  archivedAt: null,
  createdAt: "2026-09-17T00:00:00.000Z",
  updatedAt: "2026-09-17T00:00:00.000Z",
  createdBy: "00000000-0000-4000-8000-000000000002",
  updatedBy: "00000000-0000-4000-8000-000000000002",
});
const readNext = [
  publishedGuide("wagering-requirements", "casino-bonuses", "Wagering requirements"),
  publishedGuide("payments-withdrawals", "payments", "Payments and withdrawals"),
];
const documentWithReadNext = transformBonusGuideHandoff(transformCommonHandoff(generatedPages.article.html), { readNext });
const css = generatedPages.article.css;
const publicLayout = read("app/(public)/layout.tsx");

test("Bonus Guide is a standalone server-rendered document inside the Public Shell", () => {
  assert.doesNotMatch(route + document, /["']use client["']|useEffect|useState|localStorage|sessionStorage/);
  assert.match(publicLayout, /<PublicHeader[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<PublicFooter/);
  assert.equal((document.match(/<h1\b/g) ?? []).length, 1);
  assert.match(route, /<HandoffPage headerAutoHide name="article" transform=\{\(html\) => transformBonusGuideHandoff\(html, \{ offerBridge: bridge, readNext \}\)\} \/>/);
  assert.doesNotMatch(document, /PublicHeader|PublicFooter/);
});

test("Bonus Guide preserves the visual article while qualifying fictional calculations", () => {
  for (const content of [
    "Wagering requirements,",
    "explained with real numbers.",
    "The hypothetical 35x example",
    "Required turnover — 200 × 35",
    "Simplified theoretical loss at 96% RTP",
    "Comparing fictional examples",
    "Game weighting",
    "Comparing turnover",
    "Before you accept any bonus",
  ]) assert.ok(document.includes(content), content);
  assert.match(document, /Educational examples · not current offers/);
  assert.match(document, /not current eligible GB offers/);
  assert.doesNotMatch(document, /Not sponsored · real-money tested|current test set|10–15x/);
});

test("prototype offer examples remain editorial and cannot become commercial actions", () => {
  assert.doesNotMatch(document, /CasinoOutboundAction|CommercialHandoff|href="\/(?:r|go)\//);
  assert.doesNotMatch(document, /publicOfferService|@prisma\/client|prisma\./);
  assert.match(document, /fictional records show why the wagering base/i);
  assert.match(document, /current promotions or test results/i);
});

test("claims-review records contain only the checked UKGC and ASA primary sources", () => {
  assert.match(document, /gamblingcommission\.gov\.uk\/licensees-and-businesses\/lccp\/condition\/5-1-1-sr-code/);
  assert.match(document, /asa\.org\.uk\/advice-online\/gambling-betting-and-gaming-free-bets-and-bonuses\.html/);
  assert.equal((document.match(/Checked 18 August 2026/g) ?? []).length, 1);
  assert.match(document, /rel="noopener noreferrer"/);
  assert.match(document, /opens in a new tab/);
});

test("metadata and structured data describe only visible production content", () => {
  assert.match(route, /title: "Casino Bonus Terms Guide \| B4GAMBLE"/);
  assert.match(route, /canonical: absoluteUrl\("\/bonus-guide"\)/);
  assert.match(route, /BreadcrumbList/);
  assert.doesNotMatch(route, /FAQPage|mainEntity|bonusGuideFaq/);
});

test("document order and transitions stay within Learn, Help and Programme", () => {
  const order = ["The hypothetical 35x example", "Comparing fictional examples", "Game weighting", "Comparing turnover", "The checklist", "Current primary sources", "Read next", "Beyond reading"];
  let cursor = -1;
  for (const marker of order) {
    const index = documentWithReadNext.indexOf(marker, cursor + 1);
    assert.ok(index > cursor, marker);
    cursor = index;
  }
  for (const href of ['href="/learn"', 'href="/help"', 'href="/program\\?entry=start"']) assert.match(document, new RegExp(href));
});

test("Read next shows only real published guides, in dark ink, and disappears when there are none", () => {
  const fake = /Free spins: value, weighting and the fine print|How casino payouts really work|Session limits that actually hold|\/learn\?category=/;
  assert.doesNotMatch(documentWithReadNext, fake);
  assert.doesNotMatch(document, fake);
  assert.doesNotMatch(document, /data-screen-label="Read next"/);
  assert.equal((documentWithReadNext.match(/data-bonus-guide-read-next=""/g) ?? []).length, 2);
  assert.match(documentWithReadNext, /<a href="\/learn\/casino-bonuses\/wagering-requirements" class="scp2" data-bonus-guide-read-next="" style="display: block;[^"]*color: rgb\(16, 15, 15\);/);
  assert.match(documentWithReadNext, />Casino Bonuses<\/div>\s*<div [^>]*>Wagering requirements<\/div>\s*<div [^>]*>4 min read<\/div>/);
  assert.match(documentWithReadNext, /href="\/learn\/payments\/payments-withdrawals"/);
  assert.match(route, /bonusGuideReadNextSelection\(await articleService\.listPublished\("en-GB"/);
});

test("responsive reading layout gives the wide table a keyboard-scroll region", () => {
  assert.match(css, /@media \(max-width: 1000px\)/);
  assert.match(document, /grid-template-columns: 2fr 1fr 1fr 1fr/);
  assert.doesNotMatch(css, /transition:\s*all|outline:\s*none/);
});

test("the checklist leads to current offers only where offers may be presented, with the disclosure beside the links", () => {
  const route = read("app/(public)/bonus-guide/page.tsx");
  assert.match(route, /offersMayBePresented\(presentation\.marketCountryCode\) \? offerBridge\(\) : null/);
  assert.doesNotMatch(document, /data-learn-offer-bridge/);
  const bridged = transformBonusGuideHandoff(transformCommonHandoff(generatedPages.article.html), { offerBridge: { title: "READY TO APPLY THE CHECKLIST?", body: "Check what you just learned against current offers and their terms.", bonusesLabel: "Bonuses", bestOffersLabel: "Best Offers", disclosure: "Commercial disclosure: B4GAMBLE may receive compensation from some outbound links reached later. Rankings remain editorial.", bonusesHref: "/bonuses", bestOffersHref: "/best-offers" } });
  assert.equal((bridged.match(/data-learn-offer-bridge=""/g) ?? []).length, 1);
  assert.ok(bridged.indexOf("data-learn-offer-bridge") > bridged.indexOf("Before you accept any bonus"));
  assert.ok(bridged.indexOf("data-learn-offer-bridge") < bridged.indexOf("data-bonus-guide-sources"));
  assert.match(bridged, /href="\/bonuses" data-learn-offer-bridge-link="bonuses"/);
  assert.match(bridged, /href="\/best-offers" data-learn-offer-bridge-link="best-offers"/);
  assert.match(bridged, /Commercial disclosure: B4GAMBLE may receive compensation/);
  assert.doesNotMatch(bridged, /href="\/(?:r|go)\//);
});
