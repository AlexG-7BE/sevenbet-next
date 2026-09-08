import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { Prisma } from "@prisma/client";

import { CASINO_COMMERCIAL_VISIBILITY_RELEASE } from "../lib/casino-commercial-visibility/catalog";
import {
  assertMediaGeo3Schema,
  inspectMediaGeo3,
  mediaGeo3MigrationChecksum,
  mediaGeo3RepositoryMigrations,
  planMediaGeo3Preflight,
} from "../lib/db/media-geo3-0033-release";
import prisma from "../lib/db/prisma";
import { resolveCasinoMedia } from "../lib/media/casino-media-resolver";
import {
  MEDIA_GEO3_CATALOG_PLACEMENTS,
  MEDIA_GEO3_CATALOG_VERSION,
  MEDIA_GEO3_PREFLIGHT_DEVICES,
  MEDIA_GEO3_PREFLIGHT_TARGET,
  MEDIA_GEO3_RELEASE,
  assertMediaGeo3Catalog,
  mediaGeo3Id,
  mediaGeo3IdentityKey,
  mediaGeo3PayloadHash,
} from "../lib/media/media-geo3-catalog";
import type { PlacementMediaAssignment, PlacementMediaAsset } from "../lib/media/placement-media";

if (!process.env.DATABASE_URL?.trim() && process.env.PRODDB_DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = process.env.PRODDB_DATABASE_URL;
}

type Mode = "audit" | "backfill" | "verify";
type MigrationRow = { migration_name: string; checksum: string; finished_at: Date | null; rolled_back_at: Date | null };

const PROJECT_ID = "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb";
const ORG_ID = "team_WhkUGuXZeIMlU1uFHtowNUqa";
const SOURCE = "FOUNDER_AUTHORIZED_MEDIA_GEO3";

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function jsonObject(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Prisma.JsonObject : {};
}

function databaseTargetFingerprint() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return "UNAVAILABLE";
  const target = new URL(raw);
  return sha256([target.hostname, target.username, target.pathname, target.port || "5432"].join("\n"));
}

async function assertRepositoryTarget() {
  const project = JSON.parse(await readFile(path.join(process.cwd(), ".vercel", "project.json"), "utf8")) as { projectId?: string; orgId?: string };
  if (project.projectId !== PROJECT_ID || project.orgId !== ORG_ID) {
    throw new Error("MEDIA-GEO3 Vercel project identity does not match the governed B4GAMBLE target.");
  }
}

function assertWriteAuthority() {
  if (process.env.MEDIA_GEO3_CONFIRM !== MEDIA_GEO3_RELEASE) {
    throw new Error(`Write refused. Set MEDIA_GEO3_CONFIRM=${MEDIA_GEO3_RELEASE}.`);
  }
  if (process.env.ALLOW_MEDIA_GEO3_WRITE !== "true") throw new Error("Write refused without the bounded MEDIA-GEO3 write flag.");
  if (process.env.MEDIA_GEO3_TARGET !== "production" || process.env.VERCEL_ENV !== "production") {
    throw new Error("Write refused unless both MEDIA_GEO3_TARGET and VERCEL_ENV explicitly identify Production.");
  }
  const actual = databaseTargetFingerprint();
  if (!process.env.MEDIA_GEO3_DATABASE_FINGERPRINT?.trim() || process.env.MEDIA_GEO3_DATABASE_FINGERPRINT !== actual) {
    throw new Error(`Write refused. Independently verify and set MEDIA_GEO3_DATABASE_FINGERPRINT=${actual}.`);
  }
}

async function migrationRows() {
  return prisma.$queryRawUnsafe<MigrationRow[]>(
    'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
  );
}

