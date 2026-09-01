import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CASINO_MARKET_0025_PROBE_APPROVED_SHA256,
  CASINO_MARKET_0025_PROBE_AUTHORITY,
  CasinoMarket0025ProductionBuildProbeError,
  assertCasinoMarket0025ProductionBuildProbeAuthority,
  isCasinoMarket0025ProductionBuildProbeRequested,
  runCasinoMarket0025ProductionBuildProbe,
} from "../lib/db/casino-market-0025-production-build-probe";
import { CASINO_MARKET_0025_VERCEL_PROJECT_ID } from "../lib/db/casino-market-0025-vercel-target";

const commit = "a".repeat(40);
const directUrl = "postgresql://probe-user:not-a-secret@db.prisma.io:5432/postgres?sslmode=require";
const pooledUrl = "postgresql://probe-user:not-a-secret@pooled.db.prisma.io:5432/postgres?sslmode=require&connection_limit=1";

function productionEnvironment(overrides: Record<string, string | undefined> = {}) {
  return {
    VERCEL_ENV: "production",
    VERCEL: "1",
    VERCEL_PROJECT_ID: CASINO_MARKET_0025_VERCEL_PROJECT_ID,
    CASINO_MARKET_0025_PROBE_AUTHORITY,
    CASINO_MARKET_0025_PROBE_SOURCE_COMMIT: commit,
    CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT: commit,
    DATABASE_URL: pooledUrl,
    DIRECT_URL: directUrl,
    ...overrides,
  };
}

test("cases 1 and 2 — Preview and local probe attempts refuse", () => {
  assert.throws(
    () => assertCasinoMarket0025ProductionBuildProbeAuthority(productionEnvironment({ VERCEL_ENV: "preview" })),
    (error: unknown) => error instanceof CasinoMarket0025ProductionBuildProbeError
      && error.code === "PREVIEW_ENVIRONMENT_REFUSED",
  );
  assert.throws(
    () => assertCasinoMarket0025ProductionBuildProbeAuthority(productionEnvironment({ VERCEL_ENV: undefined })),
    (error: unknown) => error instanceof CasinoMarket0025ProductionBuildProbeError
      && error.code === "PRODUCTION_ENVIRONMENT_REQUIRED",
  );
});

test("case 3 — Production without either probe input keeps the normal guard path", () => {
  assert.equal(isCasinoMarket0025ProductionBuildProbeRequested({ VERCEL_ENV: "production" }), false);
  assert.equal(isCasinoMarket0025ProductionBuildProbeRequested({
    VERCEL_ENV: "production",
    CASINO_MARKET_0025_RELEASE_AUTHORITY: "existing-operator-input",
  }), false);

  const preflight = readFileSync("scripts/vercel-build-preflight.ts", "utf8");
  assert.match(preflight, /await maybeApplyProgrammeAccessMigration\(\)/);
  assert.match(preflight, /runCasinoMarket0025Readiness/);
});

test("case 4 — incorrect, short, symbolic or missing commit refuses before database client creation", async () => {
  for (const overrides of [
    { CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT: "b".repeat(40) },
    { CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT: "short" },
    { CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT: "HEAD" },
    { CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT: undefined },
    { CASINO_MARKET_0025_PROBE_SOURCE_COMMIT: undefined },
    { CASINO_MARKET_0025_PROBE_SOURCE_COMMIT: "short" },
  ]) {
    let clientsCreated = 0;
    await assert.rejects(
      runCasinoMarket0025ProductionBuildProbe({
        environment: productionEnvironment(overrides),
        createPrismaClient: () => {
          clientsCreated += 1;
          throw new Error("database client must not be created");
        },
      }),
      CasinoMarket0025ProductionBuildProbeError,
    );
    assert.equal(clientsCreated, 0);
  }
});

test("source attestation mismatch refuses before database client creation", async () => {
  let clientsCreated = 0;
  await assert.rejects(
    runCasinoMarket0025ProductionBuildProbe({
      environment: productionEnvironment({ CASINO_MARKET_0025_PROBE_SOURCE_COMMIT: "b".repeat(40) }),
      createPrismaClient: () => {
        clientsCreated += 1;
        throw new Error("database client must not be created");
      },
    }),
    (error: unknown) => error instanceof CasinoMarket0025ProductionBuildProbeError
      && error.code === "PROBE_COMMIT_MISMATCH",
  );
  assert.equal(clientsCreated, 0);
});

