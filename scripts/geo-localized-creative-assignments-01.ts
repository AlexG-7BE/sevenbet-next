import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { Prisma, type PrismaClient } from "@prisma/client";

import prisma from "../lib/db/prisma";
import {
  assertGeoLocalizedCreative0028Schema,
  geoLocalizedCreativeMigrationChecksum,
  geoLocalizedCreativeRepositoryMigrations,
  planGeoLocalizedCreative0028Preflight,
} from "../lib/db/geo-localized-creative-0028-release";
import { assertPlacementMedia0027MigrationRow, type PlacementMediaMigrationRow } from "../lib/db/placement-media-0027-release";
import {
  placementMediaDatabaseTarget,
  sha256,
  type PlacementBackfillManifest,
} from "../lib/media/placement-media-backfill";

const RELEASE = "GEO-LOCALIZED-CREATIVE-ASSIGNMENTS-01";
const PROJECT_ID = "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb";
const ORG_ID = "team_WhkUGuXZeIMlU1uFHtowNUqa";
const MANIFEST_PATH = "data/placement-media-assignments-01-backfill.json";
const EXPECTED_ASSIGNMENT_COUNTS = {
  CasinoMediaAssignment: 26,
  CasinoBonusMediaAssignment: 20,
  AffiliateOfferMediaAssignment: 0,
} as const;

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

type ProtectedCounts = {
  casinos: number;
  bonuses: number;
  offers: number;
  routes: number;
  mediaAssets: number;
  versions: number;
  casinoAssignments: number;
  bonusAssignments: number;
  offerAssignments: number;
};

function event(payload: Record<string, unknown>) {
  process.stdout.write(`${JSON.stringify({ release: RELEASE, ...payload })}\n`);
}

function databaseTargetFingerprint() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return "UNAVAILABLE";
  const target = new URL(raw);
  return sha256([
    target.protocol,
    target.hostname,
    target.port || "5432",
    target.username,
    target.pathname,
    target.searchParams.get("schema") ?? "public",
  ].join("\n"));
}

function repositorySha() {
  const deployed = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (deployed) return deployed;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "UNAVAILABLE";
  }
}

function productionDatabaseFingerprint() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as PlacementBackfillManifest;
  if (!/^[a-f0-9]{64}$/.test(manifest.expectedDatabaseFingerprint)) {
    throw new Error("Governed placement-media manifest has no valid Production database fingerprint.");
  }
  return manifest.expectedDatabaseFingerprint;
}

function assertWriteAuthority() {
  if (process.env.GEO_LOCALIZED_CREATIVE_ASSIGNMENTS_CONFIRM !== RELEASE) {
    throw new Error(`Write refused. Set GEO_LOCALIZED_CREATIVE_ASSIGNMENTS_CONFIRM=${RELEASE}.`);
  }
  if (process.env.ALLOW_GEO_LOCALIZED_CREATIVE_ASSIGNMENTS_WRITE !== "true") {
    throw new Error("Write refused without the bounded geo-localized creative write flag.");
  }
  const target = process.env.GEO_LOCALIZED_CREATIVE_ASSIGNMENTS_TARGET;
  if (target !== "preview" && target !== "production") {
    throw new Error("Write refused without an explicit preview or production target.");
  }
  if (process.env.VERCEL_ENV !== target) {
    throw new Error("Write refused because VERCEL_ENV differs from the explicit target.");
  }
  if (
    process.env.GEO_LOCALIZED_CREATIVE_ASSIGNMENTS_PROJECT_ID !== PROJECT_ID
    || process.env.GEO_LOCALIZED_CREATIVE_ASSIGNMENTS_ORG_ID !== ORG_ID
  ) {
    throw new Error("Write refused because the exact Vercel project identity was not confirmed.");
  }
  const fingerprint = databaseTargetFingerprint();
  const expected = placementMediaDatabaseTarget(target, productionDatabaseFingerprint());
  if (process.env.GEO_LOCALIZED_CREATIVE_ASSIGNMENTS_DATABASE_RESOURCE_ID !== expected.resourceId) {
    throw new Error("Write refused because the exact database resource identity was not confirmed.");
  }
  if (
    fingerprint !== expected.databaseFingerprint
    || process.env.GEO_LOCALIZED_CREATIVE_ASSIGNMENTS_DATABASE_FINGERPRINT !== fingerprint
  ) {
    throw new Error(`Write refused. Independently verify and set GEO_LOCALIZED_CREATIVE_ASSIGNMENTS_DATABASE_FINGERPRINT=${fingerprint}.`);
  }
  const sha = repositorySha();
  if (!process.env.GEO_LOCALIZED_CREATIVE_ASSIGNMENTS_EXPECTED_SHA || process.env.GEO_LOCALIZED_CREATIVE_ASSIGNMENTS_EXPECTED_SHA !== sha) {
    throw new Error(`Write refused. Confirm the deployed/repository SHA ${sha}.`);
  }
  return { target, fingerprint, sha, resourceId: expected.resourceId };
}

async function migrationRows(database: DatabaseClient) {
  return database.$queryRawUnsafe<PlacementMediaMigrationRow[]>(
    'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
  );
}

