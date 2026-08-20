import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = [
  "../lib/commercial/commercial-mcp-contract.ts",
  "../lib/commercial/commercial-mcp-service.ts",
  "../lib/mcp/commercial/server.ts",
  "../app/api/mcp/commercial/route.ts",
];

test("Commercial MCP boundary has no Programme/private-domain coupling", async () => {
  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /from ["'][^"']*(programme|user-progress|starting-point|help-usage|self-exclusion)/i, file);
  }
});

test("MCP adapter and service do not import Prisma directly", async () => {
  for (const file of ["../lib/commercial/commercial-mcp-service.ts", "../lib/mcp/commercial/server.ts", "../app/api/mcp/commercial/route.ts"]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /@prisma\/client|lib\/db\/prisma|\.commercialOpportunity\./, file);
  }
});

test("provider internals are blocked and token/code material is never logged", async () => {
  const authRoute = await readFile(new URL("../app/api/auth/[...all]/route.ts", import.meta.url), "utf8");
  const oauth = await readFile(new URL("../lib/mcp/commercial/oauth.ts", import.meta.url), "utf8");
  assert.match(authRoute, /isCommercialMcpInternalAuthPath/);
  assert.doesNotMatch(oauth, /console\.(log|info|warn|error)/);
  assert.doesNotMatch(oauth, /metadata:[\s\S]{0,200}(accessToken|refreshToken|authorizationCode)/);
});

test("CRM repository records delegated Agent truth and never mutates affiliate runtime", async () => {
  const repository = await readFile(new URL("../lib/repositories/commercial.repository.ts", import.meta.url), "utf8");
  assert.match(repository, /actorKind: "PARTNER_OPERATIONS_AGENT"/);
  assert.match(repository, /channel: "MCP_WORK"/);
  assert.match(repository, /commercial_mcp_research_bundle_upserted/);
  assert.doesNotMatch(repository, /affiliateProgram\.(update|create)|affiliateOffer\.(update|create)|affiliateTrackingLink\.(update|create)/);
});

test("OAuth migration is one additive provider migration", async () => {
  const migration = await readFile(new URL("../prisma/migrations/0021_partner_ops_work_bridge_01/migration.sql", import.meta.url), "utf8");
  const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE "OAuthApplication"/);
  assert.match(migration, /CREATE TABLE "OAuthAccessToken"/);
  assert.match(migration, /CREATE TABLE "OAuthConsent"/);
  assert.match(migration, /CREATE TABLE "CommercialMcpRateLimitBucket"/);
  assert.doesNotMatch(migration, /DROP|TRUNCATE|DELETE FROM|ALTER COLUMN/i);
  assert.match(schema, /model OauthApplication[\s\S]*@@map\("OAuthApplication"\)/);
  assert.match(schema, /model OauthAccessToken[\s\S]*@@map\("OAuthAccessToken"\)/);
  assert.match(schema, /model OauthConsent[\s\S]*@@map\("OAuthConsent"\)/);
});
