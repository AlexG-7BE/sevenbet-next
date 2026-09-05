import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { EditorialStatus, Prisma } from "@prisma/client";

import { readCasinoEditorMetadata, writeCasinoEditorMetadata } from "../lib/casino-builder/editor-metadata";
import {
  CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT,
  CASINO_COMMERCIAL_VISIBILITY_RELEASE,
  assertCommercialVisibilityCatalog,
  superflyBlockEvidence,
  superflyBlockedCountries,
  superflyCommercialCatalog,
  type CommercialCatalogDefinition,
} from "../lib/casino-commercial-visibility/catalog";
import { casinoCatalogEditorialDocument, casinoRealCatalog, casinoRealCatalogBySlug } from "../lib/casino-real-catalog/catalog";
import prisma from "../lib/db/prisma";
import { deterministicCasinoIngestionId } from "../lib/casino-ingestion/importer";
import { projectPartnerRoutes } from "../lib/affiliate-routing/partner-route-projection";
import { extractHashBoundSuperflyCampaignDestination } from "../lib/affiliate-routing/superfly-destination-evidence";
import { partnerRouteRepository } from "../lib/repositories/partner-route.repository";
import { casinoService } from "../lib/services/casino.service";
import { editorialReviewService } from "../lib/services/editorial-review.service";

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

function assertWriteAuthority() {
  if (process.env.CASINO_COMMERCIAL_VISIBILITY_CONFIRM !== CASINO_COMMERCIAL_VISIBILITY_RELEASE) throw new Error(`Write refused. Set CASINO_COMMERCIAL_VISIBILITY_CONFIRM=${CASINO_COMMERCIAL_VISIBILITY_RELEASE}.`);
  if (process.env.ALLOW_CASINO_COMMERCIAL_VISIBILITY_WRITE !== "true") throw new Error("Write refused without the bounded write flag.");
  const target = process.env.CASINO_COMMERCIAL_VISIBILITY_TARGET;
  if (target !== "production" && target !== "preview") throw new Error("Write refused without an explicit production or preview target.");
  if (process.env.VERCEL_ENV !== target) throw new Error("Write refused because VERCEL_ENV differs from the explicit target.");
  const expected = process.env.CASINO_COMMERCIAL_VISIBILITY_DATABASE_FINGERPRINT?.trim();
  const actual = databaseTargetFingerprint();
  if (!expected || expected !== actual) throw new Error(`Write refused. Independently verify and set CASINO_COMMERCIAL_VISIBILITY_DATABASE_FINGERPRINT=${actual}.`);
}

async function actor() {
  const record = await prisma.adminUser.findFirst({ where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } }, orderBy: [{ role: "asc" }, { createdAt: "asc" }], select: { id: true } });
  if (!record) throw new Error("No governed CMS actor is available.");
  return record.id;
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

