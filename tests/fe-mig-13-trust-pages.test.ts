import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const affiliateRoute = readFileSync("app/(public)/affiliate-disclosure/page.tsx", "utf8");
const affiliateDocument = readFileSync("app/(public)/affiliate-disclosure/AffiliateDisclosureDocument.tsx", "utf8");
const affiliateCss = readFileSync("app/(public)/affiliate-disclosure/AffiliateDisclosurePage.module.css", "utf8");
const aboutRoute = readFileSync("app/(public)/about/page.tsx", "utf8");
const aboutDocument = readFileSync("app/(public)/about/AboutDocument.tsx", "utf8");
const aboutCss = readFileSync("app/(public)/about/AboutPage.module.css", "utf8");
const publicLayout = readFileSync("app/(public)/layout.tsx", "utf8");

test("Affiliate Disclosure is a server-rendered four-section document inside the Public Shell", () => {
  assert.doesNotMatch(affiliateRoute, /["']use client["']/);
  assert.doesNotMatch(affiliateDocument, /["']use client["']|useEffect|useState|localStorage|sessionStorage|fetch\(/);
  assert.match(publicLayout, /<PublicHeader[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<PublicFooter/);
  assert.doesNotMatch(affiliateDocument, /<footer|PublicHeader|PublicFooter/);
  assert.equal((affiliateDocument.match(/<h1\b/g) ?? []).length, 1);
  assert.match(affiliateDocument, /data-affiliate-disclosure-document/);

  const ids = ["commercial-relationship", "editorial-boundary", "reader-verification", "corrections"];
  let cursor = -1;
  for (const id of ids) {
    const index = affiliateDocument.indexOf(`id: "${id}"`);
    assert.ok(index > cursor, `${id} must follow the approved order`);
    cursor = index;
    assert.match(affiliateDocument, new RegExp(`href=\\{\`#\\$\\{section\\.id\\}\`\\}`));
  }
});

test("Affiliate Disclosure keeps commercial claims qualified and exposes only Methodology", () => {
  for (const content of [
    "Some links on SevenBet may be affiliate links",
    "SevenBet may receive a commission",
    "Not every operator",
    "should not automatically determine review scores or rankings",
    "should not remove negative findings",
    "A paid link is not proof",
  ]) assert.ok(affiliateDocument.includes(content), `missing Affiliate content: ${content}`);

  assert.match(affiliateDocument, /href="\/methodology"/);
  assert.doesNotMatch(affiliateDocument, /href="\/(?:r|go|casinos|bonuses|best-offers|compare)(?:\/|"|\?)/);
  assert.doesNotMatch(affiliateDocument, /Play now|Claim bonus|Browse Casino|casino recommendations/iu);
  assert.doesNotMatch(affiliateDocument, /affiliate revenue can never affect ranking/iu);
});

test("About implements the corrected approved visual family, not the retired four-section document", () => {
  assert.doesNotMatch(aboutRoute, /["']use client["']/);
  assert.doesNotMatch(aboutDocument, /["']use client["']|useEffect|useState|localStorage|sessionStorage|fetch\(/);
  assert.doesNotMatch(aboutDocument, /<footer|PublicHeader|PublicFooter/);
  assert.equal((aboutDocument.match(/<h1\b/g) ?? []).length, 1);
  assert.match(aboutDocument, /data-about-document/);
  assert.match(aboutDocument, /data-figma-family="835:5298"/);
  assert.match(aboutDocument, /data-figma-desktop="835:5301"/);
  assert.match(aboutDocument, /data-figma-mobile="835:5436"/);
  assert.doesNotMatch(aboutDocument, /CLARITY BEFORE|MAKE COMPLEX TERMS LEGIBLE|NO WINNING PROMISES|18\+ · ADULTS ONLY/);

  const sections = ["hero", "operating-model", "clear-boundaries", "editorial-principles", "six-step-flow", "what-sevenbet-builds"];
  let cursor = -1;
  for (const section of sections) {
    const index = aboutDocument.indexOf(`data-about-section="${section}"`);
    assert.ok(index > cursor, `${section} must follow the approved 835:5298 order`);
    cursor = index;
  }
});

test("About keeps the approved boundary, principles, flow separation, and output contracts", () => {
  for (const content of [
    "No financial advice",
    "No medical or psychological treatment",
    "No guaranteed outcomes",
    "No casino operation",
    "No licensing authority",
    "No dispute resolution",
    "Visible affiliate disclosure",
    "Programme or self-check",
    "No Programme reward for casino, bonus, affiliate or commercial action",
    "Reflection data does not personalize offers",
    "Comparison comes after context",
    "Structured reviews and comparisons remain informational",
    "Protected Help",
    "No casino, bonus or affiliate prompts",
  ]) assert.ok(aboutDocument.includes(content), `missing About content: ${content}`);

  assert.doesNotMatch(aboutDocument, /href=|<Link\b|Play now|Claim bonus|Browse Casino|Start (?:the )?10-Step/iu);
  assert.doesNotMatch(aboutDocument, /tracking|affiliate parameters|searchParams|cookies\(/);
  assert.match(aboutCss, /fresh-interruption\.png/);
});

test("metadata and structured data match the visible documents", () => {
  assert.match(affiliateRoute, /canonical: absoluteUrl\("\/affiliate-disclosure"\)/);
  assert.match(aboutRoute, /canonical: absoluteUrl\("\/about"\)/);
  assert.match(affiliateRoute, /BreadcrumbList/);
  assert.match(aboutRoute, /BreadcrumbList/);
  assert.doesNotMatch(affiliateRoute, /FAQPage|faqSchema|affiliateFaqItems/);
  assert.doesNotMatch(aboutRoute, /FAQPage|faqSchema|aboutFaqItems/);
  assert.equal((affiliateRoute.match(/application\/ld\+json/g) ?? []).length, 1);
  assert.equal((aboutRoute.match(/application\/ld\+json/g) ?? []).length, 1);
});

test("responsive, accessibility, and reduced-motion contracts are explicit", () => {
  for (const css of [affiliateCss, aboutCss]) {
    assert.match(css, /@media \(max-width: 900px\)/);
    assert.match(css, /@media \(max-width: 375px\)/);
    assert.match(css, /@media \(max-width: 330px\)/);
    assert.match(css, /:focus-visible/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
    assert.doesNotMatch(css, /overflow-x:\s*auto|transition:\s*all|outline:\s*none/);
  }
  assert.match(affiliateCss, /grid-template-columns: 256px minmax\(0, 840px\)/);
  assert.match(aboutCss, /grid-template-columns: repeat\(6, 1fr\)/);
  assert.match(aboutCss, /max-width: 1279px/);
});
