import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { EditorialStatus, Prisma } from "@prisma/client";

import { readCasinoEditorMetadata } from "../lib/casino-builder/editor-metadata";
import {
  CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT,
  CASINO_COMMERCIAL_VISIBILITY_RELEASE,
  assertCommercialVisibilityCatalog,
  superflyBlockEvidence,
  superflyBlockedCountries,
  superflyCommercialCatalog,
  type CommercialCatalogDefinition,
} from "../lib/casino-commercial-visibility/catalog";
import { casinoCatalogEditorialDocument, casinoRealCatalog } from "../lib/casino-real-catalog/catalog";
import prisma from "../lib/db/prisma";
import { deterministicCasinoIngestionId } from "../lib/casino-ingestion/importer";
import { projectPartnerRoutes } from "../lib/affiliate-routing/partner-route-projection";
import { extractHashBoundSuperflyCampaignDestination } from "../lib/affiliate-routing/superfly-destination-evidence";
import { partnerRouteRepository } from "../lib/repositories/partner-route.repository";

if (!process.env.DATABASE_URL?.trim() && process.env.PRODDB_DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = process.env.PRODDB_DATABASE_URL;
}

type Mode = "audit" | "seed" | "verify";
type Manifest = {
  release: string;
  brands: Array<{ slug: string; catalogEvidenceId: string; offerEvidenceId: string; routeEvidenceId: string; routeSha256: string; mediaSha256: string | null; payments: number; providers: number; categories: number; bonuses: number }>;
  superflyBlockedCountries: string[];
  expected: Record<string, number>;
};
type MigrationState = { unfinished: bigint; targetApplied: bigint; targetChecksum: string | null };

const TARGET_MIGRATION = "0026_commercial_platform_completion";
const PROJECT_ID = "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb";
const ORG_ID = "team_WhkUGuXZeIMlU1uFHtowNUqa";
const MANIFEST_SHA256 = "92b6bffa53da62e4d7971267f991f9a8abbf3ab3bae7299409c0269209a43aaa";
const MANIFEST_PATH = "data/casino-commercial-visibility-03/manifest.v1.json";
const allowedCountries = ["KZ", "US", "DE", "IE", "MX"] as const;

function hash(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function id(...parts: string[]) {
  return deterministicCasinoIngestionId([CASINO_COMMERCIAL_VISIBILITY_RELEASE, ...parts].join(":"));
}

function object(value: Prisma.JsonValue | null | undefined): Prisma.JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Prisma.JsonObject : {};
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stable(entry)]));
  }
  return value;
}

function same(left: unknown, right: unknown) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

function sameNumber(left: Prisma.Decimal | number | string | null | undefined, right: number | null) {
  if (left === null || left === undefined || right === null) return (left === null || left === undefined) && right === null;
  return Number(left) === right;
}

function databaseTargetFingerprint() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return "UNAVAILABLE";
  const target = new URL(raw);
  return hash([target.username, target.pathname, target.port || "5432"].join("\n"));
}

async function assertRepositoryTarget() {
  const project = JSON.parse(await readFile(path.join(process.cwd(), ".vercel", "project.json"), "utf8")) as { projectId?: string; orgId?: string };
  if (project.projectId !== PROJECT_ID || project.orgId !== ORG_ID) throw new Error("Vercel project identity does not match the governed B4GAMBLE target.");
}

async function migrationState() {
  const [state] = await prisma.$queryRaw<MigrationState[]>`
    SELECT
      COUNT(*) FILTER (WHERE "finished_at" IS NULL AND "rolled_back_at" IS NULL)::bigint AS "unfinished",
      COUNT(*) FILTER (WHERE "migration_name" = ${TARGET_MIGRATION} AND "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL)::bigint AS "targetApplied",
      MAX("checksum") FILTER (WHERE "migration_name" = ${TARGET_MIGRATION} AND "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL) AS "targetChecksum"
    FROM "_prisma_migrations"
  `;
  if (!state) throw new Error("Could not inspect the migration baseline.");
  const expected = hash(await readFile(path.join(process.cwd(), "prisma", "migrations", TARGET_MIGRATION, "migration.sql")));
  return { unfinished: Number(state.unfinished), targetApplied: Number(state.targetApplied) === 1, targetChecksumMatches: state.targetChecksum === expected };
}

