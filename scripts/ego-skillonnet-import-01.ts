// EGO (eGamingOnline / SkillOnNet) import, Founder decision FOUNDER-EGO-2026-09-22.
// Runbook: docs/06_Operations/EGO-SkillOnNet-Import-01-Runbook.md
//
//   plan  (default) offline: checks bundle checksums, dry-runs the 13 imports, lists registration commands.
//   apply           Founder-run only: imports the bundles, ensures the EGO partner and registers every
//                   ACTIVATE market through PartnerTrackingRegistrationService, then runs route health.
//
// The tracking-link CSV holds raw partner URLs and stays outside git (--links <path>).
// Output never contains a raw tracking URL; links are identified by their sha256.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

import { Prisma } from "@prisma/client";

import { parseCasinoIngestionBundle } from "../lib/casino-ingestion/contract";
import { ingestCasinoBundlesInTransaction, planCasinoIngestion } from "../lib/casino-ingestion/importer";
import { establishTrustedCommercialWriteAuthority } from "../lib/commercial/commercial-write-authority";
import { partnerTrackingRegistrationService } from "../lib/commercial/partner-tracking-registration-service";
import prisma from "../lib/db/prisma";
import {
  EGO_BUNDLE_DIR,
  EGO_CASINO_SLUGS,
  EGO_DECISION_REF,
  EGO_IMPORT_RELEASE,
  EGO_PARTNER,
  assertEgoApplyAuthority,
  databaseFingerprint,
  egoRegistrationPlan,
  parseEgoLinks,
} from "../lib/partner-imports/ego-skillonnet-import-01";
import { affiliateRouteHealthService } from "../lib/services/affiliate-route-health.service";

function option(name: string) {
  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];
  return process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

function loadBundles() {
  const manifest = JSON.parse(readFileSync(`${EGO_BUNDLE_DIR}/manifest.v1.json`, "utf8")) as {
    sourceNote: { path: string; sha256: string };
    bundles: Array<{ casinoKey: string; file?: string; path?: string; sha256: string }>;
  };
  const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
  if (sha(manifest.sourceNote.path) !== manifest.sourceNote.sha256) throw new Error("EGO_SOURCE_NOTE_CHECKSUM_MISMATCH");
  return EGO_CASINO_SLUGS.map((slug) => {
    const entry = manifest.bundles.find((bundle) => bundle.casinoKey === slug);
    const path = `${EGO_BUNDLE_DIR}/${slug}.v1.json`;
    if (!entry || sha(path) !== entry.sha256) throw new Error(`EGO_BUNDLE_CHECKSUM_MISMATCH:${slug}`);
    return parseCasinoIngestionBundle(JSON.parse(readFileSync(path, "utf8")));
  });
}

// One transaction per casino: a large bundle takes up to ~70 s against the remote database,
// beyond the importer's single 65 s batch transaction. Each bundle is idempotent, so a partial run can be repeated.
async function importBundles(bundles: ReturnType<typeof loadBundles>) {
  const results = [];
  for (const bundle of bundles) {
    const [result] = await prisma.$transaction((tx) => ingestCasinoBundlesInTransaction(tx, [bundle]), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 20_000,
      timeout: 240_000,
    });
    results.push(result);
  }
  return results;
}

async function ensurePartner(actorId: string) {
  const existing = await prisma.affiliateNetwork.findUnique({ where: { slug: EGO_PARTNER.slug } });
  if (existing) return { id: existing.id, created: false };
  const network = await prisma.$transaction(async (tx) => {
    const created = await tx.affiliateNetwork.create({ data: { ...EGO_PARTNER, createdBy: actorId, updatedBy: actorId } });
    await tx.auditLog.create({ data: { actorId, action: "create", entityType: "affiliate-network", entityId: created.id, summary: `${EGO_IMPORT_RELEASE}: created affiliate network ${created.name} (${EGO_DECISION_REF})` } });
    return created;
  });
  return { id: network.id, created: true };
}

