import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function filesUnder(path: string): string[] {
  return readdirSync(path).flatMap((entry) => {
    const candidate = join(path, entry);
    return statSync(candidate).isDirectory() ? filesUnder(candidate) : [candidate];
  });
}

const orchestratorFiles = filesUnder("lib/learn-content-orchestrator").filter((path) => path.endsWith(".ts"));
const orchestrator = orchestratorFiles.map(read).join("\n");
const provider = read("lib/learn-content-orchestrator/openai-managed-session.server.ts");
const publisher = read("lib/learn-content-orchestrator/mcp-publisher.server.ts");
const state = read("lib/learn-content-orchestrator/state-repository.server.ts");
const context = read("lib/learn-content-orchestrator/safe-context.server.ts");
const prompts = read("lib/learn-content-orchestrator/prompts.ts");
const route = read("app/api/internal/cron/learn-content/route.ts");
const schema = read("prisma/schema.prisma");
const packageJson = JSON.parse(read("package.json")) as { dependencies: Record<string, string>; scripts: Record<string, string> };

test("the cron route is a server-only boundary and never imports Prisma", () => {
  assert.match(route, /createLearnContentCronHandler/);
  assert.match(route, /runtime = "nodejs"/);
  assert.doesNotMatch(route, /Prisma|@prisma|OPENAI_API_KEY|LEARN_MCP_SERVICE_TOKEN/);
});

test("the Managed Agents session has only no-environment, programmatic, and live-web tools", () => {
  assert.match(provider, /environment: \{ type: "none" \}/);
  assert.match(provider, /type: "programmatic_tool_calling"/);
  assert.match(provider, /type: "web_search", mode: "live"/);
  assert.match(provider, /multi_agent: \{ enabled: true, max_concurrent_subagents: 3 \}/);
  assert.doesNotMatch(provider, /type: "mcp"|agent_id|LEARN_MCP|learn_apply|serviceToken/);
});

