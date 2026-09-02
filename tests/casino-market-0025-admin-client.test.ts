import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CasinoMarket0025AdminClientError,
  casinoMarket0025AdminDatasourceUrl,
} from "../lib/db/casino-market-0025-admin-client";

const directUrl = "postgresql://release-user:redacted@db.prisma.io:5432/postgres?sslmode=require";
const pooledUrl = "postgresql://release-user:redacted@pooled.db.prisma.io:5432/postgres?sslmode=require&connection_limit=1";

test("Production Casino release administration selects DIRECT_URL and never DATABASE_URL", () => {
  const bothBindings = {
    DATABASE_URL: pooledUrl,
    DIRECT_URL: directUrl,
  };
  const pooledOnly = { DATABASE_URL: pooledUrl };
  assert.equal(casinoMarket0025AdminDatasourceUrl(bothBindings), directUrl);
  assert.throws(
    () => casinoMarket0025AdminDatasourceUrl(pooledOnly),
    (error: unknown) => error instanceof CasinoMarket0025AdminClientError
      && error.code === "DIRECT_URL_REQUIRED"
      && !/postgresql:\/\/|release-user|redacted/.test(error.message),
  );

  const adminClient = readFileSync("lib/db/casino-market-0025-admin-client.ts", "utf8");
  const release = readFileSync("lib/db/casino-market-0025-release.ts", "utf8");
  const preflight = readFileSync("scripts/vercel-build-preflight.ts", "utf8");
  assert.match(adminClient, /datasourceUrl: casinoMarket0025AdminDatasourceUrl\(environment\)/);
  assert.doesNotMatch(adminClient, /environment\.DATABASE_URL/);
  assert.match(release, /createCasinoMarket0025AdminClient\(\)/);
  assert.doesNotMatch(release, /new PrismaClient\(/);
  assert.match(preflight, /createCasinoMarket0025AdminClient\(\)/);
  assert.doesNotMatch(preflight, /new PrismaClient\(/);
});

test("normal application Prisma remains on the schema-defined pooled runtime path", () => {
  const runtime = readFileSync("lib/db/prisma.ts", "utf8");
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  assert.match(runtime, /new PrismaClient\(/);
  assert.doesNotMatch(runtime, /DIRECT_URL|casinoMarket0025AdminDatasourceUrl/);
  assert.match(schema, /url\s+=\s+env\("DATABASE_URL"\)/);
  assert.match(schema, /directUrl\s+=\s+env\("DIRECT_URL"\)/);
});

test("Casino administrative reads enforce repeatable-read, read-only, and bounded local timeouts", () => {
  const release = readFileSync("lib/db/casino-market-0025-release.ts", "utf8");
  assert.match(release, /TransactionIsolationLevel\.RepeatableRead/);
  assert.match(release, /SET TRANSACTION READ ONLY/);
  assert.match(release, /SET LOCAL statement_timeout/);
  assert.match(release, /SET LOCAL lock_timeout/);
  assert.match(release, /SET LOCAL idle_in_transaction_session_timeout/);
  assert.match(release, /SHOW transaction_read_only/);
  assert.match(release, /"20s"/);
  assert.match(release, /"5s"/);
  assert.match(release, /"60s"/);
});
