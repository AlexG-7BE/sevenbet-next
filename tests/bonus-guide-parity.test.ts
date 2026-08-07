import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("app/(public)/bonus-guide/page.tsx", "utf8");
const document = readFileSync("app/(public)/bonus-guide/BonusGuideDocument.tsx", "utf8");
const css = readFileSync("app/(public)/bonus-guide/BonusGuidePage.module.css", "utf8");
const publicLayout = readFileSync("app/(public)/layout.tsx", "utf8");

test("Bonus Guide is a server-rendered document inside the unchanged Public Shell", () => {
  assert.doesNotMatch(route, /["']use client["']/);
  assert.doesNotMatch(document, /["']use client["']|useEffect|useState|localStorage|sessionStorage/);
  assert.match(publicLayout, /<PublicHeader[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<PublicFooter/);
  assert.doesNotMatch(document, /PublicHeader|PublicFooter|<footer/);
  assert.equal((document.match(/<h1\b/g) ?? []).length, 1);
  assert.match(document, /<article[\s\S]*data-bonus-guide/);
});

test("approved Bonus Guide desktop and mobile Figma authorities are explicit", () => {
  for (const nodeId of [
    "694:5455", "694:5461", "694:5531", "694:5542", "694:5551",
    "694:8724", "694:8730", "694:8787", "694:8800", "694:8809",
  ]) assert.ok(document.includes(nodeId), `missing Figma authority ${nodeId}`);
});

test("current GB example replaces both stale multipliers without claiming an offer", () => {
  assert.doesNotMatch(document, /x35|35\s*[×x]|30\s*[×x]|£600/iu);
  for (const content of [
    "Worked example — illustrative",
    "£20",
    "10× bonus",
    "£200",
    "current Great Britain regulatory ceiling",
    "not a current operator offer",
    "not a default or recommendation",
  ]) assert.ok(document.includes(content), `missing worked-example safeguard: ${content}`);
  assert.doesNotMatch(document, /Northstar|Harbour|Atlas|Juniper|Claim Bonus|Play Now/iu);
});

test("evidence records contain only the checked UKGC and ASA primary sources", () => {
  assert.match(document, /gamblingcommission\.gov\.uk\/licensees-and-businesses\/lccp\/condition\/5-1-1-sr-code/);
  assert.match(document, /asa\.org\.uk\/advice-online\/gambling-betting-and-gaming-free-bets-and-bonuses\.html/);
  assert.equal((document.match(/checked: "07 Aug 2026"/g) ?? []).length, 2);
  assert.equal((document.match(/Source checked/g) ?? []).length, 1);
  assert.doesNotMatch(document, /Reviewed by Compliance|Compliance reviewed|02 Aug 2026|VERIFIED/);
  assert.match(document, /If a required official source becomes unavailable[\s\S]*never replaced with an offer or invented summary/);
});

test("FAQ schema, visible FAQ and metadata share production sources", () => {
  assert.match(route, /mainEntity: bonusGuideFaq\.map/);
  assert.match(document, /bonusGuideFaq\.map/);
  assert.match(route, /title: "Casino Bonus Terms Guide \| SevenBet"/);
  assert.match(route, /Learn how to read wagering, max-bet, expiry, deposit, and withdrawal terms before considering an offer\./);
  assert.match(route, /canonical: absoluteUrl\("\/bonus-guide"\)/);
  assert.match(route, /BreadcrumbList/);
  assert.match(route, /FAQPage/);
});

test("related reading resolves current Learning records and the late transition stays internal", () => {
  for (const slug of ["welcome-bonus-terms", "casino-licenses-explained", "responsible-gambling-tools"]) {
    assert.ok(document.includes(`"${slug}"`), `missing current Learning record ${slug}`);
  }
  const evidenceIndex = document.indexOf('id="evidence-sources"');
  const faqIndex = document.indexOf('id="faq"');
  const relatedIndex = document.indexOf('id="related-reading"');
  const commercialIndex = document.indexOf("commercialTransition");
  assert.ok(evidenceIndex < faqIndex && faqIndex < relatedIndex && relatedIndex < commercialIndex);
  assert.match(document, /href="\/bonuses">Compare published offers/);
  assert.doesNotMatch(document, /href="\/(?:r|go)\//);
  assert.doesNotMatch(document, /tools\/budget-calculator|https?:\/\/(?!www\.gamblingcommission\.gov\.uk|www\.asa\.org\.uk)/);
});

test("responsive and accessible layout contracts remain route scoped", () => {
  assert.match(css, /grid-template-columns: minmax\(0, 820px\) minmax\(220px, 272px\)/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /@media \(max-width: 375px\)/);
  assert.doesNotMatch(css, /overflow-x:\s*auto/);
  assert.match(document, /<nav className=\{styles\.toc\} aria-label="On this page">/);
  assert.match(document, /<details key=\{question\}>/);
  assert.match(document, /opens in a new tab/);
});