test("missing or wrong Vercel project refuses before database binding inspection or client creation", async () => {
  for (const projectId of [undefined, "prj_wrong_project"]) {
    const environment = productionEnvironment({ VERCEL_PROJECT_ID: projectId });
    let databaseBindingReads = 0;
    let clientsCreated = 0;
    Object.defineProperty(environment, "DATABASE_URL", {
      get: () => {
        databaseBindingReads += 1;
        return pooledUrl;
      },
    });
    Object.defineProperty(environment, "DIRECT_URL", {
      get: () => {
        databaseBindingReads += 1;
        return directUrl;
      },
    });

    await assert.rejects(
      runCasinoMarket0025ProductionBuildProbe({
        environment,
        createPrismaClient: () => {
          clientsCreated += 1;
          throw new Error("database client must not be created");
        },
      }),
      (error: unknown) => error instanceof CasinoMarket0025ProductionBuildProbeError
        && error.code === "VERCEL_PROJECT_ID_REFUSED",
    );
    assert.equal(databaseBindingReads, 0);
    assert.equal(clientsCreated, 0);
  }
});

test("Vercel Git commit metadata is not build-probe authority", () => {
  const withoutVercelGitMetadata = assertCasinoMarket0025ProductionBuildProbeAuthority(productionEnvironment());
  assert.equal(withoutVercelGitMetadata.deploymentCommit, commit);

  const withConflictingVercelGitMetadata = assertCasinoMarket0025ProductionBuildProbeAuthority(
    productionEnvironment({ VERCEL_GIT_COMMIT_SHA: "not-authority" }),
  );
  assert.equal(withConflictingVercelGitMetadata.deploymentCommit, commit);
});

test("cases 5 through 7 — missing or mismatched database identity refuses without disclosing bindings", () => {
  for (const [overrides, expectedCode] of [
    [{ DATABASE_URL: undefined }, "DATABASE_URL_REQUIRED"],
    [{ DIRECT_URL: undefined }, "DIRECT_URL_REQUIRED"],
    [{ DIRECT_URL: directUrl.replace("probe-user", "other-user") }, "DATABASE_READINESS_REFUSED"],
  ] as const) {
    assert.throws(
      () => assertCasinoMarket0025ProductionBuildProbeAuthority(productionEnvironment(overrides)),
      (error: unknown) => {
        assert.ok(error instanceof CasinoMarket0025ProductionBuildProbeError);
        assert.equal(error.code, expectedCode);
        assert.doesNotMatch(error.message, /probe-user|other-user|not-a-secret|postgresql:\/\//);
        return true;
      },
    );
  }
});

test("exact Production probe authority is full-commit and byte-identical-migration bound", () => {
  const authority = assertCasinoMarket0025ProductionBuildProbeAuthority(productionEnvironment());
  assert.equal(authority.deploymentCommit, commit);
  assert.equal(authority.vercelProjectId, CASINO_MARKET_0025_VERCEL_PROJECT_ID);
  assert.equal(authority.runtimeMode, "pooled");
  assert.equal(authority.directMode, "direct");
  assert.equal(authority.sameDatabaseIdentity, true);
  assert.equal(authority.ready, true);
  assert.equal(authority.repositoryMigrations.at(-1), "0025_casino_market_profile_architecture");
  assert.equal(
    CASINO_MARKET_0025_PROBE_APPROVED_SHA256,
    "bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99",
  );
  assert.doesNotMatch(JSON.stringify(authority), /probe-user|not-a-secret|postgresql:\/\//);
});

test("partial probe inputs are treated as fail-closed probe attempts", () => {
  assert.equal(isCasinoMarket0025ProductionBuildProbeRequested({
    CASINO_MARKET_0025_PROBE_AUTHORITY,
  }), true);
  assert.equal(isCasinoMarket0025ProductionBuildProbeRequested({
    CASINO_MARKET_0025_PROBE_SOURCE_COMMIT: commit,
  }), true);
  assert.equal(isCasinoMarket0025ProductionBuildProbeRequested({
    CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT: commit,
  }), true);
});
