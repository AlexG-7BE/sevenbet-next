import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { Prisma } from "@prisma/client";

import {
  destinationSha256,
  extractHashBoundSuperflyCampaignDestination,
} from "../lib/affiliate-routing/superfly-destination-evidence";
import {
  SUPERFLY_DETECTED_BLOCKED_COUNTRIES,
  projectPartnerRoutes,
} from "../lib/affiliate-routing/partner-route-projection";
import { superflyCommercialCatalog } from "../lib/casino-commercial-visibility/catalog";
import prisma from "../lib/db/prisma";
import { partnerRouteRepository } from "../lib/repositories/partner-route.repository";

if (!process.env.DATABASE_URL?.trim() && process.env.PRODDB_DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = process.env.PRODDB_DATABASE_URL;
}

type Mode = "audit" | "apply" | "verify";
type RouteState = "CURRENT" | "DOTTED_TERMINAL_PERIOD";

const RELEASE = "SUPERFLY-ROUTE-DESTINATION-INTEGRITY-01";
const PROJECT_ID = "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb";
const ORG_ID = "team_WhkUGuXZeIMlU1uFHtowNUqa";
const TARGET_MIGRATION = "0026_commercial_platform_completion";
const WRITE_TRANSACTION_MAX_WAIT_MS = 30_000;
const WRITE_TRANSACTION_TIMEOUT_MS = 120_000;
const ALLOWED_COUNTRIES = ["KZ", "US", "DE", "IE", "MX"] as const;
const PRE_REPAIR_SHA256 = {
  diamond7: "df2aaa6d61ecb0e6f62de629313fa0e1940417ea30f835feadb8f4bbe75c085b",
  "gday-casino": "cfb4358a622cfc2ef3a8669112ea57e0fd94b78334708c9b2dbca3b375b4670e",
  "21-prive": "34d4f3a8319d811e3a647aedb02bad4c3fe7ca840d9ce76a256db4383eaee275",
  "skol-casino": "0291cbf9628461454f5c794533cf2af223f71b2dbafca408f15bee76344f9b7c",
  slotnite: "d3e597395afa17ffcc95133560cce21ffb1f625717b69505ea4400829a8051f3",
  "hello-casino": "af40b20544662bb848f1ade77f708dab7f6f449d9c95059b43b4e63681a0cd6a",
} as const;

type ScopedSlug = keyof typeof PRE_REPAIR_SHA256;
type MigrationState = { unfinished: bigint; targetApplied: bigint; targetChecksum: string | null };

function hash(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function object(value: Prisma.JsonValue | null | undefined): Prisma.JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Prisma.JsonObject : {};
}

function stringsEqual(left: string[], right: readonly string[]) {
  return [...left].sort().join(",") === [...right].sort().join(",");
}

function databaseTargetFingerprint() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return "UNAVAILABLE";
  const target = new URL(raw);
  return hash([target.username, target.pathname, target.port || "5432"].join("\n"));
}

async function assertRepositoryTarget() {
  const project = JSON.parse(await readFile(path.join(process.cwd(), ".vercel", "project.json"), "utf8")) as { projectId?: string; orgId?: string };
  if (project.projectId !== PROJECT_ID || project.orgId !== ORG_ID) {
    throw new Error("Vercel project identity does not match the governed B4GAMBLE target.");
  }
}

async function assertMigrationBaseline() {
  const [state] = await prisma.$queryRaw<MigrationState[]>`
    SELECT
      COUNT(*) FILTER (WHERE "finished_at" IS NULL AND "rolled_back_at" IS NULL)::bigint AS "unfinished",
      COUNT(*) FILTER (WHERE "migration_name" = ${TARGET_MIGRATION} AND "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL)::bigint AS "targetApplied",
      MAX("checksum") FILTER (WHERE "migration_name" = ${TARGET_MIGRATION} AND "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL) AS "targetChecksum"
    FROM "_prisma_migrations"
  `;
  const expected = hash(await readFile(path.join(process.cwd(), "prisma", "migrations", TARGET_MIGRATION, "migration.sql")));
  if (!state || Number(state.unfinished) !== 0 || Number(state.targetApplied) !== 1 || state.targetChecksum !== expected) {
    throw new Error("Production migration baseline is not safe for bounded route reconciliation.");
  }
}