async function protectedCounts(database: DatabaseClient): Promise<ProtectedCounts> {
  const [result] = await database.$queryRawUnsafe<Array<Record<keyof ProtectedCounts, bigint>>>(`
    SELECT
      (SELECT COUNT(*) FROM "Casino")::bigint AS casinos,
      (SELECT COUNT(*) FROM "CasinoBonus")::bigint AS bonuses,
      (SELECT COUNT(*) FROM "AffiliateOffer")::bigint AS offers,
      (SELECT COUNT(*) FROM "AffiliateRedirectSlug")::bigint AS routes,
      (SELECT COUNT(*) FROM "MediaAsset")::bigint AS "mediaAssets",
      (SELECT COUNT(*) FROM "CasinoVersion")::bigint AS versions,
      (SELECT COUNT(*) FROM "CasinoMediaAssignment")::bigint AS "casinoAssignments",
      (SELECT COUNT(*) FROM "CasinoBonusMediaAssignment")::bigint AS "bonusAssignments",
      (SELECT COUNT(*) FROM "AffiliateOfferMediaAssignment")::bigint AS "offerAssignments"
  `);
  if (!result) throw new Error("Unable to read protected database counts.");
  return Object.fromEntries(Object.entries(result).map(([key, value]) => [key, Number(value)])) as ProtectedCounts;
}

function assertExpectedAssignments(counts: ProtectedCounts) {
  const actual = {
    CasinoMediaAssignment: counts.casinoAssignments,
    CasinoBonusMediaAssignment: counts.bonusAssignments,
    AffiliateOfferMediaAssignment: counts.offerAssignments,
  };
  if (JSON.stringify(actual) !== JSON.stringify(EXPECTED_ASSIGNMENT_COUNTS)) {
    throw new Error(`Expected governed assignment counts ${JSON.stringify(EXPECTED_ASSIGNMENT_COUNTS)}; found ${JSON.stringify(actual)}.`);
  }
  return actual;
}

async function audit() {
  const result = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await migrationRows(transaction);
    const preflight = planGeoLocalizedCreative0028Preflight({ rows, repositoryMigrations: geoLocalizedCreativeRepositoryMigrations() });
    const counts = await protectedCounts(transaction);
    assertExpectedAssignments(counts);
    const schema = preflight.state === "schema_ready" ? await assertGeoLocalizedCreative0028Schema(transaction) : null;
    if (schema && schema.counts.some((entry) => entry.targeted !== 0 || entry.rows !== entry.globalNeutral)) {
      throw new Error("Architecture release audit found targeted Production inventory; this release must leave all existing rows GLOBAL/neutral.");
    }
    return { preflight, counts, schema };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5_000, timeout: 30_000 });
  event({ event: "audit", databaseFingerprint: databaseTargetFingerprint(), repositorySha: repositorySha(), ...result });
}

async function verify() {
  const result = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await migrationRows(transaction);
    assertPlacementMedia0027MigrationRow(rows);
    const preflight = planGeoLocalizedCreative0028Preflight({ rows, repositoryMigrations: geoLocalizedCreativeRepositoryMigrations() });
    if (preflight.state !== "schema_ready") throw new Error("0028 is not applied; verification cannot continue.");
    const schema = await assertGeoLocalizedCreative0028Schema(transaction);
    const counts = await protectedCounts(transaction);
    const assignments = assertExpectedAssignments(counts);
    if (schema.counts.some((entry) => entry.targeted !== 0 || entry.rows !== entry.globalNeutral)) {
      throw new Error("Expected every pre-existing assignment to remain NULL/NULL after 0028.");
    }
    return { preflight, schema, counts, assignments };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5_000, timeout: 30_000 });
  event({ event: "verify", repositorySha: repositorySha(), migrationChecksum: geoLocalizedCreativeMigrationChecksum(), ...result });
}

async function migrate() {
  const authority = assertWriteAuthority();
  const before = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await migrationRows(transaction);
    const preflight = planGeoLocalizedCreative0028Preflight({ rows, repositoryMigrations: geoLocalizedCreativeRepositoryMigrations() });
    if (preflight.state !== "schema_pending_global_compatibility") {
      throw new Error("Migration refused because 0028 is not the exact untouched pending suffix.");
    }
    const counts = await protectedCounts(transaction);
    assertExpectedAssignments(counts);
    return { preflight, counts };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5_000, timeout: 30_000 });

  event({ event: "migration_preflight", authority, ...before });
  execFileSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", env: process.env });

  const after = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await migrationRows(transaction);
    const preflight = planGeoLocalizedCreative0028Preflight({ rows, repositoryMigrations: geoLocalizedCreativeRepositoryMigrations() });
    if (preflight.state !== "schema_ready") throw new Error("0028 did not reach verified schema-ready state.");
    const schema = await assertGeoLocalizedCreative0028Schema(transaction);
    const counts = await protectedCounts(transaction);
    if (JSON.stringify(counts) !== JSON.stringify(before.counts)) {
      throw new Error(`Protected row counts changed across 0028: before=${JSON.stringify(before.counts)} after=${JSON.stringify(counts)}.`);
    }
    assertExpectedAssignments(counts);
    if (schema.counts.some((entry) => entry.targeted !== 0 || entry.rows !== entry.globalNeutral)) {
      throw new Error("0028 postflight found a pre-existing assignment that is not NULL/NULL.");
    }
    return { preflight, schema, counts };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5_000, timeout: 30_000 });
  event({ event: "migration_complete", authority, before: before.counts, after });
}

async function main() {
  const command = process.argv[2];
  if (command === "audit") return audit();
  if (command === "verify") return verify();
  if (command === "migrate") return migrate();
  throw new Error("Usage: geo-localized-creative-assignments-01.ts <audit|migrate|verify>");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[${RELEASE}] ${message}\n`);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect().catch(() => undefined);
});
