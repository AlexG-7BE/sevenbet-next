import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("app/(public)/methodology/page.tsx", "utf8");
const document = readFileSync("app/(public)/methodology/MethodologyDocument.tsx", "utf8");
const css = readFileSync("app/(public)/methodology/MethodologyPage.module.css", "utf8");
const layout = readFileSync("app/(public)/layout.tsx", "utf8");

test("methodology remains a server-rendered document inside the approved Public Shell", () => {
  assert.doesNotMatch(route, /["']use client["']/);
  assert.doesNotMatch(document, /["']use client["']|useEffect|useState|localStorage|sessionStorage/);
  assert.match(layout, /<PublicHeader[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<PublicFooter/);
  assert.doesNotMatch(document, /<header[^>]*data-public-shell|<footer|PublicHeader|PublicFooter/);
  assert.equal((document.match(/<h1\b/g) ?? []).length, 1);
  assert.match(document, /data-methodology-document/);
});

test("current Editor's Score weights, criteria, limitations and commercial separation are preserved", () => {
  for (const weight of [
    '["Licensing and operator transparency", 20]',
    '["Bonus clarity and fairness", 20]',
    '["Payments and withdrawal conditions", 20]',
    '["Responsible gambling tools", 15]',
    '["Website usability and information clarity", 10]',
    '["Customer support information", 10]',
    '["Account rules and restrictions", 5]',
  ]) assert.ok(document.includes(weight), `missing current weight ${weight}`);

  for (const content of [
    "10-point Editor&apos;s Score",
    "Promotional terms availability",
    "Bonus-related withdrawal conditions",
    "External support links",
    "SevenBet does not guarantee winnings, withdrawals, operator conduct, or dispute outcomes",
    "Affiliate status does not automatically produce a higher score",
  ]) assert.ok(document.includes(content), `missing current methodology content: ${content}`);

  assert.match(document, /href="\/affiliate-disclosure"/);
  assert.doesNotMatch(document, /href="\/r\//);
  assert.doesNotMatch(document, /Prisma|scoring engine|calculateScore/);
});

test("TOC anchors resolve to semantic document sections", () => {
  const hrefs = [...document.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(hrefs, ["review-process", "editors-score", "evaluation-criteria", "updates-corrections"]);
  for (const id of hrefs) assert.match(document, new RegExp(`id="${id}"`));
});

test("FAQ schema uses the same structured FAQ source as visible content", () => {
  assert.match(route, /mainEntity: methodologyFaqItems\.map/);
  assert.match(document, /methodologyFaqItems\.map/);
  assert.equal((document.match(/^\s{4}"[^"\n]+",$/gm) ?? []).length >= 16, true);
});

test("metadata and responsive contracts remain explicit", () => {
  assert.match(route, /alternates: \{ canonical: absoluteUrl\("\/methodology"\) \}/);
  assert.match(route, /BreadcrumbList/);
  assert.match(route, /FAQPage/);
  assert.match(document, /Last updated[\s\S]*July 12, 2026/);
  assert.match(css, /grid-template-columns: 256px minmax\(0, 840px\)/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 375px\)/);
  assert.doesNotMatch(css, /overflow-x:\s*auto/);
});
