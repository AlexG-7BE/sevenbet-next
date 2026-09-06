import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Prisma, type PrismaClient } from "@prisma/client";

import {
  assertVettedPartnerHostedCreatives0029Schema,
  planVettedPartnerHostedCreatives0029Preflight,
  vettedPartnerHostedCreativesMigrationChecksum,
  vettedPartnerHostedCreativesRepositoryMigrations,
} from "../lib/db/vetted-partner-hosted-creatives-0029-release";
import type { PlacementMediaMigrationRow } from "../lib/db/placement-media-0027-release";
import {
  placementMediaDatabaseTarget,
  sha256,
  type PlacementBackfillManifest,
} from "../lib/media/placement-media-backfill";

export const VETTED_PARTNER_HOSTED_CREATIVES_RELEASE = "VETTED-PARTNER-HOSTED-CREATIVES-01";

const PROJECT_ID = "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb";
const ORG_ID = "team_WhkUGuXZeIMlU1uFHtowNUqa";
const MANIFEST_PATH = "data/placement-media-assignments-01-backfill.json";
const FULL_COMMIT = /^[a-f0-9]{40}$/;

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

let prisma: PrismaClient;

type ProtectedCounts = {
  users: number;
  enrollments: number;
  missionProgress: number;
  casinos: number;
  bonuses: number;
  offers: number;
  routes: number;
  trackingLinks: number;
  mediaAssets: number;
  versions: number;
  casinoAssignments: number;
  bonusAssignments: number;
  offerAssignments: number;
  commercialOpportunities: number;
  commercialEvidence: number;
};

function event(payload: Record<string, unknown>) {
  process.stdout.write(`${JSON.stringify({ release: VETTED_PARTNER_HOSTED_CREATIVES_RELEASE, ...payload })}\n`);
}

