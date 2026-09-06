import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION,
  assertVettedPartnerHostedCreatives0029MigrationRow,
  planVettedPartnerHostedCreatives0029Preflight,
  vettedPartnerHostedCreativesMigrationChecksum,
} from "../lib/db/vetted-partner-hosted-creatives-0029-release";
import {
  GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION,
  geoLocalizedCreativeMigrationChecksum,
} from "../lib/db/geo-localized-creative-0028-release";
import type { PlacementMediaMigrationRow } from "../lib/db/placement-media-0027-release";

function migrationRow(name: string, checksum: string, overrides: Partial<PlacementMediaMigrationRow> = {}): PlacementMediaMigrationRow {
  return { migration_name: name, checksum, finished_at: new Date("2026-09-06T00:00:00Z"), rolled_back_at: null, ...overrides };
}

const row0028 = migrationRow(GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION, geoLocalizedCreativeMigrationChecksum());
const row0029 = () => migrationRow(VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION, vettedPartnerHostedCreativesMigrationChecksum());
const migrations = [GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION, VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION];

test("0029 requires exactly one effective checksum-matched migration", () => {
  const result = assertVettedPartnerHostedCreatives0029MigrationRow([row0029()]);
  assert.equal(result.applied, true);
  assert.match(result.checksum, /^[a-f0-9]{64}$/);
  assert.throws(() => assertVettedPartnerHostedCreatives0029MigrationRow([]), /exactly one effective/);
  assert.throws(() => assertVettedPartnerHostedCreatives0029MigrationRow([row0029(), row0029()]), /exactly one effective/);
  assert.throws(() => assertVettedPartnerHostedCreatives0029MigrationRow([row0029(), migrationRow(VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION, "wrong")]), /exactly one effective|checksum mismatch/);
  assert.throws(() => assertVettedPartnerHostedCreatives0029MigrationRow([row0029(), migrationRow(VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION, "wrong", { finished_at: null })]), /unresolved/);
});

test("DB-first preflight keeps capability disabled until 0029 and requires ready state when enabled", () => {
  assert.deepEqual(planVettedPartnerHostedCreatives0029Preflight({ rows: [row0028], repositoryMigrations: migrations }), {
    state: "schema_pending_capability_disabled",
    pending: [VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION],
    capabilityEnabled: false,
  });
  assert.throws(() => planVettedPartnerHostedCreatives0029Preflight({ rows: [row0028], repositoryMigrations: migrations, capabilityEnabled: true }), /cannot be enabled/);
  const ready = planVettedPartnerHostedCreatives0029Preflight({ rows: [row0028, row0029()], repositoryMigrations: migrations, capabilityEnabled: true });
  assert.equal(ready.state, "schema_ready");
  assert.deepEqual(ready.pending, []);
  const buildPreflight = readFileSync("scripts/vercel-build-preflight.ts", "utf8");
  assert.match(buildPreflight, /requires completed.*GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION.*VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION/s);
});

test("0029 migration, fixture and release inspection are additive, bounded, and non-destructive", () => {
  const migration = readFileSync(`prisma/migrations/${VETTED_PARTNER_HOSTED_CREATIVES_TARGET_MIGRATION}/migration.sql`, "utf8");
  const fixture = readFileSync("prisma/fixtures/0029_pre_vetted_partner_hosted_creatives.sql", "utf8");
  const release = readFileSync("lib/db/vetted-partner-hosted-creatives-0029-release.ts", "utf8");
  const executor = readFileSync("scripts/vetted-partner-hosted-creatives-01.ts", "utf8");
  const packageJson = readFileSync("package.json", "utf8");
  for (const sql of [migration, fixture]) assert.doesNotMatch(sql, /^\s*(?:DELETE|DROP|TRUNCATE|UPDATE)\b/im);
  assert.match(migration, /PartnerHostedCreative/);
  assert.match(migration, /ON DELETE RESTRICT/);
  assert.match(migration, /PartnerHostedCreative_verified_binding_check/);
  assert.match(migration, /PartnerHostedCreative_validated_destination_check/);
  assert.match(migration, /PartnerCreativeLanguageState/);
  assert.match(release, /SET TRANSACTION READ ONLY/);
  assert.doesNotMatch(release, /migrate reset|DROP TABLE|TRUNCATE/i);
  assert.match(executor, /schema_pending_capability_disabled/);
  assert.match(executor, /VETTED_PARTNER_HOSTED_CREATIVES_DATABASE_RESOURCE_ID/);
  assert.match(executor, /VETTED_PARTNER_HOSTED_CREATIVES_DATABASE_FINGERPRINT/);
  assert.match(executor, /VETTED_PARTNER_HOSTED_CREATIVES_EXPECTED_SHA/);
  assert.match(executor, /execFileSync\("npx", \["prisma", "migrate", "deploy"\]/);
  assert.match(executor, /SET TRANSACTION READ ONLY/);
  assert.doesNotMatch(executor, /migrate reset|DROP TABLE|TRUNCATE/i);
  assert.match(packageJson, /vetted-partner-hosted-creatives:migrate/);
});

test("public snapshots and DTOs omit raw destination authority", () => {
  const repository = readFileSync("lib/repositories/casino.repository.ts", "utf8");
  const snapshotProjection = repository.slice(repository.indexOf("function snapshotPartnerHostedCreative"), repository.indexOf("function snapshotPartnerHostedAssignment"));
  assert.doesNotMatch(snapshotProjection, /destinationUrl|destinationHost|destinationUrlHash|trackingLinkId/);
  assert.match(snapshotProjection, /bindingFingerprint: publishedBindingFingerprint/);
  const publicTypes = readFileSync("lib/public-casino/public-casino.types.ts", "utf8");
  assert.doesNotMatch(publicTypes, /destinationUrl|destinationHost|redirecturl|trackingLinkId/);
  const hostedRepository = readFileSync("lib/media-operations/partner-hosted-repository.ts", "utf8");
  assert.match(hostedRepository, /resolvePublishedCreativeDestination/);
  assert.match(hostedRepository, /projected\.bindingFingerprint !== expectedFingerprint/);
  assert.match(hostedRepository, /sha256\(destination\.href\) !== creative\.destinationUrlHash/);
  assert.match(hostedRepository, /casino: \{ status: "PUBLISHED", archivedAt: null \}/);
});