async function releaseManifest() {
  const bytes = await readFile(path.join(process.cwd(), MANIFEST_PATH));
  if (hash(bytes) !== MANIFEST_SHA256) throw new Error("Commercial visibility manifest checksum mismatch.");
  const manifest = JSON.parse(bytes.toString("utf8")) as Manifest;
  if (manifest.release !== CASINO_COMMERCIAL_VISIBILITY_RELEASE) throw new Error("Commercial visibility manifest release mismatch.");
  if (!same(manifest.superflyBlockedCountries, superflyBlockedCountries)) throw new Error("Manifest block matrix differs from code authority.");
  for (const definition of superflyCommercialCatalog) {
    const row = manifest.brands.find((entry) => entry.slug === definition.slug);
    if (!row
      || row.catalogEvidenceId !== definition.evidence.catalogId
      || row.offerEvidenceId !== definition.evidence.offerId
      || row.routeEvidenceId !== definition.evidence.routeId
      || row.routeSha256 !== definition.evidence.canonicalUrlSha256
      || row.mediaSha256 !== (definition.media?.checksum ?? null)
      || row.payments !== definition.payments.length
      || row.providers !== definition.providers.length
      || row.categories !== definition.categories.length
      || row.bonuses !== 1) throw new Error(`${definition.slug} differs from the checksum-bound manifest.`);
    if (definition.media) {
      const bytes = await readFile(path.join(process.cwd(), "public", definition.media.path.replace(/^\//, "")));
      if (hash(bytes) !== definition.media.checksum) throw new Error(`${definition.slug} controlled-media checksum mismatch.`);
    }
  }
  return manifest;
}

async function evidenceAuthority() {
  const blockIds = Object.values(superflyBlockEvidence).flat();
  const expectedIds = [...new Set(superflyCommercialCatalog.flatMap((definition) => [
    definition.evidence.catalogId,
    definition.evidence.offerId,
    definition.evidence.routeId,
    ...(definition.media ? [definition.media.evidenceId] : []),
  ]).concat(blockIds))];
  const records = await prisma.commercialEvidence.findMany({
    where: { id: { in: expectedIds } },
    select: { id: true, classification: true, status: true, claim: true, sourceReference: true },
  });
  const byId = new Map(records.map((record) => [record.id, record]));
  for (const evidenceId of expectedIds) {
    const record = byId.get(evidenceId);
    if (!record || record.classification !== "DETECTED" || record.status !== "CURRENT" || !record.sourceReference?.trim()) throw new Error(`Current DETECTED CRM evidence is missing: ${evidenceId}`);
  }
  const routeUrls = new Map<string, string>();
  for (const definition of superflyCommercialCatalog) {
    const url = extractHashBoundSuperflyCampaignDestination(
      byId.get(definition.evidence.routeId)?.claim ?? "",
      definition.evidence.canonicalUrlSha256,
    );
    routeUrls.set(definition.slug, url);
  }
  return routeUrls;
}

function identities(definition: CommercialCatalogDefinition) {
  return {
    bonus: id(definition.slug, "bonus"),
    program: id(definition.slug, "program"),
    offer: id(definition.slug, "offer"),
    tracking: id(definition.slug, "tracking"),
    redirect: id(definition.slug, "redirect"),
    media: id(definition.slug, "media"),
  };
}

async function definitionIssues(definition: CommercialCatalogDefinition) {
  const keys = identities(definition);
  const record = await prisma.casino.findUnique({
    where: { slug: definition.slug },
    include: {
      paymentMethods: { where: { id: { in: definition.payments.map((payment) => id(definition.slug, "payment", payment.key)) } } },
      gameProviders: { where: { id: { in: definition.providers.map((provider) => id(definition.slug, "provider", provider.key)) } } },
      gameCategories: { where: { id: { in: definition.categories.map((category) => id(definition.slug, "category", category.key)) } } },
      casinoBonuses: { where: { id: keys.bonus } },
      mediaAssets: true,
      affiliatePrograms: { where: { id: keys.program }, include: { network: true, offers: { where: { id: keys.offer }, include: { countries: true, currencies: true, trackingLinks: { where: { id: keys.tracking }, include: { countries: true } }, redirectSlugs: { where: { id: keys.redirect } } } } } },
      versions: { where: { status: "PUBLISHED" }, orderBy: { version: "desc" }, take: 1 },
      editorialReview: { include: { revisions: { orderBy: { revisionNumber: "desc" } } } },
    },
  });
  const issues: string[] = [];
  if (!record || record.id.startsWith("demo-") || record.status !== "PUBLISHED") return [`${definition.slug}: real published identity missing`];
  if (record.foundedYear !== definition.foundedYear
    || !same(record.languages, definition.languages)
    || !same(record.currencies, definition.currencies)
    || !same(record.responsibleGamblingTools, definition.responsibleGamblingTools)) issues.push(`${definition.slug}: core facts`);
  const coreMetadata = object(record.trackingMetadata);
  if (coreMetadata.commercialVisibilityRelease !== CASINO_COMMERCIAL_VISIBILITY_RELEASE) issues.push(`${definition.slug}: release marker`);
  const editorMetadata = readCasinoEditorMetadata(record.reviewBlocks);
  if (editorMetadata.general.supportsMobile !== true) issues.push(`${definition.slug}: mobile support metadata`);
  for (const expected of definition.payments) {
    const row = record.paymentMethods.find((entry) => entry.id === id(definition.slug, "payment", expected.key));
    if (!row || row.casinoCountryId || row.name !== expected.name || row.supportsDeposits !== expected.supportsDeposits || row.supportsWithdrawals !== expected.supportsWithdrawals
      || !same(row.currencies, expected.currencies) || row.withdrawalTime !== expected.withdrawalTime || row.notes !== expected.notes
      || !sameNumber(row.maximumWithdrawal, expected.maximumWithdrawal)) issues.push(`${definition.slug}: payment ${expected.key}`);
  }
  for (const expected of definition.providers) {
    const row = record.gameProviders.find((entry) => entry.id === id(definition.slug, "provider", expected.key));
    if (!row || row.casinoCountryId || row.name !== expected.name || row.liveCasino !== expected.liveCasino) issues.push(`${definition.slug}: provider ${expected.key}`);
  }
  for (const expected of definition.categories) {
    const row = record.gameCategories.find((entry) => entry.id === id(definition.slug, "category", expected.key));
    if (!row || row.casinoCountryId || row.name !== expected.name || row.gameCount !== expected.gameCount) issues.push(`${definition.slug}: category ${expected.key}`);
  }
  const bonus = record.casinoBonuses[0];
  if (!bonus
    || bonus.casinoCountryId !== null
    || bonus.slug !== definition.bonus.slug
    || bonus.title !== definition.bonus.title
    || bonus.summary !== definition.bonus.summary
    || bonus.type !== "WELCOME"
    || !sameNumber(bonus.percentage, definition.bonus.percentage)
    || !sameNumber(bonus.maximumBonus, definition.bonus.maximumBonus)
    || !sameNumber(bonus.minimumDeposit, definition.bonus.minimumDeposit)
    || bonus.currency !== definition.bonus.currency
    || bonus.freeSpins !== definition.bonus.freeSpins
    || !sameNumber(bonus.wageringMultiplier, definition.bonus.wageringMultiplier)
    || bonus.wageringText !== definition.bonus.wageringText
    || bonus.eligibility !== definition.bonus.eligibility
    || !same(bonus.importantConditions, definition.bonus.importantConditions)
    || bonus.status !== "PUBLISHED"
    || bonus.domainLifecycleStatus !== "ACTIVE"
    || bonus.offerStatus !== "ACTIVE") issues.push(`${definition.slug}: bonus`);
  const bonusMetadata = object(editorMetadata.bonuses[keys.bonus]);
  if (!sameNumber(typeof bonusMetadata.maximumBet === "number" || typeof bonusMetadata.maximumBet === "string" ? bonusMetadata.maximumBet : null, definition.bonus.maximumBet)) issues.push(`${definition.slug}: maximum-bet metadata`);
  if (definition.media) {
    const media = record.mediaAssets.find((entry) => entry.id === keys.media);
    if (!media || media.status !== "ACTIVE" || media.archivedAt || media.publicUrl !== definition.media.path || media.checksum !== definition.media.checksum) issues.push(`${definition.slug}: media`);
  } else if (record.mediaAssets.some((media) => media.status === "ACTIVE" && !media.archivedAt && media.type !== "LOGO")) {
    issues.push(`${definition.slug}: stale Hello promotional media`);
  }
  const program = record.affiliatePrograms[0];
  const offer = program?.offers[0];
  const tracking = offer?.trackingLinks[0];
  const redirect = offer?.redirectSlugs[0];
  const programVisibility = object(object(program?.metadata).commercialVisibility);
  const trackingVisibility = object(object(tracking?.metadata).commercialVisibility);
  if (!program || program.status !== "ACTIVE" || program.workflowStatus !== "PUBLISHED" || program.network.slug !== "superfly-partners"
    || program.supportedCountries.length !== 0 || programVisibility.authority !== CASINO_COMMERCIAL_VISIBILITY_RELEASE
    || programVisibility.productionEligibleByDefault !== true || programVisibility.evidenceId !== definition.evidence.routeId
    || programVisibility.canonicalUrlSha256 !== definition.evidence.canonicalUrlSha256
    || !same(programVisibility.blockedCountries, superflyBlockedCountries)) issues.push(`${definition.slug}: program`);
  if (!offer || offer.status !== "ACTIVE" || offer.geoMode !== "BLOCK" || offer.casinoBonusId !== keys.bonus) issues.push(`${definition.slug}: commercial offer`);
  if (!tracking || !tracking.active || tracking.geoMode !== "BLOCK" || hash(tracking.trackingUrl) !== definition.evidence.canonicalUrlSha256 || hash(tracking.destinationUrl) !== definition.evidence.canonicalUrlSha256
    || trackingVisibility.authority !== CASINO_COMMERCIAL_VISIBILITY_RELEASE || trackingVisibility.productionEligibleByDefault !== true
    || trackingVisibility.evidenceId !== definition.evidence.routeId || trackingVisibility.canonicalUrlSha256 !== definition.evidence.canonicalUrlSha256
    || !same(trackingVisibility.blockedCountries, superflyBlockedCountries)) issues.push(`${definition.slug}: tracking route`);
  const expectedBlocks = [...superflyBlockedCountries].sort();
  if (!same(offer?.countries.map((entry) => `${entry.countryCode}:${entry.mode}`).sort(), expectedBlocks.map((entry) => `${entry}:BLOCK`))) issues.push(`${definition.slug}: offer blocks`);
  if (!same(tracking?.countries.map((entry) => `${entry.countryCode}:${entry.mode}:${entry.productionEligible}`).sort(), expectedBlocks.map((entry) => `${entry}:BLOCK:false`))) issues.push(`${definition.slug}: tracking blocks`);
  if (!redirect || !redirect.active || redirect.slug !== `${definition.slug}-welcome` || redirect.casinoBonusId !== keys.bonus || redirect.affiliateOfferId !== keys.offer) issues.push(`${definition.slug}: redirect`);
  const snapshot = object(record.versions[0]?.snapshot);
  if (object(snapshot.trackingMetadata).commercialVisibilityRelease !== CASINO_COMMERCIAL_VISIBILITY_RELEASE) issues.push(`${definition.slug}: published snapshot`);
  return issues;
}

async function catalogEditorialIssues() {
  const records = await prisma.casino.findMany({
    where: { slug: { in: casinoRealCatalog.map((definition) => definition.slug) } },
    select: { slug: true, editorialReview: { select: { status: true, publishedRevisionId: true, revisions: { select: { id: true, content: true } } } } },
  });
  const bySlug = new Map(records.map((record) => [record.slug, record.editorialReview]));
  return casinoRealCatalog.flatMap((definition) => {
    const review = bySlug.get(definition.slug);
    const publishedRevision = review?.revisions.find((revision) => revision.id === review.publishedRevisionId);
    return review?.status === "PUBLISHED" && same(publishedRevision?.content, casinoCatalogEditorialDocument(definition)) ? [] : [definition.slug];
  });
}

async function preflight(options: { allowReleaseRecovery?: boolean } = {}) {
  assertCommercialVisibilityCatalog();
  const [manifest, migrations, routes, casinos, gentlemanJim, networkCandidates, redirectConflicts] = await Promise.all([
    releaseManifest(), migrationState(), evidenceAuthority(),
    prisma.casino.findMany({ where: { slug: { in: ["betsson", "skol-casino", "hello-casino", "gday-casino", "diamond7", "dragonbet", "21-prive", "slotnite"] } }, select: { id: true, slug: true, status: true, trackingMetadata: true } }),
    prisma.casino.findUnique({ where: { slug: "gentleman-jim" }, select: { status: true } }),
    prisma.affiliateNetwork.findMany({ where: { OR: [{ slug: "superfly-partners" }, { name: { equals: "Superfly Partners", mode: "insensitive" } }] }, select: { id: true, slug: true, name: true, type: true, active: true, archivedAt: true } }),
    prisma.affiliateRedirectSlug.findMany({ where: { slug: { in: superflyCommercialCatalog.map((definition) => `${definition.slug}-welcome`) } }, select: { slug: true, casino: { select: { slug: true } } } }),
  ]);
  await assertRepositoryTarget();
  if (migrations.unfinished || !migrations.targetApplied || !migrations.targetChecksumMatches) throw new Error("Database migration target is not safe.");
  const recoverableStatuses: EditorialStatus[] = [EditorialStatus.DRAFT, EditorialStatus.IN_REVIEW, EditorialStatus.APPROVED, EditorialStatus.SCHEDULED];
  const invalidCasino = casinos.some((casino) => {
    if (casino.id.startsWith("demo-")) return true;
    if (casino.status === EditorialStatus.PUBLISHED) return false;
    return !(options.allowReleaseRecovery
      && recoverableStatuses.includes(casino.status)
      && object(casino.trackingMetadata).commercialVisibilityRelease === CASINO_COMMERCIAL_VISIBILITY_RELEASE);
  });
  if (casinos.length !== 8 || invalidCasino) throw new Error("The exact eight real casino identities are not in a published or release-recoverable state.");
  if (gentlemanJim?.status === "PUBLISHED") throw new Error("Gentleman Jim is unexpectedly published.");
  if (networkCandidates.length > 1) throw new Error("Multiple Superfly network identities require manual reconciliation.");
  for (const conflict of redirectConflicts) if (conflict.casino.slug !== conflict.slug.replace(/-welcome$/, "")) throw new Error(`Redirect slug conflict: ${conflict.slug}`);
  return { manifest, migrations, routes, casinos, gentlemanJim: gentlemanJim?.status ?? "ABSENT", networkCandidates };
}

async function verify() {
  const state = await preflight();
  const issues = (await Promise.all(superflyCommercialCatalog.map(definitionIssues))).flat();
  issues.push(...(await catalogEditorialIssues()).map((slug) => `${slug}: editorial review`));
  const casinoIds = state.casinos.filter((casino) => superflyCommercialCatalog.some((definition) => definition.slug === casino.slug)).map((casino) => casino.id);
  const matrix: Record<string, Record<string, "ON" | "OFF">> = {};
  for (const countryCode of [...allowedCountries, ...superflyBlockedCountries]) {
    const candidates = await partnerRouteRepository.listCandidates(casinoIds, countryCode);
    const projected = projectPartnerRoutes(candidates, { countryCode, now: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), commercialAllowed: true, referralAllowed: true, redirectEnabled: true });
    matrix[countryCode] = Object.fromEntries(superflyCommercialCatalog.map((definition) => [definition.slug, projected.some((route) => route.casino.slug === definition.slug && route.productionEligible) ? "ON" : "OFF"]));
  }
  for (const countryCode of allowedCountries) for (const stateValue of Object.values(matrix[countryCode])) if (stateValue !== "ON") issues.push(`${countryCode}: expected all Superfly routes ON`);
  for (const countryCode of superflyBlockedCountries) for (const stateValue of Object.values(matrix[countryCode])) if (stateValue !== "OFF") issues.push(`${countryCode}: expected all Superfly routes OFF`);
  const counts = {
    realCasinos: await prisma.casino.count({ where: { slug: { in: ["betsson", "skol-casino", "hello-casino", "gday-casino", "diamond7", "dragonbet", "21-prive", "slotnite"] }, status: "PUBLISHED" } }),
    globalPayments: await prisma.casinoPaymentMethod.count({ where: { casinoId: { in: casinoIds }, casinoCountryId: null } }),
    globalProviders: await prisma.casinoGameProvider.count({ where: { casinoId: { in: casinoIds }, casinoCountryId: null } }),
    globalCategories: await prisma.casinoGameCategory.count({ where: { casinoId: { in: casinoIds }, casinoCountryId: null } }),
    publishedBonuses: await prisma.casinoBonus.count({ where: { casinoId: { in: casinoIds }, casinoCountryId: null, status: "PUBLISHED", offerStatus: "ACTIVE" } }),
    activePrograms: await prisma.affiliateProgram.count({ where: { id: { in: superflyCommercialCatalog.map((definition) => identities(definition).program) }, status: "ACTIVE", workflowStatus: "PUBLISHED" } }),
    activeOffers: await prisma.affiliateOffer.count({ where: { id: { in: superflyCommercialCatalog.map((definition) => identities(definition).offer) }, status: "ACTIVE" } }),
    activeTrackingLinks: await prisma.affiliateTrackingLink.count({ where: { id: { in: superflyCommercialCatalog.map((definition) => identities(definition).tracking) }, active: true } }),
    activeRedirects: await prisma.affiliateRedirectSlug.count({ where: { id: { in: superflyCommercialCatalog.map((definition) => identities(definition).redirect) }, active: true, archivedAt: null } }),
    detectedBlocks: await prisma.affiliateTrackingLinkCountry.count({ where: { trackingLinkId: { in: superflyCommercialCatalog.map((definition) => identities(definition).tracking) }, mode: "BLOCK", productionEligible: false } }),
  };
  if (counts.realCasinos !== 8 || counts.publishedBonuses !== 6 || counts.activePrograms !== 6 || counts.activeOffers !== 6 || counts.activeTrackingLinks !== 6 || counts.activeRedirects !== 6 || counts.detectedBlocks !== 42) issues.push("Final release counts differ from the bounded manifest.");
  console.info(JSON.stringify({ release: CASINO_COMMERCIAL_VISIBILITY_RELEASE, databaseTargetFingerprint: databaseTargetFingerprint(), counts, matrix, issues, rawTrackingUrlsEmitted: 0, destructiveWrites: 0 }, null, 2));
  if (issues.length) throw new Error(`Commercial visibility verification failed with ${issues.length} issue(s).`);
}

async function audit() {
  const state = await preflight();
  const definitionIssueGroups = await Promise.all(superflyCommercialCatalog.map(async (definition) => [definition.slug, (await definitionIssues(definition)).length] as const));
  const pendingEditorialSlugs = await catalogEditorialIssues();
  const pendingIssueCount = definitionIssueGroups.reduce((total, [, count]) => total + count, 0) + pendingEditorialSlugs.length;
  console.info(JSON.stringify({ release: CASINO_COMMERCIAL_VISIBILITY_RELEASE, databaseTargetFingerprint: databaseTargetFingerprint(), projectId: PROJECT_ID, migrations: state.migrations, manifestBrands: state.manifest.brands.length, realCasinoCount: state.casinos.length, gentlemanJim: state.gentlemanJim, currentSuperflyNetworkIdentities: state.networkCandidates.length, pendingIssueCount, pendingDefinitionIssues: Object.fromEntries(definitionIssueGroups), pendingEditorialSlugs, routeEvidenceVerified: state.routes.size, rawTrackingUrlsEmitted: 0, destructiveWrites: 0 }, null, 2));
}

async function main() {
  const mode = process.argv[2] as Mode | undefined;
  if (!mode || !["audit", "seed", "verify"].includes(mode)) throw new Error("Usage: casino-commercial-visibility-03.ts <audit|seed|verify>");
  try {
    if (mode === "seed") throw new Error("CASINO_COMMERCIAL_VISIBILITY_SEED_RETIRED_BY_PR4");
    if (mode === "audit") await audit();
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