function commercialVisibilityMetadata(definition: CommercialCatalogDefinition) {
  return {
    authority: CASINO_COMMERCIAL_VISIBILITY_RELEASE,
    productionEligibleByDefault: true,
    blockedCountries: superflyBlockedCountries,
    evidenceId: definition.evidence.routeId,
    canonicalUrlSha256: definition.evidence.canonicalUrlSha256,
    observedAt: CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT,
    availabilityMeaning: "A real route with no detected block; not a regulator or partner-approval claim.",
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

async function syncEditorial(definition: { slug: (typeof casinoRealCatalog)[number]["slug"] }, casinoId: string, actorId: string) {
  const editorialDefinition = casinoRealCatalogBySlug.get(definition.slug);
  if (!editorialDefinition) throw new Error(`${definition.slug} is absent from the eight-casino editorial catalog.`);
  let review = await editorialReviewService.getByCasinoId(casinoId);
  if (review && review.status !== "DRAFT") review = await editorialReviewService.transition(review.id, "DRAFT", actorId);
  review = await editorialReviewService.saveDraft(casinoId, casinoCatalogEditorialDocument(editorialDefinition), `${CASINO_COMMERCIAL_VISIBILITY_RELEASE}: global catalog and commercial separation`, actorId);
  review = await editorialReviewService.transition(review.id, "IN_REVIEW", actorId);
  review = await editorialReviewService.transition(review.id, "APPROVED", actorId);
  const revision = review.revisions.find((entry) => entry.revisionNumber === review?.draftRevisionNumber);
  if (!revision) throw new Error(`${definition.slug} editorial revision was not created.`);
  await editorialReviewService.publish(review.id, revision.id, actorId);
}

async function syncDefinition(definition: CommercialCatalogDefinition, actorId: string, networkId: string, routeUrl: string) {
  const before = await definitionIssues(definition);
  if (!before.length) return { slug: definition.slug, status: "unchanged" as const };
  const keys = identities(definition);
  let aggregate = await casinoService.getCasinoById((await prisma.casino.findUniqueOrThrow({ where: { slug: definition.slug }, select: { id: true } })).id);
  if (aggregate.id.startsWith("demo-")) throw new Error(`${definition.slug} resolved to a synthetic identity.`);
  if (aggregate.status !== EditorialStatus.DRAFT) aggregate = await casinoService.transitionWorkflow(aggregate.id, EditorialStatus.DRAFT, actorId, aggregate.updatedAt);
  const editorMetadata = readCasinoEditorMetadata(aggregate.reviewBlocks);
  editorMetadata.general = { ...editorMetadata.general, supportsMobile: true, internalNotes: `${CASINO_COMMERCIAL_VISIBILITY_RELEASE}; global evidence and CTA authority are independent.` };
  const governedBonusMetadata = editorMetadata.bonuses[keys.bonus] ?? {
    internalName: definition.bonus.title,
    shortTerms: definition.bonus.wageringText,
    amount: String(definition.bonus.maximumBonus),
    wageringBase: definition.slug === "hello-casino" ? "DEPOSIT_AND_BONUS" : "OTHER",
    minimumOdds: null,
    maximumBet: null,
    eligibleGames: [],
    excludedGames: [],
    eligiblePaymentMethods: [],
    excludedPaymentMethods: [],
    newPlayersOnly: true,
    existingPlayersAllowed: false,
    promoCode: null,
    evergreen: true,
    featured: false,
    exclusive: false,
    notes: null,
    geoMode: "GLOBAL" as const,
    allowedCountries: [],
    blockedCountries: [],
  };
  editorMetadata.bonuses = {
    ...editorMetadata.bonuses,
    [keys.bonus]: {
      ...governedBonusMetadata,
      amount: String(definition.bonus.maximumBonus),
      maximumBet: definition.bonus.maximumBet === null ? null : String(definition.bonus.maximumBet),
      notes: `${CASINO_COMMERCIAL_VISIBILITY_RELEASE}; offer evidence ${definition.evidence.offerId}; global researched offer.`,
    },
  };
  await prisma.casino.update({
    where: { id: aggregate.id },
    data: {
      foundedYear: definition.foundedYear,
      languages: definition.languages,
      currencies: definition.currencies,
      responsibleGamblingTools: definition.responsibleGamblingTools,
      lastReviewedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT),
      trackingMetadata: { ...object(aggregate.trackingMetadata), commercialVisibilityRelease: CASINO_COMMERCIAL_VISIBILITY_RELEASE, globalCatalogEvidenceId: definition.evidence.catalogId },
      reviewBlocks: writeCasinoEditorMetadata(object(aggregate.reviewBlocks), editorMetadata),
      updatedBy: actorId,
    },
  });
  for (const [sortOrder, payment] of definition.payments.entries()) await prisma.casinoPaymentMethod.upsert({
    where: { id: id(definition.slug, "payment", payment.key) },
    create: { id: id(definition.slug, "payment", payment.key), casinoId: aggregate.id, casinoCountryId: null, methodKey: payment.key, name: payment.name, supportsDeposits: payment.supportsDeposits, supportsWithdrawals: payment.supportsWithdrawals, currencies: payment.currencies, maximumWithdrawal: payment.maximumWithdrawal, withdrawalTime: payment.withdrawalTime, crypto: false, lastVerifiedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), notes: payment.notes, sortOrder },
    update: { casinoId: aggregate.id, casinoCountryId: null, methodKey: payment.key, name: payment.name, supportsDeposits: payment.supportsDeposits, supportsWithdrawals: payment.supportsWithdrawals, currencies: payment.currencies, maximumWithdrawal: payment.maximumWithdrawal, withdrawalTime: payment.withdrawalTime, crypto: false, lastVerifiedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), notes: payment.notes, sortOrder },
  });
  for (const [sortOrder, provider] of definition.providers.entries()) await prisma.casinoGameProvider.upsert({
    where: { id: id(definition.slug, "provider", provider.key) },
    create: { id: id(definition.slug, "provider", provider.key), casinoId: aggregate.id, casinoCountryId: null, providerKey: provider.key, name: provider.name, liveCasino: provider.liveCasino, verifiedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), sortOrder },
    update: { casinoId: aggregate.id, casinoCountryId: null, providerKey: provider.key, name: provider.name, liveCasino: provider.liveCasino, verifiedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), sortOrder },
  });
  for (const [sortOrder, category] of definition.categories.entries()) await prisma.casinoGameCategory.upsert({
    where: { id: id(definition.slug, "category", category.key) },
    create: { id: id(definition.slug, "category", category.key), casinoId: aggregate.id, casinoCountryId: null, categoryKey: category.key, name: category.name, gameCount: category.gameCount, featured: sortOrder === 0, sortOrder },
    update: { casinoId: aggregate.id, casinoCountryId: null, categoryKey: category.key, name: category.name, gameCount: category.gameCount, featured: sortOrder === 0, sortOrder },
  });
  await prisma.casinoBonus.upsert({
    where: { id: keys.bonus },
    create: { id: keys.bonus, casinoId: aggregate.id, casinoCountryId: null, slug: definition.bonus.slug, title: definition.bonus.title, summary: definition.bonus.summary, type: "WELCOME", percentage: definition.bonus.percentage, minimumDeposit: definition.bonus.minimumDeposit, maximumBonus: definition.bonus.maximumBonus, currency: definition.bonus.currency, freeSpins: definition.bonus.freeSpins, wageringMultiplier: definition.bonus.wageringMultiplier, wageringText: definition.bonus.wageringText, eligibility: definition.bonus.eligibility, importantConditions: definition.bonus.importantConditions, status: "DRAFT", domainLifecycleStatus: "ACTIVE", offerStatus: "ACTIVE", lastVerifiedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), sortOrder: 0, createdBy: actorId, updatedBy: actorId },
    update: { casinoId: aggregate.id, casinoCountryId: null, slug: definition.bonus.slug, title: definition.bonus.title, summary: definition.bonus.summary, type: "WELCOME", percentage: definition.bonus.percentage, minimumDeposit: definition.bonus.minimumDeposit, maximumBonus: definition.bonus.maximumBonus, currency: definition.bonus.currency, freeSpins: definition.bonus.freeSpins, wageringMultiplier: definition.bonus.wageringMultiplier, wageringText: definition.bonus.wageringText, eligibility: definition.bonus.eligibility, importantConditions: definition.bonus.importantConditions, domainLifecycleStatus: "ACTIVE", offerStatus: "ACTIVE", lastVerifiedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), sortOrder: 0, updatedBy: actorId },
  });
  if (definition.media) {
    const diskPath = path.join(process.cwd(), "public", definition.media.path.replace(/^\//, ""));
    const bytes = await readFile(diskPath);
    await prisma.mediaAsset.upsert({
      where: { storageKey: `${CASINO_COMMERCIAL_VISIBILITY_RELEASE.toLowerCase()}/${definition.slug}/${path.basename(definition.media.path)}` },
      create: { id: keys.media, type: "HERO", storageProvider: "LOCAL", storageKey: `${CASINO_COMMERCIAL_VISIBILITY_RELEASE.toLowerCase()}/${definition.slug}/${path.basename(definition.media.path)}`, publicUrl: definition.media.path, originalFilename: path.basename(definition.media.path), mimeType: definition.media.mimeType, width: definition.media.width, height: definition.media.height, sizeBytes: bytes.length, altText: `${definition.title} controlled partner creative`, title: `${definition.title} controlled partner media`, caption: "Controlled media shown independently of CTA availability.", credit: "Superfly Partners", sortOrder: -90, featured: true, status: "ACTIVE", checksum: definition.media.checksum, metadata: { release: CASINO_COMMERCIAL_VISIBILITY_RELEASE, evidenceId: definition.media.evidenceId, role: definition.media.role }, createdBy: actorId, casinoId: aggregate.id },
      update: { publicUrl: definition.media.path, originalFilename: path.basename(definition.media.path), mimeType: definition.media.mimeType, width: definition.media.width, height: definition.media.height, sizeBytes: bytes.length, altText: `${definition.title} controlled partner creative`, title: `${definition.title} controlled partner media`, caption: "Controlled media shown independently of CTA availability.", credit: "Superfly Partners", sortOrder: -90, featured: true, status: "ACTIVE", checksum: definition.media.checksum, metadata: { release: CASINO_COMMERCIAL_VISIBILITY_RELEASE, evidenceId: definition.media.evidenceId, role: definition.media.role }, archivedAt: null, casinoId: aggregate.id, casinoCountryId: null, casinoBonusId: null, affiliateOfferId: null },
    });
  }
  const visibility = commercialVisibilityMetadata(definition);
  await prisma.affiliateProgram.upsert({
    where: { id: keys.program },
    create: { id: keys.program, networkId, casinoId: aggregate.id, externalProgramId: `${CASINO_COMMERCIAL_VISIBILITY_RELEASE}:${definition.slug}`, name: `${definition.title} — Superfly Partners`, operator: "White Hat Gaming Limited", status: "ACTIVE", domainLifecycleStatus: "ACTIVE", workflowStatus: "PUBLISHED", providerType: "MANUAL", connectionStatus: "CONNECTED", integrationMode: "MANUAL", supportedCountries: [], supportedCurrencies: definition.currencies, metadata: { commercialVisibility: visibility }, sourceOfTruth: { release: CASINO_COMMERCIAL_VISIBILITY_RELEASE, catalogEvidenceId: definition.evidence.catalogId, routeEvidenceId: definition.evidence.routeId }, trustedAutoActivation: false, notes: "Bounded Founder-authorized global-default route; availability is not an approval claim.", createdBy: actorId, updatedBy: actorId },
    update: { networkId, casinoId: aggregate.id, externalProgramId: `${CASINO_COMMERCIAL_VISIBILITY_RELEASE}:${definition.slug}`, name: `${definition.title} — Superfly Partners`, operator: "White Hat Gaming Limited", status: "ACTIVE", domainLifecycleStatus: "ACTIVE", workflowStatus: "PUBLISHED", connectionStatus: "CONNECTED", integrationMode: "MANUAL", supportedCountries: [], supportedCurrencies: definition.currencies, metadata: { commercialVisibility: visibility }, sourceOfTruth: { release: CASINO_COMMERCIAL_VISIBILITY_RELEASE, catalogEvidenceId: definition.evidence.catalogId, routeEvidenceId: definition.evidence.routeId }, trustedAutoActivation: false, archivedAt: null, notes: "Bounded Founder-authorized global-default route; availability is not an approval claim.", updatedBy: actorId },
  });
  await prisma.affiliateOffer.upsert({
    where: { id: keys.offer },
    create: { id: keys.offer, programId: keys.program, casinoId: aggregate.id, casinoBonusId: keys.bonus, externalOfferId: `${CASINO_COMMERCIAL_VISIBILITY_RELEASE}:${definition.slug}:welcome`, externalName: definition.bonus.title, internalName: `${definition.title} current welcome offer`, publicLabel: definition.bonus.title, offerType: "WELCOME", status: "ACTIVE", domainLifecycleStatus: "ACTIVE", payoutModel: "UNKNOWN", geoMode: "BLOCK", languages: [], devices: [], evergreen: true, featured: false, priority: 0, terms: definition.bonus.importantConditions.join(" "), notes: "Informational offer publication and CTA eligibility are independent.", metadata: { release: CASINO_COMMERCIAL_VISIBILITY_RELEASE, offerEvidenceId: definition.evidence.offerId }, sourceUpdatedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), lastSyncedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), createdBy: actorId, updatedBy: actorId },
    update: { programId: keys.program, casinoId: aggregate.id, casinoBonusId: keys.bonus, externalOfferId: `${CASINO_COMMERCIAL_VISIBILITY_RELEASE}:${definition.slug}:welcome`, externalName: definition.bonus.title, internalName: `${definition.title} current welcome offer`, publicLabel: definition.bonus.title, offerType: "WELCOME", status: "ACTIVE", domainLifecycleStatus: "ACTIVE", geoMode: "BLOCK", languages: [], devices: [], evergreen: true, featured: false, priority: 0, terms: definition.bonus.importantConditions.join(" "), notes: "Informational offer publication and CTA eligibility are independent.", metadata: { release: CASINO_COMMERCIAL_VISIBILITY_RELEASE, offerEvidenceId: definition.evidence.offerId }, sourceUpdatedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), lastSyncedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), archivedAt: null, updatedBy: actorId },
  });
  await prisma.affiliateOfferCurrency.upsert({ where: { offerId_currencyCode: { offerId: keys.offer, currencyCode: "EUR" } }, create: { id: id(definition.slug, "offer-currency", "EUR"), offerId: keys.offer, currencyCode: "EUR" }, update: {} });
  for (const countryCode of superflyBlockedCountries) await prisma.affiliateOfferCountry.upsert({ where: { offerId_countryCode: { offerId: keys.offer, countryCode } }, create: { id: id(definition.slug, "offer-block", countryCode), offerId: keys.offer, countryCode, mode: "BLOCK" }, update: { mode: "BLOCK" } });
  const previousTracking = await prisma.affiliateTrackingLink.findUnique({ where: { id: keys.tracking }, select: { destinationUrl: true, trackingUrl: true } });
  await prisma.affiliateTrackingLink.upsert({
    where: { id: keys.tracking },
    create: { id: keys.tracking, offerId: keys.offer, externalLinkId: `${CASINO_COMMERCIAL_VISIBILITY_RELEASE}:${definition.slug}`, label: `${definition.title} canonical campaign route`, destinationUrl: routeUrl, trackingUrl: routeUrl, geoMode: "BLOCK", active: true, priority: 100, source: "COMMERCIAL_CRM", verifiedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), lastCheckedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), metadata: { commercialVisibility: visibility }, creativeReference: definition.media?.evidenceId ?? null, createdBy: actorId, updatedBy: actorId },
    update: { offerId: keys.offer, externalLinkId: `${CASINO_COMMERCIAL_VISIBILITY_RELEASE}:${definition.slug}`, label: `${definition.title} canonical campaign route`, destinationUrl: routeUrl, trackingUrl: routeUrl, geoMode: "BLOCK", active: true, priority: 100, source: "COMMERCIAL_CRM", verifiedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), lastCheckedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), metadata: { commercialVisibility: visibility }, creativeReference: definition.media?.evidenceId ?? null, archivedAt: null, updatedBy: actorId },
  });
  if (!previousTracking || previousTracking.destinationUrl !== routeUrl || previousTracking.trackingUrl !== routeUrl) {
    const latest = await prisma.affiliateTrackingLinkRevision.findFirst({ where: { trackingLinkId: keys.tracking }, orderBy: { revisionNumber: "desc" }, select: { revisionNumber: true } });
    await prisma.affiliateTrackingLinkRevision.create({ data: { trackingLinkId: keys.tracking, revisionNumber: (latest?.revisionNumber ?? 0) + 1, destinationUrl: routeUrl, trackingUrl: routeUrl, summary: `${CASINO_COMMERCIAL_VISIBILITY_RELEASE}: canonical CRM route reconciled`, createdBy: actorId } });
  }
  for (const countryCode of superflyBlockedCountries) await prisma.affiliateTrackingLinkCountry.upsert({
    where: { trackingLinkId_countryCode: { trackingLinkId: keys.tracking, countryCode } },
    create: { id: id(definition.slug, "tracking-block", countryCode), trackingLinkId: keys.tracking, countryCode, mode: "BLOCK", productionEligible: false, productionEligibilityVerifiedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), productionEligibilityEvidence: superflyBlockEvidence[countryCode].join(","), productionEligibilityNotes: "Detected legal, regulatory, contractual or account restriction." },
    update: { mode: "BLOCK", productionEligible: false, productionEligibilityVerifiedAt: new Date(CASINO_COMMERCIAL_VISIBILITY_OBSERVED_AT), productionEligibilityExpiresAt: null, productionEligibilityEvidence: superflyBlockEvidence[countryCode].join(","), productionEligibilityNotes: "Detected legal, regulatory, contractual or account restriction." },
  });
  await prisma.affiliateRedirectSlug.upsert({
    where: { slug: `${definition.slug}-welcome` },
    create: { id: keys.redirect, slug: `${definition.slug}-welcome`, casinoId: aggregate.id, casinoBonusId: keys.bonus, affiliateOfferId: keys.offer, active: true, createdBy: actorId, updatedBy: actorId },
    update: { casinoId: aggregate.id, casinoBonusId: keys.bonus, affiliateOfferId: keys.offer, defaultCurrency: null, defaultLanguage: null, active: true, archivedAt: null, updatedBy: actorId },
  });
  await prisma.auditLog.create({ data: { actorId, action: "casino_commercial_visibility_reconciled", entityType: "casino", entityId: aggregate.id, summary: `${CASINO_COMMERCIAL_VISIBILITY_RELEASE}: global catalog, offer, media and governed route reconciled`, metadata: { release: CASINO_COMMERCIAL_VISIBILITY_RELEASE, slug: definition.slug, routeEvidenceId: definition.evidence.routeId, blockedCountries: superflyBlockedCountries } } });
  aggregate = await casinoService.getCasinoById(aggregate.id);
  aggregate = await casinoService.transitionWorkflow(aggregate.id, EditorialStatus.IN_REVIEW, actorId, aggregate.updatedAt);
  aggregate = await casinoService.transitionWorkflow(aggregate.id, EditorialStatus.APPROVED, actorId, aggregate.updatedAt);
  await casinoService.publishCasino(aggregate.id, actorId, aggregate.updatedAt);
  return { slug: definition.slug, status: "published" as const, reconciledIssues: before.length };
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

