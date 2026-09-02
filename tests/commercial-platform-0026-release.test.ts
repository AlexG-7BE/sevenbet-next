import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  COMMERCIAL_PLATFORM_TARGET_MIGRATION,
  assertCommercialPlatform0026MigrationRow,
  commercialPlatformMigrationChecksum,
  type CommercialPlatformMigrationRow,
} from "../lib/db/commercial-platform-0026-release";

function row(overrides: Partial<CommercialPlatformMigrationRow> = {}): CommercialPlatformMigrationRow {
  return {
    migration_name: COMMERCIAL_PLATFORM_TARGET_MIGRATION,
    checksum: commercialPlatformMigrationChecksum(),
    finished_at: new Date("2026-09-03T12:00:00.000Z"),
    rolled_back_at: null,
    ...overrides,
  };
}

test("0026 release accepts exactly one completed matching migration", () => {
  const result = assertCommercialPlatform0026MigrationRow([row()]);
  assert.equal(result.applied, true);
  assert.equal(result.checksum, commercialPlatformMigrationChecksum());
  assert.match(result.checksum, /^[a-f0-9]{64}$/);
});

test("0026 release refuses pending, rolled-back, duplicate, and mismatched attempts", () => {
  assert.throws(() => assertCommercialPlatform0026MigrationRow([]), /exactly one effective completed/);
  assert.throws(() => assertCommercialPlatform0026MigrationRow([row({ finished_at: null })]), /unresolved/);
  assert.throws(() => assertCommercialPlatform0026MigrationRow([row({ finished_at: null, rolled_back_at: new Date() })]), /exactly one effective completed/);
  assert.throws(() => assertCommercialPlatform0026MigrationRow([row(), row()]), /exactly one effective completed/);
  assert.throws(() => assertCommercialPlatform0026MigrationRow([row({ checksum: "wrong" })]), /checksum mismatch/);
});

test("Production preflight is verification-only and requires the exact 0026 checksum", () => {
  const preflight = readFileSync("scripts/vercel-build-preflight.ts", "utf8");
  const guard = readFileSync("lib/db/commercial-platform-0026-release.ts", "utf8");
  assert.match(preflight, /COMMERCIAL_PLATFORM_TARGET_MIGRATION/);
  assert.match(preflight, /assertChecksum\(completedByName\.get\(COMMERCIAL_PLATFORM_TARGET_MIGRATION\)/);
  assert.match(guard, /SET TRANSACTION READ ONLY/);
  assert.doesNotMatch(guard + preflight, /prisma migrate deploy|migrate reset|DROP TABLE|TRUNCATE/);
});