async function main() {
  const mode = process.argv[2] === "apply" ? "apply" : "plan";
  const linksPath = option("--links");
  if (!linksPath) throw new Error("EGO_IMPORT_REQUIRES --links=<path to ego-tracking-links.csv (kept outside git)>");
  const bundles = loadBundles();
  const { commands, superseded } = egoRegistrationPlan(parseEgoLinks(readFileSync(linksPath, "utf8")));

  if (mode === "plan") {
    console.info(JSON.stringify({
      release: EGO_IMPORT_RELEASE,
      mode,
      bundles: bundles.map((bundle) => ({ casino: bundle.casino.slug, planned: planCasinoIngestion(bundle).planned })),
      registrationCommands: commands.length,
      superseded,
      commands: commands.map(({ casinoSlug, geo, expectedOperatorHost, linkHash }) => ({ casinoSlug, geo, expectedOperatorHost, linkHash: linkHash.slice(0, 12) })),
      targetDatabaseFingerprint: process.env.DATABASE_URL ? databaseFingerprint(process.env.DATABASE_URL) : null,
    }, null, 2));
    return;
  }

  assertEgoApplyAuthority({
    confirm: option("--confirm"),
    decisionRef: option("--decision-ref"),
    actorEmail: option("--actor-email"),
    expectedDatabase: option("--expected-database"),
    databaseUrl: process.env.DATABASE_URL,
    env: process.env,
  });
  const actor = await prisma.adminUser.findUnique({ where: { email: option("--actor-email")!.trim().toLowerCase() }, select: { id: true } });
  if (!actor) throw new Error("EGO_IMPORT_ACTOR_NOT_FOUND");

  const imported = await importBundles(bundles);
  const partner = await ensurePartner(actor.id);
  const authority = establishTrustedCommercialWriteAuthority({ kind: "FOUNDER_DIRECT", decisionRef: EGO_DECISION_REF });

  type RegistrationReport = {
    casinoSlug: string;
    geo: string;
    status: string;
    verification?: string;
    finalState?: string | null;
    reason: string | null;
    finalHost?: string | null;
    expectedOperatorHost?: string;
    linkHash: string;
  };
  const registrations: RegistrationReport[] = [];
  for (const command of commands) {
    try {
      const result = await partnerTrackingRegistrationService.register(
        { partner: EGO_PARTNER.slug, casino: command.casinoSlug, trackingUrl: command.trackingUrl, geo: command.geo },
        { actorId: actor.id, auditOrigin: "INTERNAL_COMMAND", correlationId: `${EGO_IMPORT_RELEASE}:${command.casinoSlug}:${command.geo}`, commercialAuthority: authority },
      );
      const row = result.results.find((entry) => entry.geo === command.geo);
      registrations.push({
        casinoSlug: command.casinoSlug,
        geo: command.geo,
        status: result.status,
        verification: result.verification,
        finalState: row?.finalState ?? null,
        reason: row?.reason ?? null,
        finalHost: result.finalHost,
        expectedOperatorHost: command.expectedOperatorHost,
        linkHash: result.linkHash.slice(0, 12),
      });
    } catch (error) {
      registrations.push({ casinoSlug: command.casinoSlug, geo: command.geo, status: "ERROR", reason: error instanceof Error ? error.message.slice(0, 200) : "UNKNOWN", linkHash: command.linkHash.slice(0, 12) });
    }
  }

  const health = [];
  for (const slug of EGO_CASINO_SLUGS) {
    const report = await affiliateRouteHealthService.run({ casino: slug });
    health.push(...report.results.map((result) => ({
      casinoSlug: result.casinoSlug,
      marketCode: result.marketCode,
      verifierStatus: result.currentEvidence.verifierStatus,
      finalHost: result.currentEvidence.finalHost,
      actionRequired: result.actionRequired,
      actionReason: result.actionReason,
    })));
  }

  const count = (state: string) => registrations.filter((entry) => entry.finalState === state).length;
  console.info(JSON.stringify({
    release: EGO_IMPORT_RELEASE,
    mode,
    decisionRef: EGO_DECISION_REF,
    imported: imported.map((result) => ({ casino: result.casinoKey, reconciliation: result.reconciliation })),
    partner,
    summary: {
      commands: commands.length,
      activeHealthy: count("ACTIVE_HEALTHY"),
      actionRequiredRegulatory: count("ACTION_REQUIRED_REGULATORY"),
      blockedByLaw: count("BLOCKED_BY_LAW"),
      brokenRoute: count("BROKEN_ROUTE"),
      missingTrackingRoute: count("MISSING_TRACKING_ROUTE"),
      errors: registrations.filter((entry) => entry.status === "ERROR").length,
      healthChecked: health.length,
      healthActionRequired: health.filter((entry) => entry.actionRequired).length,
    },
    registrations,
    health,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "EGO import failed");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
