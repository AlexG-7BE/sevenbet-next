import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  formatProfileScore,
  profileAction,
  profileFacts,
  profileFaqItems,
  profileOfferHeadline,
  profileReviewFreshness,
  selectProfileBonus,
} from "../lib/casino-profile/presentation";
import { casinoProfileMetadata, casinoProfileSchemas, projectCasinoProfileSchemas } from "../lib/casino-profile/seo";
import type { CasinoEditorialDocument } from "../lib/editorial-review/types";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { mapPublishedCasino } from "../lib/public-casino/public-casino.mapper";
import type { PublicCasinoDTO } from "../lib/public-casino/public-casino.types";
import { temporaryDemoCasinoIds } from "../lib/demo-data/temporary-demo-authority";
import { absoluteUrl } from "../lib/site";

function casino(patch: Partial<PublicCasinoDTO> = {}): PublicCasinoDTO {
  return {
    source: "cms", id: "casino-id", slug: "published-casino", name: "Published Casino", title: "Published Casino",
    domain: "operator.example", summary: "Published factual summary.", reviewContent: "Published editorial review.", operator: "Published Operator",
    foundedYear: 2020, editorScore: 8.7, trustScore: 8.1, featured: false, recommended: false,
    publishedAt: "2030-01-01T00:00:00.000Z", lastReviewedAt: "2030-02-03T00:00:00.000Z", version: 3,
    languages: ["en"], currencies: ["GBP"], pros: ["Published strength"], cons: ["Published limitation"],
    responsibleGamblingTools: ["Deposit limits"],
    seo: {
      title: "Published Casino review | B4GAMBLE", description: "Published metadata description.", canonical: "https://b4gamble.com/casino/published-casino",
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
  assert.equal(profileOfferHeadline(bonus), "100% up to £150 + 20 free spins");
  assert.deepEqual(profileAction(record, bonus), { href: "/r/published-bonus", label: "Visit Published Casino" });
  assert.deepEqual(profileReviewFreshness(record), { label: "Reviewed", value: "3 Feb 2030" });
  assert.equal(profileReviewFreshness(record, "de-DE")?.value, new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(record.lastReviewedAt!)));
  assert.equal(formatProfileScore(8.7, "de-DE"), "8,7");
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

test("exact-ID demo profiles are noindex, truthful and suppress review/commercial schemas", () => {
  const record = casino({
    id: temporaryDemoCasinoIds[0],
    slug: "demo-northstar",
    name: "Fictional Demo",
    seo: {
      ...casino().seo,
      canonical: "https://sevenbet-next.vercel.app/casino/demo-northstar",
      socialImage: "https://sevenbet-next.vercel.app/demo-casinos/demo-northstar-hero.svg",
    },
    media: {
      ...casino().media,
      hero: {
        id: "demo-hero",
        type: "hero",
        url: "/demo-casinos/demo-northstar-hero.svg",
        alt: "Fictional demo hero",
        width: 1600,
        height: 900,
        caption: null,
      },
    },
    affiliate: { href: "/r/demo", available: true },
  });
  assert.equal(profileAction(record, selectProfileBonus(record)), null);
  const metadata = casinoProfileMetadata(record, editorial);
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.match(String(metadata.title), /Fictional Review Demonstration/);
  assert.match(String(metadata.description), /not a current GB operator/i);
  const metadataSerialized = JSON.stringify(metadata);
  assert.match(metadataSerialized, new RegExp(absoluteUrl("/casino/demo-northstar").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(metadataSerialized, new RegExp(absoluteUrl("/demo-casinos/demo-northstar-hero.svg").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(metadataSerialized, /vercel\.app/);
  const serialized = JSON.stringify(casinoProfileSchemas(record, editorial));
  assert.match(serialized, /fictional review demonstration/i);
  assert.match(serialized, new RegExp(absoluteUrl("/casino/demo-northstar").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(serialized, /vercel\.app/);
  assert.doesNotMatch(serialized, /"@type":"Review"|"@type":"FAQPage"|"@type":"Offer"/);
});

test("localized schema projection translates demo chrome, omits unsafe FAQ chrome and preserves source evidence", () => {
  const messages = productPageMessages("de-DE");
  const demo = casino({ id: temporaryDemoCasinoIds[0], name: "Fictional Demo" });
  const demoSchemas = projectCasinoProfileSchemas(casinoProfileSchemas(demo, editorial), {
    casino: demo,
    casinoDirectoryUrl: absoluteUrl("/de/casinos"),
    locale: "de-DE",
    messages,
    profileUrl: absoluteUrl("/de/casino/published-casino"),
  });
  const demoSerialized = JSON.stringify(demoSchemas);
  assert.match(demoSerialized, new RegExp(messages.profile.demoReview));
  assert.match(demoSerialized, new RegExp(messages.profile.demoDisclosure.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(demoSerialized, /fictional review demonstration|Fictional product demonstration/i);
  assert.doesNotMatch(demoSerialized, /"@type":"FAQPage"/);

  const published = casino();
  const publishedSchemas = projectCasinoProfileSchemas(casinoProfileSchemas(published, editorial), {
    casino: published,
    casinoDirectoryUrl: absoluteUrl("/de/casinos"),
    locale: "de-DE",
    messages,
    profileUrl: absoluteUrl("/de/casino/published-casino"),
  });
  const publishedSerialized = JSON.stringify(publishedSchemas);
  assert.match(publishedSerialized, /Published editorial review/);
  assert.doesNotMatch(publishedSerialized, /Structured question|"@type":"FAQPage"/);
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
  assert.match(route, /boundedCandidate\?\.source === "cms"/);
  assert.match(route, /projectCasinoProfileSchemas/);
  assert.match(component, /messages\.profile\.offerUnavailable/);
  assert.match(component, /data-content-origin="localized-taxonomy"/);
  assert.match(component, /editorialSectionLabel\(section\.kind, messages, locale\)/);
  assert.match(component, /demonstration \? "localized-fixture" : "source-controlled"/);
  assert.match(component, /demo \? messages\.profile\.demoDisclosure : messages\.profile\.originalEditorialNotice/);
  assert.match(component, /data-content-origin=\{contentOrigin\}/);
  assert.match(component, /category\.key\.replaceAll\("-", " "\)/);
  assert.match(component, /casino\.media\.logo \? <img alt=""/);
  assert.doesNotMatch(component, /alt=\{casino\.media\.logo\.alt \|\| casino\.name\}/);
  assert.doesNotMatch(component, /alt=\{casino\.media\.logo\.alt \|\| `\$\{casino\.name\} logo`\}/);
  assert.equal((action.match(/<a[^>]+href=\{action\.href\}/g) ?? []).length, 1);
  assert.match(action, /href=\{confirmationHref\}/);
  assert.match(action, /aria-haspopup="dialog"/);
  assert.doesNotMatch(source, /@prisma\/client|\bprisma\.|fetch\(|axios|startsWith\(["']demo-|destinationUrl|trackingUrl|casinoOfficialUrl/);
  assert.equal((component.match(/<h1/g) ?? []).length, 1);
});
