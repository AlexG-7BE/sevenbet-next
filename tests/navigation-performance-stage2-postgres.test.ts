import assert from "node:assert/strict";
import test from "node:test";

import type { CommercialJurisdictionAuthority } from "../lib/jurisdiction/commercial-authority";
import { assertNavigationStage2TestSafety } from "../lib/market/navigation-stage2-test-safety";
import type { PublicCasinoDiscoveryStore } from "../lib/public-casino-discovery/public-casino-discovery.types";
import { publicCasinoDiscoveryRepository } from "../lib/repositories/public-casino-discovery.repository";
import { articleService } from "../lib/services/article.service";
import { PublicCasinoDiscoveryService } from "../lib/services/public-casino-discovery.service";

const enabled = process.env.NAVIGATION_STAGE2_REPRESENTATIVE_DATABASE === "true";
const peAuthority: CommercialJurisdictionAuthority = {
  commercialAllowed: true,
  referralAllowed: true,
  reasonCode: "POLICY_APPROVED",
  countryCode: "PE",
  policyVersion: "navigation-stage2-isolated-fixture",
};

test("representative catalogue stays batched, deterministic and commercially isolated", { skip: !enabled }, async () => {
  assertNavigationStage2TestSafety();
  assert.equal(new URL(process.env.DATABASE_URL!).searchParams.get("connection_limit"), "1");
  const calls = { published: 0, offers: 0, context: 0 };
  const store: PublicCasinoDiscoveryStore = {
    async listPublished(countryCode) {
      calls.published += 1;
      return publicCasinoDiscoveryRepository.listPublished(countryCode);
    },
    async listPublishedOfferCandidates(casinoIds, now) {
      calls.offers += 1;
      return publicCasinoDiscoveryRepository.listPublishedOfferCandidates(casinoIds, now);
    },
    async loadContext(casinoIds, options) {
      calls.context += 1;
      return publicCasinoDiscoveryRepository.loadContext(casinoIds, options);
    },
  };
  const service = new PublicCasinoDiscoveryService(store, () => new Date("2026-09-17T00:00:00.000Z"));
  const input = { pageSize: 25 as const };
  const options = {
    defaultEditorialCountry: "PE",
    commercialMarketCode: "PE",
    presentationLanguage: "en-GB",
  };

  const [first, shared] = await Promise.all([
    service.discover(input, peAuthority, options),
    service.discover(input, peAuthority, options),
  ]);
  assert.deepEqual(shared, first);
  assert.deepEqual(calls, { published: 1, offers: 1, context: 1 });
  assert.equal(first.total, 15);
  assert.equal(first.items.length, 15);
  assert.equal(first.inventoryMode, "PUBLISHED_ONLY");
  assert.equal(new Set(first.items.map((item) => item.id)).size, 15);
  assert.equal(first.items[0]?.slug, "navigation-stage2-casino");
  assert.deepEqual(first.items.filter((item) => item.action).map((item) => item.action?.href), ["/r/navigation-stage2-route"]);
  assert.ok(first.items.some((item) => item.featuredBonus));
  assert.ok(first.items.some((item) => item.featuredBonus === null));
  assert.ok((first.curated?.bestBonusCasinoIds.length ?? 0) > 0);

  const repeated = await service.discover(input, peAuthority, options);
  assert.deepEqual(repeated, first);
  assert.deepEqual(calls, { published: 2, offers: 2, context: 2 });
});

test("representative Articles use the canonical list and detail service paths", { skip: !enabled }, async () => {
  assertNavigationStage2TestSafety();
  const fixtureArticles = (await articleService.listPublished("en-GB", { take: 100 }))
    .filter((article) => article.slug.startsWith("navigation-stage2-"));
  assert.equal(fixtureArticles.length, 5);
  assert.deepEqual(
    fixtureArticles.map((article) => article.slug).sort(),
    [
      "navigation-stage2-guide",
      "navigation-stage2-offer-states",
      "navigation-stage2-payments",
      "navigation-stage2-ranking",
      "navigation-stage2-safety",
    ],
  );
  const article = await articleService.getPublished("casino-basics", "navigation-stage2-guide", "en-GB");
  assert.equal(article?.title, "Navigation Stage 2 Published Guide");
  assert.equal(article?.bodyBlocks[1]?.type, "paragraph");
});
