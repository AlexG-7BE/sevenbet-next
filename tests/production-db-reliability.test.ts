import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

import { isTransientDatabaseAvailabilityError } from "../lib/db/transient-availability";
import { adminServiceErrorResponse } from "../lib/http/admin-service-error";
import { mediaOperationsErrorResponse } from "../lib/media-operations/http";
import { mcpDatabaseUnavailableResponse, runMcpPostBoundary } from "../lib/mcp/reliability";
import { PublicCasinoDiscoveryRepository } from "../lib/repositories/public-casino-discovery.repository";

const executeFile = promisify(execFile);
const unreachableDatabaseUrl = "postgresql://reliability@127.0.0.1:1/unreachable?connect_timeout=1&connection_limit=1&pool_timeout=1";

type ProbeResult = {
  statuses: number[];
  allow: Array<string | null>;
  cacheControl: Array<string | null>;
  unhandled: string[];
};

type PostProbeResult = {
  responses: Array<{
    name: string;
    status: number;
    cacheControl: string | null;
    retryAfter: string | null;
    body: unknown;
  }>;
  elapsedMs: number;
  unhandled: string[];
};

async function probe(mode: "method" | "post") {
  const fixture = new URL("./fixtures/production-db-reliability-probe.ts", import.meta.url);
  const serverOnlyFixture = new URL("./fixtures/register-server-only.mjs", import.meta.url);
  return executeFile(process.execPath, ["--import", "tsx", "--import", serverOnlyFixture.pathname, fixture.pathname, mode], {
    cwd: new URL("..", import.meta.url).pathname,
    env: {
      ...process.env,
      NODE_ENV: "production",
      DATABASE_URL: unreachableDatabaseUrl,
      DIRECT_URL: unreachableDatabaseUrl,
      BETTER_AUTH_SECRET: "reliability-test-only-secret-with-32-characters",
      BETTER_AUTH_URL: "http://127.0.0.1:4173",
      COMMERCIAL_MCP_ENABLED: "true",
      COMMERCIAL_MCP_PUBLIC_ORIGIN: "http://127.0.0.1:4173",
      MEDIA_OPERATIONS_MCP_ENABLED: "true",
      MEDIA_OPERATIONS_MCP_PUBLIC_ORIGIN: "http://127.0.0.1:4173",
    },
    timeout: 12_000,
  });
}

function finalJsonLine(output: string) {
  return output.trim().split("\n").at(-1) ?? "";
}

test("transient database classification is narrow and follows bounded causes", () => {
  assert.equal(isTransientDatabaseAvailabilityError({ name: "PrismaClientInitializationError", errorCode: "P1001" }), true);
  assert.equal(isTransientDatabaseAvailabilityError({ name: "PrismaClientKnownRequestError", code: "P2024" }), true);
  assert.equal(isTransientDatabaseAvailabilityError({ name: "PrismaClientInitializationError", message: "Can't reach database server at hidden.example" }), true);
  assert.equal(isTransientDatabaseAvailabilityError({ cause: { name: "PrismaClientKnownRequestError", code: "P1017" } }), true);

  assert.equal(isTransientDatabaseAvailabilityError({ name: "Error", code: "P2024" }), false);
  assert.equal(isTransientDatabaseAvailabilityError({ name: "PrismaClientInitializationError", errorCode: "P1000", message: "Authentication failed" }), false);
  assert.equal(isTransientDatabaseAvailabilityError({ name: "PrismaClientKnownRequestError", code: "P2002" }), false);
  assert.equal(isTransientDatabaseAvailabilityError(new SyntaxError("invalid JSON")), false);
});

test("MCP transient boundary is bounded JSON-RPC and does not reclassify programming failures", async () => {
  const transient = { name: "PrismaClientKnownRequestError", code: "P2024", message: "secret pool detail" };
  const response = await runMcpPostBoundary(async () => { throw transient; });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("retry-after"), "3");
  const text = await response.text();
  assert.deepEqual(JSON.parse(text), {
    jsonrpc: "2.0",
    error: { code: -32003, message: "Operational data is temporarily unavailable" },
    id: null,
  });
  assert.doesNotMatch(text, /Prisma|P2024|pool|secret|postgres|stack/i);
  await assert.rejects(
    runMcpPostBoundary(async () => { throw new TypeError("programming failure"); }),
    /programming failure/,
  );
});

