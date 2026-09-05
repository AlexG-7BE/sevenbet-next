import assert from "node:assert/strict";
import test from "node:test";

import { PrismaClient } from "@prisma/client";
import { makeSignature } from "better-auth/crypto";
import { NextRequest } from "next/server";

import { GET as getAdminMediaIngestions } from "../app/api/admin/media-operations/ingestions/route";
import { POST as postCommercialMcp } from "../app/api/mcp/commercial/route";
import { POST as postMediaMcp } from "../app/api/mcp/media/route";
import { getOperationalMcpAuth } from "../lib/auth/instance";
import prisma from "../lib/db/prisma";
import { isTransientDatabaseAvailabilityError } from "../lib/db/transient-availability";
import { resolveCommercialMcpConfig } from "../lib/mcp/commercial/config";
import { hashCommercialMcpPresentedToken } from "../lib/mcp/commercial/provider";
import { resolveMediaMcpConfig } from "../lib/mcp/media/config";
import { publicCasinoDiscoveryRepository } from "../lib/repositories/public-casino-discovery.repository";

const fixture = {
  userId: "production-db-reliability-user",
  adminId: "00000000-0000-4000-8000-000000000901",
  sessionId: "production-db-reliability-session",
  sessionToken: "production-db-reliability-session-token",
};

function assertDisposablePostgres() {
  assert.equal(process.env.CI, "true");
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  const localPort = process.env.PRODUCTION_DB_RELIABILITY_TEST_PORT;
  assert.ok(localPort ? url.port === localPort : ["5432", "54329"].includes(url.port));
  assert.ok(url.pathname.endsWith("_ci"));
  assert.equal(url.searchParams.get("connection_limit"), "1");
  assert.equal(url.searchParams.get("pool_timeout"), "1");
}

function directDatabaseUrl() {
  const url = new URL(process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "");
  url.searchParams.delete("connection_limit");
  url.searchParams.delete("pool_timeout");
  return url.toString();
}

function config() {
  const commercial = resolveCommercialMcpConfig("http://127.0.0.1:4173/api/mcp/commercial");
  const media = resolveMediaMcpConfig("http://127.0.0.1:4173/api/mcp/media");
  assert.ok(commercial);
  assert.ok(media);
  return { commercial, media };
}

async function cleanup(database: PrismaClient) {
  await database.oauthAccessToken.deleteMany({ where: { id: { startsWith: "production-db-reliability-token-" } } });
  await database.oauthClient.deleteMany({ where: { clientId: { startsWith: "production-db-reliability-client-" } } });
  await database.session.deleteMany({ where: { id: fixture.sessionId } });
  await database.adminUser.deleteMany({ where: { id: fixture.adminId } });
  await database.user.deleteMany({ where: { id: fixture.userId } });
  await database.commercialMcpRateLimitBucket.deleteMany();
}

async function createFixtures(database: PrismaClient) {
  const resources = config();
  await database.user.create({
    data: {
      id: fixture.userId,
      name: "Production DB reliability fixture",
      email: "production-db-reliability@invalid.example",
      emailVerified: true,
    },
  });
  await database.adminUser.create({
    data: {
      id: fixture.adminId,
      userId: fixture.userId,
      name: "Production DB reliability fixture",
      email: "production-db-reliability@invalid.example",
      role: "SUPER_ADMIN",
    },
  });
  await database.session.create({
    data: {
      id: fixture.sessionId,
      token: fixture.sessionToken,
      userId: fixture.userId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1_000),
    },
  });

  for (const [kind, resource, scopes] of [
    ["commercial", resources.commercial.resource, ["commercial:read", "offline_access"]],
    ["media", resources.media.resource, ["media:read", "offline_access"]],
  ] as const) {
    const clientId = `production-db-reliability-client-${kind}`;
    await database.oauthResource.upsert({
      where: { identifier: resource },
      create: {
        id: `production-db-reliability-resource-${kind}`,
        identifier: resource,
        name: kind === "commercial" ? "B4GAMBLE Commercial MCP" : "B4GAMBLE Media Operations MCP",
        allowedScopes: [...scopes],
      },
      update: {},
    });
    await database.oauthClient.create({
      data: {
        id: `production-db-reliability-client-row-${kind}`,
        clientId,
        disabled: false,
        scopes: [...scopes],
        contacts: [],
        redirectUris: ["https://chatgpt.com/connector_platform_oauth_redirect"],
        postLogoutRedirectUris: [],
        tokenEndpointAuthMethod: "none",
        applicationType: "web",
        grantTypes: ["authorization_code", "refresh_token"],
        responseTypes: ["code"],
        requirePKCE: true,
        metadata: { integration: "CHATGPT_WORK", b4gambleMcpResource: resource },
      },
    });
    await database.oauthClientResource.create({
      data: {
        id: `production-db-reliability-client-resource-${kind}`,
        clientId,
        resourceId: resource,
      },
    });
    const presented = `b4mcp_at_production_db_reliability_${kind}`;
    const token = await hashCommercialMcpPresentedToken(presented, "access_token");
    assert.ok(token);
    await database.oauthAccessToken.create({
      data: {
        id: `production-db-reliability-token-${kind}`,
        token,
        clientId,
        userId: fixture.userId,
        resources: [resource],
        expiresAt: new Date(Date.now() + 60 * 60 * 1_000),
        createdAt: new Date(),
        scopes: [...scopes],
      },
    });
  }
}

