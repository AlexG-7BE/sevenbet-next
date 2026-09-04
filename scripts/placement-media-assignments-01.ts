import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";

import {
  MediaPlacement,
  MediaPlacementVariant,
  MediaRenderingMode,
  Prisma,
  type PrismaClient,
} from "@prisma/client";

import prisma from "../lib/db/prisma";
import { assertPlacementMedia0027Schema } from "../lib/db/placement-media-0027-release";
import {
  buildPlacementBackfillManifest,
  comparableManifest,
  PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE,
  sha256,
  stableJson,
  type LegacyPublishedCasino,
  type PlacementBackfillManifest,
  type PlacementBackfillRow,
} from "../lib/media/placement-media-backfill";
import { resolveMedia } from "../lib/media/placement-media";
import {
  buildPublishedCasinoSnapshot,
  casinoPlacementAggregateInclude,
} from "../lib/repositories/casino.repository";

const TARGET_MIGRATION = "0027_placement_media_assignments";
const MANIFEST_PATH = "data/placement-media-assignments-01-backfill.json";
const MANIFEST_SHA256 = "958d2b15f96d4871105d605de413020814b26de9183684a7620b8694afcb0d1d";
const PROJECT_ID = "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb";
const ORG_ID = "team_WhkUGuXZeIMlU1uFHtowNUqa";
const CURRENT_CASINO_SLUGS = [
  "betsson",
  "skol-casino",
  "hello-casino",
  "gday-casino",
  "diamond7",
  "dragonbet",
  "21-prive",
  "slotnite",
] as const;
const EXPECTED_CURRENT_CASINOS = 8;
const EXPECTED_CURRENT_BONUSES = 6;

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

type MigrationRow = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

function databaseTargetFingerprint() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return "UNAVAILABLE";
  const target = new URL(raw);
  return sha256([
    target.protocol,
    target.hostname,
    target.port || "5432",
    target.username,
    target.pathname,
    target.searchParams.get("schema") ?? "public",
  ].join("\n"));
}

function repositorySha() {
  const deployed = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (deployed) return deployed;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "UNAVAILABLE";
  }
}

async function repositoryMigrationChecksum(name = TARGET_MIGRATION) {
  return sha256(await readFile(`prisma/migrations/${name}/migration.sql`));
}

async function loadLegacyState(database: DatabaseClient): Promise<LegacyPublishedCasino[]> {
  const records = await database.casino.findMany({
    where: {
      slug: { in: [...CURRENT_CASINO_SLUGS] },
      status: "PUBLISHED",
      archivedAt: null,
    },
    orderBy: { slug: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      publishedVersion: true,
      mediaAssets: {
        where: { casinoCountryId: null },
        orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          type: true,
          publicUrl: true,
          originalFilename: true,
          mimeType: true,
          width: true,
          height: true,
          altText: true,
          title: true,
          caption: true,
          credit: true,
          status: true,
          archivedAt: true,
          sortOrder: true,
          createdAt: true,
          featured: true,
          checksum: true,
        },
      },
      casinoBonuses: {
        where: { casinoCountryId: null, status: "PUBLISHED", offerStatus: "ACTIVE" },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true, slug: true, title: true },
      },
    },
  });
  const slugs = records.map((record) => record.slug).sort();
  const expectedSlugs = [...CURRENT_CASINO_SLUGS].sort();
  if (stableJson(slugs) !== stableJson(expectedSlugs)) {
    throw new Error("The exact eight governed real Casino identities are not all published and unarchived.");
  }
  const bonusCount = records.reduce((total, record) => total + record.casinoBonuses.length, 0);
  if (bonusCount !== EXPECTED_CURRENT_BONUSES) {
    throw new Error(`Expected exactly ${EXPECTED_CURRENT_BONUSES} current editorial Bonuses across the governed eight Casinos; found ${bonusCount}.`);
  }
  return records.map((record) => ({
    ...record,
    mediaAssets: record.mediaAssets.map((asset) => ({ ...asset, type: asset.type.toString(), status: asset.status.toString() })),
  }));
}

