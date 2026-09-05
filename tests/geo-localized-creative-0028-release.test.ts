import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION,
  assertGeoLocalizedCreative0028MigrationRow,
  geoLocalizedCreativeMigrationChecksum,
  planGeoLocalizedCreative0028Preflight,
} from "../lib/db/geo-localized-creative-0028-release";
import {
  PLACEMENT_MEDIA_TARGET_MIGRATION,
  placementMediaMigrationChecksum,
  type PlacementMediaMigrationRow,
} from "../lib/db/placement-media-0027-release";

function row(overrides: Partial<PlacementMediaMigrationRow> = {}): PlacementMediaMigrationRow {
  return {
    migration_name: GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION,
    checksum: geoLocalizedCreativeMigrationChecksum(),
    finished_at: new Date("2026-09-05T08:00:00.000Z"),
    rolled_back_at: null,
    ...overrides,
  };
}

const placementRow: PlacementMediaMigrationRow = {
  migration_name: PLACEMENT_MEDIA_TARGET_MIGRATION,
  checksum: placementMediaMigrationChecksum(),
  finished_at: new Date("2026-09-04T08:00:00.000Z"),
  rolled_back_at: null,
};

const repositoryMigrations = [PLACEMENT_MEDIA_TARGET_MIGRATION, GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION];

test("0028 release accepts exactly one effective checksum-matched migration", () => {
  const result = assertGeoLocalizedCreative0028MigrationRow([row()]);
  assert.equal(result.applied, true);
  assert.equal(result.migration, GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION);
  assert.equal(result.checksum, geoLocalizedCreativeMigrationChecksum());
  assert.match(result.checksum, /^[a-f0-9]{64}$/);
});

test("0028 release refuses missing, unresolved, rolled-back, duplicate and mismatched attempts", () => {
  assert.throws(() => assertGeoLocalizedCreative0028MigrationRow([]), /exactly one effective completed/);
  assert.throws(() => assertGeoLocalizedCreative0028MigrationRow([row({ finished_at: null })]), /unresolved/);
  assert.throws(() => assertGeoLocalizedCreative0028MigrationRow([row({ finished_at: null, rolled_back_at: new Date() })]), /exactly one effective completed/);
  assert.throws(() => assertGeoLocalizedCreative0028MigrationRow([row(), row()]), /exactly one effective completed/);
  assert.throws(() => assertGeoLocalizedCreative0028MigrationRow([row({ checksum: "wrong" })]), /checksum mismatch/);
});

test("Production preflight permits only the exact staged 0028 suffix after verified 0027", () => {
  const pending = planGeoLocalizedCreative0028Preflight({ rows: [placementRow], repositoryMigrations });
  assert.deepEqual(pending, {
    state: "schema_pending_global_compatibility",
    pending: [GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION],
    legacyTargetSemantics: "GLOBAL_NEUTRAL",
  });
  assert.throws(() => planGeoLocalizedCreative0028Preflight({ rows: [], repositoryMigrations }), /0027/);
  assert.throws(() => planGeoLocalizedCreative0028Preflight({
    rows: [placementRow, row({ finished_at: null })],
    repositoryMigrations,
  }), /unresolved/);
  assert.throws(() => planGeoLocalizedCreative0028Preflight({
    rows: [placementRow, row({ finished_at: null, rolled_back_at: new Date() })],
    repositoryMigrations,
  }), /historical attempts/);
});

test("Production preflight requires verified 0028 for steady state", () => {
  const ready = planGeoLocalizedCreative0028Preflight({ rows: [placementRow, row()], repositoryMigrations });
  assert.equal(ready.state, "schema_ready");
  assert.deepEqual(ready.pending, []);
  if (ready.state !== "schema_ready") throw new Error("unreachable");
  assert.equal(ready.migration.applied, true);
});

test("0028 staged migration fixture and release inspection are additive and read-only", () => {
  const fixture = readFileSync("prisma/fixtures/0028_pre_geo_localized_creative_assignments.sql", "utf8");
  const migration = readFileSync(`prisma/migrations/${GEO_LOCALIZED_CREATIVE_TARGET_MIGRATION}/migration.sql`, "utf8");
  const migrationCi = readFileSync("scripts/ci-migrations.mjs", "utf8");
  const release = readFileSync("lib/db/geo-localized-creative-0028-release.ts", "utf8");
  const casinoRepository = readFileSync("lib/repositories/casino.repository.ts", "utf8");
  assert.match(fixture, /CasinoMediaAssignment/);
  assert.match(fixture, /CasinoBonusMediaAssignment/);
  assert.match(fixture, /AffiliateOfferMediaAssignment/);
  assert.doesNotMatch(fixture, /DELETE|DROP|TRUNCATE|UPDATE/);
  assert.doesNotMatch(migration, /DELETE|DROP|TRUNCATE|UPDATE/);
  assert.match(migrationCi, /verifyGeoLocalizedCreativeUpgrade/);
  assert.match(migrationCi, /existingAssignmentsGlobalNeutral/);
  assert.match(release, /SET TRANSACTION READ ONLY/);
  assert.doesNotMatch(release, /prisma migrate deploy|migrate reset|DROP TABLE|TRUNCATE/);
  assert.match(casinoRepository, /typedAssignments && !placementSchema\.localizedAssignments/);
  assert.match(casinoRepository, /GEO_LOCALIZED_CREATIVE_SCHEMA_PENDING/);
});

test("public target authority and cache boundary stay server-side, trusted and private", () => {
  const publicApi = readFileSync("app/api/public/[resource]/route.ts", "utf8");
  const comparisonApi = readFileSync("app/api/public/comparison/route.ts", "utf8");
  const resolver = readFileSync("lib/media/placement-media.ts", "utf8");
  const publicMapper = readFileSync("lib/public-casino/public-casino.mapper.ts", "utf8");
  assert.match(publicApi, /requestCountrySignalFromHeaders/);
  assert.match(publicApi, /accept-language/);
  assert.match(publicApi, /private, no-store/);
  assert.match(publicApi, /X-Vercel-IP-Country, Accept-Language/);
  assert.match(comparisonApi, /X-Vercel-IP-Country, Accept-Language/);
  assert.match(publicMapper, /resolvedPlacementMap/);
  assert.match(publicMapper, /placementAssignments/);
  assert.match(publicMapper, /resolveMedia/);
  assert.doesNotMatch(resolver, /trackingUrl|affiliateHref|redirectSlug|commission|programme|cookie/i);
});