export function databaseTargetFingerprint(environment: NodeJS.ProcessEnv = process.env) {
  const raw = environment.DATABASE_URL?.trim();
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

export function configureMigrationBindings(environment: NodeJS.ProcessEnv = process.env) {
  const databaseUrl = environment.DATABASE_URL?.trim();
  const directUrl = environment.DIRECT_URL?.trim();
  if (databaseUrl && directUrl) return { source: "base" as const };

  const providerAlias = environment.VERCEL_ENV === "preview"
    ? environment.ENVISO_DATABASE_URL?.trim()
    : environment.VERCEL_ENV === "production"
      ? environment.PRODDB_DATABASE_URL?.trim()
      : undefined;
  if (!providerAlias) {
    throw new Error("Database bindings are unavailable for the explicit Vercel environment.");
  }
  if (!databaseUrl) environment.DATABASE_URL = providerAlias;
  if (!directUrl) environment.DIRECT_URL = providerAlias;
  return { source: "provider-direct-alias" as const };
}

function repositorySha() {
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

export function assertWriteAuthority(
  environment: NodeJS.ProcessEnv = process.env,
  options: { repositorySha?: string; productionDatabaseFingerprint?: string } = {},
) {
  if (environment.VETTED_PARTNER_HOSTED_CREATIVES_RELEASE_CONFIRM !== VETTED_PARTNER_HOSTED_CREATIVES_RELEASE) {
    throw new Error(`Write refused. Set VETTED_PARTNER_HOSTED_CREATIVES_RELEASE_CONFIRM=${VETTED_PARTNER_HOSTED_CREATIVES_RELEASE}.`);
  }
  if (environment.ALLOW_VETTED_PARTNER_HOSTED_CREATIVES_MIGRATION !== "true") {
    throw new Error("Write refused without the bounded hosted-creative migration flag.");
  }
  const target = environment.VETTED_PARTNER_HOSTED_CREATIVES_TARGET;
  if (target !== "preview" && target !== "production") {
    throw new Error("Write refused without an explicit preview or production target.");
  }
  if (environment.VERCEL_ENV !== target) {
    throw new Error("Write refused because VERCEL_ENV differs from the explicit target.");
  }
  if (
    environment.VETTED_PARTNER_HOSTED_CREATIVES_PROJECT_ID !== PROJECT_ID
    || environment.VETTED_PARTNER_HOSTED_CREATIVES_ORG_ID !== ORG_ID
  ) {
    throw new Error("Write refused because the exact Vercel project identity was not confirmed.");
  }
  if (environment.VETTED_PARTNER_HOSTED_CREATIVES_ENABLED === "true") {
    throw new Error("Write refused while the hosted-creative capability is enabled.");
  }

  const fingerprint = databaseTargetFingerprint(environment);
  const expectedTarget = placementMediaDatabaseTarget(
    target,
    options.productionDatabaseFingerprint ?? productionDatabaseFingerprint(),
  );
  if (environment.VETTED_PARTNER_HOSTED_CREATIVES_DATABASE_RESOURCE_ID !== expectedTarget.resourceId) {
    throw new Error("Write refused because the exact database resource identity was not confirmed.");
  }
  if (
    fingerprint !== expectedTarget.databaseFingerprint
    || environment.VETTED_PARTNER_HOSTED_CREATIVES_DATABASE_FINGERPRINT !== fingerprint
  ) {
    throw new Error(`Write refused. Independently verify and set VETTED_PARTNER_HOSTED_CREATIVES_DATABASE_FINGERPRINT=${fingerprint}.`);
  }

  const sha = options.repositorySha ?? repositorySha();
  if (
    !FULL_COMMIT.test(sha)
    || environment.VETTED_PARTNER_HOSTED_CREATIVES_EXPECTED_SHA !== sha
  ) {
    throw new Error(`Write refused. Confirm the checked-out release SHA ${sha}.`);
  }
  return { target, fingerprint, sha, resourceId: expectedTarget.resourceId };
}

async function migrationRows(database: DatabaseClient) {
  return database.$queryRawUnsafe<PlacementMediaMigrationRow[]>(
    'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
  );
}

async function protectedCounts(database: DatabaseClient): Promise<ProtectedCounts> {
  const [result] = await database.$queryRawUnsafe<Array<Record<keyof ProtectedCounts, bigint>>>(`
    SELECT
      (SELECT COUNT(*) FROM "User")::bigint AS users,
      (SELECT COUNT(*) FROM "ProgramEnrollment")::bigint AS enrollments,
      (SELECT COUNT(*) FROM "ProgrammeMissionProgress")::bigint AS "missionProgress",
      (SELECT COUNT(*) FROM "Casino")::bigint AS casinos,
      (SELECT COUNT(*) FROM "CasinoBonus")::bigint AS bonuses,
      (SELECT COUNT(*) FROM "AffiliateOffer")::bigint AS offers,
      (SELECT COUNT(*) FROM "AffiliateRedirectSlug")::bigint AS routes,
      (SELECT COUNT(*) FROM "AffiliateTrackingLink")::bigint AS "trackingLinks",
      (SELECT COUNT(*) FROM "MediaAsset")::bigint AS "mediaAssets",
      (SELECT COUNT(*) FROM "CasinoVersion")::bigint AS versions,
      (SELECT COUNT(*) FROM "CasinoMediaAssignment")::bigint AS "casinoAssignments",
      (SELECT COUNT(*) FROM "CasinoBonusMediaAssignment")::bigint AS "bonusAssignments",
      (SELECT COUNT(*) FROM "AffiliateOfferMediaAssignment")::bigint AS "offerAssignments",
      (SELECT COUNT(*) FROM "CommercialOpportunity")::bigint AS "commercialOpportunities",
      (SELECT COUNT(*) FROM "CommercialEvidence")::bigint AS "commercialEvidence"
  `);
  if (!result) throw new Error("Unable to read protected database counts.");
  return Object.fromEntries(Object.entries(result).map(([key, value]) => [key, Number(value)])) as ProtectedCounts;
}

async function hostedTables(database: DatabaseClient) {
  const [result] = await database.$queryRawUnsafe<Array<{
    creatives: boolean;
    casinoAssignments: boolean;
    bonusAssignments: boolean;
    offerAssignments: boolean;
  }>>(`
    SELECT
      to_regclass('public."PartnerHostedCreative"') IS NOT NULL AS creatives,
      to_regclass('public."CasinoPartnerHostedCreativeAssignment"') IS NOT NULL AS "casinoAssignments",
      to_regclass('public."CasinoBonusPartnerHostedCreativeAssignment"') IS NOT NULL AS "bonusAssignments",
      to_regclass('public."AffiliateOfferPartnerHostedCreativeAssignment"') IS NOT NULL AS "offerAssignments"
  `);
  if (!result) throw new Error("Unable to inspect hosted-creative table presence.");
  return result;
}

async function audit() {
  const result = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await migrationRows(transaction);
    const preflight = planVettedPartnerHostedCreatives0029Preflight({
      rows,
      repositoryMigrations: vettedPartnerHostedCreativesRepositoryMigrations(),
      capabilityEnabled: process.env.VETTED_PARTNER_HOSTED_CREATIVES_ENABLED === "true",
    });
    const counts = await protectedCounts(transaction);
    const tables = await hostedTables(transaction);
    const schema = preflight.state === "schema_ready"
      ? await assertVettedPartnerHostedCreatives0029Schema(transaction)
      : null;
    if (preflight.state !== "schema_ready" && Object.values(tables).some(Boolean)) {
      throw new Error("Hosted-creative preflight found partial 0029 schema before migration.");
    }
    return { preflight, counts, tables, schema };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5_000, timeout: 30_000 });
  event({ event: "audit", databaseFingerprint: databaseTargetFingerprint(), repositorySha: repositorySha(), ...result });
}

