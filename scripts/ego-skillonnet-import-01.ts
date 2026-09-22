// EGO (eGamingOnline / SkillOnNet) import, Founder decision FOUNDER-EGO-2026-09-22.
// Runbook: docs/06_Operations/EGO-SkillOnNet-Import-01-Runbook.md
//
//   plan  (default) offline: checks bundle checksums, dry-runs the 13 imports, lists registration commands.
//   apply           Founder-run only: imports the bundles, ensures the EGO partner and registers every
//                   ACTIVATE market through PartnerTrackingRegistrationService, then runs route health.
//                   --no-registration imports only (used to preview the catalogue on a dev database).
//   publish         Founder-run only: writes the approved Editor Score and editorial content from
//                   editorial.json and runs DRAFT → IN_REVIEW → APPROVED → PUBLISHED.
//
// The tracking-link CSV holds raw partner URLs and stays outside git (--links <path>).
// Output never contains a raw tracking URL; links are identified by their sha256.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

import { EditorialStatus, Prisma } from "@prisma/client";

import { readCasinoEditorMetadata, writeCasinoEditorMetadata } from "../lib/casino-builder/editor-metadata";
import { parseCasinoIngestionBundle } from "../lib/casino-ingestion/contract";
import { ingestCasinoBundlesInTransaction, planCasinoIngestion } from "../lib/casino-ingestion/importer";
import { establishTrustedCommercialWriteAuthority } from "../lib/commercial/commercial-write-authority";
import { partnerTrackingRegistrationService } from "../lib/commercial/partner-tracking-registration-service";
import prisma from "../lib/db/prisma";
import type { CasinoEditorialDocument } from "../lib/editorial-review/types";
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
import { casinoService } from "../lib/services/casino.service";
import { editorialReviewService } from "../lib/services/editorial-review.service";

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

type EditorialEntry = {
  slug: string;
  title: string;
  score: number;
  scoreComponents: Record<string, number>;
  summary: string;
  description: string;
  bestFor: string[];
  thingsToKnow: string[];
  seo: { title: string; description: string };
};

function editorialDocument(entry: EditorialEntry): CasinoEditorialDocument {
  const components = Object.entries(entry.scoreComponents).map(([name, value]) => `${name} ${value.toFixed(1)}`).join(", ");
  return {
    version: 1,
    title: `${entry.title} Casino Review`,
    summary: entry.summary,
    author: "B4GAMBLE Editorial Team",
    factCheckedAt: "2026-09-22T00:00:00.000Z",
    trustScore: {
      overall: entry.score,
      categories: [],
      confidence: "medium",
      evidence: [
        "Facts come from the checksum-verified EGO-SKILLONNET-IMPORT-01 ingestion bundles.",
        `Editor Score is the mean of six components (${components}), approved under ${EGO_DECISION_REF}; it is independent of affiliate compensation or route eligibility.`,
      ],
    },
    sections: [
      { id: "overview", kind: "overview", title: "Overview", order: 0, blocks: [{ id: "overview-copy", type: "paragraph", text: entry.description }] },
      { id: "best-for", kind: "pros", title: "Best for", order: 1, blocks: [{ id: "best-for-list", type: "pros", items: entry.bestFor }] },
      { id: "things-to-know", kind: "cons", title: "Things to know", order: 2, blocks: [{ id: "know-list", type: "cons", items: entry.thingsToKnow }] },
      { id: "score-method", kind: "notes", title: "How the score works", order: 3, blocks: [{ id: "score-note", type: "information", title: `Editor Score ${entry.score.toFixed(1)}/10`, text: "The score is editorial. It does not grant commercial eligibility, alter jurisdiction checks or activate an affiliate route." }] },
    ],
    relatedCasinoIds: [],
    seo: {
      title: entry.seo.title,
      description: entry.seo.description,
      canonicalPath: `/casino/${entry.slug}`,
      robots: "index,follow",
      socialTitle: `${entry.title} Casino Review | B4GAMBLE`,
      socialDescription: entry.summary,
    },
  };
}