async function verifySourceFile(definition: ReturnType<typeof assertMediaGeo3Catalog>[number]) {
  if (!definition.media) throw new Error(`${definition.slug}: exact current-offer media is missing.`);
  const bytes = await readFile(path.join(process.cwd(), "public", definition.media.path.replace(/^\//, "")));
  if (sha256(bytes) !== definition.media.checksum) throw new Error(`${definition.slug}: source-controlled media checksum mismatch.`);
  return bytes.length;
}

async function exactSource(definition: ReturnType<typeof assertMediaGeo3Catalog>[number]) {
  if (!definition.media) throw new Error(`${definition.slug}: exact current-offer media is missing.`);
  const fileSize = await verifySourceFile(definition);
  const casino = await prisma.casino.findUnique({
    where: { slug: definition.slug },
    select: { id: true, title: true, status: true, archivedAt: true },
  });
  if (!casino || casino.status !== "PUBLISHED" || casino.archivedAt) throw new Error(`${definition.slug}: exact published Casino is unavailable.`);
  const offer = await prisma.affiliateOffer.findFirst({
    where: {
      casinoId: casino.id,
      externalOfferId: `${CASINO_COMMERCIAL_VISIBILITY_RELEASE}:${definition.slug}:welcome`,
      status: "ACTIVE",
      archivedAt: null,
    },
    include: { casinoBonus: true },
  });
  if (!offer || offer.casinoId !== casino.id || !offer.casinoBonus
    || offer.casinoBonus.status !== "PUBLISHED" || offer.casinoBonus.offerStatus !== "ACTIVE") {
    throw new Error(`${definition.slug}: exact active offer/bonus authority is unavailable.`);
  }
  const now = Date.now();
  if ((offer.startAt && offer.startAt.getTime() > now) || (offer.expiresAt && offer.expiresAt.getTime() <= now)
    || (offer.casinoBonus.startsAt && offer.casinoBonus.startsAt.getTime() > now)
    || (offer.casinoBonus.expiresAt && offer.casinoBonus.expiresAt.getTime() <= now)) {
    throw new Error(`${definition.slug}: exact offer/bonus is outside its validity window.`);
  }
  const mediaAsset = await prisma.mediaAsset.findFirst({
    where: { casinoId: casino.id, publicUrl: definition.media.path },
  });
  const metadata = jsonObject(mediaAsset?.metadata);
  if (!mediaAsset || mediaAsset.status !== "ACTIVE" || mediaAsset.archivedAt
    || mediaAsset.checksum !== definition.media.checksum
    || mediaAsset.width !== definition.media.width || mediaAsset.height !== definition.media.height
    || mediaAsset.mimeType !== definition.media.mimeType || mediaAsset.sizeBytes !== fileSize
    || metadata.role !== "CURRENT_OFFER_CREATIVE" || metadata.evidenceId !== definition.media.evidenceId) {
    throw new Error(`${definition.slug}: controlled MediaAsset differs from exact current-offer evidence.`);
  }
  const activations = await prisma.marketActivation.findMany({
    where: { casinoId: casino.id, countryCode: { in: [MEDIA_GEO3_PREFLIGHT_TARGET.countryCode, "ZZ"] } },
    select: { countryCode: true, status: true, desiredState: true, affiliateOfferId: true, globalFallbackBlockedCountries: true },
  });
  const exact = activations.find((activation) => activation.countryCode === MEDIA_GEO3_PREFLIGHT_TARGET.countryCode);
  const global = activations.find((activation) => activation.countryCode === "ZZ");
  const authority = exact
    ? exact.status === "ACTIVE" && exact.desiredState === "ACTIVE" && exact.affiliateOfferId === offer.id
    : Boolean(global && global.status === "ACTIVE" && global.desiredState === "ACTIVE"
      && global.affiliateOfferId === offer.id
      && !global.globalFallbackBlockedCountries.includes(MEDIA_GEO3_PREFLIGHT_TARGET.countryCode));
  if (!authority) throw new Error(`${definition.slug}: exact governed commercial authority is unavailable for the preflight target.`);
  return { casino, offer, mediaAsset };
}

function resolverMatrix(slug: string, source: Awaited<ReturnType<typeof exactSource>>, creativeSetId: string, revisionId: string) {
  const asset: PlacementMediaAsset = {
    id: source.mediaAsset.id,
    type: source.mediaAsset.type,
    publicUrl: source.mediaAsset.publicUrl,
    mimeType: source.mediaAsset.mimeType,
    width: source.mediaAsset.width,
    height: source.mediaAsset.height,
    altText: source.mediaAsset.altText,
    status: source.mediaAsset.status,
    archivedAt: source.mediaAsset.archivedAt,
    checksum: source.mediaAsset.checksum,
    metadata: source.mediaAsset.metadata,
    sourceMode: "FIRST_PARTY_MEDIA",
  };
  const assignments = MEDIA_GEO3_CATALOG_PLACEMENTS.map((placement) => ({
    id: mediaGeo3Id(slug, "variant", placement),
    mediaAssetId: source.mediaAsset.id,
    placement,
    variant: "DEFAULT",
    countryCode: null,
    languageCode: null,
    languageState: "NEUTRAL" as const,
    renderingMode: "CONTAIN",
    sortOrder: 0,
    active: true,
    cropSafe: false,
    affiliateOfferId: source.offer.id,
    casinoBonusId: source.offer.casinoBonusId,
    creativeSetId,
    creativeVariantId: mediaGeo3Id(slug, "variant", placement),
    mediaRevisionId: revisionId,
    purpose: "PROMOTION" as const,
    priority: 100,
    availability: "AVAILABLE" as const,
    mediaAsset: asset,
  })) satisfies PlacementMediaAssignment[];
  return MEDIA_GEO3_PREFLIGHT_DEVICES.flatMap((device) => MEDIA_GEO3_CATALOG_PLACEMENTS.map((placement) => {
    const resolution = resolveCasinoMedia({
      casino: { id: source.casino.id, name: source.casino.title },
      offer: {
        id: source.offer.id,
        status: source.offer.status,
        startAt: source.offer.startAt,
        expiresAt: source.offer.expiresAt,
        bonusStatus: source.offer.casinoBonus?.status,
        bonusOfferStatus: source.offer.casinoBonus?.offerStatus,
        bonusStartsAt: source.offer.casinoBonus?.startsAt,
        bonusExpiresAt: source.offer.casinoBonus?.expiresAt,
      },
      placement,
      country: MEDIA_GEO3_PREFLIGHT_TARGET.countryCode,
      language: MEDIA_GEO3_PREFLIGHT_TARGET.languageCode,
      device,
      commercialAuthority: true,
      context: { casinoName: source.casino.title, casinoAssignments: [], affiliateOfferAssignments: assignments, legacyMediaAssets: [] },
    });
    if (resolution.status !== "READY" || resolution.source !== "EXACT_OFFER" || resolution.exactOfferId !== source.offer.id) {
      throw new Error(`${source.casino.title}: ${device}/${placement} did not pass canonical preflight.`);
    }
    return { device, placement, resolution };
  }));
}

async function governedActor() {
  const actor = await prisma.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!actor) throw new Error("MEDIA-GEO3 could not find a governed CMS actor.");
  return actor.id;
}

async function backfillDefinition(definition: ReturnType<typeof assertMediaGeo3Catalog>[number], actorId: string) {
  const source = await exactSource(definition);
  const creativeSetId = mediaGeo3Id(definition.slug, "creative-set");
  const revisionId = mediaGeo3Id(definition.slug, "revision", "v1");
  const identityKey = mediaGeo3IdentityKey(definition.slug);
  const batchId = `${MEDIA_GEO3_CATALOG_VERSION}:${definition.slug}`;
  const idempotencyKey = `${batchId}:activate:v1`;
  const payloadHash = mediaGeo3PayloadHash({
    slug: definition.slug,
    casinoId: source.casino.id,
    affiliateOfferId: source.offer.id,
    casinoBonusId: source.offer.casinoBonusId,
    mediaAssetId: source.mediaAsset.id,
    mediaChecksum: source.mediaAsset.checksum!,
  });
  const matrix = resolverMatrix(definition.slug, source, creativeSetId, revisionId);

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${source.casino.id}:${source.offer.id}`}, 0))::text AS locked`;
    const replay = await tx.mediaRevision.findUnique({ where: { idempotencyKey } });
    if (replay) {
      if (replay.payloadHash !== payloadHash || replay.status !== "ACTIVE") {
        throw new Error(`${definition.slug}: idempotent revision exists in unexpected state.`);
      }
      return { slug: definition.slug, status: "unchanged", revisionId: replay.id };
    }
    const existingSet = await tx.mediaCreativeSet.findUnique({ where: { identityKey } });
    if (existingSet && (existingSet.id !== creativeSetId || existingSet.casinoId !== source.casino.id
      || existingSet.affiliateOfferId !== source.offer.id || existingSet.casinoBonusId !== source.offer.casinoBonusId
      || existingSet.purpose !== "PROMOTION" || existingSet.status === "ARCHIVED" || existingSet.archivedAt)) {
      throw new Error(`${definition.slug}: creative-set identity conflict.`);
    }
    if (!existingSet) await tx.mediaCreativeSet.create({ data: {
      id: creativeSetId,
      casinoId: source.casino.id,
      affiliateOfferId: source.offer.id,
      casinoBonusId: source.offer.casinoBonusId,
      identityKey,
      name: `${source.casino.title} current offer creative`,
      purpose: "PROMOTION",
      status: "DRAFT",
      provider: "SOURCE_CONTROLLED_CATALOG",
      externalCampaignId: definition.evidence.offerId,
      externalCreativeSetId: definition.media!.evidenceId,
      metadata: { release: MEDIA_GEO3_RELEASE, catalogVersion: MEDIA_GEO3_CATALOG_VERSION, role: "CURRENT_OFFER_CREATIVE" },
      createdBy: actorId,
      updatedBy: actorId,
    } });
    const previous = await tx.mediaRevision.findFirst({
      where: { casinoId: source.casino.id, affiliateOfferId: source.offer.id, status: "ACTIVE" },
      orderBy: { activatedAt: "desc" },
    });
    await tx.mediaRevision.create({ data: {
      id: revisionId,
      casinoId: source.casino.id,
      affiliateOfferId: source.offer.id,
      previousRevisionId: previous?.id ?? null,
      batchId,
      idempotencyKey,
      payloadHash,
      status: "PREPARED",
      source: SOURCE,
      summary: `${MEDIA_GEO3_RELEASE}: bounded current-offer creative for ${source.casino.title}`,
      createdBy: actorId,
    } });
    await tx.mediaCreativeVariant.createMany({ data: MEDIA_GEO3_CATALOG_PLACEMENTS.map((placement) => ({
      id: mediaGeo3Id(definition.slug, "variant", placement),
      creativeSetId,
      revisionId,
      mediaAssetId: source.mediaAsset.id,
      placement,
      variant: "DEFAULT" as const,
      countryCode: null,
      languageCode: null,
      languageState: "NEUTRAL" as const,
      renderingMode: "CONTAIN" as const,
      cropSafe: false,
      priority: 100,
      status: "PREPARED" as const,
      availability: "AVAILABLE" as const,
      sourceHash: source.mediaAsset.checksum!,
      altTextOverride: source.mediaAsset.altText,
      metadata: { release: MEDIA_GEO3_RELEASE, evidenceId: definition.media!.evidenceId },
    })) });
    await tx.mediaPreflightEntry.createMany({ data: matrix.map(({ device, placement, resolution }) => ({
      id: mediaGeo3Id(definition.slug, "preflight", device, placement),
      revisionId,
      casinoId: source.casino.id,
      affiliateOfferId: source.offer.id,
      creativeSetId,
      creativeVariantId: mediaGeo3Id(definition.slug, "variant", placement),
      mediaAssetId: source.mediaAsset.id,
      countryCode: MEDIA_GEO3_PREFLIGHT_TARGET.countryCode,
      languageCode: MEDIA_GEO3_PREFLIGHT_TARGET.languageCode,
      languageState: "EXPLICIT" as const,
      device,
      placement,
      resolutionSource: resolution.source,
      status: "READY" as const,
      assetHash: source.mediaAsset.checksum,
      result: {
        exactOfferId: source.offer.id,
        resolvedPlacement: resolution.resolvedPlacement,
        resolvedVariant: resolution.resolvedVariant,
        targetingResolution: resolution.targetingResolution,
        renderingMode: resolution.renderingMode,
      },
    })) });
    const activatedAt = new Date();
    if (previous) {
      await tx.mediaCreativeVariant.updateMany({
        where: { revisionId: previous.id, status: "ACTIVE" },
        data: { status: "INACTIVE", deactivatedAt: activatedAt },
      });
      await tx.mediaRevision.update({ where: { id: previous.id }, data: { status: "SUPERSEDED", supersededAt: activatedAt } });
    }
    await tx.mediaCreativeSet.update({ where: { id: creativeSetId }, data: { status: "ACTIVE", updatedBy: actorId } });
    await tx.mediaCreativeVariant.updateMany({ where: { revisionId }, data: { status: "ACTIVE", activatedAt } });
    await tx.mediaRevision.update({ where: { id: revisionId }, data: {
      status: "ACTIVE",
      activatedAt,
      verificationAt: activatedAt,
      verificationResult: { preflight: "READY", cells: matrix.length, release: MEDIA_GEO3_RELEASE },
    } });
    await tx.auditLog.create({ data: {
      actorId,
      action: "media_geo3_current_offer_backfilled",
      entityType: "media_revision",
      entityId: revisionId,
      summary: `${MEDIA_GEO3_RELEASE}: exact current-offer media activated for ${source.casino.title}`,
      metadata: { casinoId: source.casino.id, affiliateOfferId: source.offer.id, creativeSetId, placements: MEDIA_GEO3_CATALOG_PLACEMENTS },
    } });
    return { slug: definition.slug, status: "activated", revisionId };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 30_000 });
}