async function waitForQueuedAdvisoryLock(database: PrismaClient, key: number) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const rows = await database.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT count(*) AS count FROM pg_locks WHERE locktype = 'advisory' AND granted = false AND objid = ${key}`,
    );
    if (Number(rows[0]?.count ?? 0) > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error("Application connection did not enter the controlled advisory-lock wait");
}

async function withSaturatedApplicationPool<T>(database: PrismaClient, key: number, operation: () => Promise<T>) {
  let markHolderReady!: () => void;
  let releaseHolder!: () => void;
  const holderReady = new Promise<void>((resolve) => { markHolderReady = resolve; });
  const holderRelease = new Promise<void>((resolve) => { releaseHolder = resolve; });
  const holder = database.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${key})`);
    markHolderReady();
    await holderRelease;
  }, { timeout: 8_000 });
  await holderReady;

  const applicationBlocker = prisma.$transaction(
    (transaction) => transaction.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${key})`),
    { timeout: 8_000 },
  );
  await waitForQueuedAdvisoryLock(database, key);
  const failsafe = setTimeout(releaseHolder, 4_000);
  try {
    return await operation();
  } finally {
    clearTimeout(failsafe);
    releaseHolder();
    await holder;
    await applicationBlocker;
  }
}

async function withDiscoveryTablesLocked<T>(database: PrismaClient, operation: () => Promise<T>) {
  let markReady!: () => void;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => { markReady = resolve; });
  const released = new Promise<void>((resolve) => { release = resolve; });
  const holder = database.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe('LOCK TABLE "CasinoAlias", "AffiliateOffer", "AffiliateRedirectSlug" IN ACCESS EXCLUSIVE MODE');
    markReady();
    await released;
  }, { timeout: 8_000 });
  await ready;
  const timer = setTimeout(release, 1_500);
  try {
    return await operation();
  } finally {
    clearTimeout(timer);
    release();
    await holder;
  }
}

function mcpRequest(kind: "commercial" | "media") {
  const tool = kind === "commercial"
    ? { name: "commercial_list_opportunities", arguments: { limit: 1, offset: 0 } }
    : { name: "media_list_recent_ingestions", arguments: { limit: 1 } };
  return new Request(`http://127.0.0.1:4173/api/mcp/${kind}`, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      authorization: `Bearer b4mcp_at_production_db_reliability_${kind}`,
      "content-type": "application/json",
      "x-forwarded-for": kind === "commercial" ? "127.0.0.11" : "127.0.0.12",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: tool }),
  });
}

async function assertSafeUnavailable(response: Response) {
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("retry-after"), "3");
  const text = await response.text();
  assert.deepEqual(JSON.parse(text), {
    jsonrpc: "2.0",
    error: { code: -32003, message: "Operational data is temporarily unavailable" },
    id: null,
  });
  assert.doesNotMatch(text, /Prisma|P2024|pool|postgres|127\.0\.0\.1|stack|oauth/i);
}

