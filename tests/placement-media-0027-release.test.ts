import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  PLACEMENT_MEDIA_TARGET_MIGRATION,
  assertPlacementMedia0027MigrationRow,
  placementMediaMigrationChecksum,
  planPlacementMedia0027Preflight,
  type PlacementMediaMigrationRow,
} from "../lib/db/placement-media-0027-release";

function row(overrides: Partial<PlacementMediaMigrationRow> = {}): PlacementMediaMigrationRow {
  return {
    migration_name: PLACEMENT_MEDIA_TARGET_MIGRATION,
    checksum: placementMediaMigrationChecksum(),
    finished_at: new Date("2026-09-04T08:00:00.000Z"),
    rolled_back_at: null,
    ...overrides,
  };
}

const previous = {
  migration_name: "0026_commercial_platform_completion",
  checksum: "verified-separately-by-production-preflight",
  finished_at: new Date("2026-09-03T12:00:00.000Z"),
  rolled_back_at: null,
};

test("0027 release accepts exactly one effective checksum-matched migration", () => {
  const result = assertPlacementMedia0027MigrationRow([row()]);
  assert.equal(result.applied, true);
  assert.equal(result.migration, PLACEMENT_MEDIA_TARGET_MIGRATION);
  assert.equal(result.checksum, placementMediaMigrationChecksum());
  assert.match(result.checksum, /^[a-f0-9]{64}$/);
});

test("0027 release refuses missing, unresolved, rolled-back, duplicate and mismatched attempts", () => {
  assert.throws(() => assertPlacementMedia0027MigrationRow([]), /exactly one effective completed/);
  assert.throws(() => assertPlacementMedia0027MigrationRow([row({ finished_at: null })]), /unresolved/);
  assert.throws(() => assertPlacementMedia0027MigrationRow([row({ finished_at: null, rolled_back_at: new Date() })]), /exactly one effective completed/);
  assert.throws(() => assertPlacementMedia0027MigrationRow([row(), row()]), /exactly one effective completed/);
  assert.throws(() => assertPlacementMedia0027MigrationRow([row({ checksum: "wrong" })]), /checksum mismatch/);
});

test("Production preflight permits only the exact staged 0027 suffix while reads remain legacy", () => {
  const repositoryMigrations = ["0026_commercial_platform_completion", PLACEMENT_MEDIA_TARGET_MIGRATION];
  const pending = planPlacementMedia0027Preflight({
    rows: [previous],
    repositoryMigrations,
    assignmentFirstEnabled: false,
  });
  assert.deepEqual(pending, {
    state: "schema_pending_legacy_reads",
    pending: [PLACEMENT_MEDIA_TARGET_MIGRATION],
    assignmentFirstEnabled: false,
  });
  assert.throws(() => planPlacementMedia0027Preflight({
    rows: [previous],
    repositoryMigrations,
    assignmentFirstEnabled: true,
  }), /cannot be enabled/);
  assert.throws(() => planPlacementMedia0027Preflight({
    rows: [previous],
    repositoryMigrations: ["0025_casino_market_profile_architecture", "0026_commercial_platform_completion", PLACEMENT_MEDIA_TARGET_MIGRATION],
    assignmentFirstEnabled: false,
  }), /expected only 0027 pending/);
});

test("Production preflight requires verified 0027 before assignment-first enablement", () => {
  const ready = planPlacementMedia0027Preflight({
    rows: [previous, row()],
    repositoryMigrations: ["0026_commercial_platform_completion", PLACEMENT_MEDIA_TARGET_MIGRATION],
    assignmentFirstEnabled: true,
  });
  assert.equal(ready.state, "schema_ready");
  assert.equal(ready.assignmentFirstEnabled, true);
  assert.equal(ready.migration.applied, true);
});

test("build preflight retains an exact pending-suffix guard and steady-state verification is read-only", () => {
  const preflight = readFileSync("scripts/vercel-build-preflight.ts", "utf8");
  const release = readFileSync("lib/db/placement-media-0027-release.ts", "utf8");
  assert.match(preflight, /const expectedPending = applied\.has\(GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION\) \? \[\] : \[GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION\]/);
  assert.match(preflight, /pending\.length !== expectedPending\.length/);
  assert.match(preflight, /planPlacementMedia0027Preflight/);
  assert.match(preflight, /runPlacementMedia0027Readiness/);
  assert.match(preflight, /planGeoLocalizedCreative0028Preflight/);
  assert.match(release, /SET TRANSACTION READ ONLY/);
  assert.doesNotMatch(release + preflight, /prisma migrate deploy|migrate reset|DROP TABLE|TRUNCATE/);
});

test("staged migration CI proves an existing MediaAsset survives 0027 and replay", () => {
  const fixture = readFileSync("prisma/fixtures/0027_pre_placement_media_assignments.sql", "utf8");
  const migrationCi = readFileSync("scripts/ci-migrations.mjs", "utf8");
  assert.match(fixture, /INSERT INTO "MediaAsset"/);
  assert.doesNotMatch(fixture, /DELETE|DROP|TRUNCATE/);
  assert.match(migrationCi, /0027_pre_placement_media_assignments\.sql/);
  assert.match(migrationCi, /existingMediaDataPreservedAcross0027: true/);
  assert.equal((migrationCi.match(/run\("npx", \["prisma", "migrate", "deploy"\]/g) ?? []).length > 1, true);
});