async function verifyDefinition(definition: ReturnType<typeof assertMediaGeo3Catalog>[number]) {
  const source = await exactSource(definition);
  const identityKey = mediaGeo3IdentityKey(definition.slug);
  const set = await prisma.mediaCreativeSet.findUnique({
    where: { identityKey },
    include: { variants: { include: { mediaAsset: true }, orderBy: { placement: "asc" } } },
  });
  if (!set || set.status !== "ACTIVE" || set.purpose !== "PROMOTION"
    || set.casinoId !== source.casino.id || set.affiliateOfferId !== source.offer.id
    || set.variants.length !== MEDIA_GEO3_CATALOG_PLACEMENTS.length
    || set.variants.some((variant) => variant.status !== "ACTIVE" || variant.availability !== "AVAILABLE"
      || variant.mediaAssetId !== source.mediaAsset.id || variant.sourceHash !== source.mediaAsset.checksum
      || variant.languageState !== "NEUTRAL" || variant.countryCode || variant.languageCode
      || variant.renderingMode !== "CONTAIN" || variant.cropSafe)) {
    throw new Error(`${definition.slug}: active creative set/variants differ from the bounded catalog.`);
  }
  const placements = new Set(set.variants.map((variant) => variant.placement));
  if (MEDIA_GEO3_CATALOG_PLACEMENTS.some((placement) => !placements.has(placement))) {
    throw new Error(`${definition.slug}: required placement variant is missing.`);
  }
  const revisionId = mediaGeo3Id(definition.slug, "revision", "v1");
  const revision = await prisma.mediaRevision.findUnique({
    where: { id: revisionId },
    include: { preflight: true },
  });
  if (!revision || revision.status !== "ACTIVE" || revision.affiliateOfferId !== source.offer.id
    || revision.preflight.length !== MEDIA_GEO3_PREFLIGHT_DEVICES.length * MEDIA_GEO3_CATALOG_PLACEMENTS.length
    || revision.preflight.some((entry) => entry.status !== "READY" || entry.assetHash !== source.mediaAsset.checksum)) {
    throw new Error(`${definition.slug}: active revision/preflight differs from the bounded catalog.`);
  }
  resolverMatrix(definition.slug, source, set.id, revision.id);
  return { slug: definition.slug, creativeSetId: set.id, revisionId, variants: set.variants.length, preflightCells: revision.preflight.length };
}