async function readManifest() {
  const bytes = await readFile(MANIFEST_PATH);
  const checksum = sha256(bytes);
  if (checksum !== MANIFEST_SHA256) {
    throw new Error("Placement-media backfill manifest checksum mismatch.");
  }
  const manifest = JSON.parse(bytes.toString("utf8")) as PlacementBackfillManifest;
  if (manifest.release !== PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE || manifest.schemaMigration !== TARGET_MIGRATION) {
    throw new Error("Placement-media backfill manifest release identity mismatch.");
  }
  return { manifest, checksum };
}

async function migrationState(database: DatabaseClient) {
  const rows = await database.$queryRawUnsafe<MigrationRow[]>(
    'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" WHERE "migration_name" = $1 ORDER BY "started_at" ASC',
    TARGET_MIGRATION,
  );
  const effective = rows.filter((row) => row.finished_at !== null && row.rolled_back_at === null);
  const unresolved = rows.filter((row) => row.finished_at === null && row.rolled_back_at === null);
  const expectedChecksum = await repositoryMigrationChecksum();
  if (unresolved.length || effective.length !== 1 || effective[0].checksum !== expectedChecksum) {
    throw new Error("0027 migration is not exactly once, complete and checksum-matched.");
  }
  return { attempts: rows.length, checksum: expectedChecksum };
}