test("method-only MCP requests never initialize Prisma, Better Auth, OAuth, or services", async () => {
  const { stdout, stderr } = await probe("method");
  const result = JSON.parse(finalJsonLine(stdout)) as ProbeResult;
  assert.deepEqual(result.statuses, [...Array(5).fill(405), ...Array(5).fill(410)]);
  assert.deepEqual(result.allow, [...Array(5).fill("POST"), ...Array(5).fill(null)]);
  assert.deepEqual(result.cacheControl, [
    ...Array(5).fill("no-store"),
    ...Array(5).fill("private, no-store"),
  ]);
  assert.deepEqual(result.unhandled, []);
  assert.equal(stderr, "");

  const commercialSource = await readFile(new URL("../app/api/mcp/commercial/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(commercialSource, /lib\/db\/prisma|lib\/auth|rate-limit|\/oauth|\/server|service/i);
  assert.match(commercialSource, /await import\("@\/lib\/mcp\/commercial\/post-handler"\)/);

  const mediaSource = await readFile(new URL("../app/api/mcp/media/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(mediaSource, /lib\/db\/prisma|lib\/auth|rate-limit|\/oauth|\/server|service|post-handler/i);
  assert.match(mediaSource, /retiredMediaResponse/);
});

test("Better Auth is lazy, separates ordinary sessions from operational OAuth, and resets rejected initialization", async () => {
  const [instance, config, session, bootstrap] = await Promise.all([
    readFile(new URL("../lib/auth/instance.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/auth/config.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/auth/session.ts", import.meta.url), "utf8"),
    readFile(new URL("../scripts/bootstrap-first-admin.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(instance, /export const auth\s*=\s*createSevenBetAuth/);
  assert.match(instance, /instance\.\$context\.then\(\(\) => instance\)/);
  assert.match(instance, /catch\(\(error\) => \{\s*assign\(null\)/);
  assert.match(instance, /getAuth[\s\S]*false/);
  assert.match(instance, /getOperationalMcpAuth[\s\S]*true/);
  assert.match(config, /resourceSeedMode: "merge"/);
  assert.match(config, /clientRegistrationAllowedResources: \[commercialMcpResource\]/);
  assert.doesNotMatch(config, /mediaMcpResource|media:(?:read|safe_write|production_write)/);
  assert.match(session, /if \(!hasBetterAuthSessionCookie\(resolvedHeaders\)\) return null/);
  assert.match(bootstrap, /operationalMcpProvider: false/);
});

test("unreachable database produces a bounded commercial 503 while retired Media MCP stays database-independent", async () => {
  const { stdout } = await probe("post");
  const result = JSON.parse(finalJsonLine(stdout)) as PostProbeResult;
  assert.equal(result.elapsedMs < 8_000, true, `unreachable probe took ${result.elapsedMs}ms`);
  assert.deepEqual(result.unhandled, []);
  assert.deepEqual(result.responses.map((item) => item.name), ["commercial", "media"]);
  const [commercial, media] = result.responses;
  assert.equal(commercial.status, 503);
  assert.equal(commercial.cacheControl, "no-store");
  assert.equal(commercial.retryAfter, "3");
  assert.deepEqual(commercial.body, {
    jsonrpc: "2.0",
    error: { code: -32003, message: "Operational data is temporarily unavailable" },
    id: null,
  });
  assert.doesNotMatch(JSON.stringify(commercial.body), /Prisma|P1001|127\.0\.0\.1|postgres|stack|oauth/i);

  assert.equal(media.status, 410);
  assert.equal(media.cacheControl, "private, no-store");
  assert.equal(media.retryAfter, null);
  assert.deepEqual(media.body, { error: "MEDIA_OPERATIONS_RETIRED" });
});

test("Admin Media boundaries map only transient database failures to safe 503 responses", async () => {
  const transient = { name: "PrismaClientKnownRequestError", code: "P2024", message: "pool and URL secret" };
  for (const response of [
    adminServiceErrorResponse(transient, "Unable to list media"),
    mediaOperationsErrorResponse(transient, "Unable to load media ingestion plans"),
  ]) {
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "3");
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.doesNotMatch(await response.text(), /P2024|pool|URL|secret|Prisma/i);
  }
  assert.equal(adminServiceErrorResponse(new Error("bug"), "Unable to list media").status, 500);
  assert.equal(mediaOperationsErrorResponse(new Error("bug"), "Unable to load media ingestion plans").status, 500);
});

test("public discovery repository reads editorial aliases without affiliate or route queries", async () => {
  let active = 0;
  let maximum = 0;
  const order: string[] = [];
  const query = async (name: string, value: unknown) => {
    active += 1;
    maximum = Math.max(maximum, active);
    order.push(name);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return value;
  };
  const aliases = [{ casinoId: "casino-1", value: "Alias" }];
  const repository = new PublicCasinoDiscoveryRepository({
    casinoAlias: { findMany: () => query("aliases", aliases) },
  } as never);

  const result = await repository.loadContext(["casino-1"]);
  assert.deepEqual(result, { aliases });
  assert.deepEqual(order, ["aliases"]);
  assert.equal(order.length, 1);
  assert.equal(maximum, 1);
});

test("the standalone MCP availability response remains stable", async () => {
  assert.equal(mcpDatabaseUnavailableResponse().status, 503);
});
