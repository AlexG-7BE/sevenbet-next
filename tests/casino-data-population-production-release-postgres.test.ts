import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { EditorialStatus, Prisma, PrismaClient } from "@prisma/client";

import { parseCasinoIngestionBundle } from "../lib/casino-ingestion/contract";
import {
  CASINO_DATA_POPULATION_01_AUTHORITY,
  CASINO_DATA_POPULATION_01_BUNDLES,
  CasinoDataPopulation01ReleaseError,
  runCasinoDataPopulation01ProductionRelease,
} from "../lib/casino-ingestion/casino-data-population-01-production-release";
import { deterministicCasinoIngestionId, ingestCasinoBundle } from "../lib/casino-ingestion/importer";

const COMMIT = "c".repeat(40);
const POPULATION_SLUGS = ["hello-casino", "skol-casino", "diamond7", "gday-casino", "21-prive", "slotnite", "dragonbet"];
const ALL_SLUGS = ["betsson", ...POPULATION_SLUGS];

const aggregateInclude = {
  images: { orderBy: [{ kind: Prisma.SortOrder.asc }, { sortOrder: Prisma.SortOrder.asc }] },
  mediaAssets: { orderBy: [{ type: Prisma.SortOrder.asc }, { sortOrder: Prisma.SortOrder.asc }] },
  countries: {
    orderBy: { countryCode: Prisma.SortOrder.asc },
    include: {
      operatorProfile: true,
      evidence: { orderBy: { id: Prisma.SortOrder.asc } },
      licenses: {
        orderBy: { casinoLicenseId: Prisma.SortOrder.asc },
        include: { license: { include: { evidence: { orderBy: { id: Prisma.SortOrder.asc } } } } },
      },
      paymentMethods: { orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { methodKey: Prisma.SortOrder.asc }] },
      gameProviders: { orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { providerKey: Prisma.SortOrder.asc }] },
      gameCategories: { orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { categoryKey: Prisma.SortOrder.asc }] },
      bonuses: { orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { slug: Prisma.SortOrder.asc }] },
      mediaAssets: { orderBy: [{ type: Prisma.SortOrder.asc }, { sortOrder: Prisma.SortOrder.asc }] },
    },
  },
  licenses: { include: { evidence: true } },
  paymentMethods: { where: { casinoCountryId: null } },
  gameProviders: { where: { casinoCountryId: null } },
  gameCategories: { where: { casinoCountryId: null } },
  casinoBonuses: { where: { casinoCountryId: null } },
  casinoLinks: { where: { casinoBonusId: null } },
  seo: true,
  operatorProfile: true,
  brandProfile: true,
} satisfies Prisma.CasinoInclude;

function assertDisposable(value: string | undefined) {
  if (!value) throw new Error("Disposable database URL is required.");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !url.pathname.slice(1).endsWith("_ci")) {
    throw new Error("This test accepts only a loopback _ci PostgreSQL database.");
  }
}