async function migrationPreflight(database: DatabaseClient) {
  const repositoryMigrations = (await readdir("prisma/migrations", { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (repositoryMigrations.at(-1) !== TARGET_MIGRATION) {
    throw new Error(`Migration refused because ${TARGET_MIGRATION} is not the exact repository suffix.`);
  }
  const rows = await database.$queryRawUnsafe<MigrationRow[]>(
    'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
  );
  const repositorySet = new Set(repositoryMigrations);
  if (rows.some((row) => !repositorySet.has(row.migration_name))) {
    throw new Error("Migration refused because database history diverges from the repository.");
  }
  if (rows.some((row) => row.finished_at === null && row.rolled_back_at === null)) {
    throw new Error("Migration refused because an unresolved migration attempt exists.");
  }
  const completed = new Set<string>();
  for (const name of repositoryMigrations) {
    const attempts = rows.filter((row) => row.migration_name === name);
    const effective = attempts.at(-1);
    if (!effective) continue;
    if (effective.finished_at === null || effective.rolled_back_at !== null) {
      throw new Error(`Migration refused because ${name} has no effective completed attempt.`);
    }
    if (effective.checksum !== await repositoryMigrationChecksum(name)) {
      throw new Error(`Migration refused because ${name} does not match the repository checksum.`);
    }
    completed.add(name);
  }
  const pending = repositoryMigrations.filter((name) => !completed.has(name));
  if (pending.length > 1 || (pending.length === 1 && pending[0] !== TARGET_MIGRATION)) {
    throw new Error(`Migration refused because the exact pending suffix is not ${TARGET_MIGRATION}.`);
  }
  const targetAttempts = rows.filter((row) => row.migration_name === TARGET_MIGRATION);
  if (pending.length === 1 && targetAttempts.length) {
    throw new Error("Migration refused because pending 0027 has historical attempts.");
  }
  return { pending, completed: completed.size };
}

function assertManifestMatchesLive(manifest: PlacementBackfillManifest, live: LegacyPublishedCasino[]) {
  const generated = buildPlacementBackfillManifest(live, {
    generatedAt: manifest.generatedAt,
    expectedDatabaseFingerprint: manifest.expectedDatabaseFingerprint,
  });
  if (stableJson(comparableManifest(generated)) !== stableJson(comparableManifest(manifest))) {
    throw new Error("Live legacy media state differs from the governed backfill manifest.");
  }
}

function assertWriteAuthority(manifest: PlacementBackfillManifest) {
  if (process.env.PLACEMENT_MEDIA_ASSIGNMENTS_CONFIRM !== PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE) {
    throw new Error(`Write refused. Set PLACEMENT_MEDIA_ASSIGNMENTS_CONFIRM=${PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE}.`);
  }
  if (process.env.ALLOW_PLACEMENT_MEDIA_ASSIGNMENTS_WRITE !== "true") throw new Error("Write refused without the bounded write flag.");
  const target = process.env.PLACEMENT_MEDIA_ASSIGNMENTS_TARGET;
  if (target !== "preview" && target !== "production") throw new Error("Write refused without an explicit preview or production target.");
  if (process.env.VERCEL_ENV !== target) throw new Error("Write refused because VERCEL_ENV differs from the explicit target.");
  if (process.env.PLACEMENT_MEDIA_ASSIGNMENTS_PROJECT_ID !== PROJECT_ID || process.env.PLACEMENT_MEDIA_ASSIGNMENTS_ORG_ID !== ORG_ID) {
    throw new Error("Write refused because the exact Vercel project identity was not confirmed.");
  }
  const fingerprint = databaseTargetFingerprint();
  if (fingerprint !== manifest.expectedDatabaseFingerprint || process.env.PLACEMENT_MEDIA_ASSIGNMENTS_DATABASE_FINGERPRINT !== fingerprint) {
    throw new Error(`Write refused. Independently verify and set PLACEMENT_MEDIA_ASSIGNMENTS_DATABASE_FINGERPRINT=${fingerprint}.`);
  }
  const sha = repositorySha();
  if (!process.env.PLACEMENT_MEDIA_ASSIGNMENTS_EXPECTED_SHA || process.env.PLACEMENT_MEDIA_ASSIGNMENTS_EXPECTED_SHA !== sha) {
    throw new Error(`Write refused. Confirm the deployed/repository SHA ${sha}.`);
  }
}

async function governedActor(database: DatabaseClient) {
  const record = await database.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!record) throw new Error("No governed CMS actor is available for the release audit trail.");
  return record.id;
}

function assignmentData(row: PlacementBackfillRow) {
  if (!row.newAssignment) throw new Error("Cannot create an empty manifest assignment");
  return {
    id: row.newAssignment.id,
    mediaAssetId: row.newAssignment.mediaAssetId,
    placement: row.placement as MediaPlacement,
    variant: MediaPlacementVariant.DEFAULT,
    renderingMode: row.newAssignment.renderingMode as MediaRenderingMode,
    sortOrder: row.newAssignment.sortOrder,
    active: true,
    cropSafe: false,
    altTextOverride: null,
    focalPointX: null,
    focalPointY: null,
    validFrom: null,
    validUntil: null,
    reference: PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE,
  };
}

function sameAssignment(existing: {
  mediaAssetId: string; placement: MediaPlacement; variant: MediaPlacementVariant; renderingMode: MediaRenderingMode;
  sortOrder: number; active: boolean; cropSafe: boolean; altTextOverride: string | null;
  focalPointX: Prisma.Decimal | null; focalPointY: Prisma.Decimal | null;
  validFrom: Date | null; validUntil: Date | null; reference: string | null;
}, row: PlacementBackfillRow) {
  const expected = assignmentData(row);
  return existing.mediaAssetId === expected.mediaAssetId
    && existing.placement === expected.placement
    && existing.variant === expected.variant
    && existing.renderingMode === expected.renderingMode
    && existing.sortOrder === expected.sortOrder
    && existing.active === expected.active
    && existing.cropSafe === expected.cropSafe
    && existing.altTextOverride === expected.altTextOverride
    && existing.focalPointX === expected.focalPointX
    && existing.focalPointY === expected.focalPointY
    && existing.validFrom === expected.validFrom
    && existing.validUntil === expected.validUntil
    && existing.reference === expected.reference;
}

async function createAssignment(tx: Prisma.TransactionClient, row: PlacementBackfillRow) {
  if (!row.newAssignment) return false;
  if (row.subjectType === "CASINO") {
    const existing = await tx.casinoMediaAssignment.findUnique({ where: { id: row.newAssignment.id } });
    if (existing) {
      if (existing.casinoId !== row.subjectId || !sameAssignment(existing, row)) throw new Error(`Existing Casino assignment ${existing.id} differs from the release manifest.`);
      return false;
    }
    await tx.casinoMediaAssignment.create({ data: { casinoId: row.subjectId, ...assignmentData(row) } });
    return true;
  }
  const existing = await tx.casinoBonusMediaAssignment.findUnique({ where: { id: row.newAssignment.id } });
  if (existing) {
    if (existing.casinoBonusId !== row.subjectId || !sameAssignment(existing, row)) throw new Error(`Existing Bonus assignment ${existing.id} differs from the release manifest.`);
    return false;
  }
  await tx.casinoBonusMediaAssignment.create({ data: { casinoBonusId: row.subjectId, ...assignmentData(row) } });
  return true;
}

function projectionMarker(value: Prisma.JsonValue | null) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, Prisma.JsonValue>
    : null;
}

function exactProjectionMarker(
  value: Prisma.JsonValue | null,
  manifest: PlacementBackfillManifest,
  manifestChecksum: string,
) {
  const record = projectionMarker(value);
  return record?.release === PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE
    && record.sourceStateChecksum === manifest.sourceStateChecksum
    && record.manifestChecksum === manifestChecksum;
}

async function capturePublishedProjection(
  tx: Prisma.TransactionClient,
  casinoId: string,
  actorId: string,
  manifest: PlacementBackfillManifest,
  manifestChecksum: string,
) {
  const versions = await tx.casinoVersion.findMany({
    where: { casinoId },
    orderBy: { version: "desc" },
    select: { id: true, version: true, migrationMap: true },
  });
  const releaseVersions = versions.filter((version) => projectionMarker(version.migrationMap)?.release === PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE);
  const existing = releaseVersions.find((version) => exactProjectionMarker(version.migrationMap, manifest, manifestChecksum));
  if (releaseVersions.length && !existing) {
    throw new Error(`Published Casino ${casinoId} has a placement-media release marker with unexpected evidence.`);
  }
  if (existing) return { created: false, version: existing.version };
  const current = await tx.casino.findUnique({ where: { id: casinoId }, include: casinoPlacementAggregateInclude });
  if (!current || current.status !== "PUBLISHED") throw new Error(`Published Casino ${casinoId} was unavailable during projection capture.`);
  const versionNumber = (versions[0]?.version ?? current.publishedVersion) + 1;
  const publishedAt = current.publishedAt ?? new Date();
  await tx.casinoVersion.create({
    data: {
      casinoId,
      version: versionNumber,
      status: "PUBLISHED",
      snapshot: buildPublishedCasinoSnapshot(current, { actorId, publishedAt, versionNumber }),
      migrationMap: {
        release: PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE,
        sourceVersion: current.publishedVersion,
        sourceStateChecksum: manifest.sourceStateChecksum,
        manifestChecksum,
      },
      publishedAt,
      createdBy: actorId,
    },
  });
  await tx.casino.update({
    where: { id: casinoId },
    data: { publishedVersion: versionNumber, draftVersion: Math.max(current.draftVersion, versionNumber + 1), updatedBy: actorId },
  });
  await tx.auditLog.create({
    data: {
      actorId,
      action: "placement-media-backfill-republish",
      entityType: "casino",
      entityId: casinoId,
      summary: `Captured immutable placement media projection in version ${versionNumber}`,
      metadata: { release: PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE, version: versionNumber, manifestChecksum },
    },
  });
  return { created: true, version: versionNumber };
}

async function compareResolvers(database: DatabaseClient, manifest: PlacementBackfillManifest) {
  const mismatches: Array<Record<string, unknown>> = [];
  for (const casinoId of [...new Set(manifest.rows.map((row) => row.casinoId))]) {
    const casino = await database.casino.findUnique({
      where: { id: casinoId },
      select: {
        title: true,
        mediaAssets: { where: { casinoCountryId: null }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }] },
        mediaAssignments: { include: { mediaAsset: true } },
        casinoBonuses: { select: { id: true, mediaAssignments: { include: { mediaAsset: true } } } },
      },
    });
    if (!casino) throw new Error(`Casino ${casinoId} disappeared during resolver comparison.`);
    for (const row of manifest.rows.filter((candidate) => candidate.casinoId === casinoId)) {
      const bonus = row.subjectType === "CASINO_BONUS" ? casino.casinoBonuses.find((candidate) => candidate.id === row.subjectId) : null;
      const resolved = resolveMedia({
        placement: row.placement,
        context: {
          casinoName: casino.title,
          casinoAssignments: casino.mediaAssignments,
          casinoBonusAssignments: bonus?.mediaAssignments ?? [],
          legacyMediaAssets: casino.mediaAssets,
        },
      });
      const actual = {
        mediaAssetId: resolved.asset?.id ?? null,
        resolvedPlacement: resolved.resolvedPlacement,
        source: resolved.source,
        renderingMode: resolved.renderingMode,
      };
      if (stableJson(actual) !== stableJson(row.expectedResolution)) {
        mismatches.push({ subjectType: row.subjectType, subjectId: row.subjectId, placement: row.placement, expected: row.expectedResolution, actual });
      }
    }
  }
  if (mismatches.length) throw new Error(`Legacy/new resolver comparison found ${mismatches.length} mismatch(es): ${JSON.stringify(mismatches.slice(0, 3))}`);
  return manifest.rows.length;
}

