import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  profileAction,
  profileFacts,
  profileFaqItems,
  profileOfferHeadline,
  profileReviewFreshness,
  selectProfileBonus,
} from "../lib/casino-profile/presentation";
import { casinoProfileMetadata, casinoProfileSchemas } from "../lib/casino-profile/seo";
import type { CasinoEditorialDocument } from "../lib/editorial-review/types";
import { mapPublishedCasino } from "../lib/public-casino/public-casino.mapper";
import type { PublicCasinoDTO } from "../lib/public-casino/public-casino.types";

function casino(patch: Partial<PublicCasinoDTO> = {}): PublicCasinoDTO {
  return {
    source: "cms", id: "casino-id", slug: "published-casino", name: "Published Casino", title: "Published Casino",
    domain: "operator.example", summary: "Published factual summary.", reviewContent: "Published editorial review.", operator: "Published Operator",
    foundedYear: 2020, editorScore: 8.7, trustScore: 8.1, featured: false, recommended: false,
    publishedAt: "2030-01-01T00:00:00.000Z", lastReviewedAt: "2030-02-03T00:00:00.000Z", version: 3,
    languages: ["en"], currencies: ["GBP"], pros: ["Published strength"], cons: ["Published limitation"],
    responsibleGamblingTools: ["Deposit limits"],
    seo: {
      title: "Published Casino review | SevenBet", description: "Published metadata description.", canonical: "https://sevenbet-next.vercel.app/casino/published-casino",
      robots: "index,follow", socialTitle: "Published social title", socialDescription: "Published social description", socialImage: "https://media.example/social.png", structuredData: null,
    },
    licenses: [{ authority: "Published Authority", licenseNumber: null, jurisdiction: "GB", status: "ACTIVE", verificationUrl: null, expiresAt: null, lastVerifiedAt: "2030-01-15T00:00:00.000Z" }],
    countries: [{ countryCode: "GB", availability: "AVAILABLE", minimumAge: 18, currency: "GBP", language: "en" }],
    payments: [{ key: "visa", name: "Visa", supportsDeposits: true, supportsWithdrawals: true, currencies: ["GBP"], minimumDeposit: 10, minimumWithdrawal: 20, maximumWithdrawal: 2000, depositProcessingTime: "Instant", withdrawalTime: "1–3 days", fees: null, crypto: false }],
    providers: [{ key: "provider", name: "Published Provider", gameCount: 200, liveCasino: false }],
    categories: [{ key: "slots", name: "Slots", gameCount: 180, featured: true }],
    bonuses: [{
      id: "bonus-id", slug: "published-welcome", title: "Published welcome terms", summary: "Published offer summary", type: "WELCOME", percentage: 100,
      minimumDeposit: 10, maximumBonus: 150, maximumBet: 5, currency: "GBP", freeSpins: 20, wageringMultiplier: 30,
      wageringText: "30× wagering on bonus funds", eligibility: "New eligible customers only", importantConditions: ["Terms apply"], termsUrl: null,
      startsAt: null, expiresAt: null, affiliate: { href: "/r/published-bonus", available: true },
    }],
    media: { logo: { id: "logo", type: "logo", url: "https://media.example/logo.png", alt: "Published Casino logo", width: 320, height: 160, caption: null }, hero: null, screenshots: [], gallery: [], socialImage: null },
    affiliate: { href: "/r/published-casino", available: true },
    ...patch,
  };
}

const editorial: CasinoEditorialDocument = {
  version: 1, title: "Structured published review", summary: "Structured review summary.", author: "Editorial Author", factCheckedAt: "2030-02-01T00:00:00.000Z",
  trustScore: { overall: 8, confidence: "medium", evidence: ["Published source"], categories: [] }, relatedCasinoIds: [],
  sections: [{ id: "faq", kind: "faq", title: "Questions", order: 0, blocks: [{ id: "faq-1", type: "faq", question: "Structured question?", answer: "Structured answer." }] }],
  seo: { title: "Structured metadata title", description: "Structured metadata description", canonicalPath: "/casino/published-casino", robots: "noindex,follow" },
};