function asSnapshot(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function cleanup(prisma: PrismaClient) {
  await prisma.casino.deleteMany({ where: { slug: { in: ALL_SLUGS } } });
  const brandIds = [
    deterministicCasinoIngestionId("betsson:brand:betsson"),
    ...CASINO_DATA_POPULATION_01_BUNDLES.map((bundle) => deterministicCasinoIngestionId(`${bundle.key}:brand:${bundle.key}`)),
  ];
  await prisma.casinoBrand.deleteMany({ where: { id: { in: brandIds } } });
  await prisma.casinoOperator.deleteMany({
    where: {
      OR: [
        { id: { in: [
          deterministicCasinoIngestionId("betsson:operator:sftg-limited"),
          deterministicCasinoIngestionId("betsson:operator:betsson-nordic-ltd"),
          deterministicCasinoIngestionId("21-prive:operator:white-hat-gaming-limited"),
          deterministicCasinoIngestionId("dragonbet:operator:dragonbet-ltd"),
        ] } },
        { name: { in: ["White Hat Gaming Limited", "DragonBet Ltd"] } },
      ],
    },
  });
}

async function seedPublishedBetsson(prisma: PrismaClient, publishedAt: Date) {
  const bundle = parseCasinoIngestionBundle(JSON.parse(await readFile("data/casino-ingestion/betsson-pe-se.v1.json", "utf8")));
  const imported = await ingestCasinoBundle(prisma, bundle);
  assert.equal(imported.reconciliation?.created, 78);
  const current = await prisma.casino.findUniqueOrThrow({ where: { slug: "betsson" }, include: aggregateInclude });
  await prisma.$transaction(async (transaction) => {
    await transaction.casinoRevision.create({
      data: {
        casinoId: current.id,
        revisionNumber: 1,
        snapshot: asSnapshot(current),
        summary: "Disposable Betsson factual baseline",
        createdBy: "casino-data-population-01-release-test",
      },
    });
    await transaction.casinoVersion.create({
      data: {
        casinoId: current.id,
        version: 1,
        status: EditorialStatus.PUBLISHED,
        snapshot: asSnapshot({
          ...current,
          status: EditorialStatus.PUBLISHED,
          publishedVersion: 1,
          publishedAt,
          scheduledPublishAt: null,
          archivedAt: null,
          updatedAt: publishedAt,
        }),
        publishedAt,
        createdBy: "casino-data-population-01-release-test",
      },
    });
    await transaction.casino.update({
      where: { id: current.id },
      data: { status: EditorialStatus.PUBLISHED, publishedVersion: 1, draftVersion: 2, publishedAt },
    });
  });
}

test("one Production-shaped execution imports and publishes only the exact seven GB factual profiles", async () => {
  assertDisposable(process.env.DATABASE_URL);
  assertDisposable(process.env.DIRECT_URL);
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    CASINO_DATA_POPULATION_01_RELEASE_AUTHORITY: CASINO_DATA_POPULATION_01_AUTHORITY,
    CASINO_DATA_POPULATION_01_RELEASE_SOURCE_COMMIT: COMMIT,
    CASINO_DATA_POPULATION_01_EXPECTED_RELEASE_COMMIT: COMMIT,
    CASINO_DATA_POPULATION_01_EXECUTE_PRODUCTION_RELEASE: "1",
    CI: "true",
    NODE_ENV: "test",
  };
  const events: Array<Record<string, unknown>> = [];
  const now = new Date("2026-09-02T14:00:00.000Z");
  const prisma = new PrismaClient({ datasourceUrl: environment.DIRECT_URL });
  try {
    await cleanup(prisma);
    await seedPublishedBetsson(prisma, now);
    const beforeAtomicFailure = await Promise.all([
      prisma.casino.count(),
      prisma.casinoBrand.count(),
      prisma.casinoOperator.count(),
      prisma.casinoCountry.count(),
      prisma.casinoLicense.count(),
      prisma.casinoLicenseEvidence.count(),
      prisma.casinoCountryEvidence.count(),
      prisma.casinoGameProvider.count(),
      prisma.casinoGameCategory.count(),
      prisma.casinoVersion.count(),
      prisma.casinoRevision.count(),
    ]);
    const rollbackEvents: Array<Record<string, unknown>> = [];
    await assert.rejects(runCasinoDataPopulation01ProductionRelease({
      authority: "disposable-test",
      environment,
      now: () => now,
      writeEvent: (event) => rollbackEvents.push(event),
      createPrismaClient: () => new PrismaClient({ datasourceUrl: environment.DIRECT_URL }),
      beforePublicationForTestOnly: () => {
        throw new Error("injected publication refusal");
      },
    }), /injected publication refusal/);
    assert.deepEqual(await Promise.all([
      prisma.casino.count(),
      prisma.casinoBrand.count(),
      prisma.casinoOperator.count(),
      prisma.casinoCountry.count(),
      prisma.casinoLicense.count(),
      prisma.casinoLicenseEvidence.count(),
      prisma.casinoCountryEvidence.count(),
      prisma.casinoGameProvider.count(),
      prisma.casinoGameCategory.count(),
      prisma.casinoVersion.count(),
      prisma.casinoRevision.count(),
    ]), beforeAtomicFailure, "an injected publication failure must roll back the entire seven-casino import");
    assert.equal(
      rollbackEvents.some((event) => event.event === "casino_data_population_01_production_factual_release_failed"
        && event.importPerformed === false
        && event.publicationPerformed === false
        && event.mutationStatus === "none"),
      true,
    );

    const result = await runCasinoDataPopulation01ProductionRelease({
      authority: "disposable-test",
      environment,
      now: () => now,
      writeEvent: (event) => events.push(event),
      createPrismaClient: () => new PrismaClient({ datasourceUrl: environment.DIRECT_URL }),
    });
    assert.equal(result.state, "factual_release_succeeded");
    assert.equal(result.publications.length, 7);
    assert.equal(events.some((event) => event.event === "casino_data_population_01_production_release_preflight_verified"), true);
    assert.equal(events.some((event) => event.event === "casino_data_population_01_production_import_succeeded"), true);
    assert.equal(events.some((event) => event.event === "casino_data_population_01_factual_publication_succeeded"), true);
    const completed = events.find((event) => event.event === "casino_data_population_01_production_factual_release_succeeded");
    assert.equal(completed?.importExecutions, 1);
    assert.equal(completed?.commercialMutation, false);
    assert.equal(completed?.productionEligibleRoutesAfter, 0);

    const casinos = await prisma.casino.findMany({
      where: { slug: { in: POPULATION_SLUGS } },
      include: {
        countries: { include: { evidence: true, licenses: { include: { license: { include: { evidence: true } } } }, paymentMethods: true, gameCategories: true, gameProviders: true, bonuses: true } },
        versions: true,
        revisions: true,
        images: true,
        mediaAssets: true,
      },
      orderBy: { slug: "asc" },
    });
    assert.equal(casinos.length, 7);
    assert.equal(casinos.every((casino) => casino.status === "PUBLISHED" && casino.editorScore === null), true);
    assert.equal(casinos.every((casino) => casino.versions.length === 1 && casino.revisions.length === 1), true);
    assert.equal(casinos.every((casino) => casino.countries.length === 1 && casino.countries[0]!.countryCode === "GB"), true);
    assert.equal(casinos.reduce((total, casino) => total + casino.countries[0]!.evidence.length, 0), 53);
    assert.equal(casinos.reduce((total, casino) => total + casino.countries[0]!.licenses[0]!.license.evidence.length, 0), 14);
    assert.equal(casinos.reduce((total, casino) => total + casino.countries[0]!.gameCategories.length, 0), 14);
    assert.equal(casinos.reduce((total, casino) => total + casino.countries[0]!.gameProviders.length, 0), 3);
    assert.equal(casinos.every((casino) => casino.countries[0]!.paymentMethods.length === 0 && casino.countries[0]!.bonuses.length === 0), true);
    assert.equal(casinos.every((casino) => casino.images.length === 0 && casino.mediaAssets.length === 0), true);
    assert.equal(casinos.find((casino) => casino.slug === "dragonbet")!.countries[0]!.evidence.some((evidence) => evidence.classification === "CONTRADICTION"), true);
    assert.equal(await prisma.affiliateProgram.count({ where: { casinoId: { in: casinos.map((casino) => casino.id) } } }), 0);
    assert.equal(await prisma.affiliateOffer.count({ where: { casinoId: { in: casinos.map((casino) => casino.id) } } }), 0);
    assert.equal(await prisma.affiliateTrackingLinkCountry.count({ where: { productionEligible: true } }), 0);
    assert.equal(await prisma.affiliateRedirectSlug.count({ where: { casinoId: { in: casinos.map((casino) => casino.id) } } }), 0);
    assert.deepEqual((await prisma.casinoCountry.findMany({ where: { casino: { slug: "betsson" } }, orderBy: { countryCode: "asc" }, select: { countryCode: true } })).map((market) => market.countryCode), ["PE", "SE"]);

    const countsBeforeRefusal = {
      casinos: await prisma.casino.count(),
      markets: await prisma.casinoCountry.count(),
      versions: await prisma.casinoVersion.count(),
      revisions: await prisma.casinoRevision.count(),
    };
    const refusalEvents: Array<Record<string, unknown>> = [];
    await assert.rejects(
      runCasinoDataPopulation01ProductionRelease({
        authority: "disposable-test",
        environment,
        now: () => now,
        writeEvent: (event) => refusalEvents.push(event),
        createPrismaClient: () => new PrismaClient({ datasourceUrl: environment.DIRECT_URL }),
      }),
      (error: unknown) => error instanceof CasinoDataPopulation01ReleaseError,
    );
    assert.equal(refusalEvents.some((event) => event.event === "casino_data_population_01_production_factual_release_failed" && event.importPerformed === false), true);
    assert.deepEqual({
      casinos: await prisma.casino.count(),
      markets: await prisma.casinoCountry.count(),
      versions: await prisma.casinoVersion.count(),
      revisions: await prisma.casinoRevision.count(),
    }, countsBeforeRefusal, "a repeated execution attempt must refuse without a second write");
  } finally {
    await cleanup(prisma);
    await prisma.$disconnect();
  }
});