async function verifyRelease(database: DatabaseClient, manifest: PlacementBackfillManifest, manifestChecksum: string) {
  const assignmentRows = manifest.rows.filter((row) => row.newAssignment);
  const [casinoCount, bonusCount, releaseCasinoAssignments, releaseBonusAssignments, affiliateAssignments, versions] = await Promise.all([
    database.casino.count({ where: { slug: { in: [...CURRENT_CASINO_SLUGS] }, status: "PUBLISHED", archivedAt: null } }),
    database.casinoBonus.count({ where: { casino: { slug: { in: [...CURRENT_CASINO_SLUGS] } }, casinoCountryId: null, status: "PUBLISHED", offerStatus: "ACTIVE" } }),
    database.casinoMediaAssignment.count({ where: { reference: PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE } }),
    database.casinoBonusMediaAssignment.count({ where: { reference: PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE } }),
    database.affiliateOfferMediaAssignment.count({ where: { affiliateOffer: { casino: { slug: { in: [...CURRENT_CASINO_SLUGS] } } } } }),
    database.casinoVersion.findMany({
      where: { casinoId: { in: [...new Set(manifest.rows.map((row) => row.casinoId))] } },
      select: { casinoId: true, version: true, migrationMap: true, snapshot: true },
      orderBy: { version: "desc" },
    }),
  ]);
  if (casinoCount !== manifest.expectedPublishedCasinoCount || bonusCount !== manifest.expectedPublishedBonusCount) throw new Error("Published Casino/Bonus counts changed from the manifest baseline.");
  if (releaseCasinoAssignments + releaseBonusAssignments !== assignmentRows.length || assignmentRows.length !== manifest.expectedAssignmentCount) throw new Error("Release assignment count differs from the manifest.");
  if (affiliateAssignments !== 0) throw new Error("Release verification expected zero partner-specific Affiliate Offer assignments.");
  const latestByCasino = new Map<string, (typeof versions)[number]>();
  for (const version of versions) if (!latestByCasino.has(version.casinoId)) latestByCasino.set(version.casinoId, version);
  if ([...latestByCasino.values()].filter((version) => exactProjectionMarker(version.migrationMap, manifest, manifestChecksum)).length !== manifest.expectedPublishedCasinoCount) {
    throw new Error("Every current Casino must have the release projection as its latest immutable version.");
  }
  for (const version of latestByCasino.values()) {
    const snapshot = version.snapshot && typeof version.snapshot === "object" && !Array.isArray(version.snapshot) ? version.snapshot as Record<string, unknown> : {};
    if (!Array.isArray(snapshot.mediaAssignments) || !Array.isArray(snapshot.casinoBonuses)) throw new Error("Published placement projection is incomplete.");
  }
  const comparisons = await compareResolvers(database, manifest);
  return {
    casinoCount,
    bonusCount,
    tableCounts: {
      CasinoMediaAssignment: releaseCasinoAssignments,
      CasinoBonusMediaAssignment: releaseBonusAssignments,
      AffiliateOfferMediaAssignment: affiliateAssignments,
    },
    placementCounts: Object.fromEntries(
      [...new Set(assignmentRows.map((row) => row.placement))]
        .sort()
        .map((placement) => [placement, assignmentRows.filter((row) => row.placement === placement).length]),
    ),
    assignmentCount: releaseCasinoAssignments + releaseBonusAssignments,
    immutableProjectionCount: latestByCasino.size,
    comparisons,
  };
}

