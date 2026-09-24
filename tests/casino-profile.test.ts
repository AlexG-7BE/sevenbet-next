import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { shouldShowCasinoDecisionBar } from "../components/casino-profile/CasinoProfileInteractions";
import {
  formatProfileScore,
  profileAction,
  profileFacts,
  profileFaqItems,
  profileOfferHeadline,
  profileReviewFreshness,
  selectProfileBonus,
} from "../lib/casino-profile/presentation";
import { commercialUxMessages } from "../lib/commercial/commercial-ux-messages";
import { casinoProfileMetadata, casinoProfileSchemas, projectCasinoProfileSchemas } from "../lib/casino-profile/seo";
import type { CasinoEditorialDocument } from "../lib/editorial-review/types";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import { mapPublishedCasino } from "../lib/public-casino/public-casino.mapper";
import type { PublicCasinoDTO } from "../lib/public-casino/public-casino.types";
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
    regulatoryFootprint: [{ authority: "Published Authority", jurisdiction: "GB" }],
    countries: [{ countryCode: "GB", availability: "AVAILABLE", minimumAge: 18, currency: "GBP", language: "en" }],
    payments: [{ key: "visa", name: "Visa", supportsDeposits: true, supportsWithdrawals: true, currencies: ["GBP"], minimumDeposit: 10, minimumWithdrawal: 20, maximumWithdrawal: 2000, depositProcessingTime: "Instant", withdrawalTime: "1–3 days", fees: null, crypto: false }],
    providers: [{ key: "provider", name: "Published Provider", gameCount: 200, liveCasino: false }],
    categories: [{ key: "slots", name: "Slots", gameCount: 180, featured: true }],
    bonuses: [{
      id: "bonus-id", slug: "published-welcome", title: "Published welcome terms", summary: "Published offer summary", type: "WELCOME", percentage: 100,
      minimumDeposit: 10, maximumBonus: 150, maximumBet: 5, currency: "GBP", freeSpins: 20, wageringMultiplier: 30,
      wageringText: "30× wagering on bonus funds", eligibility: "New eligible customers only", importantConditions: ["Terms apply"], termsUrl: null,
      startsAt: null, expiresAt: null,
    }],
    marketProfiles: [],
    media: { logo: { id: "logo", type: "logo", url: "https://media.example/logo.png", alt: "Published Casino logo", width: 320, height: 160, caption: null }, hero: null, screenshots: [], gallery: [], socialImage: null },
    action: { href: "/r/published-bonus" },
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
  assert.deepEqual(profileAction(record), { href: "/r/published-bonus", label: "Visit Published Casino" });
  assert.deepEqual(profileReviewFreshness(record), { label: "Reviewed", value: "3 Feb 2030" });
  assert.equal(profileReviewFreshness(record, "de-DE")?.value, new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(record.lastReviewedAt!)));
  assert.equal(formatProfileScore(8.7, "de-DE"), "8,7");
  assert.ok(profileFacts(record).some((fact) => fact.label === "Licence" && fact.verified));
  assert.ok(profileFacts(record).some((fact) => fact.label === "Control tools"));
});

test("sparse and unsafe action states fail closed without invented profile facts", () => {
  const sparse = casino({
    operator: null, publishedAt: null, lastReviewedAt: null, licenses: [], countries: [], payments: [], providers: [], categories: [], responsibleGamblingTools: [],
    bonuses: [{ ...casino().bonuses[0], percentage: null, maximumBonus: null, maximumBet: null, freeSpins: null, wageringMultiplier: null, wageringText: null, eligibility: null, importantConditions: [] }],
    action: { href: "https://tracking.example/unsafe" } as never,
  });
  const bonus = selectProfileBonus(sparse);
  assert.ok(bonus);
  assert.equal(profileAction(sparse), null);
  assert.equal(profileOfferHeadline(bonus), "Published welcome terms");
  assert.equal(profileReviewFreshness(sparse), null);
  assert.deepEqual(profileFacts(sparse), []);
  assert.doesNotMatch(JSON.stringify(profileFaqItems(sparse, bonus, null)), /verified|48 hours|official website/i);
});

