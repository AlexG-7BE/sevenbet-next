import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const route = read("app/(public)/bonus-guide/page.tsx");
const document = read("app/(public)/bonus-guide/BonusGuideDocument.tsx");
const css = read("app/(public)/bonus-guide/BonusGuidePage.module.css");
const publicLayout = read("app/(public)/layout.tsx");

test("Bonus Guide is a standalone server-rendered document inside the Public Shell", () => {
  assert.doesNotMatch(route + document, /["']use client["']|useEffect|useState|localStorage|sessionStorage/);
  assert.match(publicLayout, /<PublicHeader[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<PublicFooter/);
  assert.equal((document.match(/<h1\b/g) ?? []).length, 1);
  assert.match(document, /<article[\s\S]*data-bonus-guide/);
  assert.doesNotMatch(document, /PublicHeader|PublicFooter/);
});

test("Draft Preview preserves the supplied final editorial article and calculations", () => {
  for (const content of [
    "Wagering requirements,",
    "explained with real numbers.",
    "What 35x really means",
    "Required turnover — 200 × 35",
    "Expected loss at 96% RTP slots",
    "The maths on a real offer",
    "Game weighting — the quiet tax",
    "When smaller wins",
    "Before you accept any bonus",
  ]) assert.ok(document.includes(content), content);
  assert.match(document, /Not sponsored · real-money tested/);
});

test("prototype offer examples remain editorial and cannot become commercial actions", () => {
  assert.doesNotMatch(document, /CasinoOutboundAction|CommercialHandoff|href="\/(?:r|go)\//);
  assert.doesNotMatch(document, /publicOfferService|@prisma\/client|prisma\./);
  assert.match(document, /The Draft Preview preserves the supplied article above/);
  assert.match(document, /Current GB regulatory sources remain attached for the claims review/);
});

test("claims-review records contain only the checked UKGC and ASA primary sources", () => {
  assert.match(document, /gamblingcommission\.gov\.uk\/licensees-and-businesses\/lccp\/condition\/5-1-1-sr-code/);
  assert.match(document, /asa\.org\.uk\/advice-online\/gambling-betting-and-gaming-free-bets-and-bonuses\.html/);
  assert.equal((document.match(/Checked 07 Aug 2026/g) ?? []).length, 1);
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
  const order = ['id="meaning"', 'id="maths"', 'id="weighting"', 'id="smaller"', 'id="checklist"', "Current source record", "Read next", "Beyond reading"];
  let cursor = -1;
  for (const marker of order) {
    const index = document.indexOf(marker, cursor + 1);
    assert.ok(index > cursor, marker);
    cursor = index;
  }
  for (const href of ['href="/learn"', 'href="/help"', 'href="/program"']) assert.match(document, new RegExp(href));
});

test("responsive reading layout gives the wide table a keyboard-scroll region", () => {
  assert.match(css, /grid-template-columns:240px minmax\(0,720px\)/);
  assert.match(css, /@media\(max-width:800px\)/);
  assert.match(css, /@media\(max-width:500px\)/);
  assert.match(document, /role="region" tabIndex=\{0\}/);
  assert.match(document, /scroll horizontally on narrow screens/);
  assert.doesNotMatch(css, /transition:\s*all|outline:\s*none/);
});
