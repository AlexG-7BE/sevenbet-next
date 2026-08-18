import assert from "node:assert/strict";
import test from "node:test";

import { assertVercelDatabaseReadiness } from "../lib/db/vercel-database-readiness";

const directUrl = "postgresql://runtime-user:secret@db.prisma.io:5432/postgres?sslmode=require";
const pooledUrl = "postgresql://runtime-user:secret@pooled.db.prisma.io:5432/postgres?sslmode=require&connection_limit=1";

test("Vercel deployment preflight requires the matched pooled runtime and direct migration contract", () => {
  const result = assertVercelDatabaseReadiness({
    VERCEL_ENV: "preview",
    DATABASE_URL: pooledUrl,
    DIRECT_URL: directUrl,
  });
  assert.equal(result.checked, true);
  assert.equal(result.ready, true);
  assert.equal(result.runtimeMode, "pooled");
  assert.equal(result.directMode, "direct");
  assert.equal(result.sameDatabaseIdentity, true);
  assert.doesNotMatch(JSON.stringify(result), /runtime-user|secret|postgresql:\/\//);
});

test("Vercel deployment preflight fails closed without exposing credentials", () => {
  for (const input of [
    { VERCEL_ENV: "production", DATABASE_URL: directUrl, DIRECT_URL: directUrl },
    { VERCEL_ENV: "production", DATABASE_URL: pooledUrl },
  ]) {
    assert.throws(
      () => assertVercelDatabaseReadiness(input),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /database readiness failed/);
        assert.doesNotMatch(error.message, /runtime-user|secret|postgresql:\/\//);
        return true;
      },
    );
  }
});

test("local and CI builds without Vercel metadata remain independent of hosted credentials", () => {
  assert.deepEqual(assertVercelDatabaseReadiness({}), { checked: false, environment: "local" });
  assert.deepEqual(
    assertVercelDatabaseReadiness({ VERCEL_ENV: "development" }),
    { checked: false, environment: "local" },
  );
});
