import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { parseCasinoIngestionBundle, type CasinoIngestionBundle } from "../lib/casino-ingestion/contract";
import { deterministicCasinoIngestionId, planCasinoIngestion } from "../lib/casino-ingestion/importer";
import { verifyCasinoIngestionSources } from "../lib/casino-ingestion/source-verification";
import { assertCasinoIngestionWriteAuthority } from "../lib/casino-ingestion/write-guard";

async function loadBundle() {
  return parseCasinoIngestionBundle(JSON.parse(await readFile(path.join(process.cwd(), "data/casino-ingestion/betsson-pe-se.v1.json"), "utf8")));
}

test("explicit Betsson bundle maps one global Casino and independent PE/SE profiles", async () => {
  const bundle = await loadBundle();
  const plan = planCasinoIngestion(bundle);
  assert.equal(bundle.casino.slug, "betsson");
  assert.deepEqual(plan.markets, ["PE", "SE"]);
  assert.deepEqual(plan.planned, {
    casinos: 1,
    marketProfiles: 2,
    licenses: 3,
    licenseEvidence: 4,
    payments: 22,
    bonuses: 2,
    providers: 0,
    categories: 14,
    marketEvidence: 24,
    commercialWrites: 0,
  });
  const pe = bundle.markets.find((market) => market.countryCode === "PE")!;
  const se = bundle.markets.find((market) => market.countryCode === "SE")!;
  assert.equal(pe.primaryCurrency, "PEN");
  assert.equal(se.primaryCurrency, "SEK");
  assert.equal(pe.payments.some((payment) => payment.key === "yape"), true);
  assert.equal(se.payments.some((payment) => payment.key === "swish"), true);
  assert.equal(pe.payments.some((payment) => payment.key === "swish"), false);
  assert.equal(se.payments.some((payment) => payment.key === "yape"), false);
});

test("Peru canonical licence and operator-published contradiction are both preserved", async () => {
  const pe = (await loadBundle()).markets.find((market) => market.countryCode === "PE")!;
  assert.deepEqual(pe.licenses.map((license) => license.licenseNumber).sort(), ["11002586010000", "21002586010000"]);
  assert.equal(pe.licenses.some((license) => license.licenseNumber === "21002586020000"), false);
  const contradiction = pe.evidence.find((evidence) => evidence.key === "pe-site-conflict")!;
  assert.equal(contradiction.classification, "CONTRADICTION");
  assert.match(contradiction.notes ?? "", /21002586010000/);
  assert.match(contradiction.notes ?? "", /21002586020000/);
  assert.match(contradiction.notes ?? "", /Betsafe/);
  assert.equal(pe.evidence.some((evidence) => evidence.sourceType === "OFFICIAL_TERMS"), true);
});

test("commercial mapping is report-only and fail-closed", async () => {
  const bundle = await loadBundle();
  assert.deepEqual(bundle.commercialMappings.map((entry) => [entry.countryCode, entry.routeSetupId]), [["PE", "9721"], ["SE", "38112"]]);
  assert.equal(bundle.commercialMappings.every((entry) => entry.productionEligible === false && entry.trackingVerifiedEndToEnd === false), true);
  assert.equal(planCasinoIngestion(bundle).planned.commercialWrites, 0);
});

test("write authority requires an explicit loopback _ci target and rejects Production", () => {
  const valid = {
    writeRequested: true,
    confirmation: "CASINO_DATA_INGEST_02",
    databaseUrl: "postgresql://user:secret@127.0.0.1:54329/casino_ingest_ci",
    directUrl: "postgresql://user:secret@127.0.0.1:54329/casino_ingest_ci",
    ci: "true",
    nodeEnv: "test",
    vercelEnv: undefined,
  };
  assert.deepEqual(assertCasinoIngestionWriteAuthority({ ...valid, writeRequested: false }), { mode: "DRY_RUN" });
  assert.deepEqual(assertCasinoIngestionWriteAuthority(valid), { mode: "WRITE", target: "127.0.0.1:54329/casino_ingest_ci" });
  assert.throws(() => assertCasinoIngestionWriteAuthority({ ...valid, databaseUrl: "postgresql://user:secret@db.example.com/prod" }), /loopback/);
  assert.throws(() => assertCasinoIngestionWriteAuthority({ ...valid, databaseUrl: "postgresql://user:secret@127.0.0.1/casino_ingest", directUrl: "postgresql://user:secret@127.0.0.1/casino_ingest" }), /_ci/);
  assert.throws(() => assertCasinoIngestionWriteAuthority({ ...valid, vercelEnv: "production" }), /Production/);
  assert.throws(() => assertCasinoIngestionWriteAuthority({ ...valid, confirmation: undefined }), /confirm-disposable/);
});

test("deterministic IDs are stable and source verification checks only declared paths", async () => {
  assert.equal(deterministicCasinoIngestionId("betsson:market:PE"), deterministicCasinoIngestionId("betsson:market:PE"));
  assert.notEqual(deterministicCasinoIngestionId("betsson:market:PE"), deterministicCasinoIngestionId("betsson:market:SE"));
  const root = await mkdtemp(path.join(os.tmpdir(), "casino-ingestion-source-"));
  try {
    const content = "frozen evidence\n";
    await writeFile(path.join(root, "evidence.json"), content);
    const bundle = await loadBundle();
    const verificationBundle: CasinoIngestionBundle = {
      ...bundle,
      sourceFiles: [{ path: "evidence.json", sha256: createHash("sha256").update(content).digest("hex") }],
    };
    assert.equal((await verifyCasinoIngestionSources(verificationBundle, root)).verified, 1);
    await writeFile(path.join(root, "evidence.json"), "changed\n");
    await assert.rejects(() => verifyCasinoIngestionSources(verificationBundle, root), /checksum mismatch/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
