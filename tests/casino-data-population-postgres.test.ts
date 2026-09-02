import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { parseCasinoIngestionBundle } from "../lib/casino-ingestion/contract";
import {
  deterministicCasinoIngestionId,
  ingestCasinoBundles,
  verifyCasinoBundlesIdempotency,
} from "../lib/casino-ingestion/importer";
import { assertCasinoIngestionWriteAuthority } from "../lib/casino-ingestion/write-guard";

type Manifest = { bundles: Array<{ path: string }> };

async function loadBundles() {
  const manifest = JSON.parse(await readFile(path.join(process.cwd(), "data/casino-ingestion/casino-data-population-01/manifest.v1.json"), "utf8")) as Manifest;
  return Promise.all(manifest.bundles.map(async (entry) => parseCasinoIngestionBundle(
    JSON.parse(await readFile(path.join(process.cwd(), entry.path), "utf8")),
  )));
}

test("seven exact-market bundles are atomic and idempotent in disposable PostgreSQL", async () => {
  assertCasinoIngestionWriteAuthority({
    writeRequested: true,
    confirmation: "CASINO_DATA_INGEST_02",
    databaseUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
    ci: process.env.CI,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
  const bundles = await loadBundles();
  const slugs = bundles.map((bundle) => bundle.casino.slug);
  const prisma = new PrismaClient();

  try {
    await prisma.casino.deleteMany({ where: { slug: { in: slugs } } });
    const commercialBefore = {
      routeCountries: await prisma.affiliateTrackingLinkCountry.count(),
      casinoLinks: await prisma.casinoAffiliateLink.count(),
      legacyLinks: await prisma.affiliateLink.count(),
    };

    const conflict = await prisma.casino.create({
      data: {
        id: "fa000000-0000-4000-8000-000000000001",
        slug: "population-atomicity-conflict",
        title: "Population atomicity conflict",
        domain: "slotnite.com",
        status: "DRAFT",
        createdBy: "casino-data-population-01-test",
        updatedBy: "casino-data-population-01-test",
      },
    });
    await assert.rejects(() => ingestCasinoBundles(prisma, bundles), /Casino domain conflict/);
    assert.equal(await prisma.casino.count({ where: { slug: { in: slugs } } }), 0, "a final-bundle conflict must roll back the whole seven-Casino batch");
    await prisma.casino.delete({ where: { id: conflict.id } });

    const first = await ingestCasinoBundles(prisma, bundles);
    assert.equal(first.length, 7);
    assert.equal(first.reduce((total, result) => total + (result.reconciliation?.created ?? 0), 0), 121);
    assert.equal(first.reduce((total, result) => total + (result.reconciliation?.updated ?? 0), 0), 0);
    assert.equal(first.reduce((total, result) => total + (result.reconciliation?.unchanged ?? 0), 0), 5, "the shared White Hat operator is reused without duplication");

    assert.equal(await prisma.casino.count({ where: { slug: { in: slugs } } }), 7);
    assert.equal(await prisma.casinoCountry.count({ where: { casino: { slug: { in: slugs } } } }), 7);
    assert.equal(await prisma.casinoLicense.count({ where: { casino: { slug: { in: slugs } } } }), 7);
    assert.equal(await prisma.casinoCountryEvidence.count({ where: { marketProfile: { casino: { slug: { in: slugs } } } } }), 53);
    assert.equal(await prisma.casinoLicenseEvidence.count({ where: { license: { casino: { slug: { in: slugs } } } } }), 14);
    assert.equal(await prisma.casinoGameCategory.count({ where: { casino: { slug: { in: slugs } } } }), 14);
    assert.equal(await prisma.casinoGameProvider.count({ where: { casino: { slug: { in: slugs } } } }), 3);
    assert.equal(await prisma.casinoPaymentMethod.count({ where: { casino: { slug: { in: slugs } } } }), 0);
    assert.equal(await prisma.casinoBonus.count({ where: { casino: { slug: { in: slugs } } } }), 0);
    assert.equal(await prisma.casinoImage.count({ where: { casino: { slug: { in: slugs } } } }), 0);
    assert.equal(await prisma.mediaAsset.count({ where: { casinoId: { in: bundles.map((bundle) => deterministicCasinoIngestionId(`${bundle.casino.key}:casino`)) } } }), 0);

    const markets = await prisma.casinoCountry.findMany({
      where: { casino: { slug: { in: slugs } } },
      include: { casino: true, evidence: true, licenses: { include: { license: true } }, paymentMethods: true, bonuses: true },
      orderBy: { casino: { slug: "asc" } },
    });
    assert.equal(markets.every((market) => market.countryCode === "GB" && market.availability === "AVAILABLE"), true);
    assert.equal(markets.every((market) => market.evidence.some((evidence) => evidence.classification === "UNKNOWN")), true);
    assert.equal(markets.every((market) => market.licenses.length === 1 && market.licenses[0]!.license.jurisdiction === "GB"), true);
    assert.equal(markets.every((market) => market.paymentMethods.length === 0 && market.bonuses.length === 0), true);

    const dragon = markets.find((market) => market.casino.slug === "dragonbet")!;
    assert.equal(dragon.evidence.some((evidence) => evidence.classification === "CONTRADICTION"), true);
    const whiteHatOperators = await prisma.casinoOperator.findMany({ where: { name: "White Hat Gaming Limited" } });
    assert.equal(whiteHatOperators.length, 1);

    const second = await ingestCasinoBundles(prisma, bundles);
    assert.equal(second.reduce((total, result) => total + (result.reconciliation?.created ?? 0), 0), 0);
    assert.equal(second.reduce((total, result) => total + (result.reconciliation?.updated ?? 0), 0), 0);
    assert.equal(second.reduce((total, result) => total + (result.reconciliation?.unchanged ?? 0), 0), 126);
    const readOnlyIdempotency = await verifyCasinoBundlesIdempotency(prisma, bundles);
    assert.deepEqual({ created: readOnlyIdempotency.created, updated: readOnlyIdempotency.updated, unchanged: readOnlyIdempotency.unchanged }, {
      created: 0,
      updated: 0,
      unchanged: 126,
    });

    assert.deepEqual({
      routeCountries: await prisma.affiliateTrackingLinkCountry.count(),
      casinoLinks: await prisma.casinoAffiliateLink.count(),
      legacyLinks: await prisma.affiliateLink.count(),
    }, commercialBefore);
  } finally {
    await prisma.$disconnect();
  }
});