test("the model never receives private, Programme-runtime, analytics, or commercial imports", () => {
  assert.doesNotMatch(orchestrator, /@\/lib\/(?:programme|customers?|analytics|affiliate|affiliate-commercial|commercial|email|auth|media)(?:\/|"|')/);
  assert.doesNotMatch(context, /UserProgress|ProgrammeProgress|ProgrammePause|AnonymousProgramme|AffiliateOffer|TrackingLink|OutboundClick|Customer/);
  assert.match(context, /status: EditorialStatus\.PUBLISHED/);
  assert.doesNotMatch(context, /bodyBlocks: true|excerpt: true|createdBy: true|updatedBy: true/);
});

test("the separated role prompt names exactly the three authorized roles and caps rewrites", () => {
  for (const name of ["B4GAMBLE SEO Growth Lead", "B4GAMBLE Research + Content", "B4GAMBLE Editor + Publisher"]) {
    assert.match(read("lib/learn-content-orchestrator/contracts.ts") + prompts, new RegExp(name.replaceAll("+", "\\+")));
  }
  assert.match(prompts, /at most two rewrite rounds/i);
  assert.match(prompts, /never directly mutate Production, call publication tools, or publish/i);
  assert.match(prompts, /application, not any model, is the only publication authority/i);
  assert.match(prompts, /protected \/help or \/responsible-gambling/);
  assert.match(prompts, /inherit this session's configured model and high reasoning effort/i);
  assert.match(prompts, /Wait for SEO_HANDOFF before creating any other role/);
  assert.match(prompts, /NO_OP must have exactly the single SEO trace/);
  assert.match(prompts, /bounded taxonomy-wide opportunity scan/i);
  assert.match(prompts, /single overlapping or weak candidate must never end the scan/i);
  assert.match(prompts, /Do not expose candidate deliberation or chain-of-thought/i);
  assert.match(read("lib/learn-content-orchestrator/openai-managed-session.server.ts"), /item\.model === session\.agent\.model/);
});

test("only the deterministic MCP publisher can call the sole learn_apply tool", () => {
  assert.equal((publisher.match(/callTool\(/g) ?? []).length, 1);
  assert.match(publisher, /name: "learn_apply"/);
  assert.match(publisher, /tools\.tools\.length !== 1/);
  assert.match(publisher, /learnApplyToolResultSchema\.parse/);
  assert.equal(orchestratorFiles.filter((path) => path !== "lib/learn-content-orchestrator/mcp-publisher.server.ts").map(read).join("\n").includes("callTool("), false);
});

test("publication input is validated through the actual RFC-052 LearnApply schema", () => {
  const contracts = read("lib/learn-content-orchestrator/contracts.ts");
  const learnApplyContract = read("lib/learn-apply/contract.ts");
  const articleService = read("lib/services/article.service.ts");
  const autonomousApply = articleService.slice(
    articleService.indexOf("async applyPublishedDocument"),
    articleService.indexOf("async isImageUrlReferenced"),
  );
  assert.match(contracts, /import\s*\{[^}]*learnApplyInputSchema[^}]*\}\s*from "@\/lib\/learn-apply\/contract"/);
  assert.match(contracts, /learnApply: learnApplyInputSchema/);
  assert.match(learnApplyContract, /articleId: z\.null\(\)/);
  assert.match(learnApplyContract, /expectedUpdatedAt: z\.null\(\)/);
  assert.doesNotMatch(learnApplyContract, /operation: z\.enum\(\["CREATED", "UPDATED"/);
  assert.match(autonomousApply, /tx\.article\.create/);
  assert.doesNotMatch(autonomousApply, /tx\.article\.update|contentRevision\.create|UPDATED/);
  assert.match(prompts, /Existing Articles are never autonomous update targets/);
  assert.match(read("lib/mcp/learn/server.ts"), /updates are not supported/);
  assert.match(read("lib/mcp/learn/server.ts"), /destructiveHint: false/);
  assert.match(read("lib/learn-content-orchestrator/service.server.ts"), /!published\.error\.retryable/);
  assert.match(read("lib/learn-content-orchestrator/service.server.ts"), /result !== "LIVE"|result\.result !== "LIVE"/);
  assert.match(read("lib/learn-content-orchestrator/service.server.ts"), /persistence !== "COMMITTED"/);
  assert.match(read("lib/learn-content-orchestrator/service.server.ts"), /status !== "PUBLISHED"/);
});

test("operational state is one bounded SiteSetting and contains no prose payload field", () => {
  assert.match(state, /learn-content-orchestrator:v1|LEARN_CONTENT_STATE_KEY/);
  assert.match(state, /LEARN_CONTENT_MAX_STATE_BYTES/);
  assert.match(state, /pg_try_advisory_xact_lock/);
  assert.match(state, /TransactionIsolationLevel\.Serializable/);
  assert.doesNotMatch(state, /prompt|reasoning|contentPackage|seoHandoff|learnApply|articleBody|rawOutput/);
});

test("the orchestrator adds no model, table, entity, queue, or migration", () => {
  assert.doesNotMatch(schema, /model LearnContent|model ContentOrchestrator|LearnContentRun|LearnContentQueue/);
  assert.equal((schema.match(/^model Article \{/gm) ?? []).length, 1);
  assert.equal((schema.match(/^model ContentRevision \{/gm) ?? []).length, 1);
  assert.equal((schema.match(/^model AuditLog \{/gm) ?? []).length, 1);
  assert.equal((schema.match(/^model SiteSetting \{/gm) ?? []).length, 1);
  assert.equal(readdirSync("prisma/migrations").some((name) => /learn.*content|orchestrat/i.test(name)), false);
});

test("Vercel has exactly one hourly Learn orchestrator cron", () => {
  const vercel = JSON.parse(read("vercel.json")) as { crons: Array<{ path: string; schedule: string }> };
  const matches = vercel.crons.filter((cron) => cron.path === "/api/internal/cron/learn-content");
  assert.deepEqual(matches, [{ path: "/api/internal/cron/learn-content", schedule: "13 * * * *" }]);
});

test("all autonomous switches and secret boundaries are documented as server-only env configuration", () => {
  const env = read(".env.example");
  for (const name of [
    "LEARN_CONTENT_AUTONOMY_ENABLED",
    "LEARN_CONTENT_LOCALES",
    "LEARN_CONTENT_MIN_INTERVAL_HOURS",
    "LEARN_CONTENT_OPENAI_MODEL",
    "LEARN_MCP_ENABLED",
    "LEARN_MCP_SERVICE_TOKEN",
    "LEARN_MCP_ACTOR_ID",
    "OPENAI_API_KEY",
    "CRON_SECRET",
  ]) assert.match(env, new RegExp(`^${name}=`, "m"));
  assert.doesNotMatch(env, /^NEXT_PUBLIC_(?:OPENAI|LEARN|CRON)/m);
});

test("the official OpenAI SDK is pinned and the orchestrator suites are wired into CI", () => {
  assert.equal(packageJson.dependencies.openai, "7.20.0");
  assert.match(packageJson.scripts["ci:quality"], /learn-content-orchestrator:test/);
  assert.match(packageJson.scripts["learn-content-orchestrator:test"], /learn-content-orchestrator-structural\.test\.ts/);
  assert.match(read(".github/workflows/ci.yml"), /learn-content-orchestrator:postgres-test/g);
  assert.equal((read(".github/workflows/ci.yml").match(/learn-content-orchestrator:postgres-test/g) ?? []).length, 2);
});

test("RFC-053 is ACTIVE and the registry counts include it accurately", () => {
  const rfc = read("docs/06_RFC/RFC-053-Autonomous-Learn-Content-Orchestration.md");
  const registry = read("docs/06_RFC/README.md");
  assert.match(rfc, /\*\*Status:\*\* `ACTIVE`/);
  assert.match(rfc, /supersedes RFC-027's no-autonomy\/no-schedule\/no-/i);
  assert.match(rfc, /RFC-052 remains the sole Article mutation authority/);
  assert.match(registry, /RFC-053 — Autonomous Learn Content Orchestration/);
  assert.match(registry, /\| `ACTIVE` \| 29 \|/);
  assert.match(registry, /\| \*\*Total RFC artifacts\*\* \| \*\*53\*\* \|/);
});

test("no autonomous Learn code appears in a browser component or public route", () => {
  for (const path of orchestratorFiles) assert.ok(path.startsWith("lib/learn-content-orchestrator/"));
  assert.equal(existsSync("components/learn-content-orchestrator"), false);
  assert.equal(existsSync("app/(public)/learn-content-orchestrator"), false);
});