function assertWriteAuthority() {
  if (process.env.SUPERFLY_ROUTE_DESTINATION_INTEGRITY_CONFIRM !== RELEASE) {
    throw new Error(`Write refused. Set SUPERFLY_ROUTE_DESTINATION_INTEGRITY_CONFIRM=${RELEASE}.`);
  }
  if (process.env.ALLOW_SUPERFLY_ROUTE_DESTINATION_INTEGRITY_WRITE !== "true") {
    throw new Error("Write refused without the bounded destination-integrity write flag.");
  }
  const target = process.env.SUPERFLY_ROUTE_DESTINATION_INTEGRITY_TARGET;
  if (target !== "production" && target !== "preview") throw new Error("Write refused without an explicit production or preview target.");
  if (process.env.VERCEL_ENV !== target) throw new Error("Write refused because VERCEL_ENV differs from the explicit target.");
  const expected = process.env.SUPERFLY_ROUTE_DESTINATION_INTEGRITY_DATABASE_FINGERPRINT?.trim();
  const actual = databaseTargetFingerprint();
  if (!expected || expected !== actual) {
    throw new Error(`Write refused. Independently verify and set SUPERFLY_ROUTE_DESTINATION_INTEGRITY_DATABASE_FINGERPRINT=${actual}.`);
  }
}

function metadataWithDestinationHash(value: Prisma.JsonValue, destinationHash: string): Prisma.InputJsonObject {
  const metadata = object(value);
  const visibility = object(metadata.commercialVisibility as Prisma.JsonValue | undefined);
  return {
    ...metadata,
    commercialVisibility: {
      ...visibility,
      canonicalUrlSha256: destinationHash,
    },
  } as Prisma.InputJsonObject;
}

async function inspectRoutes() {
  await Promise.all([assertRepositoryTarget(), assertMigrationBaseline()]);
  const routeEvidenceIds = superflyCommercialCatalog.map((definition) => definition.evidence.routeId);
  const [links, evidence] = await Promise.all([
    prisma.affiliateTrackingLink.findMany({
      where: {
        offer: {
          casino: { slug: { in: superflyCommercialCatalog.map((definition) => definition.slug) } },
          program: { network: { slug: "superfly-partners" } },
        },
      },
      select: {
        id: true,
        destinationUrl: true,
        trackingUrl: true,
        active: true,
        archivedAt: true,
        source: true,
        metadata: true,
        updatedBy: true,
        offer: {
          select: {
            status: true,
            geoMode: true,
            countries: { select: { countryCode: true, mode: true } },
            casino: { select: { id: true, slug: true } },
            program: { select: { id: true, status: true, workflowStatus: true, metadata: true } },
            redirectSlugs: { select: { slug: true, active: true, archivedAt: true } },
          },
        },
        countries: { select: { countryCode: true, mode: true, productionEligible: true } },
      },
    }),
    prisma.commercialEvidence.findMany({
      where: { id: { in: routeEvidenceIds } },
      select: { id: true, claim: true, sourceType: true, classification: true, status: true, sourceReference: true },
    }),
  ]);
  if (links.length !== 6 || evidence.length !== 6) throw new Error("The exact six route or CRM evidence records were not found.");

  const evidenceById = new Map(evidence.map((record) => [record.id, record]));
  return superflyCommercialCatalog.map((definition) => {
    const slug = definition.slug as ScopedSlug;
    const link = links.find((record) => record.offer.casino.slug === slug);
    const record = evidenceById.get(definition.evidence.routeId);
    if (!link || !record) throw new Error(`${slug}: exact route or evidence is missing.`);
    if (record.sourceType !== "APPLICATION_PORTAL"
      || record.classification !== "DETECTED"
      || record.status !== "CURRENT"
      || !record.sourceReference?.trim()) throw new Error(`${slug}: current authenticated portal provenance is missing.`);

    const destination = extractHashBoundSuperflyCampaignDestination(record.claim, definition.evidence.canonicalUrlSha256);
    if (link.destinationUrl !== link.trackingUrl) throw new Error(`${slug}: destination and tracking fields diverge.`);
    const actualHash = destinationSha256(link.destinationUrl);
    const oldHash = PRE_REPAIR_SHA256[slug];
    let state: RouteState;
    if (link.destinationUrl === destination && actualHash === definition.evidence.canonicalUrlSha256) state = "CURRENT";
    else if (oldHash !== definition.evidence.canonicalUrlSha256
      && actualHash === oldHash
      && link.destinationUrl === `${destination}.`) state = "DOTTED_TERMINAL_PERIOD";
    else throw new Error(`${slug}: destination is outside the exact pre-repair or verified current state.`);

    const programVisibility = object(object(link.offer.program.metadata).commercialVisibility as Prisma.JsonValue | undefined);
    const trackingVisibility = object(object(link.metadata).commercialVisibility as Prisma.JsonValue | undefined);
    if (!link.active || link.archivedAt || link.source !== "COMMERCIAL_CRM"
      || link.offer.status !== "ACTIVE" || link.offer.geoMode !== "BLOCK"
      || link.offer.program.status !== "ACTIVE" || link.offer.program.workflowStatus !== "PUBLISHED"
      || programVisibility.authority !== "CASINO-COMMERCIAL-VISIBILITY-03"
      || trackingVisibility.authority !== "CASINO-COMMERCIAL-VISIBILITY-03"
      || programVisibility.evidenceId !== definition.evidence.routeId
      || trackingVisibility.evidenceId !== definition.evidence.routeId
      || programVisibility.canonicalUrlSha256 !== actualHash
      || trackingVisibility.canonicalUrlSha256 !== actualHash) throw new Error(`${slug}: route authority or destination provenance changed unexpectedly.`);

    const expectedBlocks = SUPERFLY_DETECTED_BLOCKED_COUNTRIES;
    const offerBlocks = link.offer.countries.filter((country) => country.mode === "BLOCK").map((country) => country.countryCode);
    const trackingBlocks = link.countries.filter((country) => country.mode === "BLOCK" && !country.productionEligible).map((country) => country.countryCode);
    if (link.offer.countries.length !== expectedBlocks.length
      || link.countries.length !== expectedBlocks.length
      || !stringsEqual(offerBlocks, expectedBlocks) || !stringsEqual(trackingBlocks, expectedBlocks)
      || !stringsEqual(Array.isArray(programVisibility.blockedCountries) ? programVisibility.blockedCountries.filter((country): country is string => typeof country === "string") : [], expectedBlocks)
      || !stringsEqual(Array.isArray(trackingVisibility.blockedCountries) ? trackingVisibility.blockedCountries.filter((country): country is string => typeof country === "string") : [], expectedBlocks)) {
      throw new Error(`${slug}: GEO block policy changed unexpectedly.`);
    }
    if (link.offer.redirectSlugs.length !== 1
      || link.offer.redirectSlugs[0].slug !== `${slug}-welcome`
      || !link.offer.redirectSlugs[0].active
      || link.offer.redirectSlugs[0].archivedAt) throw new Error(`${slug}: redirect association changed unexpectedly.`);

    return { definition, destination, link, record, state, actualHash, oldHash };
  });
}

