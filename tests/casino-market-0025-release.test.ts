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
  const repositoryMigrations = casinoMarketRepositoryMigrations();
  return {
    migration_name: name,
    checksum: repositoryMigrations.includes(name) ? checksum(name) : "fixture",
    finished_at: new Date("2026-09-01T00:00:00.000Z"),
    rolled_back_at: null,
    ...overrides,
  };
}

function through0024() {
  return casinoMarketRepositoryMigrations().filter((name) => name !== CASINO_MARKET_TARGET_MIGRATION).map((name) => row(name));
}

function through0025() {
  return [...through0024(), row(CASINO_MARKET_TARGET_MIGRATION)];
}

function rolledBack(name: string): CasinoMarketMigrationRow {
  return row(name, {
    checksum: "historical-attempt",
    finished_at: null,
    rolled_back_at: new Date("2026-08-31T00:00:00.000Z"),
  });
}

function unresolved(name: string): CasinoMarketMigrationRow {
  return row(name, { finished_at: null, rolled_back_at: null });
}

function beforeCompletion(rows: CasinoMarketMigrationRow[], name: string, attempts: CasinoMarketMigrationRow[]) {
  const index = rows.findIndex((entry) => entry.migration_name === name);
  assert.notEqual(index, -1);
  return [...rows.slice(0, index), ...attempts, ...rows.slice(index)];
}

function replaceAttempts(rows: CasinoMarketMigrationRow[], name: string, attempts: CasinoMarketMigrationRow[]) {
  const index = rows.findIndex((entry) => entry.migration_name === name);
  assert.notEqual(index, -1);
  return [
    ...rows.slice(0, index),
    ...attempts,
    ...rows.slice(index + 1),
  ];
}

test("1 — pending 0025 is refused by the post-migration steady-state guard", () => {
  assert.throws(
    () => planCasinoMarket0025Release(through0024()),
    /must already be applied; the steady-state guard is read-only/,
  );
});

test("2 — one rolled-back attempt followed by a matching completion passes", () => {
  const migration = "0020_commercial_ops_01";
  const plan = planCasinoMarket0025Release(beforeCompletion(through0025(), migration, [rolledBack(migration)]));
  assert.equal(plan.state, "VERIFY");
  assert.deepEqual(plan.historicalRolledBackAttempts, [{
    migration,
    supersededByCompletedAttempt: true,
    effectiveChecksumMatchesRepository: true,
  }]);
});

test("3 — multiple rolled-back attempts followed by one matching completion pass", () => {
  const migration = "0021_partner_ops_work_bridge_01";
  const plan = planCasinoMarket0025Release(beforeCompletion(
    through0025(),
    migration,
    [rolledBack(migration), rolledBack(migration)],
  ));
  assert.equal(plan.state, "VERIFY");
  assert.equal(plan.historicalRolledBackAttempts.length, 2);
  assert.ok(plan.historicalRolledBackAttempts.every((attempt) => (
    attempt.migration === migration
    && attempt.supersededByCompletedAttempt
    && attempt.effectiveChecksumMatchesRepository
  )));
});

test("4 — a rolled-back attempt without a later completion refuses", () => {
  const migration = "0022_better_auth_17_schema_upgrade";
  assert.throws(
    () => planCasinoMarket0025Release(replaceAttempts(through0025(), migration, [rolledBack(migration)])),
    /unsuperseded rolled-back migration attempt for 0022_better_auth_17_schema_upgrade/,
  );
});

test("5 — a rolled-back attempt followed by an unresolved attempt refuses", () => {
  const migration = "0022_better_auth_17_schema_upgrade";
  assert.throws(
    () => planCasinoMarket0025Release(replaceAttempts(
      through0025(),
      migration,
      [rolledBack(migration), unresolved(migration)],
    )),
    /unresolved migration attempt for 0022_better_auth_17_schema_upgrade/,
  );
});

test("6 — a rolled-back attempt followed by a mismatched completion refuses", () => {
  const migration = "0022_better_auth_17_schema_upgrade";
  assert.throws(
    () => planCasinoMarket0025Release(replaceAttempts(
      through0025(),
      migration,
      [rolledBack(migration), row(migration, { checksum: "wrong" })],
    )),
    /checksum mismatch for the effective completed attempt of 0022_better_auth_17_schema_upgrade/,
  );
});