async function verify() {
  const result = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await migrationRows(transaction);
    const preflight = planVettedPartnerHostedCreatives0029Preflight({
      rows,
      repositoryMigrations: vettedPartnerHostedCreativesRepositoryMigrations(),
      capabilityEnabled: process.env.VETTED_PARTNER_HOSTED_CREATIVES_ENABLED === "true",
    });
    if (preflight.state !== "schema_ready") throw new Error("0029 is not applied; verification cannot continue.");
    return {
      preflight,
      schema: await assertVettedPartnerHostedCreatives0029Schema(transaction),
      counts: await protectedCounts(transaction),
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5_000, timeout: 30_000 });
  event({
    event: "verify",
    repositorySha: repositorySha(),
    migrationChecksum: vettedPartnerHostedCreativesMigrationChecksum(),
    ...result,
  });
}

async function migrate() {
  const authority = assertWriteAuthority();
  const before = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await migrationRows(transaction);
    const preflight = planVettedPartnerHostedCreatives0029Preflight({
      rows,
      repositoryMigrations: vettedPartnerHostedCreativesRepositoryMigrations(),
      capabilityEnabled: false,
    });
    if (preflight.state !== "schema_pending_capability_disabled") {
      throw new Error("Migration refused because 0029 is not the exact untouched pending suffix.");
    }
    const tables = await hostedTables(transaction);
    if (Object.values(tables).some(Boolean)) {
      throw new Error("Migration refused because partial 0029 schema already exists.");
    }
    return { preflight, tables, counts: await protectedCounts(transaction) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5_000, timeout: 30_000 });

  event({ event: "migration_preflight", authority, ...before });
  execFileSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", env: process.env });

  const after = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const rows = await migrationRows(transaction);
    const preflight = planVettedPartnerHostedCreatives0029Preflight({
      rows,
      repositoryMigrations: vettedPartnerHostedCreativesRepositoryMigrations(),
      capabilityEnabled: false,
    });
    if (preflight.state !== "schema_ready") throw new Error("0029 did not reach verified schema-ready state.");
    const schema = await assertVettedPartnerHostedCreatives0029Schema(transaction);
    const counts = await protectedCounts(transaction);
    if (JSON.stringify(counts) !== JSON.stringify(before.counts)) {
      throw new Error(`Protected row counts changed across 0029: before=${JSON.stringify(before.counts)} after=${JSON.stringify(counts)}.`);
    }
    if (schema.counts.some((entry) => entry.rows !== 0)) {
      throw new Error("0029 postflight found hosted rows invented by an additive schema migration.");
    }
    return { preflight, schema, counts };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5_000, timeout: 30_000 });
  event({ event: "migration_complete", authority, before: before.counts, after });
}

async function main() {
  const binding = configureMigrationBindings();
  ({ default: prisma } = await import("../lib/db/prisma"));
  event({ event: "migration_binding", source: binding.source, environment: process.env.VERCEL_ENV });
  const command = process.argv[2];
  if (command === "audit") return audit();
  if (command === "verify") return verify();
  if (command === "migrate") return migrate();
  throw new Error("Usage: vetted-partner-hosted-creatives-01.ts <audit|migrate|verify>");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[${VETTED_PARTNER_HOSTED_CREATIVES_RELEASE}] ${message}\n`);
    process.exitCode = 1;
  }).finally(async () => {
    await prisma?.$disconnect().catch(() => undefined);
  });
}
