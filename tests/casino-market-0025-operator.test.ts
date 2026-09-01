import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CASINO_MARKET_0025_PRODUCTION_AUTHORITY,
  assertCasinoMarket0025ExecutionEnvironment,
  assertCasinoMarket0025RepositoryAuthority,
  parseCasinoMarket0025OperatorArguments,
} from "../lib/db/casino-market-0025-operator";

const commit = "a".repeat(40);
const directUrl = "postgresql://release-user:redacted@db.prisma.io:5432/postgres?sslmode=require";
const pooledUrl = "postgresql://release-user:redacted@pooled.db.prisma.io:5432/postgres?sslmode=require&connection_limit=1";

test("case 10 — absent execute flag is dry-run authority only", () => {
  assert.deepEqual(parseCasinoMarket0025OperatorArguments([
    "--expected-release-commit",
    commit,
  ]), {
    executeProduction0025: false,
    expectedReleaseCommit: commit,
  });
});

test("the only mutation switch is the exact one-time 0025 flag", () => {
  assert.deepEqual(parseCasinoMarket0025OperatorArguments([
    `--expected-release-commit=${commit}`,
    "--execute-production-0025",
  ]), {
    executeProduction0025: true,
    expectedReleaseCommit: commit,
  });
  for (const arguments_ of [
    ["--execute"],
    ["--migration", "0025_casino_market_profile_architecture"],
    ["--expected-release-commit", "short"],
    ["--expected-release-commit", commit, "--expected-release-commit", commit],
  ]) {
    assert.throws(() => parseCasinoMarket0025OperatorArguments(arguments_));
  }
});

test("case 8 — incorrect or ambiguous Production database identity refuses", () => {
  for (const environment of [
    {
      VERCEL_ENV: "production",
      CASINO_MARKET_0025_RELEASE_AUTHORITY: CASINO_MARKET_0025_PRODUCTION_AUTHORITY,
      DATABASE_URL: pooledUrl,
      DIRECT_URL: directUrl.replace("release-user", "different-user"),
    },
    {
      VERCEL_ENV: "production",
      CASINO_MARKET_0025_RELEASE_AUTHORITY: CASINO_MARKET_0025_PRODUCTION_AUTHORITY,
      DATABASE_URL: pooledUrl,
    },
    {
      VERCEL_ENV: "production",
      DATABASE_URL: pooledUrl,
      DIRECT_URL: directUrl,
    },
  ]) {
    assert.throws(() => assertCasinoMarket0025ExecutionEnvironment("production", environment));
  }
});

test("case 9 — Preview refuses the operator even when its database contract is otherwise valid", () => {
  assert.throws(
    () => assertCasinoMarket0025ExecutionEnvironment("production", {
      VERCEL_ENV: "preview",
      CASINO_MARKET_0025_RELEASE_AUTHORITY: CASINO_MARKET_0025_PRODUCTION_AUTHORITY,
      DATABASE_URL: pooledUrl,
      DIRECT_URL: directUrl,
    }),
    /Preview environment execution is refused/,
  );
});

test("Production authority requires the exact acknowledgement and the existing matched readiness contract", () => {
  const result = assertCasinoMarket0025ExecutionEnvironment("production", {
    VERCEL_ENV: "production",
    CASINO_MARKET_0025_RELEASE_AUTHORITY: CASINO_MARKET_0025_PRODUCTION_AUTHORITY,
    DATABASE_URL: pooledUrl,
    DIRECT_URL: directUrl,
  });
  assert.equal(result.environment, "production");
  assert.equal(result.sameDatabaseIdentity, true);
  assert.doesNotMatch(JSON.stringify(result), /release-user|redacted|postgresql:\/\//);
});

test("release commit pinning refuses a checkout other than the exact supplied full commit", () => {
  assert.throws(
    () => assertCasinoMarket0025RepositoryAuthority("0".repeat(40)),
    /checked-out commit does not equal/,
  );
});

test("production CLI cannot select a database, migration, SQL, seed, import, asset or commercial action", () => {
  const operator = readFileSync("lib/db/casino-market-0025-operator.ts", "utf8");
  const cli = readFileSync("scripts/casino-market-0025-one-time-operator.ts", "utf8");
  assert.match(operator, /\["prisma", "migrate", "deploy", "--schema", "prisma\/schema\.prisma"\]/);
  assert.match(cli, /authority: "production"/);
  assert.doesNotMatch(cli, /disposable-test|DATABASE_URL|DIRECT_URL|migrationName|queryRaw|seed|affiliate|asset/i);
  assert.doesNotMatch(operator, /db push|migrate reset|migrate dev|prisma db execute/);
});
