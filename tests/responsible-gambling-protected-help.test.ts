import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { protectedHelpResources } from "../components/protected-help/support-resources";

const page = readFileSync("app/help/page.tsx", "utf8");
const layout = readFileSync("app/help/layout.tsx", "utf8");
const hub = readFileSync("components/protected-help/ProtectedHelpHub.tsx", "utf8");
const shell = readFileSync("components/protected-help/ProtectedHelpShell.tsx", "utf8");
const css = readFileSync("components/protected-help/ProtectedHelp.module.css", "utf8");
const combined = `${page}\n${layout}\n${hub}\n${shell}\n${css}`;

test("Protected Help is a server-rendered route-scoped shell with one Hub h1", () => {
  assert.doesNotMatch(page, /["']use client["']/);
  assert.doesNotMatch(layout, /["']use client["']/);
  assert.match(layout, /<ProtectedHelpHeader \/>[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<ProtectedHelpFooter \/>/);
  assert.match(layout, /data-protected-help-shell="true"/);
  assert.doesNotMatch(layout, /PublicHeader|PublicFooter|getServerSession/);
  assert.equal((hub.match(/<h1\b/g) ?? []).length, 1);
  assert.match(hub, /aria-labelledby="protected-help-title"/);
});

test("critical Help content and links are available as ordinary server HTML", () => {
  assert.match(hub, /Get support[\s\S]*without offers\./i);
  assert.match(hub, /href="#next-actions"/);
  assert.match(hub, /href="#external-support"/);
  assert.match(hub, /protectedHelpResources\.map/);
  assert.doesNotMatch(hub, /useState|useEffect|onClick|dialog|localStorage|sessionStorage|fetch\(/);
  assert.doesNotMatch(css, /display:\s*none[^}]*resource|opacity:\s*0[^}]*resource/);
});

test("Hub hierarchy follows the approved desktop and mobile Protected Help family", () => {
  const approvedOrder = ["hero", "next-actions", "external-support", "privacy-boundary"];
  let cursor = -1;
  for (const section of approvedOrder) {
    const index = hub.indexOf(`data-help-section="${section}"`);
    assert.ok(index > cursor, `${section} must follow the previous approved section`);
    cursor = index;
  }
  assert.match(shell, /Protected Help navigation/);
  assert.match(shell, /Help stays non-commercial\./);
  assert.match(css, /grid-template-columns:\s*repeat\(4/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*grid-template-columns:\s*1fr/);
});

test("metadata is canonical, indexable and limited to truthful WebPage schemas", () => {
  assert.match(page, /canonical: absoluteUrl\("\/help"\)/);
  assert.match(page, /robots: \{ index: true, follow: true \}/);
  assert.match(page, /openGraph:/);
  assert.match(page, /twitter:/);
  assert.match(page, /"@type": "BreadcrumbList"/);
  assert.match(page, /"@type": "WebPage"/);
  assert.doesNotMatch(page, /"@type": "(?:MedicalWebPage|MedicalCondition|HowTo|Course|Product|Offer|AggregateRating|FAQPage)"/);
});

test("commercial and Programme-derived personalisation stay absent", () => {
  assert.doesNotMatch(combined, /CasinoCard|CasinoDiscovery|BestOffers|PublicOffers|Affiliate(?:Card|Service|Offer|Redirect)|href=["']\/(?:r|go|casinos|bonuses|best-offers)(?:\/|["'])|Visit casino|deposit now|claim bonus/iu);
  assert.doesNotMatch(combined, /@prisma\/client|prisma\.|programmeDashboardService|affiliate targeting event|trackingUrl|destinationUrl/iu);
  assert.doesNotMatch(combined, /cookies\(|headers\(|getServerSession|searchParams/);
  assert.match(hub, /does not save your choices here/);
  assert.match(hub, /Help activity for affiliate targeting, offer ranking or commercial personalisation/);
});

test("external resources are allowlisted, current and truthfully limited", () => {
  assert.deepEqual(protectedHelpResources, [
    {
      name: "GamCare",
      description: "Free gambling-harm support and information for people in the UK, including friends and family.",
      href: "https://www.gamcare.org.uk/get-support/",
      action: "Open GamCare",
      region: "UK support",
      verifiedOn: "2026-08-07",
    },
    {
      name: "GAMSTOP Online",
      description: "Free online self-exclusion for gambling websites and apps licensed in Great Britain.",
      href: "https://www.gamstop.co.uk/",
      action: "Open GAMSTOP",
      region: "Great Britain",
      verifiedOn: "2026-08-07",
    },
  ]);
  assert.match(hub, /https:\/\/www\.nhs\.uk\/live-well\/addiction-support\/gambling-addiction\//);
  assert.match(hub, /target="_blank"/);
  assert.match(hub, /rel="noopener noreferrer"/);
  assert.match(hub, /opens an external site in a new tab/);
  assert.doesNotMatch(combined, /\+?\d{3}[\d -]{5,}|24\/7|response time|guaranteed|diagnos(?:e|is)|treatment outcome/iu);
});

test("missing support data has a neutral, non-invented fallback", () => {
  assert.match(hub, /protectedHelpResources\.length > 0/);
  assert.match(hub, /No verified external support destination is available to show here/);
  assert.match(hub, /Check current details with an official provider for your location/);
  assert.doesNotMatch(hub, /default hotline|nearest service|we will connect|available in your area/iu);
});

test("accessibility and reduced-motion contracts are explicit", () => {
  assert.match(layout, /href="#main-content"/);
  assert.match(shell, /<header[\s\S]*<nav[\s\S]*<footer/);
  assert.match(hub, /<ol className=\{styles\.actionGrid\}>/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(combined, /autoFocus|outline:\s*none|transition:\s*all/);
});
