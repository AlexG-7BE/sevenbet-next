import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { isTransientDatabaseAvailabilityError } from "../lib/db/transient-availability";
import { adminServiceErrorResponse } from "../lib/http/admin-service-error";
import { mediaOperationsErrorResponse } from "../lib/media-operations/http";
import { PublicCasinoDiscoveryRepository } from "../lib/repositories/public-casino-discovery.repository";

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

test("Better Auth stays lazy, generic, and resets rejected initialization", async () => {
  const [instance, config, session, bootstrap] = await Promise.all([
    readFile(new URL("../lib/auth/instance.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/auth/config.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/auth/session.ts", import.meta.url), "utf8"),
    readFile(new URL("../scripts/bootstrap-first-admin.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(instance, /export const auth\s*=\s*createSevenBetAuth/);
  assert.match(instance, /instance\.\$context\.then\(\(\) => instance\)/);
  assert.match(instance, /catch\(\(error\) => \{\s*authPromise = null/);
  assert.doesNotMatch(instance, /Operational|Mcp|oauth/i);
  assert.doesNotMatch(config, /oauthProvider|clientRegistration|commercial:safe_write|chatgpt/i);
  assert.match(session, /if \(!hasBetterAuthSessionCookie\(resolvedHeaders\)\) return null/);
  assert.doesNotMatch(bootstrap, /operationalMcpProvider/);
});

test("Admin and Media boundaries map only transient database failures to safe 503 responses", async () => {
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
  assert.equal(maximum, 1);
});
