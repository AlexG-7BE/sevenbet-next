import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

async function sourceText(): Promise<string> {
  const sourceDirectory = join(packageRoot, "src");
  const files = (await readdir(sourceDirectory)).filter((file) =>
    file.endsWith(".ts"),
  );
  const contents = await Promise.all(
    files.map((file) => readFile(join(sourceDirectory, file), "utf8")),
  );

  return contents.join("\n");
}

test("package dependencies contain no database, framework, or external integration", async () => {
  const manifest = JSON.parse(
    await readFile(join(packageRoot, "package.json"), "utf8"),
  ) as { dependencies?: Record<string, string> };

  assert.deepEqual(Object.keys(manifest.dependencies ?? {}).sort(), [
    "@openai/agents",
    "zod",
  ]);
});

test("agent source has no forbidden consumer, Prisma, write-tool, or schedule imports", async () => {
  const source = await sourceText();

  assert.doesNotMatch(source, /from ["'](?:@\/|\.\.\/\.\.\/)(?:app|components|lib|prisma)\//);
  assert.doesNotMatch(source, /@prisma\/client|github|gmail|calendar|semrush|ahrefs|slack/i);
  assert.doesNotMatch(source, /webSearchTool|shellTool|applyPatchTool|computerTool/);
  assert.doesNotMatch(source, /cron|schedule/i);
});

test("runner fixes the no-tool, no-handoff, no-retry, no-store, no-trace boundary", async () => {
  const runner = await readFile(join(packageRoot, "src", "runner.ts"), "utf8");

  assert.match(runner, /tools: \[\]/);
  assert.match(runner, /handoffs: \[\]/);
  assert.match(runner, /maxRetries: 0/);
  assert.match(runner, /store: false/);
  assert.match(runner, /tracingDisabled: true/);
  assert.match(runner, /traceIncludeSensitiveData: false/);
});

test("no source or fixture contains an assigned OpenAI API key", async () => {
  const source = await sourceText();
  const fixture = await readFile(
    join(packageRoot, "fixtures", "live-smoke", "compliance-neutral.json"),
    "utf8",
  ).catch(() => "");

  assert.doesNotMatch(`${source}\n${fixture}`, /OPENAI_API_KEY\s*=/);
  assert.doesNotMatch(`${source}\n${fixture}`, /sk-[A-Za-z0-9_-]{12,}/);
});
