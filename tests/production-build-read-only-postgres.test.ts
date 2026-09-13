import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { safeOfferCorpusDefinitions } from "../lib/casino-offer-corpus/safe-offer-corpus";

const ACTOR_ID = "d4440000-0000-4000-8000-000000000001";
const CREATED_BY = "production-build-read-only-postgres-test";
const LOGO_STORAGE_PREFIX = "release-governance-read-only-test/";
const governedSlugs = safeOfferCorpusDefinitions.map((definition) => definition.casinoSlug)
  .concat(["inkabet", "betsafe", "supercasino"])
  .sort();

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL and DIRECT_URL are required");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !url.pathname.slice(1).endsWith("_ci")) {
    throw new Error("Production build read-only test requires a loopback _ci database");
  }
}

function executeScript(script: string, mode: string) {
  return spawnSync(
    process.execPath,
    ["--import", "tsx", script, mode],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        CI: "true",
        VERCEL_ENV: "production",
        PRISMA_INTERACTIVE_TRANSACTION_TIMEOUT_MS: "30000",
      },
    },
  );
}

function runScript(script: string, mode: string) {
  const result = executeScript(script, mode);
  assert.equal(result.status, 0, [result.stdout, result.stderr].filter(Boolean).join("\n"));
  return result.stdout;
}

function quotedIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function applicationTableDigests(prisma: PrismaClient) {
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name <> '_prisma_migrations'
    ORDER BY table_name
  `;
  const state: Record<string, { rows: string; digest: string }> = {};
  for (const { table_name: tableName } of tables) {
    const [digest] = await prisma.$queryRawUnsafe<Array<{ rows: bigint; digest: string }>>(`
      SELECT
        COUNT(*)::bigint AS rows,
        md5(COALESCE(string_agg(md5(to_jsonb(subject)::text), '' ORDER BY to_jsonb(subject)::text), '')) AS digest
      FROM ${quotedIdentifier(tableName)} AS subject
    `);
    assert.ok(digest);
    state[tableName] = { rows: digest.rows.toString(), digest: digest.digest };
  }
  return state;
}

async function cleanup(prisma: PrismaClient) {
  await prisma.mediaAsset.deleteMany({ where: { storageKey: { startsWith: LOGO_STORAGE_PREFIX } } });
  await prisma.casino.deleteMany({ where: { slug: { in: governedSlugs } } });
  await prisma.adminUser.deleteMany({ where: { id: ACTOR_ID } });
}

test("Production-mode catalog and logo verifiers leave every application table byte-stable", async () => {
  assert.equal(process.env.CI, "true", "This mutation-proof test is restricted to disposable CI databases");
  assertDisposableDatabase(process.env.DATABASE_URL);
  assertDisposableDatabase(process.env.DIRECT_URL);
  const prisma = new PrismaClient();

  try {
    await cleanup(prisma);
    await prisma.adminUser.create({
      data: {
        id: ACTOR_ID,
        email: "production-build-read-only@example.invalid",
        name: "Production build read-only test",
        role: "ADMIN",
      },
    });

    // Fixture preparation deliberately exercises the historical writer before
    // the protected before/after boundary. It never targets a non-loopback DB.
    runScript("scripts/casino-real-catalog-03.ts", "build-preflight");

    const casinos = await prisma.casino.findMany({
      where: { slug: { in: governedSlugs } },
      orderBy: { slug: "asc" },
      select: { id: true, slug: true },
    });
    assert.equal(casinos.length, 6);
    await prisma.mediaAsset.createMany({
      data: casinos.map((casino) => ({
        type: "LOGO",
        storageKey: `${LOGO_STORAGE_PREFIX}${casino.slug}.svg`,
        publicUrl: `/release-governance-read-only-test/${casino.slug}.svg`,
        originalFilename: `${casino.slug}.svg`,
        mimeType: "image/svg+xml",
        sizeBytes: 1,
        altText: `${casino.slug} test logo`,
        createdBy: CREATED_BY,
        casinoId: casino.id,
      })),
    });

    const writerFixtureShape = {
      casinoRevisions: await prisma.casinoRevision.count({ where: { casino: { slug: { in: governedSlugs } } } }),
      editorialReviewRevisions: await prisma.editorialReviewRevision.count({ where: { review: { casino: { slug: { in: governedSlugs } } } } }),
      auditRows: await prisma.auditLog.count({ where: { actorId: ACTOR_ID } }),
    };
    assert.ok(writerFixtureShape.casinoRevisions > 0);
    assert.equal(writerFixtureShape.editorialReviewRevisions, 6);
    assert.ok(writerFixtureShape.auditRows > 0);

    const before = await applicationTableDigests(prisma);
    for (const requiredTable of [
      "Casino", "CasinoVersion", "CasinoRevision", "EditorialReview", "EditorialReviewRevision",
      "CasinoBonus", "AffiliateNetwork", "AffiliateProgram", "AffiliateOffer", "AffiliateTrackingLink",
      "AffiliateRedirectSlug", "MarketActivation", "PartnerCasinoRelationship", "PartnerCasinoMarketSupport",
      "CommercialOpportunity", "AuditLog",
    ]) {
      assert.ok(before[requiredTable], `${requiredTable} must be covered by the digest proof`);
    }

    const logoOutput = runScript("scripts/logo-only-media-build-preflight.ts", "verify");
    const catalogOutput = runScript("scripts/casino-real-catalog-03.ts", "verify");
    assert.match(logoOutput, /"verified":true/);
    assert.match(catalogOutput, /"verified": true/);

    const after = await applicationTableDigests(prisma);
    assert.deepEqual(after, before);

    await prisma.casino.delete({ where: { slug: "inkabet" } });
    const incompatibleBefore = await applicationTableDigests(prisma);
    const failedVerification = executeScript("scripts/casino-real-catalog-03.ts", "verify");
    assert.notEqual(failedVerification.status, 0);
    assert.match(failedVerification.stderr, /CASINO-REAL-CATALOG-03: inkabet missing after release/);
    assert.deepEqual(await applicationTableDigests(prisma), incompatibleBefore);
  } finally {
    await cleanup(prisma);
    await prisma.$disconnect();
  }
});
