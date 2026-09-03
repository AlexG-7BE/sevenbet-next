import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { parseCasinoIngestionBundle } from "../lib/casino-ingestion/contract";
import { deterministicCasinoIngestionId, ingestCasinoBundle } from "../lib/casino-ingestion/importer";
import { verifyCasinoIngestionSources } from "../lib/casino-ingestion/source-verification";
import { assertCasinoIngestionWriteAuthority } from "../lib/casino-ingestion/write-guard";
import { inspectCasinoMarket0025Release } from "../lib/db/casino-market-0025-release";
import type { DiscoveryContext, PublicCasinoDiscoveryStore } from "../lib/public-casino-discovery/public-casino-discovery.types";
import type { PublishedCasinoSnapshotRecord } from "../lib/public-casino/public-casino.types";
import type { PublicCasinoStore } from "../lib/repositories/public-casino.repository";
import { PublicCasinoDiscoveryService } from "../lib/services/public-casino-discovery.service";
import { PublicCasinoService } from "../lib/services/public-casino.service";

const EMPTY_CONTEXT: DiscoveryContext = { aliases: [], offers: [], redirects: [] };

function json(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

async function loadBundle() {
  return parseCasinoIngestionBundle(JSON.parse(await readFile(path.join(process.cwd(), "data/casino-ingestion/betsson-pe-se.v1.json"), "utf8")));
}

test("real frozen Betsson PE/SE bundle passes disposable PostgreSQL and public-service acceptance", async () => {
  assertCasinoIngestionWriteAuthority({
    writeRequested: true,
    confirmation: "CASINO_DATA_INGEST_02",
    databaseUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
    ci: process.env.CI,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
  const bundle = await loadBundle();
  if (process.env.CASINO_INGEST_SOURCE_ROOT) {
    assert.equal((await verifyCasinoIngestionSources(bundle, process.env.CASINO_INGEST_SOURCE_ROOT)).verified, 9);
  }
  const prisma = new PrismaClient();
  try {
    const applied = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name FROM "_prisma_migrations"
      WHERE migration_name = '0025_casino_market_profile_architecture' AND finished_at IS NOT NULL
    `;
    assert.equal(applied.length, 1, "migration 0025 must be applied before ingestion");

    await prisma.casino.deleteMany({ where: { slug: bundle.casino.slug } });
    const sentinelId = "f4000000-0000-4000-8000-000000000001";
    const sentinel = await prisma.casino.upsert({
      where: { slug: "ingestion-unrelated-sentinel" },
      create: {
        id: sentinelId,
        slug: "ingestion-unrelated-sentinel",
        title: "Unrelated ingestion sentinel",
        domain: "ingestion-unrelated-sentinel.invalid",
        status: "DRAFT",
        createdBy: "casino-data-ingest-02-test",
        updatedBy: "casino-data-ingest-02-test",
      },
      update: {},
    });
    const sentinelBefore = json(sentinel);

    await prisma.casinoBonus.create({
      data: {
        casinoId: sentinel.id,
        slug: bundle.markets.find((market) => market.countryCode === "SE")!.bonuses[0]!.slug,
        title: "Atomicity conflict sentinel",
        summary: "Forces the second market reconciliation to fail.",
        createdBy: "casino-data-ingest-02-test",
        updatedBy: "casino-data-ingest-02-test",
      },
    });
    await assert.rejects(() => ingestCasinoBundle(prisma, bundle));
    assert.equal(await prisma.casino.count({ where: { slug: bundle.casino.slug } }), 0, "a later market failure must roll back the global Casino and PE market");
    assert.equal(await prisma.casinoCountry.count({ where: { countryCode: "PE", casino: { slug: bundle.casino.slug } } }), 0);
    await prisma.casinoBonus.delete({ where: { slug: bundle.markets.find((market) => market.countryCode === "SE")!.bonuses[0]!.slug } });

    const first = await ingestCasinoBundle(prisma, bundle);
    assert.equal(first.reconciliation?.byModel.Casino?.created, 1);
    assert.equal(first.reconciliation?.byModel.CasinoCountry?.created, 2);
    assert.equal(first.reconciliation?.byModel.CasinoPaymentMethod?.created, 22);
    assert.equal(first.reconciliation?.byModel.CasinoCountryEvidence?.created, 24);

    const loadState = () => prisma.casino.findUniqueOrThrow({
      where: { slug: "betsson" },
      include: {
        countries: {
          orderBy: { countryCode: "asc" },
          include: {
            evidence: { orderBy: { id: "asc" } },
            licenses: { orderBy: { casinoLicenseId: "asc" }, include: { license: { include: { evidence: { orderBy: { id: "asc" } } } } } },
            paymentMethods: { orderBy: { sortOrder: "asc" } },
            gameProviders: { orderBy: { sortOrder: "asc" } },
            gameCategories: { orderBy: { sortOrder: "asc" } },
            bonuses: { orderBy: { sortOrder: "asc" } },
            mediaAssets: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });
    const stateAfterFirst = await loadState();
    assert.equal(await prisma.casino.count({ where: { slug: "betsson" } }), 1);
    assert.equal(stateAfterFirst.countries.length, 2);
    const pe = stateAfterFirst.countries.find((market) => market.countryCode === "PE")!;
    const se = stateAfterFirst.countries.find((market) => market.countryCode === "SE")!;
    assert.equal(pe.primaryCurrency, "PEN");
    assert.equal(se.primaryCurrency, "SEK");
    assert.equal(pe.paymentMethods.length, 10);
    assert.equal(se.paymentMethods.length, 12);
    assert.equal(pe.paymentMethods.every((payment) => payment.casinoCountryId === pe.id), true);
    assert.equal(se.paymentMethods.every((payment) => payment.casinoCountryId === se.id), true);
    assert.equal(pe.paymentMethods.some((payment) => payment.methodKey === "swish"), false);
    assert.equal(se.paymentMethods.some((payment) => payment.methodKey === "yape"), false);
    assert.deepEqual(pe.licenses.map((relation) => relation.license.licenseNumber).sort(), ["11002586010000", "21002586010000"]);
    assert.deepEqual(se.licenses.map((relation) => relation.license.licenseNumber), ["23Si2176"]);
    assert.equal(pe.licenses.some((relation) => relation.license.authority === "Spelinspektionen"), false);
    assert.equal(se.licenses.some((relation) => relation.license.authority === "MINCETUR"), false);
    assert.equal(pe.bonuses.length, 1);
    assert.equal(se.bonuses.length, 1);
    assert.equal([...pe.bonuses, ...se.bonuses].every((bonus) => bonus.casinoCountryId && bonus.status === "DRAFT" && bonus.offerStatus === "DRAFT"), true);
    assert.equal(pe.gameProviders.length + se.gameProviders.length, 0);
    assert.equal(pe.evidence.length, 12);
    assert.equal(se.evidence.length, 12);
    assert.equal(pe.evidence.some((evidence) => evidence.classification === "CONTRADICTION" && evidence.notes?.includes("21002586020000")), true);
    assert.equal([...pe.evidence, ...se.evidence].some((evidence) => evidence.classification === "UNKNOWN"), true);
    assert.equal([...pe.evidence, ...se.evidence].every((evidence) => evidence.sourceReference && evidence.fieldKeys.length > 0), true);
    assert.deepEqual(
      await inspectCasinoMarket0025Release(prisma),
      { state: "already_applied_and_verified" },
      "ordinary Production preflight must accept evidence-backed factual rows while retaining the commercial firewall",
    );

    const firstCanonical = json(stateAfterFirst);
    const second = await ingestCasinoBundle(prisma, bundle);
    assert.equal(second.reconciliation?.created, 0);
    assert.equal(second.reconciliation?.updated, 0);
    assert.deepEqual(json(await loadState()), firstCanonical);

    await prisma.casino.update({ where: { id: stateAfterFirst.id }, data: { status: "PUBLISHED" } });
    await prisma.casinoBonus.updateMany({ where: { casinoId: stateAfterFirst.id }, data: { status: "PUBLISHED", offerStatus: "PAUSED" } });
    const editorialRetry = await ingestCasinoBundle(prisma, bundle);
    assert.equal(editorialRetry.reconciliation?.updated, 0);
    assert.equal((await prisma.casino.findUniqueOrThrow({ where: { id: stateAfterFirst.id } })).status, "PUBLISHED");
    assert.equal((await prisma.casinoBonus.findMany({ where: { casinoId: stateAfterFirst.id } })).every((bonus) => bonus.status === "PUBLISHED" && bonus.offerStatus === "PAUSED"), true);

    const targetEvidenceId = deterministicCasinoIngestionId("betsson:market:PE:evidence:pe-kyc");
    const unchangedEvidenceBefore = json(await prisma.casinoCountryEvidence.findMany({
      where: { marketProfile: { casino: { slug: "betsson" } }, id: { not: targetEvidenceId } },
      orderBy: { id: "asc" },
    }));
    const changedBundle = structuredClone(bundle);
    const changedEvidence = changedBundle.markets.find((market) => market.countryCode === "PE")!.evidence.find((evidence) => evidence.key === "pe-kyc")!;
    changedEvidence.notes = "Targeted evidence refresh from the same frozen source.";
    const changed = await ingestCasinoBundle(prisma, changedBundle);
    assert.equal(changed.reconciliation?.updated, 1);
    assert.equal(changed.reconciliation?.byModel.CasinoCountryEvidence?.updated, 1);
    assert.equal((await prisma.casinoCountryEvidence.findUniqueOrThrow({ where: { id: targetEvidenceId } })).notes, changedEvidence.notes);
    assert.deepEqual(json(await prisma.casinoCountryEvidence.findMany({
      where: { marketProfile: { casino: { slug: "betsson" } }, id: { not: targetEvidenceId } },
      orderBy: { id: "asc" },
    })), unchangedEvidenceBefore);
    assert.deepEqual(json(await prisma.casino.findUniqueOrThrow({ where: { id: sentinelId } })), sentinelBefore);

    await ingestCasinoBundle(prisma, bundle);
    const persisted = await loadState();
    const snapshot = {
      ...persisted,
      status: "PUBLISHED",
      publishedAt: new Date("2026-09-01T00:00:00.000Z"),
      licenses: [],
      paymentMethods: [],
      gameProviders: [],
      gameCategories: [],
      casinoBonuses: [],
      images: [],
      mediaAssets: [],
    };
    const published: PublishedCasinoSnapshotRecord = {
      casinoId: persisted.id,
      version: 1,
      status: "PUBLISHED",
      snapshot,
      publishedAt: new Date("2026-09-01T00:00:00.000Z"),
      archivedAt: null,
    };
    const publicStore: PublicCasinoStore = {
      findPublishedBySlug: async (slug) => slug === "betsson" ? published : null,
      hasManagedSlug: async (slug) => slug === "betsson",
      listPublished: async () => [published],
      listManagedSlugs: async () => ["betsson"],
      listActiveAffiliateRoutes: async () => [],
    };
    const discoveryStore: PublicCasinoDiscoveryStore = {
      listPublished: async () => [published],
      loadContext: async () => EMPTY_CONTEXT,
    };
    const publicService = new PublicCasinoService(publicStore, [], { cmsEnabled: true, redirectEnabled: false, now: new Date("2026-09-01T00:00:00.000Z") });
    const discovery = new PublicCasinoDiscoveryService(discoveryStore, () => new Date("2026-09-01T00:00:00.000Z"), undefined, () => false);
    const peProfile = await publicService.getCasino("betsson", undefined, "PE");
    const seProfile = await publicService.getCasino("betsson", undefined, "SE");
    for (const [countryCode, profile] of [["PE", peProfile], ["SE", seProfile]] as const) {
      assert.ok(profile, `${countryCode} contradiction evidence must preserve the editorial profile`);
      assert.equal(profile.presentationDisposition, "INFORMATIONAL_ONLY");
      assert.equal(profile.presentationDispositionReason, "EXACT_MARKET_EVIDENCE_CONTRADICTED");
      assert.equal(profile.affiliate.available, false, `${countryCode} contradiction evidence must keep the CTA off`);
      assert.equal(profile.affiliate.href, null);
    }

    const globalProfile = await publicService.getCasino("betsson");
    assert.equal(globalProfile?.editorScore, null, "missing editorial score must remain null rather than becoming a false 0/10");
    assert.equal(globalProfile?.domain, "betsson.com");
    assert.deepEqual(globalProfile?.marketProfiles, []);
    assert.deepEqual(globalProfile?.countries, []);
    assert.deepEqual(globalProfile?.languages, []);
    assert.deepEqual(globalProfile?.currencies, []);
    assert.deepEqual(globalProfile?.payments, []);
    assert.deepEqual(globalProfile?.licenses, []);
    assert.deepEqual(globalProfile?.bonuses, []);
    assert.equal(globalProfile?.affiliate.available, false);

    const informationalDiscoveryCases: Array<[string, Parameters<typeof discovery.discover>[0]]> = [
      ["PE", { country: ["SE"], currency: ["PEN"], payment: ["yape"], license: ["mincetur"] }],
      ["SE", { country: ["PE"], currency: ["SEK"], payment: ["swish"], license: ["spelinspektionen"] }],
    ];
    for (const [countryCode, query] of informationalDiscoveryCases) {
      const result = await discovery.discover(query, null, { defaultEditorialCountry: countryCode });
      assert.equal(result.total, 1, `${countryCode} contradiction evidence must preserve the exact-market discovery card`);
      assert.equal(result.items[0]?.slug, "betsson");
      assert.equal(result.items[0]?.disposition, "INFORMATIONAL_ONLY");
      assert.equal(result.items[0]?.dispositionReason, "EXACT_MARKET_EVIDENCE_CONTRADICTED");
      assert.equal(result.items[0]?.visitAction.available, false, `${countryCode} contradiction evidence must keep the CTA off`);
    }

    const globalDiscovery = await discovery.discover({ country: ["PE"] });
    assert.equal(globalDiscovery.total, 1, "a query country is not trusted GEO authority");
    assert.equal(globalDiscovery.items[0]?.disposition, "INFORMATIONAL_ONLY");
    assert.equal(globalDiscovery.items[0]?.rating, null);
    assert.deepEqual(globalDiscovery.items[0]?.countries, []);
    assert.deepEqual(globalDiscovery.items[0]?.licenses, []);
    assert.deepEqual(globalDiscovery.items[0]?.paymentMethods, []);
    assert.equal(globalDiscovery.items[0]?.visitAction.available, false);

    assert.equal(await prisma.affiliateProgram.count({ where: { casinoId: persisted.id } }), 0);
    assert.equal(await prisma.affiliateOffer.count({ where: { casinoId: persisted.id } }), 0);
    assert.equal(await prisma.affiliateRedirectSlug.count({ where: { casinoId: persisted.id } }), 0);
    assert.equal(await prisma.casinoAffiliateLink.count({ where: { casinoId: persisted.id } }), 0);
    assert.equal(await prisma.commercialOpportunity.count({ where: { casinoId: persisted.id } }), 0);
    assert.equal(await prisma.affiliateTrackingLinkCountry.count({
      where: { productionEligible: true, trackingLink: { offer: { casinoId: persisted.id } } },
    }), 0);
  } finally {
    await prisma.$disconnect();
  }
});
