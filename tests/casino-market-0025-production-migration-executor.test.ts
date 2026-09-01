import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { casinoMarket0025BuildMode } from "../lib/db/casino-market-0025-build-mode";
import { CASINO_MARKET_0025_PROBE_AUTHORITY } from "../lib/db/casino-market-0025-production-build-probe";
import {
  CASINO_MARKET_0025_EXECUTION_APPROVED_SHA256,
  CASINO_MARKET_0025_EXECUTION_AUTHORITY,
  CasinoMarket0025ProductionMigrationExecutorError,
  assertCasinoMarket0025ProductionMigrationAuthority,
  runCasinoMarket0025ProductionMigration,
} from "../lib/db/casino-market-0025-production-migration-executor";

const commit = "a".repeat(40);
const directUrl = "postgresql://executor-user:not-a-secret@db.prisma.io:5432/postgres?sslmode=require";
const pooledUrl = "postgresql://executor-user:not-a-secret@pooled.db.prisma.io:5432/postgres?sslmode=require&connection_limit=1";

function productionEnvironment(overrides: Record<string, string | undefined> = {}) {
  return {
    VERCEL_ENV: "production",
    VERCEL: "1",
    CASINO_MARKET_0025_EXECUTION_AUTHORITY,
    CASINO_MARKET_0025_EXECUTION_SOURCE_COMMIT: commit,
    CASINO_MARKET_0025_EXPECTED_RELEASE_COMMIT: commit,
    CASINO_MARKET_0025_EXECUTE_PRODUCTION_0025: "1",
    DATABASE_URL: pooledUrl,
    DIRECT_URL: directUrl,
    ...overrides,
  };
}

test("ordinary, probe and execution build modes remain explicit and mutually exclusive", () => {
  assert.equal(casinoMarket0025BuildMode({}), null);
  assert.equal(casinoMarket0025BuildMode({ CASINO_MARKET_0025_PROBE_AUTHORITY }), "read-only-probe");
  assert.equal(casinoMarket0025BuildMode({ CASINO_MARKET_0025_EXECUTION_AUTHORITY }), "migration-execution");
  assert.throws(() => casinoMarket0025BuildMode({
    CASINO_MARKET_0025_PROBE_AUTHORITY,
    CASINO_MARKET_0025_EXECUTION_AUTHORITY,
  }), /mutually exclusive/);
});

test("partial, malformed, probe or non-Production execution authority refuses before database or migration", async () => {
  const cases = [
    { CASINO_MARKET_0025_EXECUTION_AUTHORITY: undefined },
    { CASINO_MARKET_0025_EXECUTION_AUTHORITY: CASINO_MARKET_0025_PROBE_AUTHORITY },
    { CASINO_MARKET_0025_EXECUTE_PRODUCTION_0025: undefined },
    { CASINO_MARKET_0025_EXECUTE_PRODUCTION_0025: "true" },
    { CASINO_MARKET_0025_EXECUTION_SOURCE_COMMIT: undefined },
    { CASINO_MARKET_0025_EXECUTION_SOURCE_COMMIT: "short" },
    { CASINO_MARKET_0025_EXPECTED_RELEASE_COMMIT: "b".repeat(40) },
    { VERCEL_ENV: "preview" },
    { VERCEL_ENV: undefined },
    { VERCEL: undefined },
    { DATABASE_URL: undefined },
    { DIRECT_URL: undefined },
    { DIRECT_URL: directUrl.replace("executor-user", "other-user") },
  ];

  for (const overrides of cases) {
    let clientsCreated = 0;
    let migrationRuns = 0;
    await assert.rejects(
      runCasinoMarket0025ProductionMigration({
        environment: productionEnvironment(overrides),
        createPrismaClient: () => {
          clientsCreated += 1;
          throw new Error("database client must not be created");
        },
        runMigration: () => {
          migrationRuns += 1;
          return { status: 0 };
        },
      }),
      CasinoMarket0025ProductionMigrationExecutorError,
    );
    assert.equal(clientsCreated, 0);
    assert.equal(migrationRuns, 0);
  }
});

test("exact execution authority is commit, checksum, identity and Production bound", () => {
  const authority = assertCasinoMarket0025ProductionMigrationAuthority(productionEnvironment());
  assert.equal(authority.deploymentCommit, commit);
  assert.equal(authority.environment, "production");
  assert.equal(authority.runtimeMode, "pooled");
  assert.equal(authority.directMode, "direct");
  assert.equal(authority.sameDatabaseIdentity, true);
  assert.equal(authority.repositoryMigrations.at(-1), "0025_casino_market_profile_architecture");
  assert.equal(
    CASINO_MARKET_0025_EXECUTION_APPROVED_SHA256,
    "bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99",
  );
  assert.doesNotMatch(JSON.stringify(authority), /executor-user|not-a-secret|postgresql:\/\//);
});

test("executor contains only the exact migrate deploy command and forces the verified direct binding", () => {
  const source = readFileSync("lib/db/casino-market-0025-production-migration-executor.ts", "utf8");
  assert.match(source, /\["prisma", "migrate", "deploy", "--schema", "prisma\/schema\.prisma"\]/);
  assert.match(source, /DATABASE_URL: directUrl/);
  assert.match(source, /DIRECT_URL: directUrl/);
  assert.doesNotMatch(source, /prisma\s+db\s+(?:push|execute)|prisma\s+migrate\s+reset|seed|import-bundle/i);
});