test("profile presentation uses only published values and a governed internal action", () => {
  const record = casino();
  const bonus = selectProfileBonus(record);
  assert.ok(bonus);
  assert.equal(profileOfferHeadline(bonus), "100% up to £150");
  assert.deepEqual(profileAction(record, bonus), { href: "/r/published-bonus", label: "Visit Published Casino" });
  assert.deepEqual(profileReviewFreshness(record), { label: "Reviewed", value: "3 Feb 2030" });
  assert.ok(profileFacts(record).some((fact) => fact.label === "Licence" && fact.verified));
  assert.ok(profileFacts(record).some((fact) => fact.label === "Control tools"));
});

test("sparse and unsafe action states fail closed without invented profile facts", () => {
  const sparse = casino({
    operator: null, publishedAt: null, lastReviewedAt: null, licenses: [], countries: [], payments: [], providers: [], categories: [], responsibleGamblingTools: [],
    bonuses: [{ ...casino().bonuses[0], percentage: null, maximumBonus: null, maximumBet: null, freeSpins: null, wageringMultiplier: null, wageringText: null, eligibility: null, importantConditions: [], affiliate: { href: "https://tracking.example/unsafe", available: true } }],
    affiliate: { href: null, available: false },
  });
  const bonus = selectProfileBonus(sparse);
  assert.ok(bonus);
  assert.equal(profileAction(sparse, bonus), null);
  assert.equal(profileOfferHeadline(bonus), "Published welcome terms");
  assert.equal(profileReviewFreshness(sparse), null);
  assert.deepEqual(profileFacts(sparse), []);
  assert.doesNotMatch(JSON.stringify(profileFaqItems(sparse, bonus, null)), /verified|48 hours|official website/i);
});

test("metadata and structured data contain no raw operator destination or fabricated Offer schema", () => {
  const record = casino();
  const metadata = casinoProfileMetadata(record, editorial);
  assert.equal(metadata.title, "Structured metadata title");
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  const schemas = casinoProfileSchemas(record, editorial);
  const serialized = JSON.stringify(schemas);
  assert.match(serialized, /BreadcrumbList/);
  assert.match(serialized, /Review/);
  assert.match(serialized, /FAQPage/);
  assert.match(serialized, /Structured question/);
  assert.doesNotMatch(serialized, /operator\.example|tracking\.example|"@type":"Offer"/);

  const unavailable = casinoProfileMetadata(null, null);
  assert.deepEqual(unavailable.robots, { index: false, follow: false });
});

test("published maximum bet is projected from the existing immutable snapshot field", () => {
  const mapped = mapPublishedCasino({
    casinoId: "casino-id", version: 2, status: "PUBLISHED", publishedAt: new Date("2030-01-01T00:00:00.000Z"), archivedAt: null,
    snapshot: {
      id: "casino-id", slug: "mapped-casino", title: "Mapped Casino", domain: "mapped.example", status: "PUBLISHED", editorScore: 8,
      casinoBonuses: [{ id: "bonus-id", slug: "mapped-welcome", title: "Mapped terms", status: "PUBLISHED", offerStatus: "ACTIVE", maximumBet: "7.50" }],
    },
  }, [], { redirectEnabled: false, now: new Date("2030-02-01T00:00:00.000Z") });
  assert.equal(mapped?.bonuses[0]?.maximumBet, 7.5);
});

test("route and component keep Prisma, client fetching, raw destinations and demo-prefix behavior outside the profile", () => {
  const route = readFileSync("app/(public)/casino/[slug]/page.tsx", "utf8");
  const component = readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8");
  const action = readFileSync("components/casino-profile/CasinoOutboundAction.tsx", "utf8");
  const source = `${route}\n${component}\n${action}`;
  assert.match(route, /publicCasinoService\.getCasino/);
  assert.match(component, /Offer unavailable/);
  assert.equal((action.match(/<a[^>]+href=\{action\.href\}/g) ?? []).length, 1);
  assert.match(action, /href=\{confirmationHref\}/);
  assert.match(action, /aria-haspopup="dialog"/);
  assert.doesNotMatch(source, /@prisma\/client|\bprisma\.|fetch\(|axios|startsWith\(["']demo-|destinationUrl|trackingUrl|casinoOfficialUrl/);
  assert.equal((component.match(/<h1/g) ?? []).length, 1);
});
