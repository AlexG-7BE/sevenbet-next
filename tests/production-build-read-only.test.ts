import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const directBusinessMutation = /\b(?:prisma|transaction|tx)\.[A-Za-z][A-Za-z0-9]*\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/;
const mutatingSql = /\b(?:INSERT\s+INTO|UPDATE\s+"|DELETE\s+FROM|ALTER\s+TABLE|CREATE\s+TABLE|DROP\s+TABLE)\b/i;

test("canonical Vercel build is an explicit read-only compatibility gate", () => {
  const vercel = JSON.parse(read("vercel.json")) as { buildCommand: string };
  assert.deepEqual(vercel.buildCommand.split(" && "), [
    "tsx scripts/vercel-build-preflight.ts",
    "tsx scripts/logo-only-media-build-preflight.ts production-verify",
    "tsx scripts/casino-real-catalog-03.ts production-verify",
    "next build",
  ]);

  assert.doesNotMatch(vercel.buildCommand, /gp-meta\.ts/);
  assert.doesNotMatch(vercel.buildCommand, /casino-real-catalog-03\.ts build-preflight/);
  assert.doesNotMatch(vercel.buildCommand, /\b(?:reconcile|repair|seed|ingest|publish)\b/i);
  assert.doesNotMatch(vercel.buildCommand, /prisma\s+migrate\s+deploy/i);
});

test("Production verifiers skip isolated Preview data but execute in Production", () => {
  const catalog = read("scripts/casino-real-catalog-03.ts");
  const logo = read("scripts/logo-only-media-build-preflight.ts");
  for (const source of [catalog, logo]) {
    assert.match(source, /"production-verify"/);
    assert.match(source, /process\.env\.VERCEL_ENV !== "production"/);
  }
  assert.match(catalog, /mode === "build-preflight" \|\| mode === "production-verify"/);
  assert.match(logo, /\["build-preflight", "production-verify"\]\.includes\(mode\)/);

  for (const script of [
    "scripts/logo-only-media-build-preflight.ts",
    "scripts/casino-real-catalog-03.ts",
  ]) {
    const result = spawnSync(process.execPath, ["--import", "tsx", script, "production-verify"], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        VERCEL_ENV: "preview",
        DATABASE_URL: "postgresql://invalid:invalid@127.0.0.1:1/invalid",
        DIRECT_URL: "postgresql://invalid:invalid@127.0.0.1:1/invalid",
      },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /"skipped":true/);
  }
});

test("catalog and logo build verification are PostgreSQL-enforced read-only paths", () => {
  const catalog = read("scripts/casino-real-catalog-03.ts");
  const catalogVerify = catalog.slice(
    catalog.indexOf("async function verifyState"),
    catalog.indexOf("async function main"),
  );
  const safeOffer = read("lib/casino-offer-corpus/safe-offer-corpus.ts");
  const safeOfferVerify = safeOffer.slice(safeOffer.indexOf("export async function verifySafeOfferCorpusInTransaction"));
  const logo = read("scripts/logo-only-media-build-preflight.ts");

  assert.match(catalogVerify, /SET TRANSACTION READ ONLY/);
  assert.match(catalogVerify, /SHOW transaction_read_only/);
  assert.match(catalogVerify, /verifySafeOfferCorpusInTransaction\(transaction\)/);
  assert.match(catalogVerify, /Founder score\/order mismatch|score mismatch/);
  assert.match(catalogVerify, /is not published/);
  assert.match(catalogVerify, /missing market/);
  assert.match(catalogVerify, /published bonus snapshot count mismatch/);
  assert.match(catalogVerify, /StarCasino must not gain an active MarketActivation/);
  assert.doesNotMatch(catalogVerify, directBusinessMutation);
  assert.doesNotMatch(catalogVerify, /\b(?:ingestFactualBundles|syncCasino|syncEditorial|reconcileSafeOfferCorpusInTransaction)\s*\(/);

  assert.match(safeOfferVerify, /findUnique\(/);
  assert.doesNotMatch(safeOfferVerify, directBusinessMutation);
  assert.doesNotMatch(safeOfferVerify, mutatingSql);

  assert.match(logo, /SET TRANSACTION READ ONLY/);
  assert.match(logo, /SHOW transaction_read_only/);
  assert.doesNotMatch(logo, directBusinessMutation);
  assert.doesNotMatch(logo, mutatingSql);
});

test("Vercel schema and compatibility preflight has no migration or business-data writer", () => {
  const preflight = read("scripts/vercel-build-preflight.ts");
  const activationAudit = read("lib/casino-commercial-activation/production-release.ts");
  const casinoMarket = read("lib/db/casino-market-0025-release.ts");
  const commercialPlatform = read("lib/db/commercial-platform-0026-release.ts");
  const transitiveDatabaseChecks = [activationAudit, casinoMarket, commercialPlatform].join("\n");

  assert.match(preflight, /verifyVercelBuildCompatibility/);
  assert.match(preflight, /SET TRANSACTION READ ONLY/);
  assert.match(preflight, /SHOW transaction_read_only/);
  assert.doesNotMatch(preflight, directBusinessMutation);
  assert.doesNotMatch(preflight, mutatingSql);
  assert.doesNotMatch(preflight, /prisma\s+migrate\s+deploy/i);

  assert.match(activationAudit, /SET TRANSACTION READ ONLY/);
  assert.match(casinoMarket, /SET TRANSACTION READ ONLY/);
  assert.match(commercialPlatform, /SET TRANSACTION READ ONLY/);
  assert.doesNotMatch(transitiveDatabaseChecks, directBusinessMutation);
  assert.doesNotMatch(transitiveDatabaseChecks, mutatingSql);
});

test("known historical repair and reconciliation writers cannot regain build authority", () => {
  const vercel = JSON.parse(read("vercel.json")) as { buildCommand: string };
  const goldenPlayRepair = read("scripts/gp-meta.ts");
  const catalog = read("scripts/casino-real-catalog-03.ts");

  assert.match(goldenPlayRepair, /prisma\.affiliateTrackingLink\.update\(/);
  assert.match(catalog, /async function ingestFactualBundles/);
  assert.match(catalog, /reconcileSafeOfferCorpusInTransaction/);
  assert.match(catalog, /casinoService\.publishCasino/);
  assert.match(catalog, /prisma\.auditLog\.create/);
  assert.equal(vercel.buildCommand.includes("scripts/gp-meta.ts"), false);
  assert.equal(vercel.buildCommand.includes("scripts/casino-real-catalog-03.ts build-preflight"), false);
});

test("Next build keeps database-backed application routes dynamic", () => {
  assert.match(read("app/layout.tsx"), /export const dynamic = "force-dynamic"/);
  assert.match(read("app/sitemap.ts"), /export const dynamic = "force-dynamic"/);
});