async function manifestCommand() {
  const live = await loadLegacyState(prisma);
  const generatedAt = process.argv[3]?.trim() || new Date().toISOString();
  const manifest = buildPlacementBackfillManifest(live, {
    generatedAt,
    expectedDatabaseFingerprint: databaseTargetFingerprint(),
  });
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  const offset = process.argv[4] === undefined ? 0 : Number.parseInt(process.argv[4], 10);
  const length = process.argv[5] === undefined ? serialized.length : Number.parseInt(process.argv[5], 10);
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(length) || length < 1) {
    throw new Error("Manifest slice must use non-negative offset and positive length integers.");
  }
  process.stdout.write(serialized.slice(offset, offset + length));
}

async function auditCommand() {
  const live = await loadLegacyState(prisma);
  const generated = buildPlacementBackfillManifest(live, {
    generatedAt: new Date().toISOString(),
    expectedDatabaseFingerprint: databaseTargetFingerprint(),
  });
  process.stdout.write(`${JSON.stringify({
    release: generated.release,
    repositorySha: repositorySha(),
    databaseTargetFingerprint: databaseTargetFingerprint(),
    publishedCasinos: generated.expectedPublishedCasinoCount,
    publishedBonuses: generated.expectedPublishedBonusCount,
    plannedAssignments: generated.expectedAssignmentCount,
    sourceStateChecksum: generated.sourceStateChecksum,
    placements: Object.fromEntries([...new Set(generated.rows.map((row) => row.placement))].map((placement) => [placement, generated.rows.filter((row) => row.newAssignment && row.placement === placement).length])),
    writes: 0,
  }, null, 2)}\n`);
}

