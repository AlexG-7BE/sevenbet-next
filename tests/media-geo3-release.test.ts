import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  MEDIA_GEO3_PREVIOUS_MIGRATION,
  MEDIA_GEO3_TARGET_MIGRATION,
  assertMediaGeo3MigrationRow,
  mediaGeo3MigrationChecksum,
  planMediaGeo3Preflight,
} from "../lib/db/media-geo3-0033-release";
import {
  MEDIA_GEO3_CATALOG_PLACEMENTS,
  MEDIA_GEO3_CATALOG_SLUGS,
  assertMediaGeo3Catalog,
} from "../lib/media/media-geo3-catalog";

const previous = {
  migration_name: MEDIA_GEO3_PREVIOUS_MIGRATION,
  checksum: "prior",
  finished_at: new Date(),
  rolled_back_at: null,
};
const current = {
  migration_name: MEDIA_GEO3_TARGET_MIGRATION,
  checksum: mediaGeo3MigrationChecksum(),
  finished_at: new Date(),
  rolled_back_at: null,
};

test("DB-first gate permits only the exact additive 0033 suffix and then requires one checksum-matched completion", () => {
  const repositoryMigrations = [MEDIA_GEO3_PREVIOUS_MIGRATION, MEDIA_GEO3_TARGET_MIGRATION];
  assert.deepEqual(planMediaGeo3Preflight({ rows: [previous], repositoryMigrations }), {
    state: "schema_pending",
    pending: [MEDIA_GEO3_TARGET_MIGRATION],
  });
  const ready = planMediaGeo3Preflight({ rows: [previous, current], repositoryMigrations });
  assert.equal(ready.state, "schema_ready");
  assert.deepEqual(assertMediaGeo3MigrationRow([previous, current]), {
    migration: MEDIA_GEO3_TARGET_MIGRATION,
    checksum: current.checksum,
    applied: true,
  });
  assert.throws(() => planMediaGeo3Preflight({ rows: [previous], repositoryMigrations: [...repositoryMigrations, "0034_unexpected"] }), /expected only 0033 pending/);
  assert.throws(() => planMediaGeo3Preflight({ rows: [{ ...previous, finished_at: null }], repositoryMigrations }), /unresolved/);
  assert.throws(() => assertMediaGeo3MigrationRow([previous, { ...current, checksum: "wrong" }]), /checksum mismatch/);
});

test("migration is additive, keeps compatible tables, and installs atomic/conflict invariants", () => {
  const sql = readFileSync(`prisma/migrations/${MEDIA_GEO3_TARGET_MIGRATION}/migration.sql`, "utf8");
  assert.doesNotMatch(sql, /^\s*(?:DELETE|TRUNCATE|DROP TABLE|DROP TYPE|ALTER TABLE[^;]+DROP COLUMN)\b/im);
  for (const table of ["MediaCreativeSet", "MediaCreativeVariant", "MediaRevision", "MediaPreflightEntry"]) {
    assert.match(sql, new RegExp(`CREATE TABLE "${table}"`));
  }
  assert.match(sql, /CASINO_REVIEW_RIGHT_HERO/);
  assert.match(sql, /MediaRevision_active_scope_key[\s\S]*WHERE "status" = 'ACTIVE'/);
  assert.match(sql, /MediaPreflightEntry_matrix_key/);
  assert.match(sql, /MediaCreativeVariant_source_check/);
  assert.match(sql, /MediaCreativeVariant_cover_check/);
  assert.equal((sql.match(/one_active_slot_key/g) ?? []).length, 6);
});

test("bounded catalog includes only exact current-offer evidence and both governed surfaces", () => {
  const catalog = assertMediaGeo3Catalog();
  assert.deepEqual(catalog.map((definition) => definition.slug), [...MEDIA_GEO3_CATALOG_SLUGS]);
  assert.ok(catalog.every((definition) => definition.media?.role === "CURRENT_OFFER_CREATIVE"));
  assert.deepEqual(MEDIA_GEO3_CATALOG_PLACEMENTS, ["CASINO_REVIEW_RIGHT_HERO", "CASINO_DIRECTORY_CARD"]);
  assert.equal(catalog.some((definition) => ["skol-casino", "slotnite", "hello-casino"].includes(definition.slug)), false);
});

test("pipeline performs preflight before a Serializable atomic switch and preserves/restores the known-good revision", () => {
  const source = readFileSync("lib/media-operations/production-revisions.ts", "utf8");
  const preflight = source.indexOf("mediaPreflightEntry.createMany");
  const previous = source.indexOf("const previous = await tx.mediaRevision.findFirst", preflight);
  const activate = source.indexOf('status: "ACTIVE", previousRevisionId', previous);
  assert.ok(preflight > 0 && previous > preflight && activate > previous);
  assert.match(source, /TransactionIsolationLevel\.Serializable/);
  assert.match(source, /pg_advisory_xact_lock/);
  assert.match(source, /if \(unsafe\)[\s\S]*status: "FAILED"[\s\S]*return;/);
  assert.match(source, /where: \{ revisionId: previous\.id, status: "ACTIVE" \}[\s\S]*status: "INACTIVE"/);
  assert.match(source, /current\.previousRevisionId[\s\S]*status: "ACTIVE", deactivatedAt: null/);
  assert.match(source, /MAX_SERIALIZABLE_ATTEMPTS = 3/);
});

test("MCP isolates Production orchestration and rollback behind the explicit Production scope", () => {
  const server = readFileSync("lib/mcp/media/server.ts", "utf8");
  const revision = readFileSync("lib/media-operations/production-revisions.ts", "utf8");
  for (const tool of ["media_orchestrate_production", "media_rollback_production_revision", "media_get_production_revision"]) {
    assert.match(server, new RegExp(tool));
  }
  assert.match(server, /media_orchestrate_production[\s\S]*media:production_write/);
  assert.match(readFileSync("lib/media-operations/service.ts", "utf8"), /Production media revision mutations require the Production runtime/);
  assert.doesNotMatch(revision, /destinationUrl:\s|trackingUrl:\s/);
});

test("public consumers retire GEO3 presentation while governed CTA action stays available", () => {
  const mapper = readFileSync("lib/public-casino/public-casino.mapper.ts", "utf8");
  const profile = readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8");
  const directory = readFileSync("lib/services/public-casino-discovery.service.ts", "utf8");
  const activeProjection = mapper.slice(mapper.indexOf("export function mapPublishedCasino"), mapper.indexOf("export function mapLegacyCasino"));
  assert.doesNotMatch(mapper, /resolveCasinoMedia|resolvedPlacementMap|MediaCreative|MediaRevision/);
  assert.doesNotMatch(activeProjection, /resolveCasinoMedia|resolvedPlacementMap/);
  assert.match(activeProjection, /logo: allMedia\.find/);
  assert.match(profile, /data-presentation-family": "LOGO_ONLY"/);
  assert.match(profile, /source: "CTA", placement: "CASINO_OFFER_BLOCK"/);
  assert.doesNotMatch(profile, /CASINO_REVIEW_RIGHT_HERO|source: "CREATIVE"/);
  assert.match(directory, /hero:\s*null/);
  assert.match(directory, /logo:\s*logoMediaDto/);
});