function safeReport(rows: Awaited<ReturnType<typeof inspectRoutes>>) {
  return rows.map(({ definition, link, record, state, actualHash }) => ({
    slug: definition.slug,
    state,
    active: link.active,
    source: link.source,
    evidenceId: record.id,
    evidenceSource: record.sourceType,
    evidenceClassification: record.classification,
    destinationSha256: actualHash,
    expectedSha256: definition.evidence.canonicalUrlSha256,
    redirectSlug: link.offer.redirectSlugs[0].slug,
    blockedCountries: SUPERFLY_DETECTED_BLOCKED_COUNTRIES,
  }));
}

async function audit() {
  const rows = await inspectRoutes();
  console.info(JSON.stringify({
    release: RELEASE,
    databaseTargetFingerprint: databaseTargetFingerprint(),
    routes: safeReport(rows),
    pendingRepairs: rows.filter((row) => row.state !== "CURRENT").length,
    rawTrackingUrlsEmitted: 0,
    destructiveWrites: 0,
  }, null, 2));
}

async function apply() {
  assertWriteAuthority();
  const rows = await inspectRoutes();
  const pending = rows.filter((row) => row.state === "DOTTED_TERMINAL_PERIOD");
  await prisma.$transaction(async (tx) => {
    for (const row of pending) {
      const verifiedAt = new Date();
      const destinationHash = row.definition.evidence.canonicalUrlSha256;
      const update = await tx.affiliateTrackingLink.updateMany({
        where: {
          id: row.link.id,
          destinationUrl: row.link.destinationUrl,
          trackingUrl: row.link.trackingUrl,
          active: true,
          archivedAt: null,
        },
        data: {
          destinationUrl: row.destination,
          trackingUrl: row.destination,
          verifiedAt,
          lastCheckedAt: verifiedAt,
          metadata: metadataWithDestinationHash(row.link.metadata, destinationHash),
          updatedBy: row.link.updatedBy,
        },
      });
      if (update.count !== 1) throw new Error(`${row.definition.slug}: concurrent route change refused.`);
      await tx.affiliateProgram.update({
        where: { id: row.link.offer.program.id },
        data: {
          metadata: metadataWithDestinationHash(row.link.offer.program.metadata, destinationHash),
          updatedBy: row.link.updatedBy,
        },
      });
      const latest = await tx.affiliateTrackingLinkRevision.findFirst({
        where: { trackingLinkId: row.link.id },
        orderBy: { revisionNumber: "desc" },
        select: { revisionNumber: true },
      });
      await tx.affiliateTrackingLinkRevision.create({
        data: {
          trackingLinkId: row.link.id,
          revisionNumber: (latest?.revisionNumber ?? 0) + 1,
          destinationUrl: row.destination,
          trackingUrl: row.destination,
          summary: `${RELEASE}: exact authenticated-portal campaign destination repaired`,
          createdBy: row.link.updatedBy,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: row.link.updatedBy,
          action: "superfly_route_destination_integrity_repaired",
          entityType: "affiliate-tracking-link",
          entityId: row.link.id,
          summary: `${RELEASE}: terminal sentence punctuation removed from verified campaign destination`,
          metadata: {
            release: RELEASE,
            slug: row.definition.slug,
            routeEvidenceId: row.definition.evidence.routeId,
            priorSha256: row.actualHash,
            destinationSha256: destinationHash,
          },
        },
      });
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: WRITE_TRANSACTION_MAX_WAIT_MS,
    timeout: WRITE_TRANSACTION_TIMEOUT_MS,
  });

  const results = [];
  for (const row of pending) {
    const destinationHash = row.definition.evidence.canonicalUrlSha256;
    results.push({ slug: row.definition.slug, status: "repaired", priorSha256: row.actualHash, destinationSha256: destinationHash });
  }
  for (const row of rows.filter((candidate) => candidate.state === "CURRENT")) {
    results.push({ slug: row.definition.slug, status: "unchanged", priorSha256: row.actualHash, destinationSha256: row.actualHash });
  }
  console.info(JSON.stringify({ release: RELEASE, databaseTargetFingerprint: databaseTargetFingerprint(), results, destructiveWrites: 0, rawTrackingUrlsEmitted: 0 }, null, 2));
  await verify();
}

async function verify() {
  const rows = await inspectRoutes();
  const issues: string[] = [];
  for (const row of rows) if (row.state !== "CURRENT") issues.push(`${row.definition.slug}: destination is not current`);
  const casinoIds = rows.map((row) => row.link.offer.casino.id);
  const matrix: Record<string, Record<string, "ON" | "OFF">> = {};
  for (const countryCode of [...ALLOWED_COUNTRIES, ...SUPERFLY_DETECTED_BLOCKED_COUNTRIES]) {
    const candidates = await partnerRouteRepository.listCandidates(casinoIds, countryCode);
    const projected = projectPartnerRoutes(candidates, {
      countryCode,
      now: new Date(),
      commercialAllowed: true,
      referralAllowed: true,
      redirectEnabled: true,
    });
    matrix[countryCode] = Object.fromEntries(rows.map((row) => [
      row.definition.slug,
      projected.some((route) => route.casino.slug === row.definition.slug && route.productionEligible) ? "ON" : "OFF",
    ]));
  }
  for (const countryCode of ALLOWED_COUNTRIES) {
    if (Object.values(matrix[countryCode]).some((state) => state !== "ON")) issues.push(`${countryCode}: expected all six routes ON`);
  }
  for (const countryCode of SUPERFLY_DETECTED_BLOCKED_COUNTRIES) {
    if (Object.values(matrix[countryCode]).some((state) => state !== "OFF")) issues.push(`${countryCode}: expected all six routes OFF`);
  }
  console.info(JSON.stringify({
    release: RELEASE,
    databaseTargetFingerprint: databaseTargetFingerprint(),
    routes: safeReport(rows),
    matrix,
    issues,
    rawTrackingUrlsEmitted: 0,
    destructiveWrites: 0,
  }, null, 2));
  if (issues.length) throw new Error(`${RELEASE} verification failed with ${issues.length} issue(s).`);
}

async function main() {
  const mode = process.argv[2] as Mode | undefined;
  if (!mode || !["audit", "apply", "verify"].includes(mode)) {
    throw new Error("Usage: superfly-route-destination-integrity-01.ts <audit|apply|verify>");
  }
  try {
    if (mode === "audit") await audit();
    if (mode === "apply") await apply();
    if (mode === "verify") await verify();
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unknown executor failure";
    console.error(message.replace(/https:\/\/[^\s\"'<>]+/gi, "[redacted-url]"));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
