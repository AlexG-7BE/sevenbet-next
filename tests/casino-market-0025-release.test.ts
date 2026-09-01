import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CASINO_MARKET_TARGET_MIGRATION,
  casinoMarketRepositoryMigrations,
  planCasinoMarket0025Release,
  type CasinoMarketMigrationRow,
} from "../lib/db/casino-market-0025-release";

function checksum(name: string) {
  return createHash("sha256").update(readFileSync(`prisma/migrations/${name}/migration.sql`)).digest("hex");
}

function row(name: string, overrides: Partial<CasinoMarketMigrationRow> = {}): CasinoMarketMigrationRow {
  return {
    migration_name: name,
    checksum: ["0023_mcp_dcr_runtime_compat_fix", "0024_programme_access_acceptance", CASINO_MARKET_TARGET_MIGRATION].includes(name) ? checksum(name) : "fixture",
    finished_at: new Date("2026-09-01T00:00:00.000Z"),
    rolled_back_at: null,
    ...overrides,
  };
}

function through0024() {
  return casinoMarketRepositoryMigrations().filter((name) => name !== CASINO_MARKET_TARGET_MIGRATION).map((name) => row(name));
}

test("A — exact 0024 baseline permits only the 0025 candidate", () => {
  assert.deepEqual(planCasinoMarket0025Release(through0024()), { state: "APPLY" });
});

test("B and L — correctly applied 0025 is verify-only and idempotent", () => {
  const rows = [...through0024(), row(CASINO_MARKET_TARGET_MIGRATION)];
  assert.deepEqual(planCasinoMarket0025Release(rows), { state: "VERIFY" });
  assert.deepEqual(planCasinoMarket0025Release(rows), { state: "VERIFY" });
});

test("C — any unresolved migration refuses release", () => {
  assert.throws(() => planCasinoMarket0025Release([...through0024(), row(CASINO_MARKET_TARGET_MIGRATION, { finished_at: null })]), /unresolved/);
});

test("D — an unexpected pending 0026 refuses release", () => {
  assert.throws(() => planCasinoMarket0025Release(through0024(), [...casinoMarketRepositoryMigrations(), "0026_unexpected"]), /expected pending suffix/);
});

test("E — target checksum mismatch refuses verification", () => {
  assert.throws(() => planCasinoMarket0025Release([...through0024(), row(CASINO_MARKET_TARGET_MIGRATION, { checksum: "wrong" })]), /checksum mismatch/);
});

test("F and G — missing or rolled-back 0024 refuses release", () => {
  assert.throws(() => planCasinoMarket0025Release(through0024().filter((entry) => entry.migration_name !== "0024_programme_access_acceptance")), /requires completed baseline/);
  assert.throws(() => planCasinoMarket0025Release(through0024().map((entry) => entry.migration_name === "0024_programme_access_acceptance" ? { ...entry, finished_at: null, rolled_back_at: new Date() } : entry)), /requires completed baseline/);
});

test("H through J — steady-state guard is authority, index, constraint and pending-state fail-closed", () => {
  const guard = readFileSync("lib/db/casino-market-0025-release.ts", "utf8");
  const preflight = readFileSync("scripts/vercel-build-preflight.ts", "utf8");
  assert.match(guard, /must already be applied; steady-state guard is read-only/);
  assert.match(guard, /productionEligible authority/);
  assert.match(guard, /missing 0025 indexes/);
  assert.match(guard, /missing 0025 constraints/);
  assert.doesNotMatch(guard + preflight, /allowMutation\s*:\s*true|spawnSync\([^)]*prisma[^)]*migrate/);
});

test("migration carrier is byte-identical to the frozen architecture candidate", () => {
  assert.equal(checksum(CASINO_MARKET_TARGET_MIGRATION), "bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99");
  assert.equal(readFileSync(`prisma/migrations/${CASINO_MARKET_TARGET_MIGRATION}/migration.sql`).byteLength, 7954);
});
