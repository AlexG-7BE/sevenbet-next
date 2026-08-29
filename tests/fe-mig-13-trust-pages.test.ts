import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const affiliateRoute = read("app/(public)/affiliate-disclosure/page.tsx");
const affiliateDocument = read("app/(public)/affiliate-disclosure/AffiliateDisclosureDocument.tsx");
const affiliateCss = read("app/(public)/affiliate-disclosure/AffiliateDisclosurePage.module.css");
const aboutRoute = read("app/(public)/about/page.tsx");
const aboutDocument = read("app/(public)/about/AboutDocument.tsx");
const aboutCatalog = read("lib/i18n/static-pages/about.ts");
const aboutCss = read("app/(public)/about/AboutPage.module.css");
const productMetadata = read("lib/market/product-context.ts");
const publicLayout = read("app/(public)/layout.tsx");

test("final Affiliate Disclosure is a server-rendered seven-section document inside the Public Shell", () => {
  assert.doesNotMatch(affiliateRoute + affiliateDocument, /["']use client["']|useEffect|useState|localStorage|sessionStorage|fetch\(/);
  assert.match(publicLayout, /<PublicHeader[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<PublicFooter/);
  assert.equal((affiliateDocument.match(/<h1\b/g) ?? []).length, 1);
  assert.match(affiliateDocument, /data-affiliate-disclosure-document/);
  for (const heading of [
    "1. The commercial relationship",
    "2. How we label commercial content",
    "3. What compensation can influence",
    "4. What compensation does not determine",
    "5. Offers and significant conditions",
    "6. Sponsored and demonstration content",
    "7. Method and corrections",
  ]) assert.ok(affiliateDocument.includes(heading), heading);
});

test("Affiliate Disclosure preserves the final handoff funding and editorial boundary", () => {
  for (const content of [
    "may pay 7BE Inc. a commission",
    "A working affiliate route exists only when",
    "Affiliate compensation does not determine Editor Score or natural editorial ranking",
    "Programme, protected Help, pause, self-check and vulnerability information is not used",
    "An active commercial action is labelled",
    "Corrections are reviewed and dated",
  ]) assert.ok(affiliateDocument.includes(content), content);
  assert.match(affiliateDocument, /href="\/methodology"/);
  assert.match(affiliateDocument, /href="\/contact"/);
  assert.doesNotMatch(affiliateDocument, /href="\/(?:r|go|casinos|bonuses|best-offers|compare)/);
});

test("About implements the final handoff three-part product family", () => {
  assert.doesNotMatch(aboutRoute + aboutDocument, /["']use client["']|useEffect|useState|localStorage|sessionStorage|fetch\(/);
  assert.equal((aboutDocument.match(/<h1\b/g) ?? []).length, 1);
  assert.match(aboutDocument, /data-about-document/);
  const sections = ["hero", "three-parts", "commercial-separation", "clear-lines"];
  let cursor = -1;
  for (const section of sections) {
    const index = aboutDocument.indexOf(`data-about-section="${section}"`);
    assert.ok(index > cursor, section);
    cursor = index;
  }
  for (const title of ["The Programme", "Research & education", "Commercial discovery"]) assert.ok(aboutCatalog.includes(title), title);
});

test("About keeps Programme, commercial, Help and clinical boundaries explicit", () => {
  for (const content of [
    "free-to-use, self-directed 10-step Programme",
    "guides explain material terms in plain language",
    "B4GAMBLE may earn commission",
    "Programme and Help data never feeds offers or rankings",
    "Protected Help contains no casino, bonus or affiliate actions",
    "Not a casino",
    "Not a therapy service",
    "does not diagnose or treat",
  ]) assert.ok(aboutCatalog.includes(content), content);
  assert.match(aboutDocument, /href="\/affiliate-disclosure"/);
  assert.doesNotMatch(aboutDocument, /href="\/(?:r|go|compare)/);
});

test("metadata matches the final visible trust documents without commercial schema", () => {
  assert.match(affiliateRoute, /canonical: absoluteUrl\("\/affiliate-disclosure"\)/);
  assert.match(aboutRoute, /productMetadata\(\{ presentation, pathname: "\/about"/);
  assert.match(productMetadata, /const canonical = absoluteUrl\(productCanonicalPath/);
  assert.doesNotMatch(affiliateRoute + aboutRoute, /FAQPage|AggregateRating|Product|Offer/);
});

test("final trust pages stay responsive and use bounded local visual assets", () => {
  assert.match(affiliateCss, /@media\(max-width:700px\)/);
  assert.match(aboutCss, /@media\(max-width:800px\)/);
  assert.match(aboutCss, /url\('\/home\/hero-outcome\.jpg'\)/);
  assert.doesNotMatch(affiliateCss + aboutCss, /https?:\/\/|transition:\s*all|outline:\s*none/);
});
