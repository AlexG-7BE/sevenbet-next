import { createHash } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { checkAffiliateRouteHttp } from "../lib/affiliate-health/checker";
import {
  buildCurrentPartnerMatrix,
  currentPartnerMatrixSummary,
  GLOBAL_CURRENT_PARTNER_RELEASE,
} from "../lib/current-partner-rollout/inventory";

const LOCALE_SEO_AUDIT = {
  classification: "DETECTED",
  publishedLocales: ["en-GB", "de-DE", "es-ES", "el-GR", "sv-SE", "da-DK", "it-IT", "pt-PT", "nl-NL", "fi-FI", "nb-NO"],
  frFr: {
    published: false,
    generated: false,
    reason: "fr-FR is absent from the canonical language registry, public-shell catalog, Programme catalog, QA corpus, and Founder publication acceptance evidence; fr-CA remains an unpublished architecture-only locale and is not evidence for fr-FR.",
  },
  seo: {
    newlyIndexablePages: [],
    reason: "The current localized product surfaces remain intentionally noindex under LOCAL_LEGAL_REVIEW_REQUIRED; commercial activation does not override the independent SEO publication review gate.",
  },
} as const;

function matrixDocument() {
  const rows = buildCurrentPartnerMatrix();
  return {
    schemaVersion: 1,
    release: GLOBAL_CURRENT_PARTNER_RELEASE,
    authorityDate: "2026-09-09",
    evidenceAsOf: "2026-09-10",
    classification: "DETECTED_AND_FOUNDER_AUTHORIZED",
    summary: currentPartnerMatrixSummary(rows),
    localeSeoAudit: LOCALE_SEO_AUDIT,
    rows,
  };
}

function parseCsv(source: string) {
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') { field += '"'; index += 1; } else quoted = !quoted;
    } else if (character === "," && !quoted) { row.push(field); field = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some(Boolean)) records.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (field || row.length) { row.push(field); records.push(row); }
  const [headers, ...values] = records;
  return values.map((value) => Object.fromEntries(headers.map((header, index) => [header, value[index] ?? ""])));
}

async function probeLinks() {
  const source = await readFile("research_staging/betsson-network-2026-09-07/direct-links.normalized.csv", "utf8");
  const requestedRows = new Set(process.argv.slice(3).map(Number).filter(Number.isInteger));
  if (!requestedRows.size) throw new Error("Provide one or more direct-link row numbers.");
  const rows = parseCsv(source).filter((row) => requestedRows.has(Number(row.row)));
  const results = [];
  for (const row of rows) {
    const expectedFinalHost = row.brand === "Inkabet" ? "inkabet.pe"
      : row.brand === "Betsafe Baltics" ? (row.countryCode === "EE" ? "offers.betsafe.ee" : "offers.betsafe.lv")
        : row.brand === "NordicBet" ? "nordicbet.com"
          : row.brand === "Rizk" ? (row.countryCode === "RS" ? "rizk.rs" : "rizk.com")
            : row.countryCode === "PE" ? "betsson.pe" : "betsson.com";
    const checked = await checkAffiliateRouteHttp({
      url: new URL(row.trackingUrl),
      expectation: { expectedFinalHost, expectedPathPrefix: null, requiredAttributionParameters: [], allowWwwEquivalentFinalHost: true },
      inspectTerminalContent: true,
    });
    results.push({
      row: Number(row.row),
      brand: row.brand,
      countryCode: row.countryCode || null,
      trackingIdentity: createHash("sha256").update(row.trackingUrl).digest("hex").slice(0, 16),
      ...checked,
    });
  }
  return results;
}

async function writePrivateJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const body = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(path, body, { mode: 0o600 });
  await chmod(path, 0o600);
  return { path, sha256: createHash("sha256").update(body).digest("hex") };
}

async function main() {
  const mode = process.argv[2] ?? "matrix";
  if (mode === "matrix") return matrixDocument();
  if (mode === "probe-links") return probeLinks();

  const { prisma } = await import("../lib/db/prisma");
  const {
    currentPartnerProductionSnapshot,
    runCurrentPartnerReconciliation,
    verifyCurrentPartnerProduction,
  } = await import("../lib/current-partner-rollout/reconciliation");
  try {
    if (mode === "snapshot") {
      const path = process.argv[3] ?? `/private/tmp/${GLOBAL_CURRENT_PARTNER_RELEASE.toLowerCase()}-snapshot.json`;
      return writePrivateJson(path, await currentPartnerProductionSnapshot());
    }
    if (mode === "verify") {
      const verification = await verifyCurrentPartnerProduction();
      if (!verification.pass) process.exitCode = 2;
      return verification;
    }
    if (mode === "reconcile") {
      const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
      const snapshot = await writePrivateJson(`/private/tmp/${GLOBAL_CURRENT_PARTNER_RELEASE.toLowerCase()}-before-${timestamp}.json`, await currentPartnerProductionSnapshot());
      const result = await runCurrentPartnerReconciliation({
        expectedSha: process.env.CURRENT_PARTNER_ROLLOUT_EXPECTED_SHA ?? "",
        confirmation: process.env.CURRENT_PARTNER_ROLLOUT_CONFIRM ?? "",
      });
      const resultFile = await writePrivateJson(`/private/tmp/${GLOBAL_CURRENT_PARTNER_RELEASE.toLowerCase()}-result-${timestamp}.json`, result);
      return { release: GLOBAL_CURRENT_PARTNER_RELEASE, snapshot, resultFile, result };
    }
    throw new Error("Usage: current-partner-global-rollout.ts <matrix|snapshot|reconcile|verify|probe-links>");
  } finally {
    await prisma.$disconnect();
  }
}

void main().then((result) => console.info(JSON.stringify(result, null, 2)));