test("decision-page composition renders three governed VIEW OFFER placements and no CTA for Review Only", async () => {
  const require = createRequire(import.meta.url);
  require.extensions[".css"] = () => undefined;
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const { CasinoProfile } = await import("../components/casino-profile/CasinoProfile");
  const presentation = resolvePresentationContext({ routeLanguage: "en", trustedCountryCode: "GB" });
  const messages = productPageMessages(presentation.locale);
  const actionable = casino({
    media: { ...casino().media, logo: null },
  });
  const actionableHtml = renderToStaticMarkup(React.createElement(CasinoProfile, {
    availableForPresentation: true,
    casino: actionable,
    editorial,
    messages,
    presentation,
  }));
  assert.equal((actionableHtml.match(/href="\/r\/published-bonus\?placement=CTA_CASINO_(?:HERO|MOBILE_STICKY|OFFER_SECTION)"/g) ?? []).length, 3);
  assert.equal((actionableHtml.match(/VIEW OFFER/g) ?? []).length, 3);
  assert.match(actionableHtml, /data-casino-decision-bar/);
  assert.match(actionableHtml, /data-casino-section-nav/);
  for (const href of ["#overview", "#current-offer", "#our-verdict", "#casino-faq"]) {
    assert.match(actionableHtml, new RegExp(`href="${href}"`));
  }
  assert.match(actionableHtml, /data-premium-section="casino-verdict"/);
  assert.match(actionableHtml, /data-premium-section="casino-faq"/);
  assert.ok(actionableHtml.indexOf('id="current-offer"') < actionableHtml.indexOf('id="casino-faq"'));
  assert.ok(actionableHtml.indexOf('id="casino-faq"') < actionableHtml.indexOf('id="our-verdict"'));
  assert.doesNotMatch(actionableHtml, />07</);
  assert.doesNotMatch(actionableHtml, /Play responsibly|Browse casino reviews|Methodology &amp; sources/);
  const expectedOrder = ["why-we-rate", "payments", "current-offer", "games", "support", "regulation", "casino-faq", "our-verdict"];
  assert.deepEqual([...expectedOrder].sort((left, right) => actionableHtml.indexOf(`id="${left}"`) - actionableHtml.indexOf(`id="${right}"`)), expectedOrder);

  const reviewOnly = casino({
    action: null,
    media: { ...casino().media, logo: null },
  });
  const reviewOnlyHtml = renderToStaticMarkup(React.createElement(CasinoProfile, {
    availableForPresentation: true,
    casino: reviewOnly,
    editorial,
    messages,
    presentation,
  }));
  assert.doesNotMatch(reviewOnlyHtml, /href="\/r\//);
  assert.doesNotMatch(reviewOnlyHtml, /data-casino-decision-bar/);
  // Without a governed action the profile states it in plain text; no box
  // styled like a button stands where the partner action would be.
  assert.equal((reviewOnlyHtml.match(/Review only/g) ?? []).length, 0);
  assert.ok(reviewOnlyHtml.includes(messages.common.reviewAvailableNoAction));

  const repeatedActionableHtml = renderToStaticMarkup(React.createElement(CasinoProfile, {
    availableForPresentation: true,
    casino: actionable,
    editorial,
    messages,
    presentation,
  }));
  assert.equal((repeatedActionableHtml.match(/href="\/r\/published-bonus\?placement=CTA_CASINO_(?:HERO|MOBILE_STICKY|OFFER_SECTION)"/g) ?? []).length, 3);
  assert.doesNotMatch(readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8"), /commercialProductsAvailable/);
});

test("mobile decision bar appears only after the hero and clears before the footer", () => {
  const base = {
    barHeight: 68,
    footerTop: 1200,
    headerHeight: 64,
    heroBottom: 68,
    mobile: true,
    viewportHeight: 844,
  };
  assert.equal(shouldShowCasinoDecisionBar(base), true);
  assert.equal(shouldShowCasinoDecisionBar({ ...base, mobile: false }), false);
  assert.equal(shouldShowCasinoDecisionBar({ ...base, heroBottom: 69 }), false);
  assert.equal(shouldShowCasinoDecisionBar({ ...base, footerTop: 912 }), false);
  assert.equal(shouldShowCasinoDecisionBar({ ...base, footerTop: null }), true);
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

test("environment-gated visual fixtures are noindex, truthful and suppress review/commercial schemas", () => {
  const record = casino({
    id: "visual-casino-fixture",
    dataClassification: "DEMO_FIXTURE",
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
    action: null,
  });
  assert.equal(profileAction(record), null);
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
  const demo = casino({ id: "visual-casino-fixture", dataClassification: "DEMO_FIXTURE", name: "Fictional Demo" });
  const demoSchemas = projectCasinoProfileSchemas(casinoProfileSchemas(demo, editorial), {
    casino: demo,
    casinoDirectoryUrl: absoluteUrl("/de-de/casinos"),
    locale: "de-DE",
    messages,
    profileUrl: absoluteUrl("/de-de/casino/published-casino"),
  });
  const demoSerialized = JSON.stringify(demoSchemas);
  assert.match(demoSerialized, new RegExp(messages.profile.demoReview));
  assert.match(demoSerialized, new RegExp(messages.profile.demoDisclosure.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(demoSerialized, /fictional review demonstration|Fictional product demonstration/i);
  assert.doesNotMatch(demoSerialized, /"@type":"FAQPage"/);

  const published = casino();
  const publishedSchemas = projectCasinoProfileSchemas(casinoProfileSchemas(published, editorial), {
    casino: published,
    casinoDirectoryUrl: absoluteUrl("/de-de/casinos"),
    locale: "de-DE",
    messages,
    profileUrl: absoluteUrl("/de-de/casino/published-casino"),
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
  }, { now: new Date("2030-02-01T00:00:00.000Z") });
  assert.equal(mapped?.bonuses[0]?.maximumBet, 7.5);
});

test("route and decision composition keep authority, raw destinations and Prisma outside the profile", () => {
  const route = readFileSync("app/(public)/casino/[slug]/page.tsx", "utf8");
  const component = readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8");
  const action = readFileSync("components/casino-profile/CasinoOutboundAction.tsx", "utf8");
  const source = `${route}\n${component}\n${action}`;
  assert.match(route, /publicCasinoService\.getCasino/);
  assert.match(route, /visualFixture \|\| candidate\.source === "cms"/);
  assert.match(route, /projectCasinoProfileSchemas/);
  assert.match(component, /messages\.profile\.offerUnavailable/);
  assert.match(component, /casinoProfileDecisionPresentation/);
  assert.match(component, /CASINO_HERO/);
  assert.match(component, /CASINO_OFFER_SECTION/);
  assert.match(component, /CASINO_MOBILE_STICKY/);
  assert.match(component, /decision\.reasons\.map/);
  assert.match(component, /data-reason-tone=\{item\.tone\}/);
  assert.match(component, /decision\.restriction/);
  assert.match(component, /casino\.media\.logo \? <ResponsivePlacementImage alt=""/);
  assert.doesNotMatch(component, /alt=\{casino\.media\.logo\.alt \|\| casino\.name\}/);
  assert.doesNotMatch(component, /alt=\{casino\.media\.logo\.alt \|\| `\$\{casino\.name\} logo`\}/);
  assert.equal((component.match(/<CasinoOutboundAction/g) ?? []).length, 3);
  assert.equal((action.match(/<a/g) ?? []).length, 1);
  assert.match(action, /href=\{attributedCommercialHref\(action\.href, context\)\}/);
  assert.match(action, /return `\$\{href\}\?placement=\$\{context\.source\}_\$\{context\.placement\}`/);
  assert.match(action, /outboundIntent\("direct", context\)/);
  assert.match(action, /target="_blank"/);
  assert.doesNotMatch(action, /confirmationHref|aria-haspopup="dialog"|showModal|You are leaving B4GAMBLE/);
  assert.doesNotMatch(source, /@prisma\/client|\bprisma\.|fetch\(|axios|startsWith\(["']demo-|destinationUrl|trackingUrl|casinoOfficialUrl/);
  assert.equal((component.match(/<h1/g) ?? []).length, 1);
});

test("a projection cached before regulatoryFootprint existed does not crash the profile", async () => {
  // unstable_cache replays a serialized DTO. During a rollout an entry written
  // by the previous mapper carries no regulatoryFootprint, and reading .map on
  // it threw a server-side TypeError on every casino profile.
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const { CasinoProfile } = await import("../components/casino-profile/CasinoProfile");
  const presentation = resolvePresentationContext({ routeLanguage: "en", trustedCountryCode: "GB" });
  // No market profile and no global licence, so the profile falls back to the
  // brand's regulatory footprint — the exact path that threw.
  const stale = casino({ marketProfiles: [], licenses: [] });
  delete (stale as { regulatoryFootprint?: unknown }).regulatoryFootprint;

  const markup = renderToStaticMarkup(React.createElement(CasinoProfile, {
    availableForPresentation: false,
    casino: stale,
    editorial: null,
    messages: productPageMessages(presentation.locale),
    presentation,
  }));
  // The page renders rather than throwing, and an empty footprint now drops
  // the row instead of printing "Not verified" into it.
  // The page renders rather than throwing, and an empty footprint now drops
  // the row instead of printing "Not verified" into it. (CSS module classes
  // resolve to undefined under the test harness, so only rendered text is
  // asserted here.)
  assert.match(markup, /Operator<\/dt><dd>Published Operator/);
  assert.doesNotMatch(markup, /Licensed in/);
  assert.doesNotMatch(markup, /<dd>undefined<\/dd>/);
});

test("the detail projection cache key changes when the projected shape changes", () => {
  // A cache key that outlives a shape change serves the old shape to new code.
  const service = readFileSync(new URL("../lib/services/public-casino.service.ts", import.meta.url), "utf8");
  assert.match(service, /public-casino-detail-editorial-projection-v3/);
  assert.doesNotMatch(service, /public-casino-detail-editorial-projection-v[12]\b/);
});

test("a fact with nothing to say is dropped, and an empty section says so once", async () => {
  // The TurboNino profile printed "Not verified" six times: three in the hero
  // strip and three in payments. A row that admits ignorance teaches nothing,
  // and a section built entirely from them teaches nothing repeatedly.
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const { CasinoProfile } = await import("../components/casino-profile/CasinoProfile");
  const presentation = resolvePresentationContext({ routeLanguage: "en", trustedCountryCode: "GB" });
  const copy = commercialUxMessages(presentation.locale);

  const bare = casino({
    bonuses: [],
    offerPresentation: undefined,
    payments: [],
    marketProfiles: [],
    action: null,
  });
  const markup = renderToStaticMarkup(React.createElement(CasinoProfile, {
    availableForPresentation: false,
    casino: bare,
    editorial: null,
    messages: productPageMessages(presentation.locale),
    presentation,
  }));

  assert.doesNotMatch(markup, new RegExp(`<dd>${copy.notVerified}</dd>`), "no fact row may admit ignorance");
  assert.match(markup, new RegExp(copy.nothingPublishedYet), "an emptied section explains itself once");
  assert.equal(
    (markup.match(new RegExp(copy.nothingPublishedYet, "g")) ?? []).length <= 3,
    true,
    "the explanation replaces rows rather than multiplying them",
  );
});

test("a licence held in one market still tells the reader the brand is regulated", async () => {
  // Skol Casino holds one UKGC licence scoped to GB. It must not be asserted
  // as authority in the reader's own market, but hiding it entirely leaves the
  // most important trust question unanswered.
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const { CasinoProfile } = await import("../components/casino-profile/CasinoProfile");
  const presentation = resolvePresentationContext({ routeLanguage: "en", trustedCountryCode: "GB" });

  const markup = renderToStaticMarkup(React.createElement(CasinoProfile, {
    availableForPresentation: false,
    casino: casino({
      licenses: [],
      marketProfiles: [],
      regulatoryFootprint: [{ authority: "Gambling Commission", jurisdiction: "GB" }],
    }),
    editorial: null,
    messages: productPageMessages(presentation.locale),
    presentation,
  }));
  assert.match(markup, /Gambling Commission \(GB\)/, "the jurisdiction is named so it cannot read as local authority");
});

test("a market's withdrawal sentence is shown as written, never parsed into a speed", async () => {
  // Most markets record withdrawal timing as prose, and the payout fact reads
  // only the structured per-method field. Parsing this sentence would take
  // "same day" from it and award a fast-payout badge that a card user never
  // experiences, so it is displayed verbatim and earns no badge.
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const { CasinoProfile } = await import("../components/casino-profile/CasinoProfile");
  const presentation = resolvePresentationContext({ routeLanguage: "en", trustedCountryCode: "GB" });
  const copy = commercialUxMessages(presentation.locale);
  const prose = "After approval: Visa/Mastercard and bank transfer 1-3 banking days; e-wallets same day.";

  const markup = renderToStaticMarkup(React.createElement(CasinoProfile, {
    availableForPresentation: true,
    casino: casino({
      payments: [],
      marketProfiles: [{
        id: "gb", countryCode: "GB", availability: "AVAILABLE", localDomain: null, localWebsiteUrl: null,
        operatingLegalEntity: null, termsUrl: null, privacyUrl: null, responsibleGamblingUrl: null,
        primaryLanguage: "en", supportedLanguages: [], supportLanguages: [], primaryCurrency: "GBP",
        supportedCurrencies: [], minimumAge: 18, kycSummary: null, withdrawalSummary: prose,
        supportSummary: null, lastVerifiedAt: null, evidence: [], licenses: [], payments: [],
        providers: [], categories: [], bonuses: [], media: [],
      }],
    }),
    editorial: null,
    messages: productPageMessages(presentation.locale),
    presentation,
  }));

  assert.match(markup, /1-3 banking days; e-wallets same day/, "the sentence reaches the reader intact");
  assert.doesNotMatch(markup, new RegExp(`<dd>${copy.payoutSameDay}</dd>`), "prose never becomes a payout verdict");
  assert.doesNotMatch(markup, new RegExp(`>${copy.fastPayouts}<`), "prose never earns a fast-payout badge");
});

test("founded year and control tools reach the reader when the record has them", async () => {
  // Both fields sat on the DTO but were rendered only by components no route
  // imports, so nine casinos' responsible-gambling tools — GAMSTOP among them —
  // were published to nobody.
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const { CasinoProfile } = await import("../components/casino-profile/CasinoProfile");
  const presentation = resolvePresentationContext({ routeLanguage: "en", trustedCountryCode: "GB" });
  const messages = productPageMessages(presentation.locale);

  const withRecord = renderToStaticMarkup(React.createElement(CasinoProfile, {
    availableForPresentation: false,
    casino: casino({ foundedYear: 2014, responsibleGamblingTools: ["Deposit limit", "GAMSTOP"] }),
    editorial: null,
    messages,
    presentation,
  }));
  assert.match(withRecord, new RegExp(`<dt>${messages.profile.founded}</dt><dd>2014</dd>`));
  assert.match(withRecord, new RegExp(`<dt>${messages.profile.controlTools}</dt><dd>Deposit limit · GAMSTOP</dd>`));

  const withoutRecord = renderToStaticMarkup(React.createElement(CasinoProfile, {
    availableForPresentation: false,
    casino: casino({ foundedYear: null, responsibleGamblingTools: [] }),
    editorial: null,
    messages,
    presentation,
  }));
  assert.doesNotMatch(withoutRecord, new RegExp(messages.profile.founded));
  assert.doesNotMatch(withoutRecord, new RegExp(messages.profile.controlTools));
});
