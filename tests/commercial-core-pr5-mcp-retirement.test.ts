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

test("PR5 keeps Commercial, Media, and operational OAuth transport retired", () => {
  for (const path of [
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
  const allowedLearnMcpFiles = [
    "app/api/mcp/learn/route.ts",
    "lib/mcp/learn/config.ts",
    "lib/mcp/learn/post-handler.ts",
    "lib/mcp/learn/rate-limit.ts",
    "lib/mcp/learn/server.ts",
  ];
  const mcpFiles = [
    ...(existsSync(join(root, "app/api/mcp")) ? sourceFiles("app/api/mcp") : []),
    ...(existsSync(join(root, "lib/mcp")) ? sourceFiles("lib/mcp") : []),
  ].sort();
  assert.deepEqual(mcpFiles, allowedLearnMcpFiles, "only the Founder-authorized Learn MCP surface may exist");

  const activeRuntimePaths = [
    ...sourceFiles("app"),
    ...sourceFiles("components"),
    ...sourceFiles("lib"),
    "middleware.ts",
    "next.config.mjs",
  ];
  assert.deepEqual(
    activeRuntimePaths.filter((path) => source(path).includes("CHATGPT_WORK")),
    ["lib/media-operations/persisted-history.ts"],
    "the retired source literal may survive only in the bounded persisted-history decoder",
  );
  const activeRuntime = activeRuntimePaths
    .filter((path) => path !== "lib/media-operations/persisted-history.ts" && !allowedLearnMcpFiles.includes(path))
    .map((path) => `// ${path}\n${source(path)}`).join("\n");
  assert.doesNotMatch(
    activeRuntime,
    /@modelcontextprotocol|\/api\/mcp|CommercialMcp|MediaMcp|commercial_mcp|COMMERCIAL_MCP|MEDIA_OPERATIONS_MCP|commercial:(?:read|safe_write)|media:(?:read|safe_write|production_write)|chatgpt-work|CHATGPT_WORK|getOperationalMcpAuth|oauthProvider|mcpAuth|mcpPermission|mcpAuthority|mcpConsent/,
  );
});

test("legacy Media source compatibility is bounded to persisted reads and remains fail-closed", () => {
  const contracts = source("lib/media-operations/contracts.ts");
  const decoder = source("lib/media-operations/persisted-history.ts");
  const repository = source("lib/media-operations/repository.ts");
  assert.doesNotMatch(contracts, /CHATGPT_WORK/);
  assert.match(decoder, /value === LEGACY_MEDIA_OPERATIONS_SOURCE \? "AUTOMATION" : value/);
  assert.match(decoder, /mediaIngestionPlanSchema\.parse\(normalizePersistedPlan\(value\)\)/);
  assert.match(decoder, /mediaIngestionBatchSchema\.parse/);
  assert.equal((repository.match(/planFromValue\(/g) ?? []).length, 5);
  assert.equal((repository.match(/decodePersistedMediaIngestionBatch\(/g) ?? []).length, 2);
  assert.match(repository, /async applyDraftPlan[\s\S]*?const plan = planFromValue\(setting\.value\)/);
  assert.match(repository, /async rollbackDraftPlan[\s\S]*?const plan = planFromValue\(setting\.value\)/);
  assert.match(repository, /const parsed = mediaIngestionPlanSchema\.parse\(plan\)/);
  assert.match(repository, /const parsed = mediaIngestionBatchSchema\.parse\(batch\)/);
});

test("retired transport dependencies and commands stay absent", () => {
  const pkg = JSON.parse(source("package.json")) as {
    dependencies: Record<string, string>;
    scripts: Record<string, string>;
  };
  assert.equal(pkg.dependencies["@modelcontextprotocol/sdk"], "1.30.0");
  assert.equal(pkg.dependencies["@better-auth/oauth-provider"], undefined);
  assert.equal(pkg.dependencies["@better-auth/utils"], undefined);
  assert.equal(Object.keys(pkg.scripts).some((name) => /mcp-bridge|partner-tracking:production-smoke/i.test(name)), false);
  assert.equal(Object.values(pkg.scripts).some((command) => /\/api\/mcp\/(?:commercial|media|oauth)|commercial-mcp-browser|media-ingestion-autoplacement-browser/.test(command)), false);
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
  const applicationCallers = [
    ...sourceFiles("app"),
    ...sourceFiles("components"),
    ...sourceFiles("lib"),
  ].filter((path) => path !== "lib/commercial/commercial-opportunity-research-service.ts"
    && source(path).includes("commercialOpportunityResearchService"));
  assert.deepEqual(applicationCallers, [], "PR5 must not add a neutral research service caller or replay adapter");
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

test("PR5 connector history remains documented while PR6 removes it from the active data model", () => {
  const schema = source("prisma/schema.prisma");
  const models = [...schema.matchAll(/^model (Oauth\w+|CommercialMcpRateLimitBucket) \{/gm)].map((match) => match[1]);
  assert.deepEqual(models, []);
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
  assert.ok(migrations.includes("0041_commercial_core_legacy_connector_cleanup"));
  assert.equal(migrations.at(-1), "0043_article_learning_center");
  assert.match(source("prisma/migrations/0021_partner_ops_work_bridge_01/migration.sql"), /CREATE TABLE "oauthClient"/);
  assert.match(source("docs/06_Operations/Commercial-Core-PR5-MCP-Extraction-Retirement.md"), /513 connector-storage rows|storage contains 11 historical connector clients/);
  const scripts = (JSON.parse(source("package.json")) as { scripts: Record<string, string> }).scripts;
  assert.equal(scripts["commercial-core:pr5:projection"], undefined);
  assert.equal(existsSync(join(root, "scripts/commercial-core-pr5-mcp-retirement-projection.ts")), false);
});

test("release documentation records both detected external connectors and exact retirement order", () => {
  const decision = source("docs/06_RFC/RFC-051-MCP-Extraction-and-Retirement.md");
  const runbook = source("docs/06_Operations/Commercial-Core-PR5-MCP-Extraction-Retirement.md");
  const currentState = source("docs/CURRENT_STATE.md");
  assert.match(decision, /EXTERNAL_CONNECTOR_RETIREMENT_REQUIRED/);
  assert.match(runbook, /MCP_RECENT_USAGE_UNKNOWN/);
  assert.match(runbook, /B4GAMBLE Commercial Operations2/);
  assert.match(runbook, /B4GAMBLE Media GEO3/);
  assert.match(runbook, /410 MEDIA_OPERATIONS_RETIRED/);
  assert.match(runbook, /Founder Office subsequently\s+removed both registrations/);
  assert.match(runbook, /313b18bfff5db98d7e66b16088ec3ed8537fc299/);
  assert.match(runbook, /dpl_Ethqm2TdoiCDvKoEF5rVZUdiR8o7/);
  assert.match(runbook, /175 plans and 56 batches/);
  assert.match(runbook, /deliberate cross-namespace replay|deliberately replayed/i);
  assert.match(runbook, /intentionally unsupported/);
  assert.doesNotMatch(runbook, /Media connector.*UNKNOWN/is);
  assert.match(currentState, /EXTERNAL CONNECTORS COMPLETE/);
  assert.match(currentState, /B4GAMBLE Commercial Operations2[\s\S]*B4GAMBLE Media GEO3/);
});