async function seed() {
  assertWriteAuthority();
  const state = await preflight({ allowReleaseRecovery: true });
  const pendingIssues = (await Promise.all(superflyCommercialCatalog.map(definitionIssues))).flat();
  const pendingEditorialSlugs = await catalogEditorialIssues();
  const existingNetwork = state.networkCandidates[0] ?? null;
  const networkIsCurrent = Boolean(existingNetwork
    && existingNetwork.slug === "superfly-partners"
    && existingNetwork.name === "Superfly Partners"
    && existingNetwork.type === "OTHER"
    && existingNetwork.active
    && !existingNetwork.archivedAt);
  if (!pendingIssues.length && !pendingEditorialSlugs.length && networkIsCurrent) {
    console.info(JSON.stringify({ release: CASINO_COMMERCIAL_VISIBILITY_RELEASE, databaseTargetFingerprint: databaseTargetFingerprint(), results: superflyCommercialCatalog.map((definition) => ({ slug: definition.slug, status: "unchanged" })), destructiveWrites: 0 }, null, 2));
    await verify();
    return;
  }
  const actorId = await actor();
  let network = existingNetwork;
  if (!network) network = await prisma.affiliateNetwork.create({ data: { id: id("network"), name: "Superfly Partners", slug: "superfly-partners", type: "OTHER", active: true, notes: `${CASINO_COMMERCIAL_VISIBILITY_RELEASE}: source-controlled CRM authority`, createdBy: actorId, updatedBy: actorId }, select: { id: true, slug: true, name: true, type: true, active: true, archivedAt: true } });
  else if (!networkIsCurrent) network = await prisma.affiliateNetwork.update({ where: { id: network.id }, data: { name: "Superfly Partners", slug: "superfly-partners", type: "OTHER", active: true, archivedAt: null, updatedBy: actorId }, select: { id: true, slug: true, name: true, type: true, active: true, archivedAt: true } });
  const results = [];
  for (const definition of superflyCommercialCatalog) results.push(await syncDefinition(definition, actorId, network.id, state.routes.get(definition.slug)!));
  const editorialResults = [];
  for (const slug of pendingEditorialSlugs) {
    const casino = state.casinos.find((record) => record.slug === slug);
    if (!casino) throw new Error(`${slug}: real casino identity missing for editorial reconciliation.`);
    await syncEditorial({ slug }, casino.id, actorId);
    editorialResults.push({ slug, status: "published" });
  }
  console.info(JSON.stringify({ release: CASINO_COMMERCIAL_VISIBILITY_RELEASE, databaseTargetFingerprint: databaseTargetFingerprint(), results, editorialResults, destructiveWrites: 0 }, null, 2));
  await verify();
}

async function main() {
  const mode = process.argv[2] as Mode | undefined;
  if (!mode || !["audit", "seed", "verify"].includes(mode)) throw new Error("Usage: casino-commercial-visibility-03.ts <audit|seed|verify>");
  try {
    if (mode === "audit") await audit();
    if (mode === "seed") await seed();
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
