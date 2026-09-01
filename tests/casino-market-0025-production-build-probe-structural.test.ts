import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const roots = [
  "scripts/casino-market-0025-production-build-probe.ts",
  "lib/db/casino-market-0025-production-build-probe.ts",
];
const mutationSql = /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/i;
const mutationCommand = /\bprisma\s+(?:migrate\s+deploy|db\s+(?:push|execute))\b/i;
const mutationModule = /casino-market-0025-operator|(?:^|\/)seed(?:-|\/)|import-bundle|affiliate.*(?:repository|service)|asset.*(?:publish|upload)/i;

function resolveModule(fromFile: string, specifier: string) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return null;
  const base = specifier.startsWith("@/")
    ? path.resolve(specifier.slice(2))
    : path.resolve(path.dirname(fromFile), specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.mjs`, path.join(base, "index.ts")]) {
    if (existsSync(candidate)) return path.relative(process.cwd(), candidate);
  }
  throw new Error(`Unable to resolve build-probe dependency ${specifier} from ${fromFile}`);
}

function propertyName(node: ts.LeftHandSideExpression | ts.Expression) {
  return ts.isPropertyAccessExpression(node) ? node.name.text : null;
}

function literalText(node: ts.Node) {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join("?");
  }
  return null;
}

function importedSpecifiers(sourceFile: ts.SourceFile) {
  const specifiers: string[] = [];
  sourceFile.forEachChild(function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      const value = literalText(node.moduleSpecifier);
      if (value) specifiers.push(value);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const value = node.arguments[0] && literalText(node.arguments[0]);
      if (value) specifiers.push(value);
    }
    ts.forEachChild(node, visit);
  });
  return specifiers;
}

function inspectExecutableNodes(file: string, sourceFile: ts.SourceFile) {
  sourceFile.forEachChild(function visit(node) {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      const specifier = literalText(node.moduleSpecifier) ?? "";
      assert.doesNotMatch(specifier, mutationModule, `${file} imports mutation-capable module ${specifier}`);
    }

    if (ts.isTaggedTemplateExpression(node)) {
      const method = propertyName(node.tag);
      const sql = literalText(node.template);
      if (method === "$executeRaw") {
        assert.equal(sql?.trim(), "SET TRANSACTION READ ONLY", `${file} contains a non-control executeRaw statement`);
      }
      if ((method === "$executeRaw" || method === "$queryRaw") && sql) {
        assert.doesNotMatch(sql, mutationSql, `${file} contains mutation SQL`);
      }
    }

    if (ts.isCallExpression(node)) {
      const method = propertyName(node.expression);
      const executableText = node.arguments.map((argument) => literalText(argument) ?? "").join(" ");
      if (method === "$executeRawUnsafe") {
        assert.match(
          executableText.trim(),
          /^SET (?:TRANSACTION READ ONLY|LOCAL (?:statement_timeout|lock_timeout|idle_in_transaction_session_timeout) = '\?')$/,
          `${file} contains unsafe executable SQL`,
        );
      }
      if (["$executeRaw", "$executeRawUnsafe", "$queryRaw", "$queryRawUnsafe"].includes(method ?? "")) {
        assert.doesNotMatch(executableText, mutationSql, `${file} contains mutation SQL`);
      }
      if (ts.isIdentifier(node.expression) && /^(?:spawn|spawnSync|exec|execFile|execSync)$/.test(node.expression.text)) {
        assert.doesNotMatch(executableText, mutationCommand, `${file} invokes a database mutation command`);
      }
    }

    ts.forEachChild(node, visit);
  });
}

test("the executable Vercel build-probe dependency graph is read-only", () => {
  const pending = [...roots];
  const graph = new Set<string>();
  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || graph.has(file)) continue;
    graph.add(file);
    const source = readFileSync(file, "utf8");
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    inspectExecutableNodes(file, sourceFile);
    for (const specifier of importedSpecifiers(sourceFile)) {
      assert.doesNotMatch(specifier, mutationModule, `${file} depends on mutation-capable module ${specifier}`);
      const dependency = resolveModule(file, specifier);
      if (dependency) pending.push(dependency);
    }
  }

  assert.ok(graph.has("lib/db/casino-market-0025-production-build-probe.ts"));
  assert.ok(graph.has("scripts/casino-market-0025-production-build-probe.ts"));
  assert.ok(graph.has("lib/db/casino-market-0025-release.ts"));
  assert.ok(graph.has("lib/db/casino-market-0025-admin-client.ts"));
  assert.ok(graph.has("lib/db/vercel-database-readiness.ts"));
  assert.equal([...graph].some((file) => /casino-market-0025-operator/.test(file)), false);
  assert.equal([...graph].some((file) => /production-migration-executor/.test(file)), false);
});

test("Vercel preflight selects mutually exclusive explicit modes and has no automatic execution input", () => {
  const preflight = readFileSync("scripts/vercel-build-preflight.ts", "utf8");
  const mode = readFileSync("lib/db/casino-market-0025-build-mode.ts", "utf8");
  assert.match(preflight, /casinoMarketBuildMode === "read-only-probe"/);
  assert.match(preflight, /casinoMarketBuildMode === "migration-execution"/);
  assert.match(preflight, /runCasinoMarket0025ProductionBuildProbeAndStop/);
  assert.match(preflight, /runCasinoMarket0025ProductionMigrationAndStop/);
  assert.match(mode, /build modes are mutually exclusive/);
  assert.match(mode, /CASINO_MARKET_0025_EXECUTE_PRODUCTION_0025/);
  assert.doesNotMatch(preflight, /CASINO_MARKET_0025_EXECUTION_AUTHORITY\s*=/);
});

test("both attended launchers pin the shared project and never link or discover a project", () => {
  const probeLauncher = readFileSync("scripts/casino-market-0025-production-build-probe.ts", "utf8");
  const migrationLauncher = readFileSync("scripts/casino-market-0025-production-migrate.ts", "utf8");
  const target = readFileSync("lib/db/casino-market-0025-vercel-target.ts", "utf8");
  for (const launcher of [probeLauncher, migrationLauncher]) {
    assert.match(launcher, /casinoMarket0025VercelChildEnvironment\(process\.env\)/);
    assert.match(launcher, /CASINO_MARKET_0025_VERCEL_PROJECT_ID/);
    assert.doesNotMatch(launcher, /vercel\s+link|["']link["']|\.vercel\/project\.json/i);
  }
  assert.match(target, /team_WhkUGuXZeIMlU1uFHtowNUqa/);
  assert.match(target, /prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb/);
});