async function backfillCommand() {
  const { manifest, checksum } = await readManifest();
  assertWriteAuthority(manifest);
  if (process.env.PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED === "true") {
    throw new Error("Backfill refused while assignment-first reads are enabled.");
  }
  if (manifest.expectedPublishedCasinoCount !== EXPECTED_CURRENT_CASINOS || manifest.expectedPublishedBonusCount !== EXPECTED_CURRENT_BONUSES) {
    throw new Error("The governed release expects exactly 8 published Casinos and 6 current editorial Bonuses.");
  }
  await migrationState(prisma);
  const result = await prisma.$transaction(async (tx) => {
    const live = await loadLegacyState(tx);
    assertManifestMatchesLive(manifest, live);
    const actorId = await governedActor(tx);
    const unexpected = await Promise.all([
      tx.casinoMediaAssignment.count({ where: { casinoId: { in: live.map((casino) => casino.id) }, OR: [{ reference: null }, { reference: { not: PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE } }] } }),
      tx.casinoBonusMediaAssignment.count({ where: { casinoBonusId: { in: live.flatMap((casino) => casino.casinoBonuses.map((bonus) => bonus.id)) }, OR: [{ reference: null }, { reference: { not: PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE } }] } }),
      tx.affiliateOfferMediaAssignment.count({ where: { affiliateOffer: { casinoId: { in: live.map((casino) => casino.id) } } } }),
    ]);
    if (unexpected.some(Boolean)) throw new Error("Unexpected pre-release placement assignments exist; refusing to overwrite Founder/Admin state.");
    let createdAssignments = 0;
    for (const row of manifest.rows) if (await createAssignment(tx, row)) createdAssignments += 1;
    await compareResolvers(tx, manifest);
    let createdProjections = 0;
    const publishedVersions: Record<string, number> = {};
    for (const casinoId of live.map((casino) => casino.id)) {
      const projection = await capturePublishedProjection(tx, casinoId, actorId, manifest, checksum);
      if (projection.created) createdProjections += 1;
      publishedVersions[casinoId] = projection.version;
    }
    return { createdAssignments, createdProjections, publishedVersions };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120_000, maxWait: 20_000 });
  const verification = await verifyRelease(prisma, manifest, checksum);
  process.stdout.write(`${JSON.stringify({ release: PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE, manifestChecksum: checksum, migrationChecksum: await repositoryMigrationChecksum(), ...result, verification }, null, 2)}\n`);
}