async function audit() {
  await assertRepositoryTarget();
  const catalog = assertMediaGeo3Catalog();
  await Promise.all(catalog.map(verifySourceFile));
  const rows = await migrationRows();
  const release = planMediaGeo3Preflight({ rows, repositoryMigrations: mediaGeo3RepositoryMigrations() });
  const sources = await Promise.all(catalog.map(exactSource));
  console.info(JSON.stringify({
    release: MEDIA_GEO3_RELEASE,
    databaseTargetFingerprint: databaseTargetFingerprint(),
    migration: release,
    migrationChecksum: mediaGeo3MigrationChecksum(),
    boundedSlugs: sources.map((source) => source.casino.title),
    exactCurrentOfferSources: sources.length,
    plannedVariants: sources.length * MEDIA_GEO3_CATALOG_PLACEMENTS.length,
    destructiveWrites: 0,
    rawDestinationsEmitted: 0,
  }, null, 2));
}

async function backfill() {
  assertWriteAuthority();
  await assertRepositoryTarget();
  const catalog = assertMediaGeo3Catalog();
  await inspectMediaGeo3(prisma);
  const actorId = await governedActor();
  const results = [];
  for (const definition of catalog) results.push(await backfillDefinition(definition, actorId));
  console.info(JSON.stringify({ release: MEDIA_GEO3_RELEASE, databaseTargetFingerprint: databaseTargetFingerprint(), results, destructiveWrites: 0 }, null, 2));
  await verify();
}

