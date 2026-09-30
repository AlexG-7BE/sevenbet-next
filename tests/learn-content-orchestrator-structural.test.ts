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

const runtimeFiles = ["app", "components", "lib"]
  .flatMap(filesUnder)
  .filter((path) => /\.(?:tsx|ts|mjs|js)$/.test(path))
  .concat(["middleware.ts"]);
const orchestratorFiles = filesUnder("lib/learn-content-orchestrator").filter((path) => path.endsWith(".ts")).sort();
const orchestrator = orchestratorFiles.map(read).join("\n");
const route = read("app/api/internal/cron/learn-content/route.ts");
const context = read("lib/learn-content-orchestrator/safe-context.server.ts");
const learnContext = read("lib/learn-content-orchestrator/learn-context.server.ts");
const mcpServer = read("lib/mcp/learn/server.ts");
const schema = read("prisma/schema.prisma");
const packageJson = JSON.parse(read("package.json")) as { dependencies: Record<string, string>; devDependencies?: Record<string, string>; scripts: Record<string, string> };

test("Vercel no longer schedules the Learn editorial cron", () => {
  const vercel = JSON.parse(read("vercel.json")) as { crons: Array<{ path: string; schedule: string }> };
  assert.equal(vercel.crons.some((cron) => cron.path.includes("learn-content")), false);
  assert.deepEqual(vercel.crons.map((cron) => cron.path), [
    "/api/internal/cron/programme-expiry-purge",
    "/api/internal/cron/customer-lifecycle",
  ]);
});

