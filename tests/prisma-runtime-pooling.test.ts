import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { inspectPrismaRuntimeConnection, warnForUnsafePrismaRuntimeConnection } from "../lib/db/prisma-runtime-config";

const directUrl = "postgresql://runtime-user:super-secret@db.prisma.io:5432/postgres?sslmode=require";
const pooledUrl = "postgresql://runtime-user:super-secret@pooled.db.prisma.io:5432/postgres?sslmode=require&connection_limit=1";

test("production runtime warns for the direct Prisma Postgres endpoint without revealing credentials", () => {
  const messages: string[] = [];
  warnForUnsafePrismaRuntimeConnection({ NODE_ENV: "production", DATABASE_URL: directUrl }, (message) => messages.push(message));
  assert.equal(messages.length, 1);
  assert.match(messages[0], /direct Prisma Postgres endpoint/);
  assert.doesNotMatch(JSON.stringify(messages), /runtime-user|super-secret|postgresql:\/\//);
});

test("the approved pooled runtime URL is accepted only with bounded SSL pool settings", () => {
  assert.deepEqual(inspectPrismaRuntimeConnection(pooledUrl), { mode: "pooled", warnings: [] });
  const unsafe = inspectPrismaRuntimeConnection("postgresql://user:password@pooled.db.prisma.io:5432/postgres?sslmode=require&connection_limit=2&pool_timeout=0");
  assert.equal(unsafe.mode, "pooled");
  assert.deepEqual(unsafe.warnings, [
    "Pooled runtime DATABASE_URL must set connection_limit=1.",
    "Pooled runtime DATABASE_URL must not disable pool timeout.",
  ]);
});

test("non-production administrative scripts do not emit runtime connection warnings", () => {
  const messages: string[] = [];
  warnForUnsafePrismaRuntimeConnection({ NODE_ENV: "development", DATABASE_URL: directUrl }, (message) => messages.push(message));
  assert.deepEqual(messages, []);
});

test("Prisma CLI has a direct URL while the application keeps one module-level client", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const example = readFileSync(".env.example", "utf8");
  const client = readFileSync("lib/db/prisma.ts", "utf8");
  assert.match(schema, /url\s+= env\("DATABASE_URL"\)/);
  assert.match(schema, /directUrl\s+= env\("DIRECT_URL"\)/);
  assert.match(example, /DATABASE_URL="postgresql:\/\/USER:PASSWORD@pooled\.db\.prisma\.io:5432\/postgres\?sslmode=require&connection_limit=1"/);
  assert.match(example, /DIRECT_URL="postgresql:\/\/USER:PASSWORD@db\.prisma\.io:5432\/postgres\?sslmode=require"/);
  assert.equal((client.match(/new PrismaClient\(/g) ?? []).length, 1);
  assert.doesNotMatch(client, /\$disconnect\(/);
});
