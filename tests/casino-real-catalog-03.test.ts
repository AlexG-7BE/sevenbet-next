import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const corpus = JSON.parse(read("data/casino-real-catalog-03/catalog.v1.json")) as {
  release: string;
  commercialAuthority: boolean;
  entries: Array<{ slug: string; score: number; markets: string[]; publicationMode?: string }>;
  uploadedArchiveFinding: string;
};

const expected = [
  ["inkabet", 9.0],
  ["betsafe", 8.8],
  ["starcasino", 8.7],
  ["supercasino", 8.6],
  ["nordicbet", 8.5],
  ["rizk", 8.4],
] as const;

const bundlePaths = [
  "data/casino-ingestion/betsafe-ee-lv.v1.json",
  "data/casino-ingestion/inkabet-pe.v1.json",
  "data/casino-ingestion/nordicbet-se.v1.json",
  "data/casino-ingestion/rizk-ca.v1.json",
  "data/casino-ingestion/rizk-rs.v1.json",
  "data/casino-ingestion/starcasino-it.v1.json",
  "data/casino-ingestion/supercasino-nz.v1.json",
];

test("CASINO-REAL-CATALOG-03 has exactly the six Founder-approved scores in descending order", () => {
  assert.equal(corpus.release, "CASINO-REAL-CATALOG-03");
  assert.deepEqual(corpus.entries.map(({ slug, score }) => [slug, score]), expected.map(([slug, score]) => [slug, score]));
  assert.ok(corpus.entries.every(({ score }) => Number.isInteger(score * 10)));
});

test("release has no commercial authority and does not force curated flags", () => {
  assert.equal(corpus.commercialAuthority, false);
  const source = read("scripts/casino-real-catalog-03.ts");
  assert.match(source, /commercialMappings\.length !== 0/);
  assert.match(source, /featured: false/);
  assert.match(source, /recommended: false/);
  assert.match(source, /commercialReferralAuthority: false/);
  assert.doesNotMatch(source, /productionEligible\s*:\s*true/);
});

test("Rizk NZ contradictory profile is withheld from runtime release", () => {
  const rizk = corpus.entries.find(({ slug }) => slug === "rizk");
  assert.ok(rizk);
  assert.deepEqual(rizk.markets, ["CA", "RS"]);
  assert.ok(!bundlePaths.includes("data/casino-ingestion/rizk-nz.v1.json"));
  assert.match(read("scripts/casino-real-catalog-03.ts"), /Rizk NZ must remain excluded/);
});

test("StarCasino is informational-only and cannot gain a release-created outbound route", () => {
  const star = corpus.entries.find(({ slug }) => slug === "starcasino");
  assert.equal(star?.publicationMode, "INFORMATIONAL_ONLY");
  const source = read("scripts/casino-real-catalog-03.ts");
  assert.match(source, /StarCasino must remain noindex informational-only/);
  assert.match(source, /StarCasino must not gain an outbound route/);
});

test("all release ingestion bundles contain zero commercial mappings", () => {
  for (const bundlePath of bundlePaths) {
    const bundle = JSON.parse(read(bundlePath)) as { commercialMappings?: unknown[] };
    assert.deepEqual(bundle.commercialMappings, [], bundlePath);
  }
});

test("the supplied archive finding prevents corporate BGA art being mislabelled as a casino logo", () => {
  assert.match(corpus.uploadedArchiveFinding, /only the Betsson Group Affiliates corporate logo/i);
  assert.match(corpus.uploadedArchiveFinding, /not suitable as a casino brand logo/i);
});

test("production mutation is bounded to Vercel production after the existing database preflight", () => {
  const releaseSource = read("scripts/casino-real-catalog-03.ts");
  const vercel = JSON.parse(read("vercel.json")) as { buildCommand: string };
  assert.match(releaseSource, /process\.env\.VERCEL_ENV !== "production"/);
  assert.ok(vercel.buildCommand.indexOf("scripts/vercel-build-preflight.ts") < vercel.buildCommand.indexOf("scripts/casino-real-catalog-03.ts build-preflight"));
});
