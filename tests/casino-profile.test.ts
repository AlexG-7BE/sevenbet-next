import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { bonusTerms, casinoProfileFacts, casinoProfileFaq, governedVisitHref, publishedScore } from "../lib/casino-profile/presentation";
import type { PublicCasinoDTO } from "../lib/public-casino/public-casino.types";

function profile(overrides: Partial<PublicCasinoDTO> = {}): PublicCasinoDTO {
  return {
    source: "cms",
    id: "casino-1",
    slug: "truthful-casino",
    name: "Truthful Casino",
    title: "Truthful Casino",
    domain: "truthful.example",
    summary: "A published editorial summary.",
    reviewContent: "A published editorial review.",
    operator: null,
    foundedYear: null,
    editorScore: 0,
    trustScore: null,
    featured: false,
    recommended: false,
    publishedAt: "2026-08-01T00:00:00.000Z",
    lastReviewedAt: null,
    version: 1,
    languages: [],
    currencies: [],
    pros: [],
    cons: [],
    responsibleGamblingTools: [],
    seo: { title: "Truthful Casino review", description: "Published review", canonical: "https://sevenbet-next.vercel.app/casino/truthful-casino", robots: "index,follow", socialTitle: "Truthful Casino review", socialDescription: "Published review", socialImage: null, structuredData: null },
    licenses: [],
    countries: [],
    payments: [],
    providers: [],
    categories: [],
    bonuses: [],
    media: { logo: null, hero: null, screenshots: [], gallery: [], socialImage: null },
    affiliate: { href: null, available: false },
    ...overrides,
  };
}

test("Casino Profile exposes only governed internal visit paths", () => {
  assert.equal(governedVisitHref(profile({ affiliate: { href: "/r/truthful-casino", available: true } })), "/r/truthful-casino");
  assert.equal(governedVisitHref(profile({ affiliate: { href: "https://affiliate.example/secret", available: true } })), null);
  assert.equal(governedVisitHref(profile({ affiliate: { href: "/r/truthful-casino", available: false } })), null);
});

test("Casino Profile omits unknown ratings and facts instead of inventing claims", () => {
  const empty = profile();
  assert.equal(publishedScore(empty), null);
  assert.deepEqual(casinoProfileFacts(empty), []);
  assert.deepEqual(bonusTerms(undefined), []);
  assert.match(casinoProfileFaq(empty).at(-1)?.answer ?? "", /no commercial visit action/i);
});

test("Casino Profile presents only published DTO evidence", () => {
  const casino = profile({
    editorScore: 8.4,
    operator: "Published Operator Ltd",
    licenses: [{ authority: "Published Authority", licenseNumber: "LIC-1", jurisdiction: null, status: "ACTIVE", verificationUrl: null, expiresAt: null, lastVerifiedAt: null }],
    countries: [{ countryCode: "GB", availability: "AVAILABLE", minimumAge: null, currency: null, language: null }],
    payments: [{ key: "card", name: "Published Card", supportsDeposits: true, supportsWithdrawals: true, currencies: [], minimumDeposit: null, minimumWithdrawal: null, maximumWithdrawal: null, depositProcessingTime: null, withdrawalTime: null, fees: null, crypto: false }],
  });
  assert.equal(publishedScore(casino), 8.4);
  assert.deepEqual(casinoProfileFacts(casino).map((item) => item.label), ["Operator", "Published licence", "Published markets", "Payment methods"]);
  assert.doesNotMatch(JSON.stringify(casinoProfileFacts(casino)), /verified|best for|fast/i);
});

test("Casino Profile route keeps SSR, metadata, no-JS and unavailable-state boundaries", () => {
  const route = readFileSync("app/(public)/casino/[slug]/page.tsx", "utf8");
  const profileComponent = readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8");
  const outbound = readFileSync("components/casino-profile/CasinoOutboundAction.tsx", "utf8");
  const unavailable = readFileSync("components/casino-profile/CasinoProfileUnavailable.tsx", "utf8");
  assert.match(route, /dynamic = "force-dynamic"/);
  assert.match(route, /<CasinoProfile casino=\{casino\}/);
  assert.doesNotMatch(route, /publicCasinoToLegacy|https:\/\/\$\{casino\.domain\}/);
  assert.match(route, /reviewRating: score === null \? undefined/);
  assert.match(route, /if \(!casino\) notFound\(\)/);
  assert.match(profileComponent, /<article[^>]+data-casino-profile/);
  assert.match(profileComponent, /<details key=/);
  assert.match(profileComponent, /Offer unavailable/);
  assert.match(outbound, /href=\{href\}/);
  assert.match(outbound, /event\.preventDefault\(\)/);
  assert.match(outbound, /nofollow sponsored noopener/);
  assert.doesNotMatch(outbound, /target="_blank"|destinationUrl|trackingUrl/);
  assert.match(unavailable, /Nothing from a legacy fallback is rendered here/);
  assert.match(readFileSync("app/(public)/casino/[slug]/not-found.tsx", "utf8"), /CasinoProfileUnavailable/);
  assert.match(readFileSync("app/(public)/casino/[slug]/loading.tsx", "utf8"), /aria-busy="true"/);
});