test("7 — a completion followed by a later rolled-back attempt refuses", () => {
  const migration = "0022_better_auth_17_schema_upgrade";
  assert.throws(
    () => planCasinoMarket0025Release([...through0025(), rolledBack(migration)]),
    /unsuperseded rolled-back migration attempt for 0022_better_auth_17_schema_upgrade/,
  );
});

test("8 — baseline 0023 may have a safely superseded historical rollback", () => {
  const migration = "0023_mcp_dcr_runtime_compat_fix";
  const plan = planCasinoMarket0025Release(beforeCompletion(through0025(), migration, [rolledBack(migration)]));
  assert.equal(plan.migrationStates[0]?.status, "completed");
  assert.equal(plan.migrationStates[0]?.checksumMatchesRepository, true);
});

test("9 — baseline 0024 may have a safely superseded historical rollback", () => {
  const migration = "0024_programme_access_acceptance";
  const plan = planCasinoMarket0025Release(beforeCompletion(through0025(), migration, [rolledBack(migration)]));
  assert.equal(plan.migrationStates[1]?.status, "completed");
  assert.equal(plan.migrationStates[1]?.checksumMatchesRepository, true);
});

test("10 — any rolled-back 0025 attempt refuses the pending target", () => {
  assert.throws(
    () => planCasinoMarket0025Release([...through0024(), rolledBack(CASINO_MARKET_TARGET_MIGRATION)]),
    /unsuperseded rolled-back migration attempt for 0025_casino_market_profile_architecture/,
  );
});

test("11 — any unresolved 0025 attempt refuses the pending target", () => {
  assert.throws(
    () => planCasinoMarket0025Release([...through0024(), unresolved(CASINO_MARKET_TARGET_MIGRATION)]),
    /unresolved migration attempt for 0025_casino_market_profile_architecture/,
  );
});

test("12 — correctly completed 0025 is verify-only and idempotent", () => {
  const rows = through0025();
  assert.equal(planCasinoMarket0025Release(rows).state, "VERIFY");
  assert.equal(planCasinoMarket0025Release(rows).state, "VERIFY");
});

test("13 — unknown migration history divergence refuses", () => {
  assert.throws(
    () => planCasinoMarket0025Release([...through0025(), row("0026_unknown")]),
    /migration-history divergence for 0026_unknown/,
  );
});

test("an unexpected pending repository migration still refuses release", () => {
  assert.throws(() => planCasinoMarket0025Release(through0025(), [...casinoMarketRepositoryMigrations(), "0026_unexpected"]), /requires no pending repository migrations/);
});

test("E — target checksum mismatch refuses verification", () => {
  assert.throws(() => planCasinoMarket0025Release([...through0024(), row(CASINO_MARKET_TARGET_MIGRATION, { checksum: "wrong" })]), /checksum mismatch/);
});

test("missing 0024 still refuses release", () => {
  assert.throws(() => planCasinoMarket0025Release(through0025().filter((entry) => entry.migration_name !== "0024_programme_access_acceptance")), /requires completed baseline/);
});

test("H through J — steady-state guard is authority, index, constraint and pending-state fail-closed", () => {
  const guard = readFileSync("lib/db/casino-market-0025-release.ts", "utf8");
  const preflight = readFileSync("scripts/vercel-build-preflight.ts", "utf8");
  assert.match(guard, /must already be applied; the steady-state guard is read-only/);
  assert.match(guard, /productionEligible authority/);
  assert.match(guard, /missing 0025 indexes/);
  assert.match(guard, /missing 0025 constraints/);
  assert.doesNotMatch(guard + preflight, /allowMutation\s*:\s*true|spawnSync\([^)]*prisma[^)]*migrate/);
  assert.doesNotMatch(guard, /"APPLY"|pending_verified_read_only|assertNoPartialCasinoMarket0025/);
});

test("migration carrier is byte-identical to the frozen architecture candidate", () => {
  assert.equal(checksum(CASINO_MARKET_TARGET_MIGRATION), "bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99");
  assert.equal(readFileSync(`prisma/migrations/${CASINO_MARKET_TARGET_MIGRATION}/migration.sql`).byteLength, 7954);
});