async function migrateCommand() {
  const { manifest, checksum } = await readManifest();
  assertWriteAuthority(manifest);
  if (process.env.PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED === "true") {
    throw new Error("Migration refused while assignment-first reads are enabled.");
  }
  if (manifest.expectedPublishedCasinoCount !== EXPECTED_CURRENT_CASINOS || manifest.expectedPublishedBonusCount !== EXPECTED_CURRENT_BONUSES) {
    throw new Error("The governed release expects exactly 8 published Casinos and 6 current editorial Bonuses.");
  }
  const live = await loadLegacyState(prisma);
  assertManifestMatchesLive(manifest, live);
  const preflight = await migrationPreflight(prisma);
  if (preflight.pending.length === 1) {
    execFileSync("npx", ["prisma", "migrate", "deploy"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });
  }
  const migration = await migrationState(prisma);
  const schema = await assertPlacementMedia0027Schema(prisma);
  process.stdout.write(`${JSON.stringify({
    release: PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE,
    state: preflight.pending.length ? "applied_and_verified" : "already_applied_and_verified",
    manifestChecksum: checksum,
    migration: TARGET_MIGRATION,
    migrationChecksum: migration.checksum,
    migrationAttempts: migration.attempts,
    repositoryMigrationsPreviouslyCompleted: preflight.completed,
    typedTables: schema.tables,
    writes: preflight.pending.length,
  }, null, 2)}\n`);
}

async function verifyCommand() {
  const { manifest, checksum } = await readManifest();
  await migrationState(prisma);
  const live = await loadLegacyState(prisma);
  assertManifestMatchesLive(manifest, live);
  const verification = await verifyRelease(prisma, manifest, checksum);
  process.stdout.write(`${JSON.stringify({ release: PLACEMENT_MEDIA_ASSIGNMENTS_RELEASE, repositorySha: repositorySha(), manifestChecksum: checksum, migrationChecksum: await repositoryMigrationChecksum(), databaseTargetFingerprint: databaseTargetFingerprint(), ...verification }, null, 2)}\n`);
}

async function main() {
  const command = process.argv[2] ?? "audit";
  if (command === "manifest") return manifestCommand();
  if (command === "audit") return auditCommand();
  if (command === "migrate") return migrateCommand();
  if (command === "backfill") return backfillCommand();
  if (command === "verify") return verifyCommand();
  throw new Error("Usage: placement-media-assignments-01.ts [audit|manifest [generatedAt [offset length]]|migrate|backfill|verify]");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Placement-media release command failed");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