// Same workflow as scripts/casino-real-catalog-03.ts: casino fields and SEO, the editorial review,
// then DRAFT → IN_REVIEW → APPROVED → PUBLISHED through the casino service's publication validation.
async function publishEntry(entry: EditorialEntry, actorId: string) {
  const aggregate = await prisma.casino.findUnique({ where: { slug: entry.slug }, select: { id: true } });
  if (!aggregate) throw new Error(`EGO_PUBLISH_CASINO_NOT_IMPORTED:${entry.slug}`);
  let current = await casinoService.getCasinoById(aggregate.id);
  if (current.status !== EditorialStatus.DRAFT) {
    current = await casinoService.transitionWorkflow(current.id, EditorialStatus.DRAFT, actorId, current.updatedAt);
  }
  const metadata = readCasinoEditorMetadata(current.reviewBlocks);
  metadata.general = {
    ...metadata.general,
    trustScore: entry.score,
    featured: false,
    recommended: false,
    internalNotes: `${EGO_IMPORT_RELEASE}: Editor Score ${entry.score.toFixed(1)} approved under ${EGO_DECISION_REF}.`,
  };
  current = await casinoService.updateCasino(current.id, {
    title: entry.title,
    summary: entry.summary,
    description: entry.description,
    editorScore: entry.score,
    pros: entry.bestFor,
    cons: entry.thingsToKnow,
    reviewBlocks: writeCasinoEditorMetadata(current.reviewBlocks, metadata),
    lastReviewedAt: new Date("2026-09-22T00:00:00.000Z"),
    updatedBy: actorId,
    expectedUpdatedAt: current.updatedAt,
  });
  const document = editorialDocument(entry);
  const seo = {
    title: entry.seo.title,
    description: entry.seo.description,
    canonicalUrl: `/casino/${entry.slug}`,
    robots: "index,follow",
    socialTitle: document.seo.socialTitle ?? entry.seo.title,
    socialDescription: document.seo.socialDescription ?? entry.seo.description,
  };
  await prisma.casinoSeo.upsert({ where: { casinoId: current.id }, create: { casinoId: current.id, ...seo }, update: seo });

  let review = await editorialReviewService.getByCasinoId(current.id);
  if (review && review.status !== "DRAFT") review = await editorialReviewService.transition(review.id, "DRAFT", actorId);
  review = await editorialReviewService.saveDraft(current.id, document, `${EGO_IMPORT_RELEASE}: factual/editorial review`, actorId);
  review = await editorialReviewService.transition(review.id, "IN_REVIEW", actorId);
  review = await editorialReviewService.transition(review.id, "APPROVED", actorId);
  const revision = review.revisions.find((candidate) => candidate.revisionNumber === review?.draftRevisionNumber);
  if (!revision) throw new Error(`EGO_PUBLISH_EDITORIAL_REVISION_MISSING:${entry.slug}`);
  await editorialReviewService.publish(review.id, revision.id, actorId);

  current = await casinoService.getCasinoById(current.id);
  current = await casinoService.transitionWorkflow(current.id, EditorialStatus.IN_REVIEW, actorId, current.updatedAt);
  current = await casinoService.transitionWorkflow(current.id, EditorialStatus.APPROVED, actorId, current.updatedAt);
  await casinoService.publishCasino(current.id, actorId, current.updatedAt);
  await prisma.casino.update({ where: { id: current.id }, data: { domainPublicationStatus: "PUBLISHED", updatedBy: actorId } });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "ego-skillonnet-import-01-publish",
      entityType: "casino",
      entityId: current.id,
      summary: `${EGO_IMPORT_RELEASE}: published ${entry.title} with Editor Score ${entry.score.toFixed(1)} (${EGO_DECISION_REF})`,
      metadata: { release: EGO_IMPORT_RELEASE, score: entry.score, scoreComponents: entry.scoreComponents, referralAuthorityGranted: false },
    },
  });
}

async function main() {
  const mode = process.argv[2] === "apply" || process.argv[2] === "publish" ? process.argv[2] : "plan";
  const bundles = loadBundles();

  if (mode === "publish") {
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
    const editorial = JSON.parse(readFileSync(`${EGO_BUNDLE_DIR}/editorial.json`, "utf8")) as { casinos: EditorialEntry[] };
    const published = [];
    for (const entry of editorial.casinos) {
      try {
        await publishEntry(entry, actor.id);
        published.push({ casinoSlug: entry.slug, editorScore: entry.score, status: "PUBLISHED" });
      } catch (error) {
        published.push({ casinoSlug: entry.slug, editorScore: entry.score, status: "ERROR", reason: error instanceof Error ? error.message.slice(0, 300) : "UNKNOWN" });
      }
    }
    console.info(JSON.stringify({ release: EGO_IMPORT_RELEASE, mode, decisionRef: EGO_DECISION_REF, published }, null, 2));
    if (published.some((entry) => entry.status === "ERROR")) process.exitCode = 1;
    return;
  }

  const linksPath = option("--links");
  if (!linksPath) throw new Error("EGO_IMPORT_REQUIRES --links=<path to ego-tracking-links.csv (kept outside git)>");
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
  for (const command of process.argv.includes("--no-registration") ? [] : commands) {
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