test("the retired cron route imports nothing and can reach no provider, state or publisher", () => {
  assert.doesNotMatch(route, /^\s*import\s/m);
  assert.doesNotMatch(route, /require\(|await import\(|fetch\(|process\.env/);
  assert.match(route, /CHATGPT_SCHEDULER_OWNS_EXECUTION/);
  assert.match(route, /export function GET\(\)/);
  assert.doesNotMatch(route, /export (?:const|async function|function) (?:POST|PUT|PATCH|DELETE)\b/);
});

test("the server-side OpenAI text orchestrator is gone and nothing can recreate a managed session", () => {
  assert.deepEqual(orchestratorFiles, [
    "lib/learn-content-orchestrator/config.ts",
    "lib/learn-content-orchestrator/learn-context.server.ts",
    "lib/learn-content-orchestrator/safe-context.server.ts",
  ]);
  for (const retired of [
    "service.server.ts",
    "openai-managed-session.server.ts",
    "mcp-publisher.server.ts",
    "state-repository.server.ts",
    "model-output-schema.ts",
    "prompts.ts",
  ]) assert.equal(existsSync(`lib/learn-content-orchestrator/${retired}`), false, retired);
  assert.equal(packageJson.dependencies.openai, undefined);
  assert.equal(packageJson.devDependencies?.openai, undefined);
  for (const path of runtimeFiles) {
    const source = read(path);
    assert.doesNotMatch(source, /from ["']openai["']|require\(["']openai["']\)/, path);
    assert.doesNotMatch(source, /agents\.sessions|managed[_ ]session|gpt-6-astra|createLearnContentCronHandler|LEARN_CONTENT_OPENAI_MODEL/i, path);
  }
});

test("no runtime code reads the autonomy switch or writes the retired orchestrator state", () => {
  for (const path of runtimeFiles) {
    const source = read(path);
    assert.doesNotMatch(source, /LEARN_CONTENT_AUTONOMY_ENABLED|LEARN_CONTENT_MIN_INTERVAL_HOURS/, path);
    if (source.includes("LEARN_CONTENT_STATE_KEY")) assert.equal(path, "lib/learn-content-orchestrator/config.ts");
  }
  assert.doesNotMatch(orchestrator, /siteSetting|\$transaction|\.create\(|\.update\(|\.upsert\(|\.delete\(|deleteMany|updateMany|createMany/);
});

test("only the Learn MCP server imports the editorial context, and it adds no second mutation", () => {
  const importers = runtimeFiles.filter((path) => !path.startsWith("lib/learn-content-orchestrator/") && /@\/lib\/learn-content-orchestrator\//.test(read(path)));
  assert.deepEqual(importers, ["lib/mcp/learn/server.ts"]);
  assert.equal((mcpServer.match(/name: "learn_apply"/g) ?? []).length, 1);
  assert.equal((mcpServer.match(/name: "learn_context"/g) ?? []).length, 1);
  assert.match(mcpServer, /tools: \[learnContextTool, learnApplyTool\]/);
  assert.match(mcpServer, /readOnlyHint: true,\s*destructiveHint: false,\s*idempotentHint: true/);
  assert.doesNotMatch(learnContext, /learnApplyService|callTool|articleService|prisma\./);
});

test("the editorial context never reads private, Programme-runtime, analytics or commercial data", () => {
  assert.doesNotMatch(orchestrator, /@\/lib\/(?:programme|customers?|analytics|affiliate|affiliate-commercial|commercial|email|auth|media)(?:\/|"|')/);
  assert.doesNotMatch(context, /UserProgress|ProgrammeProgress|ProgrammePause|AnonymousProgramme|AffiliateOffer|TrackingLink|OutboundClick|Customer/);
  assert.match(context, /status: EditorialStatus\.PUBLISHED/);
  assert.match(context, /take: LEARN_CONTENT_MAX_ARTICLE_INVENTORY \+ 1/);
  assert.match(context, /LEARN_CONTENT_MAX_ARTICLE_INVENTORY = 500/);
  assert.doesNotMatch(context, /bodyBlocks: true|excerpt: true|createdBy: true|updatedBy: true|heroImage|seoDescription/);
  assert.match(learnContext, /learnContextResultSchema\.parse/);
  assert.match(learnContext, /\}\)\.strict\(\)/);
});

test("learn_apply stays create-only and the sole mutation authority", () => {
  const learnApplyContract = read("lib/learn-apply/contract.ts");
  const articleService = read("lib/services/article.service.ts");
  const autonomousApply = articleService.slice(
    articleService.indexOf("async applyPublishedDocument"),
    articleService.indexOf("async isImageUrlReferenced"),
  );
  assert.match(learnApplyContract, /articleId: z\.null\(\)/);
  assert.match(learnApplyContract, /expectedUpdatedAt: z\.null\(\)/);
  assert.doesNotMatch(learnApplyContract, /operation: z\.enum\(\["CREATED", "UPDATED"/);
  assert.match(autonomousApply, /tx\.article\.create/);
  assert.doesNotMatch(autonomousApply, /tx\.article\.update|contentRevision\.create|UPDATED/);
  assert.match(mcpServer, /updates are not supported/);
  assert.match(mcpServer, /destructiveHint: false/);
  assert.match(read("lib/learn-apply/openai-image-adapter.ts"), /DEFAULT_LEARN_OPENAI_IMAGE_MODEL = "gpt-image-2"/);
});

test("the migration adds no model, table, entity, queue or migration", () => {
  assert.doesNotMatch(schema, /model LearnContent|model ContentOrchestrator|LearnContentRun|LearnContentQueue|LearnContext/);
  assert.equal((schema.match(/^model Article \{/gm) ?? []).length, 1);
  assert.equal((schema.match(/^model SiteSetting \{/gm) ?? []).length, 1);
  assert.equal(readdirSync("prisma/migrations").some((name) => /learn.*(?:content|context)|orchestrat/i.test(name)), false);
});

test("environment documentation keeps the launch order and the retired switch server-only", () => {
  const env = read(".env.example");
  for (const name of ["LEARN_CONTENT_AUTONOMY_ENABLED", "LEARN_CONTENT_LOCALES", "LEARN_MCP_ENABLED", "LEARN_MCP_SERVICE_TOKEN", "LEARN_MCP_ACTOR_ID", "OPENAI_API_KEY"]) {
    assert.match(env, new RegExp(`^${name}=`, "m"));
  }
  assert.match(env, /^LEARN_CONTENT_AUTONOMY_ENABLED="false"$/m);
  assert.doesNotMatch(env, /^LEARN_CONTENT_(?:MIN_INTERVAL_HOURS|OPENAI_MODEL)=/m);
  assert.doesNotMatch(env, /^NEXT_PUBLIC_(?:OPENAI|LEARN|CRON)/m);
});

test("the Learn context suites are wired into CI", () => {
  assert.match(packageJson.scripts["ci:quality"], /learn-content-orchestrator:test/);
  assert.match(packageJson.scripts["learn-content-orchestrator:test"], /learn-content-orchestrator-structural\.test\.ts/);
  assert.equal((read(".github/workflows/ci.yml").match(/learn-content-orchestrator:postgres-test/g) ?? []).length, 2);
});

test("RFC-053 records the retirement and the registry counts stay accurate", () => {
  const rfc = read("docs/06_RFC/RFC-053-Autonomous-Learn-Content-Orchestration.md");
  const registry = read("docs/06_RFC/README.md");
  assert.match(rfc, /\*\*Status:\*\* `ACTIVE`/);
  assert.match(rfc, /LEARN-CHATGPT-SCHEDULER-2026-09-30/);
  assert.match(rfc, /PENDING STEP 2 \/ NOT ACTIVE YET/);
  assert.match(rfc, /RFC-052 remains the sole Article mutation authority/);
  assert.match(registry, /RFC-053 — Autonomous Learn Content Orchestration/);
  const rows = [...registry.matchAll(/^\| \[RFC-[^\n]*?\| `(ACTIVE|HISTORICAL|SUPERSEDED|PROPOSED)` \|/gm)].map((row) => row[1]);
  const active = rows.filter((lifecycle) => lifecycle === "ACTIVE").length;
  assert.match(registry, new RegExp(`\\| \`ACTIVE\` \\| ${active} \\|`));
  assert.match(registry, new RegExp(`\\| \\*\\*Total RFC artifacts\\*\\* \\| \\*\\*${rows.length}\\*\\* \\|`));
});

test("no Learn editorial code appears in a browser component or public route", () => {
  for (const path of orchestratorFiles) assert.ok(path.startsWith("lib/learn-content-orchestrator/"));
  assert.equal(existsSync("components/learn-content-orchestrator"), false);
  assert.equal(existsSync("app/(public)/learn-content-orchestrator"), false);
});
