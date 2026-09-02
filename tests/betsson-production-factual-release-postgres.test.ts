import assert from "node:assert/strict";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  BETSSON_FACTUAL_RELEASE_AUTHORITY,
  BetssonFactualReleaseError,
  runBetssonProductionFactualRelease,
} from "../lib/casino-ingestion/production-factual-release";
import { deterministicCasinoIngestionId } from "../lib/casino-ingestion/importer";

const COMMIT = "c".repeat(40);
const BETSSON_CASINO_ID = deterministicCasinoIngestionId("betsson:casino");
const BETSSON_BRAND_ID = deterministicCasinoIngestionId("betsson:brand:betsson");
const BETSSON_OPERATOR_IDS = [
  deterministicCasinoIngestionId("betsson:operator:sftg-limited"),
  deterministicCasinoIngestionId("betsson:operator:betsson-nordic-ltd"),
];

function assertDisposable(value: string | undefined) {
  if (!value) throw new Error("Disposable database URL is required.");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !url.pathname.slice(1).endsWith("_ci")) {
    throw new Error("This test accepts only a loopback _ci PostgreSQL database.");
  }
}

async function removeExactBetssonTestState(prisma: PrismaClient) {
  await prisma.casino.deleteMany({
    where: { OR: [{ id: BETSSON_CASINO_ID }, { slug: "betsson" }] },
  });
  await prisma.casinoBrand.deleteMany({ where: { id: BETSSON_BRAND_ID } });
  await prisma.casinoOperator.deleteMany({ where: { id: { in: BETSSON_OPERATOR_IDS } } });
}

test("one Production-shaped execution imports and factually publishes only Betsson PE/SE", async () => {
  assertDisposable(process.env.DATABASE_URL);
  assertDisposable(process.env.DIRECT_URL);
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    CASINO_BETSSON_PE_SE_RELEASE_AUTHORITY: BETSSON_FACTUAL_RELEASE_AUTHORITY,
    CASINO_BETSSON_PE_SE_RELEASE_SOURCE_COMMIT: COMMIT,
    CASINO_BETSSON_PE_SE_EXPECTED_RELEASE_COMMIT: COMMIT,
    CASINO_BETSSON_PE_SE_EXECUTE_PRODUCTION_RELEASE: "1",
    CI: "true",
    NODE_ENV: "test",
  };
  const events: Array<Record<string, unknown>> = [];
  const now = new Date("2026-09-02T08:00:00.000Z");
  const prisma = new PrismaClient({ datasourceUrl: environment.DIRECT_URL });
  try {
    await removeExactBetssonTestState(prisma);
    const result = await runBetssonProductionFactualRelease({
      authority: "disposable-test",
      environment,
      now: () => now,
      writeEvent: (event) => events.push(event),
      createPrismaClient: () => new PrismaClient({ datasourceUrl: environment.DIRECT_URL }),
    });
    assert.equal(result.state, "factual_release_succeeded");
    assert.equal(result.mutationPerformed, true);
    assert.equal(events.some((event) => event.event === "casino_betsson_pe_se_production_release_preflight_verified"), true);
    assert.equal(events.some((event) => event.event === "casino_betsson_pe_se_production_import_succeeded"), true);
    assert.equal(events.some((event) => event.event === "casino_betsson_pe_se_factual_publication_succeeded"), true);
    const completed = events.find((event) => event.event === "casino_betsson_pe_se_production_factual_release_succeeded");
    assert.equal(completed?.importExecutions, 1);
    assert.equal(completed?.commercialMutation, false);
    assert.equal(completed?.productionEligibleRoutesAfter, 0);

    const casino = await prisma.casino.findUniqueOrThrow({
      where: { slug: "betsson" },
      include: {
        countries: { include: { evidence: true, licenses: { include: { license: true } }, paymentMethods: true, gameCategories: true, bonuses: true } },
        versions: true,
        revisions: true,
      },
    });
    assert.equal(casino.status, "PUBLISHED");
    assert.equal(casino.editorScore, null);
    assert.equal(casino.publishedVersion, 1);
    assert.equal(casino.versions.length, 1);
    assert.equal(casino.revisions.length, 1);
    assert.deepEqual(casino.countries.map((market) => market.countryCode).sort(), ["PE", "SE"]);
    assert.equal(casino.countries.reduce((total, market) => total + market.evidence.length, 0), 24);
    assert.equal(casino.countries.reduce((total, market) => total + market.paymentMethods.length, 0), 22);
    assert.equal(casino.countries.reduce((total, market) => total + market.gameCategories.length, 0), 14);
    assert.equal(casino.countries.reduce((total, market) => total + market.bonuses.length, 0), 2);
    assert.equal(casino.countries.flatMap((market) => market.bonuses).every((bonus) => bonus.status === "DRAFT" && bonus.offerStatus === "DRAFT"), true);
    assert.equal(await prisma.affiliateProgram.count({ where: { casinoId: casino.id } }), 0);
    assert.equal(await prisma.affiliateOffer.count({ where: { casinoId: casino.id } }), 0);
    assert.equal(await prisma.affiliateTrackingLinkCountry.count({ where: { productionEligible: true } }), 0);
    assert.equal(await prisma.affiliateRedirectSlug.count({ where: { casinoId: casino.id } }), 0);

    const countsBeforeRefusal = {
      casinos: await prisma.casino.count(),
      markets: await prisma.casinoCountry.count(),
      versions: await prisma.casinoVersion.count(),
    };
    const refusalEvents: Array<Record<string, unknown>> = [];
    await assert.rejects(
      runBetssonProductionFactualRelease({
        authority: "disposable-test",
        environment,
        now: () => now,
        writeEvent: (event) => refusalEvents.push(event),
        createPrismaClient: () => new PrismaClient({ datasourceUrl: environment.DIRECT_URL }),
      }),
      (error: unknown) => error instanceof BetssonFactualReleaseError,
    );
    assert.equal(refusalEvents.some((event) => event.event === "casino_betsson_pe_se_production_factual_release_failed" && event.importPerformed === false), true);
    assert.deepEqual({
      casinos: await prisma.casino.count(),
      markets: await prisma.casinoCountry.count(),
      versions: await prisma.casinoVersion.count(),
    }, countsBeforeRefusal, "a repeated execution attempt must refuse without a second write");
  } finally {
    await removeExactBetssonTestState(prisma);
    await prisma.$disconnect();
  }
});
