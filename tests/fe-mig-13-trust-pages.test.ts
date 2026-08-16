import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const affiliateRoute = read("app/(public)/affiliate-disclosure/page.tsx");
const affiliateDocument = read("app/(public)/affiliate-disclosure/AffiliateDisclosureDocument.tsx");
const affiliateCss = read("app/(public)/affiliate-disclosure/AffiliateDisclosurePage.module.css");
const aboutRoute = read("app/(public)/about/page.tsx");
const aboutDocument = read("app/(public)/about/AboutDocument.tsx");
const aboutCss = read("app/(public)/about/AboutPage.module.css");
const publicLayout = read("app/(public)/layout.tsx");

test("final Affiliate Disclosure is a server-rendered five-section document inside the Public Shell", () => {
  assert.doesNotMatch(affiliateRoute + affiliateDocument, /["']use client["']|useEffect|useState|localStorage|sessionStorage|fetch\(/);
  assert.match(publicLayout, /<PublicHeader[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<PublicFooter/);
  assert.equal((affiliateDocument.match(/<h1\b/g) ?? []).length, 1);
  assert.match(affiliateDocument, /data-affiliate-disclosure-document/);
  for (const heading of [
    "1. How B4GAMBLE is funded",
    "2. What commission can influence",
    "3. What commission cannot influence",
    "4. How commercial links are identified",
    "5. Corrections and further reading",
  ]) assert.ok(affiliateDocument.includes(heading), heading);
});

test("Affiliate Disclosure preserves the final handoff funding and editorial boundary", () => {
  for (const content of [
    "may receive a commission",
    "only revenue model",
    "Affiliate compensation does not determine Editor Score or natural editorial ranking",
    "Programme and Help data is never used",
    "Every commercial action passes through an outbound confirmation",
    "Errors are corrected within 48 hours",
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
  for (const title of ["The Programme", "Research & education", "Commercial discovery"]) assert.ok(aboutDocument.includes(title), title);
});

test("About keeps Programme, commercial, Help and clinical boundaries explicit", () => {
  for (const content of [
    "No paywall, no upsell",
    "nothing sponsored",
    "funded by disclosed commission",
    "Programme and Help data never feeds offers or rankings",
    "Protected Help contains no commercial content at all",
    "Not a casino",
    "Not a therapy service",
    "doesn&apos;t diagnose or treat",
  ]) assert.ok(aboutDocument.includes(content), content);
  assert.match(aboutDocument, /href="\/affiliate-disclosure"/);
  assert.doesNotMatch(aboutDocument, /href="\/(?:r|go|compare)/);
});

test("metadata and breadcrumb schemas match the final visible documents", () => {
  assert.match(affiliateRoute, /canonical: absoluteUrl\("\/affiliate-disclosure"\)/);
  assert.match(aboutRoute, /canonical: absoluteUrl\("\/about"\)/);
  assert.match(affiliateRoute, /BreadcrumbList/);
  assert.match(aboutRoute, /BreadcrumbList/);
  assert.doesNotMatch(affiliateRoute + aboutRoute, /FAQPage|AggregateRating|Product|Offer/);
});

test("final trust pages stay responsive and use bounded local visual assets", () => {
  assert.match(affiliateCss, /@media\(max-width:700px\)/);
  assert.match(aboutCss, /@media\(max-width:800px\)/);
  assert.match(aboutCss, /url\('\/home\/hero-outcome\.jpg'\)/);
  assert.doesNotMatch(affiliateCss + aboutCss, /https?:\/\/|transition:\s*all|outline:\s*none/);
});
