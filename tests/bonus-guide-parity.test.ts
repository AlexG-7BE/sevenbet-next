import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import generatedPages from "../lib/final-handoff/generated-pages.json";
import { transformBonusGuideHandoff, transformCommonHandoff } from "../lib/final-handoff/transforms";

const read = (path: string) => readFileSync(path, "utf8");
const route = read("app/(public)/bonus-guide/page.tsx");
const document = transformBonusGuideHandoff(transformCommonHandoff(generatedPages.article.html));
const css = generatedPages.article.css;
const publicLayout = read("app/(public)/layout.tsx");

test("Bonus Guide is a standalone server-rendered document inside the Public Shell", () => {
  assert.doesNotMatch(route + document, /["']use client["']|useEffect|useState|localStorage|sessionStorage/);
  assert.match(publicLayout, /<PublicHeader[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<PublicFooter/);
  assert.equal((document.match(/<h1\b/g) ?? []).length, 1);
  assert.match(route, /<HandoffPage name="article" transform=\{transformBonusGuideHandoff\}/);
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
    const index = document.indexOf(marker, cursor + 1);
    assert.ok(index > cursor, marker);
    cursor = index;
  }
  for (const href of ['href="/learn"', 'href="/help"', 'href="/program\\?entry=start"']) assert.match(document, new RegExp(href));
});

test("responsive reading layout gives the wide table a keyboard-scroll region", () => {
  assert.match(css, /@media \(max-width: 1000px\)/);
  assert.match(document, /grid-template-columns: 2fr 1fr 1fr 1fr/);
  assert.doesNotMatch(css, /transition:\s*all|outline:\s*none/);
});