async function verify() {
  await assertRepositoryTarget();
  const catalog = assertMediaGeo3Catalog();
  const migration = await inspectMediaGeo3(prisma);
  await assertMediaGeo3Schema(prisma);
  const results = [];
  for (const definition of catalog) results.push(await verifyDefinition(definition));
  const prefixCount = await prisma.mediaCreativeSet.count({ where: { identityKey: { startsWith: `${MEDIA_GEO3_CATALOG_VERSION}:` } } });
  if (prefixCount !== catalog.length) throw new Error("MEDIA-GEO3 found an unbounded or missing catalog creative set.");
  console.info(JSON.stringify({
    release: MEDIA_GEO3_RELEASE,
    databaseTargetFingerprint: databaseTargetFingerprint(),
    migration,
    results,
    activeCatalogCreativeSets: prefixCount,
    genericPartnerCreativesPromoted: 0,
    rawDestinationsEmitted: 0,
    destructiveWrites: 0,
  }, null, 2));
}

async function main() {
  const mode = process.argv[2] as Mode | undefined;
  if (!mode || !["audit", "backfill", "verify"].includes(mode)) {
    throw new Error("Usage: media-geo3-production.ts <audit|backfill|verify>");
  }
  try {
    if (mode === "audit") await audit();
    if (mode === "backfill") await backfill();
    if (mode === "verify") await verify();
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unknown MEDIA-GEO3 executor failure";
    console.error(message.replace(/https:\/\/[^\s\"'<>]+/gi, "[redacted-url]"));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
