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

test("stable OAuth Provider owns protocol issuance, rotation, and revocation", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as { dependencies: Record<string, string> };
  const authConfig = await readFile(new URL("../lib/auth/config.ts", import.meta.url), "utf8");
  const oauth = await readFile(new URL("../lib/mcp/commercial/oauth.ts", import.meta.url), "utf8");
  assert.equal(packageJson.dependencies["better-auth"], "1.7.1");
  assert.equal(packageJson.dependencies["@better-auth/core"], "1.7.1");
  assert.equal(packageJson.dependencies["@better-auth/oauth-provider"], "1.7.1");
  assert.match(authConfig, /oauthProvider\(\{/);
  assert.match(authConfig, /disableJwtPlugin: true/);
  assert.match(authConfig, /storeTokens: commercialMcpProviderTokenStorage/);
  assert.match(authConfig, /resources: \[/);
  assert.match(authConfig, /clientRegistrationDefaultResources: \[commercialMcpResource\]/);
  assert.match(authConfig, /clientRegistrationAllowedResources: \[commercialMcpResource\]/);
  assert.match(authConfig, /enforcePerClientResources: true/);
  assert.match(authConfig, /refreshTokenReuseInterval: 0/);
  assert.doesNotMatch(authConfig, /validAudiences/);
  assert.doesNotMatch(authConfig, /from ["']better-auth\/plugins["']/);
  assert.match(oauth, /"\/oauth2\/token"/);
  assert.match(oauth, /"\/oauth2\/revoke"/);
  assert.match(oauth, /value\.resource\[0\] !== config\.resource/);
});

test("no reusable token is stored or queried through a plaintext field", async () => {
  const oauth = await readFile(new URL("../lib/mcp/commercial/oauth.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
  const migration = await readFile(new URL("../prisma/migrations/0021_partner_ops_work_bridge_01/migration.sql", import.meta.url), "utf8");
  const providerSchema = schema.slice(schema.indexOf("model OauthClient"), schema.indexOf("model CommercialMcpRateLimitBucket"));
  assert.doesNotMatch(providerSchema, /accessToken\s+String|refreshToken\s+String/);
  assert.doesNotMatch(migration, /"accessToken"|"refreshToken"/);
  assert.doesNotMatch(oauth, /where:\s*\{\s*(accessToken|refreshToken):/);
  assert.match(oauth, /hashCommercialMcpPresentedToken/);
});

test("CRM repository records delegated Agent truth and never mutates affiliate runtime", async () => {
  const repository = await readFile(new URL("../lib/repositories/commercial.repository.ts", import.meta.url), "utf8");
  assert.match(repository, /actorKind: "PARTNER_OPERATIONS_AGENT"/);
  assert.match(repository, /channel: "MCP_WORK"/);
  assert.match(repository, /commercial_mcp_research_bundle_upserted/);
  assert.doesNotMatch(repository, /affiliateProgram\.(update|create)|affiliateOffer\.(update|create)|affiliateTrackingLink\.(update|create)/);
});

test("OAuth migration preserves 0021 and adds the bounded 1.7 protected-resource upgrade in 0022", async () => {
  const migration0021 = await readFile(new URL("../prisma/migrations/0021_partner_ops_work_bridge_01/migration.sql", import.meta.url), "utf8");
  const migration0022 = await readFile(new URL("../prisma/migrations/0022_better_auth_17_schema_upgrade/migration.sql", import.meta.url), "utf8");
  const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
  assert.match(migration0021, /CREATE TABLE "oauthClient"/);
  assert.match(migration0021, /CREATE TABLE "oauthRefreshToken"/);
  assert.match(migration0021, /CREATE TABLE "oauthAccessToken"/);
  assert.match(migration0021, /CREATE TABLE "oauthConsent"/);
  assert.match(migration0021, /CREATE TABLE "CommercialMcpRateLimitBucket"/);
  assert.doesNotMatch(migration0021, /DROP|TRUNCATE|DELETE FROM|ALTER COLUMN/i);
  assert.match(migration0022, /ADD COLUMN "issuer" TEXT/);
  assert.match(migration0022, /local:credential/);
  assert.match(migration0022, /https:\/\/accounts\.google\.com/);
  assert.match(migration0022, /CREATE TABLE "oauthResource"/);
  assert.match(migration0022, /CREATE TABLE "oauthClientResource"/);
  assert.match(migration0022, /"clientCredentialsScopes" TEXT\[\] NOT NULL DEFAULT ARRAY\[\]::TEXT\[\]/);
  assert.match(migration0022, /CREATE FUNCTION "set_better_auth_oauth_resource_compat"/);
  assert.match(migration0022, /client must have exactly one enabled resource/);
  assert.match(migration0022, /resource does not match client authority/);
  assert.match(migration0022, /CREATE TRIGGER "oauthRefreshToken_resource_compat"/);
  assert.match(migration0022, /CREATE TRIGGER "oauthAccessToken_resource_compat"/);
  assert.match(migration0022, /CREATE TRIGGER "oauthConsent_resource_compat"/);
  assert.doesNotMatch(migration0022, /DROP TABLE|TRUNCATE|DELETE FROM/i);
  assert.match(schema, /model OauthClient[\s\S]*@@map\("oauthClient"\)/);
  assert.match(schema, /model OauthResource[\s\S]*@@map\("oauthResource"\)/);
  assert.match(schema, /model OauthClientResource[\s\S]*@@map\("oauthClientResource"\)/);
  assert.match(schema, /model OauthRefreshToken[\s\S]*@@map\("oauthRefreshToken"\)/);
  assert.match(schema, /model OauthAccessToken[\s\S]*@@map\("oauthAccessToken"\)/);
  assert.match(schema, /model OauthConsent[\s\S]*@@map\("oauthConsent"\)/);
});
