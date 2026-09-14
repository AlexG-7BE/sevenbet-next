import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;

function source(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function sourceFiles(path: string): string[] {
  const absolute = join(root, path);
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    if (entry.isDirectory()) return sourceFiles(child);
    return [".ts", ".tsx", ".js", ".mjs", ".css"].includes(extname(entry.name)) ? [child] : [];
  });
}

test("PR5 physically removes every MCP and operational OAuth HTTP surface", () => {
  for (const path of [
    "app/api/mcp",
    "lib/mcp",
    "app/.well-known/oauth-authorization-server",
    "app/.well-known/oauth-protected-resource",
    "app/admin/integrations/chatgpt-work",
  ]) {
    assert.equal(
      existsSync(join(root, path)) ? sourceFiles(path).length : 0,
      0,
      `${path} must not contain a surviving stub`,
    );
  }

  const activeRuntime = [
    ...sourceFiles("app"),
    ...sourceFiles("components"),
    ...sourceFiles("lib"),
    "middleware.ts",
    "next.config.mjs",
  ].map((path) => `// ${path}\n${source(path)}`).join("\n");
  assert.doesNotMatch(
    activeRuntime,
    /@modelcontextprotocol|\/api\/mcp|CommercialMcp|MediaMcp|commercial_mcp|COMMERCIAL_MCP|MEDIA_OPERATIONS_MCP|commercial:(?:read|safe_write)|media:(?:read|safe_write|production_write)|chatgpt-work|CHATGPT_WORK|getOperationalMcpAuth|oauthProvider|mcpAuth|mcpPermission|mcpAuthority|mcpConsent/,
  );
});

test("transport-only dependencies and commands are absent", () => {
  const pkg = JSON.parse(source("package.json")) as {
    dependencies: Record<string, string>;
    scripts: Record<string, string>;
  };
  assert.equal(pkg.dependencies["@modelcontextprotocol/sdk"], undefined);
  assert.equal(pkg.dependencies["@better-auth/oauth-provider"], undefined);
  assert.equal(pkg.dependencies["@better-auth/utils"], undefined);
  assert.equal(Object.keys(pkg.scripts).some((name) => /mcp-bridge|partner-tracking:production-smoke/i.test(name)), false);
  assert.equal(Object.values(pkg.scripts).some((command) => /\/api\/mcp|commercial-mcp-browser|media-ingestion-autoplacement-browser/.test(command)), false);
});

test("extracted CRM research capability is transport-, client-, and scope-neutral", () => {
  const contract = source("lib/commercial/commercial-opportunity-research-contract.ts");
  const service = source("lib/commercial/commercial-opportunity-research-service.ts");
  const repository = source("lib/repositories/commercial.repository.ts");
  const extracted = `${contract}\n${service}\n${repository}`;
  assert.doesNotMatch(extracted, /\bMCP\b|ChatGPT|OAuth|clientId|oauthClientId|commercial:(?:read|safe_write)|tools\/call|MCP_WORK|CHATGPT_WORK/i);
  assert.match(contract, /CommercialResearchBundleSchema/);
  assert.match(service, /commercialOpportunityResearchService/);
  assert.match(repository, /commercial_research_bundle_upserted/);
  assert.match(repository, /sourceAuthority: null/);
  assert.match(repository, /research-operation:/);
});

test("canonical tracking and public runtime remain independent of CRM and retired transport", () => {
  const tracking = source("lib/commercial/partner-tracking-registration-service.ts");
  const authority = source("lib/commercial/commercial-write-authority.ts");
  const publicRuntime = [
    source("lib/commercial/public-commercial-action-resolver.ts"),
    source("lib/services/affiliate-redirect.service.ts"),
    source("lib/market-activation/runtime.ts"),
    source("lib/market-activation/repository.ts"),
    source("lib/services/public-casino-discovery.service.ts"),
  ].join("\n");
  assert.doesNotMatch(tracking, /commercialOpportunity|CommercialResearch|oauth|token|MCP/i);
  assert.match(tracking, /requireTrustedCommercialWriteAuthority\(context\.commercialAuthority\)/);
  assert.match(authority, /new WeakSet<object>\(\)/);
  assert.doesNotMatch(publicRuntime, /commercialOpportunity|CommercialResearch|oauthAccessToken|oauthClient|\/api\/mcp|CommercialMcp|MediaMcp/i);
});

test("historical connector data is retained exactly for PR6 and has no active reader or writer", () => {
  const schema = source("prisma/schema.prisma");
  const models = [...schema.matchAll(/^model (Oauth\w+|CommercialMcpRateLimitBucket) \{/gm)].map((match) => match[1]);
  assert.deepEqual(models, [
    "OauthClient",
    "OauthResource",
    "OauthClientResource",
    "OauthRefreshToken",
    "OauthAccessToken",
    "OauthConsent",
    "OauthClientAssertion",
    "CommercialMcpRateLimitBucket",
  ]);
  assert.match(schema, /retained without runtime\s+\/\/ authority in PR5|retained without runtime/);
  const activeBusiness = [
    ...sourceFiles("app"),
    ...sourceFiles("components"),
    ...sourceFiles("lib"),
  ].map(source).join("\n");
  assert.doesNotMatch(activeBusiness, /oauthAccessToken|oauthRefreshToken|oauthClientResource|commercialMcpRateLimitBucket/);
  const migrations = readdirSync(join(root, "prisma/migrations"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.equal(migrations.at(-1), "0040_commercial_core_exact_routes_geo_simplification");
});

test("release documentation requires external connector retirement and records usage as unknown", () => {
  const decision = source("docs/06_RFC/RFC-051-MCP-Extraction-and-Retirement.md");
  const runbook = source("docs/06_Operations/Commercial-Core-PR5-MCP-Extraction-Retirement.md");
  assert.match(decision, /EXTERNAL_CONNECTOR_RETIREMENT_REQUIRED/);
  assert.match(runbook, /MCP_RECENT_USAGE_UNKNOWN/);
  assert.match(runbook, /B4GAMBLE Commercial Operations2/);
  assert.match(runbook, /Media connector.*UNKNOWN/is);
  assert.match(runbook, /External connector removal is \*\*not complete\*\*/i);
});