test("one-connection Production-shaped pool stays bounded across discovery, MCP, and Admin Media paths", async () => {
  assertDisposablePostgres();
  const database = new PrismaClient({ datasourceUrl: directDatabaseUrl() });
  try {
    await cleanup(database);

    const discoveryId = "00000000-0000-4000-8000-000000000999";
    const coldStarted = performance.now();
    await publicCasinoDiscoveryRepository.loadContext([discoveryId]);
    const coldMs = performance.now() - coldStarted;
    const warmSamples: number[] = [];
    for (let index = 0; index < 5; index += 1) {
      const started = performance.now();
      await publicCasinoDiscoveryRepository.loadContext([discoveryId]);
      warmSamples.push(performance.now() - started);
    }
    const concurrentStarted = performance.now();
    const concurrent = await Promise.allSettled(
      Array.from({ length: 8 }, () => publicCasinoDiscoveryRepository.loadContext([discoveryId])),
    );
    const concurrentMs = performance.now() - concurrentStarted;
    assert.equal(concurrent.filter((result) => result.status === "rejected").length, 0);

    const lockStarted = performance.now();
    const lockedResult = await withDiscoveryTablesLocked(
      database,
      () => publicCasinoDiscoveryRepository.loadContext([discoveryId]),
    );
    const lockedMs = performance.now() - lockStarted;
    assert.deepEqual(lockedResult, { aliases: [], offers: [], redirects: [] });
    assert.ok(lockedMs >= 1_300 && lockedMs < 4_000, `controlled lock completed in ${lockedMs}ms`);

    await createFixtures(database);
    for (const [index, post] of [postCommercialMcp, postMediaMcp].entries()) {
      const kind = index === 0 ? "commercial" as const : "media" as const;
      const unavailable = await withSaturatedApplicationPool(database, 790_100 + index, () => post(mcpRequest(kind)));
      await assertSafeUnavailable(unavailable);
      const healthy = await post(mcpRequest(kind));
      assert.equal(healthy.status, 200, await healthy.text());
    }

    const secret = process.env.BETTER_AUTH_SECRET;
    assert.ok(secret);
    const signedSession = `${fixture.sessionToken}.${await makeSignature(fixture.sessionToken, secret)}`;
    const adminRequest = () => new NextRequest("http://127.0.0.1:4173/api/admin/media-operations/ingestions?limit=1", {
      headers: { cookie: `better-auth.session_token=${signedSession}` },
    });
    const unavailableAdmin = await withSaturatedApplicationPool(database, 790_200, () => getAdminMediaIngestions(adminRequest()));
    assert.equal(unavailableAdmin.status, 503);
    assert.equal(unavailableAdmin.headers.get("retry-after"), "3");
    assert.match(unavailableAdmin.headers.get("cache-control") ?? "", /no-store/);
    assert.doesNotMatch(await unavailableAdmin.text(), /Prisma|P2024|pool|postgres|stack/i);
    const healthyAdmin = await getAdminMediaIngestions(adminRequest());
    assert.equal(healthyAdmin.status, 200, await healthyAdmin.text());

    const initializationError = await withSaturatedApplicationPool(
      database,
      790_300,
      () => getOperationalMcpAuth().then(() => null, (error: unknown) => error),
    );
    assert.equal(isTransientDatabaseAvailabilityError(initializationError), true);
    const operationalAuth = await getOperationalMcpAuth();
    await operationalAuth.$context;
    assert.equal(await database.oauthResource.count({
      where: { identifier: { in: [config().commercial.resource, config().media.resource] } },
    }), 2);

    console.info(JSON.stringify({
      productionDbReliability: {
        discoveryQueriesPerRequest: 3,
        discoveryMaximumInternalConcurrency: 1,
        coldMs: Number(coldMs.toFixed(2)),
        warmMedianMs: Number([...warmSamples].sort((a, b) => a - b)[Math.floor(warmSamples.length / 2)].toFixed(2)),
        warmMaxMs: Number(Math.max(...warmSamples).toFixed(2)),
        eightConcurrentMs: Number(concurrentMs.toFixed(2)),
        p2024Count: 0,
        controlledLockMs: Number(lockedMs.toFixed(2)),
      },
    }));
  } finally {
    await cleanup(database);
    await prisma.$disconnect();
    await database.$disconnect();
  }
});
