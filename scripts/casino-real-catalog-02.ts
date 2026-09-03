import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { EditorialStatus, Prisma } from "@prisma/client";

import { readCasinoEditorMetadata, writeCasinoEditorMetadata } from "../lib/casino-builder/editor-metadata";
import {
  CASINO_REAL_CATALOG_OBSERVED_AT,
  CASINO_REAL_CATALOG_RELEASE,
  assertCasinoRealCatalog,
  casinoCatalogEditorialDocument,
  casinoRealCatalog,
  type CasinoCatalogDefinition,
} from "../lib/casino-real-catalog/catalog";
import { parseCasinoIngestionBundle } from "../lib/casino-ingestion/contract";
import prisma from "../lib/db/prisma";
import {
  deterministicCasinoIngestionId,
  ingestCasinoBundles,
  verifyCasinoBundlesIdempotency,
} from "../lib/casino-ingestion/importer";
import { editorialReviewService } from "../lib/services/editorial-review.service";
import { casinoService } from "../lib/services/casino.service";

type Mode = "audit" | "preview-seed" | "seed" | "verify";

type MigrationState = {
  completed: bigint;
  unfinished: bigint;
  rolledBack: bigint;
  targetApplied: bigint;
  targetChecksum: string | null;
};

type ReleaseCorpus = {
  release: string;
  repositoryBase: string;
  sourceFiles: Array<{ path: string; sha256: string }>;
  assets: Array<{ path: string; sha256: string }>;
  expectedRows: Record<string, number | Record<string, number>>;
};

const TARGET_MIGRATION = "0026_commercial_platform_completion";
const PREVIEW_ACTOR = {
  id: "00000000-0000-4000-8000-000000000202",
  email: "casino-real-catalog-02-preview@invalid.example",
  name: "CASINO-REAL-CATALOG-02 Preview executor",
} as const;
const PREVIEW_FACTUAL_BUNDLES = [
  "data/casino-ingestion/betsson-pe-se.v1.json",
  "data/casino-ingestion/casino-data-population-01/21-prive-gb.v1.json",
  "data/casino-ingestion/casino-data-population-01/diamond7-gb.v1.json",
  "data/casino-ingestion/casino-data-population-01/dragonbet-gb.v1.json",
  "data/casino-ingestion/casino-data-population-01/gday-casino-gb.v1.json",
  "data/casino-ingestion/casino-data-population-01/hello-casino-gb.v1.json",
  "data/casino-ingestion/casino-data-population-01/skol-casino-gb.v1.json",
  "data/casino-ingestion/casino-data-population-01/slotnite-gb.v1.json",
] as const;

function assertWriteAuthority() {
  if (process.env.CASINO_REAL_CATALOG_CONFIRM !== CASINO_REAL_CATALOG_RELEASE) {
    throw new Error(`Write refused. Set CASINO_REAL_CATALOG_CONFIRM=${CASINO_REAL_CATALOG_RELEASE}.`);
  }
  if (process.env.ALLOW_PRODUCTION_CASINO_REAL_CATALOG_WRITE !== "true") {
    throw new Error("Write refused. Set ALLOW_PRODUCTION_CASINO_REAL_CATALOG_WRITE=true.");
  }
  if (process.env.CASINO_REAL_CATALOG_TARGET !== "production") {
    throw new Error("Write refused. Set CASINO_REAL_CATALOG_TARGET=production after verifying the Vercel project and database target.");
  }
  if (!process.env.DATABASE_URL) throw new Error("Write refused without DATABASE_URL.");
  const expectedFingerprint = process.env.CASINO_REAL_CATALOG_DATABASE_FINGERPRINT?.trim();
  const actualFingerprint = databaseTargetFingerprint();
  if (!expectedFingerprint || expectedFingerprint !== actualFingerprint) {
    throw new Error(`Write refused. Set CASINO_REAL_CATALOG_DATABASE_FINGERPRINT=${actualFingerprint} after independently verifying this exact database target.`);
  }
}

function assertPreviewWriteAuthority() {
  if (process.env.CASINO_REAL_CATALOG_CONFIRM !== CASINO_REAL_CATALOG_RELEASE) {
    throw new Error(`Preview write refused. Set CASINO_REAL_CATALOG_CONFIRM=${CASINO_REAL_CATALOG_RELEASE}.`);
  }
  if (process.env.ALLOW_PREVIEW_CASINO_REAL_CATALOG_WRITE !== "true") {
    throw new Error("Preview write refused. Set ALLOW_PREVIEW_CASINO_REAL_CATALOG_WRITE=true.");
  }
  if (process.env.CASINO_REAL_CATALOG_TARGET !== "preview" || process.env.VERCEL_ENV !== "preview") {
    throw new Error("Preview write refused unless both the explicit target and VERCEL_ENV are preview.");
  }
  if (!process.env.DATABASE_URL) throw new Error("Preview write refused without DATABASE_URL.");
  const actualFingerprint = databaseTargetFingerprint();
  const expectedFingerprint = process.env.CASINO_REAL_CATALOG_DATABASE_FINGERPRINT?.trim();
  const productionFingerprint = process.env.CASINO_REAL_CATALOG_PRODUCTION_DATABASE_FINGERPRINT?.trim();
  if (!expectedFingerprint || expectedFingerprint !== actualFingerprint) {
    throw new Error(`Preview write refused. Set CASINO_REAL_CATALOG_DATABASE_FINGERPRINT=${actualFingerprint} after independently verifying this exact Preview target.`);
  }
  if (!productionFingerprint || productionFingerprint === actualFingerprint) {
    throw new Error("Preview write refused without a verified, different Production database fingerprint.");
  }
}

function databaseTargetFingerprint() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return "UNAVAILABLE";
  const target = new URL(raw);
  const identity = [target.username, target.pathname, target.port || "5432"].join("\n");
  return createHash("sha256").update(identity).digest("hex");
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, stable(entry)]));
  }
  return value;
}

function equivalent(left: unknown, right: unknown) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

function jsonObject(value: Prisma.JsonValue | null) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Prisma.JsonObject
    : {};
}

async function selectActor() {
  return prisma.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, email: true, role: true },
  });
}

async function migrationState() {
  const [state] = await prisma.$queryRaw<MigrationState[]>`
    SELECT
      COUNT(*) FILTER (WHERE "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL)::bigint AS "completed",
      COUNT(*) FILTER (WHERE "finished_at" IS NULL AND "rolled_back_at" IS NULL)::bigint AS "unfinished",
      COUNT(*) FILTER (WHERE "rolled_back_at" IS NOT NULL)::bigint AS "rolledBack",
      COUNT(*) FILTER (WHERE "migration_name" = ${TARGET_MIGRATION} AND "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL)::bigint AS "targetApplied",
      MAX("checksum") FILTER (WHERE "migration_name" = ${TARGET_MIGRATION} AND "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL) AS "targetChecksum"
    FROM "_prisma_migrations"
  `;
  if (!state) throw new Error("Could not inspect migration state.");
  const expectedChecksum = createHash("sha256")
    .update(await readFile(path.join(process.cwd(), "prisma", "migrations", TARGET_MIGRATION, "migration.sql")))
    .digest("hex");
  return {
    completed: Number(state.completed),
    unfinished: Number(state.unfinished),
    rolledBack: Number(state.rolledBack),
    target: TARGET_MIGRATION,
    targetApplied: Number(state.targetApplied) === 1,
    targetChecksumMatches: state.targetChecksum === expectedChecksum,
  };
}

async function assertReleaseCorpus() {
  const manifestPath = path.join(process.cwd(), "data", "casino-real-catalog-02", "manifest.v1.json");
  const corpus = JSON.parse(await readFile(manifestPath, "utf8")) as ReleaseCorpus;
  if (corpus.release !== CASINO_REAL_CATALOG_RELEASE) throw new Error("Release corpus identity mismatch.");
  if (corpus.repositoryBase !== "49126a932eb630248d58846b00400f95f079dcb9") throw new Error("Release corpus base mismatch.");
  for (const source of [...corpus.sourceFiles, ...corpus.assets]) {
    const checksum = createHash("sha256").update(await readFile(path.join(process.cwd(), source.path))).digest("hex");
    if (checksum !== source.sha256) throw new Error(`Release corpus checksum mismatch: ${source.path}`);
  }
  return corpus;
}

async function loadPreviewFactualBundles() {
  return Promise.all(PREVIEW_FACTUAL_BUNDLES.map(async (bundlePath) =>
    parseCasinoIngestionBundle(JSON.parse(await readFile(path.join(process.cwd(), bundlePath), "utf8")))));
}

async function catalogRowCounts(casinoIds: string[]) {
  const [
    marketProfiles,
    licences,
    marketEvidence,
    licenceEvidence,
    payments,
    providers,
    categories,
    bonuses,
    reviews,
    publishedReviews,
    scores,
    seoRecords,
    casinoImages,
    mediaAssets,
    activeMediaAssets,
    commercialRoutes,
    activeCommercialRoutes,
  ] = await Promise.all([
    prisma.casinoCountry.count({ where: { casinoId: { in: casinoIds } } }),
    prisma.casinoLicense.count({ where: { casinoId: { in: casinoIds } } }),
    prisma.casinoCountryEvidence.count({ where: { marketProfile: { casinoId: { in: casinoIds } } } }),
    prisma.casinoLicenseEvidence.count({ where: { license: { casinoId: { in: casinoIds } } } }),
    prisma.casinoPaymentMethod.count({ where: { casinoId: { in: casinoIds } } }),
    prisma.casinoGameProvider.count({ where: { casinoId: { in: casinoIds } } }),
    prisma.casinoGameCategory.count({ where: { casinoId: { in: casinoIds } } }),
    prisma.casinoBonus.count({ where: { casinoId: { in: casinoIds } } }),
    prisma.editorialReview.count({ where: { casinoId: { in: casinoIds } } }),
    prisma.editorialReview.count({ where: { casinoId: { in: casinoIds }, status: "PUBLISHED" } }),
    prisma.casino.count({ where: { id: { in: casinoIds }, editorScore: { not: null } } }),
    prisma.casinoSeo.count({ where: { casinoId: { in: casinoIds } } }),
    prisma.casinoImage.count({ where: { casinoId: { in: casinoIds } } }),
    prisma.mediaAsset.count({ where: { casinoId: { in: casinoIds } } }),
    prisma.mediaAsset.count({ where: { casinoId: { in: casinoIds }, status: "ACTIVE" } }),
    prisma.affiliateRedirectSlug.count({ where: { casinoId: { in: casinoIds } } }),
    prisma.affiliateRedirectSlug.count({ where: { casinoId: { in: casinoIds }, active: true, archivedAt: null } }),
  ]);
  return {
    casinos: casinoIds.length,
    marketProfiles,
    licences,
    evidence: marketEvidence + licenceEvidence,
    evidenceDetail: { market: marketEvidence, licence: licenceEvidence },
    payments,
    providers,
    categories,
    bonuses,
    reviews,
    publishedReviews,
    scores,
    seoRecords,
    imagesMedia: casinoImages + mediaAssets,
    imagesMediaDetail: { casinoImages, mediaAssets, activeMediaAssets },
    commercialRoutes,
    activeCommercialRoutes,
    inactiveCommercialRoutes: commercialRoutes - activeCommercialRoutes,
  };
}

function mediaIdentity(definition: CasinoCatalogDefinition) {
  return {
    id: deterministicCasinoIngestionId(`${CASINO_REAL_CATALOG_RELEASE}:${definition.slug}:logo`),
    storageKey: `${CASINO_REAL_CATALOG_RELEASE.toLowerCase()}/${definition.slug}/logo${path.extname(definition.brandMark.path)}`,
  };
}

async function readBrandMark(definition: CasinoCatalogDefinition) {
  const diskPath = path.join(process.cwd(), "public", definition.brandMark.path.replace(/^\//, ""));
  const bytes = await readFile(diskPath);
  const checksum = createHash("sha256").update(bytes).digest("hex");
  if (checksum !== definition.brandMark.checksum) throw new Error(`${definition.slug} brand-mark checksum does not match the manifest.`);
  return { bytes, diskPath };
}

async function currentState(definition: CasinoCatalogDefinition) {
  const casino = await prisma.casino.findUnique({
    where: { slug: definition.slug },
    include: {
      seo: true,
      mediaAssets: { where: { storageKey: mediaIdentity(definition).storageKey, status: "ACTIVE" } },
      editorialReview: { include: { revisions: { orderBy: { revisionNumber: "desc" } } } },
      versions: { where: { status: "PUBLISHED" }, orderBy: { version: "desc" }, take: 1 },
    },
  });
  return casino;
}

function desiredSeo(definition: CasinoCatalogDefinition) {
  const editorial = casinoCatalogEditorialDocument(definition);
  return {
    title: editorial.seo.title,
    description: editorial.seo.description,
    canonicalUrl: editorial.seo.canonicalPath ?? `/casino/${definition.slug}`,
    robots: "index,follow",
    socialTitle: editorial.seo.socialTitle ?? editorial.seo.title,
    socialDescription: editorial.seo.socialDescription ?? editorial.seo.description,
    socialImage: definition.brandMark.path,
  };
}

async function alreadyApplied(definition: CasinoCatalogDefinition) {
  const casino = await currentState(definition);
  if (!casino || casino.status !== "PUBLISHED") return false;
  const reviewRevision = casino.editorialReview?.revisions.find((revision) => revision.id === casino.editorialReview?.publishedRevisionId);
  const media = casino.mediaAssets[0];
  const seo = desiredSeo(definition);
  const publishedSnapshot = jsonObject(casino.versions[0]?.snapshot ?? null);
  return casino.editorScore === definition.score
    && casino.summary === definition.summary
    && casino.description === definition.description
    && equivalent(casino.pros, definition.bestFor)
    && equivalent(casino.cons, definition.thingsToKnow)
    && equivalent(casino.responsibleGamblingTools, definition.responsibleGamblingTools)
    && casino.editorialReview?.status === "PUBLISHED"
    && Boolean(casino.editorialReview.publishedRevisionId)
    && casino.publishedVersion === casino.versions[0]?.version
    && publishedSnapshot.editorScore === definition.score
    && publishedSnapshot.summary === definition.summary
    && publishedSnapshot.description === definition.description
    && equivalent(publishedSnapshot.pros, definition.bestFor)
    && equivalent(publishedSnapshot.cons, definition.thingsToKnow)
    && media?.checksum === definition.brandMark.checksum
    && Object.entries(seo).every(([key, value]) => (casino.seo as unknown as Record<string, unknown> | null)?.[key] === value)
    && equivalent(reviewRevision?.content, casinoCatalogEditorialDocument(definition));
}

async function returnCasinoToDraft(casinoId: string, actorId: string) {
  let aggregate = await casinoService.getCasinoById(casinoId);
  if (aggregate.status !== EditorialStatus.DRAFT) {
    aggregate = await casinoService.transitionWorkflow(casinoId, EditorialStatus.DRAFT, actorId, aggregate.updatedAt);
  }
  return aggregate;
}

async function syncEditorial(definition: CasinoCatalogDefinition, casinoId: string, actorId: string) {
  let review = await editorialReviewService.getByCasinoId(casinoId);
  if (review && review.status !== "DRAFT") review = await editorialReviewService.transition(review.id, "DRAFT", actorId);
  review = await editorialReviewService.saveDraft(
    casinoId,
    casinoCatalogEditorialDocument(definition),
    `${CASINO_REAL_CATALOG_RELEASE}: complete real editorial review`,
    actorId,
  );
  review = await editorialReviewService.transition(review.id, "IN_REVIEW", actorId);
  review = await editorialReviewService.transition(review.id, "APPROVED", actorId);
  const revision = review.revisions.find((candidate) => candidate.revisionNumber === review?.draftRevisionNumber);
  if (!revision) throw new Error(`${definition.slug} editorial revision was not created.`);
  await editorialReviewService.publish(review.id, revision.id, actorId);
}

async function syncMedia(definition: CasinoCatalogDefinition, casinoId: string, actorId: string) {
  const { bytes } = await readBrandMark(definition);
  const identity = mediaIdentity(definition);
  await prisma.mediaAsset.upsert({
    where: { storageKey: identity.storageKey },
    create: {
      id: identity.id,
      type: "LOGO",
      storageProvider: "LOCAL",
      storageKey: identity.storageKey,
      publicUrl: definition.brandMark.path,
      originalFilename: path.basename(definition.brandMark.path),
      mimeType: definition.brandMark.mimeType,
      width: definition.brandMark.width,
      height: definition.brandMark.height,
      sizeBytes: bytes.length,
      altText: `${definition.title} logo`,
      title: `${definition.title} controlled real brand mark`,
      caption: "Stored for editorial brand identification; not an availability or endorsement signal.",
      credit: definition.brandMark.sourceDomain,
      sortOrder: -100,
      featured: true,
      status: "ACTIVE",
      checksum: definition.brandMark.checksum,
      metadata: {
        release: CASINO_REAL_CATALOG_RELEASE,
        classification: "DETECTED",
        role: "CONTROLLED_REAL_BRAND_MARK",
        geoScope: "GLOBAL_IDENTITY_ONLY",
        sourceDomain: definition.brandMark.sourceDomain,
        retrievalUrl: definition.brandMark.retrievalUrl,
        retrievalNote: "Controlled brand-identification asset; source and retrieval URL are checksum-bound in the release corpus.",
      },
      createdBy: actorId,
      casinoId,
    },
    update: {
      publicUrl: definition.brandMark.path,
      originalFilename: path.basename(definition.brandMark.path),
      mimeType: definition.brandMark.mimeType,
      width: definition.brandMark.width,
      height: definition.brandMark.height,
      sizeBytes: bytes.length,
      altText: `${definition.title} logo`,
      title: `${definition.title} controlled real brand mark`,
      caption: "Stored for editorial brand identification; not an availability or endorsement signal.",
      credit: definition.brandMark.sourceDomain,
      sortOrder: -100,
      featured: true,
      status: "ACTIVE",
      checksum: definition.brandMark.checksum,
      archivedAt: null,
      casinoId,
      casinoCountryId: null,
      casinoBonusId: null,
      affiliateOfferId: null,
      metadata: {
        release: CASINO_REAL_CATALOG_RELEASE,
        classification: "DETECTED",
        role: "CONTROLLED_REAL_BRAND_MARK",
        geoScope: "GLOBAL_IDENTITY_ONLY",
        sourceDomain: definition.brandMark.sourceDomain,
        retrievalUrl: definition.brandMark.retrievalUrl,
        retrievalNote: "Controlled brand-identification asset; source and retrieval URL are checksum-bound in the release corpus.",
      },
    },
  });
}

async function seedCasino(definition: CasinoCatalogDefinition, actorId: string) {
  await readBrandMark(definition);
  if (await alreadyApplied(definition)) return { slug: definition.slug, status: "unchanged" as const };
  let aggregate = await prisma.casino.findUnique({ where: { slug: definition.slug } });
  if (!aggregate) throw new Error(`${definition.slug} is missing; this bounded release will not invent a second casino identity.`);
  if (aggregate.id.startsWith("demo-")) throw new Error(`${definition.slug} resolved to a synthetic identity.`);

  aggregate = await returnCasinoToDraft(aggregate.id, actorId);
  const metadata = readCasinoEditorMetadata(aggregate.reviewBlocks);
  const categories = Object.fromEntries(definition.scoreCategories.map((category) => [category.key, category.score]));
  metadata.general = {
    ...metadata.general,
    trustScore: definition.score,
    userExperienceScore: categories["product-breadth"] ?? null,
    paymentsScore: categories.payments ?? null,
    gamesScore: categories["product-breadth"] ?? null,
    supportScore: categories["evidence-depth"] ?? null,
    responsibleGamblingScore: categories["regulatory-record"] ?? null,
    featured: false,
    recommended: false,
    internalNotes: `${CASINO_REAL_CATALOG_RELEASE}; scoring is editorial and independent of commercial authority.`,
  };
  const reviewBlocks = {
    ...jsonObject(aggregate.reviewBlocks),
    reviewContent: definition.description,
  } as Prisma.JsonObject;
  aggregate = await casinoService.updateCasino(aggregate.id, {
    summary: definition.summary,
    description: definition.description,
    foundedYear: definition.foundedYear,
    editorScore: definition.score,
    pros: definition.bestFor,
    cons: definition.thingsToKnow,
    responsibleGamblingTools: definition.responsibleGamblingTools,
    reviewBlocks: writeCasinoEditorMetadata(reviewBlocks, metadata),
    lastReviewedAt: new Date(CASINO_REAL_CATALOG_OBSERVED_AT),
    updatedBy: actorId,
    expectedUpdatedAt: aggregate.updatedAt,
  });

  const seo = desiredSeo(definition);
  await prisma.casinoSeo.upsert({
    where: { casinoId: aggregate.id },
    create: { casinoId: aggregate.id, ...seo },
    update: seo,
  });
  await syncMedia(definition, aggregate.id, actorId);
  await syncEditorial(definition, aggregate.id, actorId);
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "casino_real_catalog_reconciled",
      entityType: "casino",
      entityId: aggregate.id,
      summary: `${CASINO_REAL_CATALOG_RELEASE}: reconciled review, score, SEO and brand media`,
      metadata: { release: CASINO_REAL_CATALOG_RELEASE, score: definition.score, slug: definition.slug },
    },
  });
  aggregate = await casinoService.getCasinoById(aggregate.id);
  aggregate = await casinoService.transitionWorkflow(aggregate.id, EditorialStatus.IN_REVIEW, actorId, aggregate.updatedAt);
  aggregate = await casinoService.transitionWorkflow(aggregate.id, EditorialStatus.APPROVED, actorId, aggregate.updatedAt);
  await casinoService.publishCasino(aggregate.id, actorId, aggregate.updatedAt);
  return { slug: definition.slug, status: "published" as const };
}

async function audit() {
  assertCasinoRealCatalog();
  const [actor, casinos, migrations, corpus] = await Promise.all([
    selectActor(),
    prisma.casino.findMany({
      where: { slug: { in: casinoRealCatalog.map((casino) => casino.slug) } },
      select: { id: true, slug: true, status: true, editorScore: true },
      orderBy: { slug: "asc" },
    }),
    migrationState(),
    assertReleaseCorpus(),
  ]);
  for (const definition of casinoRealCatalog) await readBrandMark(definition);
  const missing = casinoRealCatalog.filter((definition) => !casinos.some((casino) => casino.slug === definition.slug)).map((definition) => definition.slug);
  const gentlemanJim = await prisma.casino.findUnique({ where: { slug: "gentleman-jim" }, select: { status: true } });
  const syntheticCandidates = casinos.filter((casino) => casino.id.startsWith("demo-")).map((casino) => casino.slug);
  const counts = await catalogRowCounts(casinos.map((casino) => casino.id));
  const factualKeys = ["marketProfiles", "licences", "evidence", "payments", "providers", "categories", "bonuses"] as const;
  const factualDrift = factualKeys.flatMap((key) => {
    const expected = corpus.expectedRows[key];
    return typeof expected === "number" && counts[key] !== expected
      ? [`${key}: expected ${expected}, found ${counts[key]}`]
      : [];
  });
  console.info(JSON.stringify({
    release: CASINO_REAL_CATALOG_RELEASE,
    actorAvailable: Boolean(actor),
    approvedCatalog: casinoRealCatalog.map(({ slug, score }) => ({ slug, score })),
    detectedCasinos: casinos.length,
    missing,
    syntheticCandidates,
    gentlemanJim: gentlemanJim?.status ?? "ABSENT",
    databaseTargetFingerprint: databaseTargetFingerprint(),
    migrations,
    corpus: { release: corpus.release, sourceFiles: corpus.sourceFiles.length, assets: corpus.assets.length },
    counts,
    factualDrift,
    productionAffiliateWrites: 0,
    destructiveWrites: 0,
  }, null, 2));
  if (!actor) throw new Error("No governed CMS actor is available.");
  if (missing.length) throw new Error(`Missing approved casino identities: ${missing.join(", ")}`);
  if (syntheticCandidates.length) throw new Error(`Synthetic candidate identities detected: ${syntheticCandidates.join(", ")}`);
  if (migrations.unfinished || !migrations.targetApplied || !migrations.targetChecksumMatches) throw new Error("Database migration target is not ready.");
  if (factualDrift.length) throw new Error(`Current factual rows differ from the checksum-bound corpus: ${factualDrift.join("; ")}`);
}

async function previewSeed() {
  assertPreviewWriteAuthority();
  assertCasinoRealCatalog();
  const [migrations, corpus, existingCasinos, existingActors] = await Promise.all([
    migrationState(),
    assertReleaseCorpus(),
    prisma.casino.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
    prisma.adminUser.findMany({ select: { id: true, email: true }, orderBy: { email: "asc" } }),
  ]);
  if (migrations.unfinished || !migrations.targetApplied || !migrations.targetChecksumMatches) {
    throw new Error("Preview write refused because the isolated Preview database is not migration-current.");
  }
  const approvedSlugs = new Set<string>(casinoRealCatalog.map((casino) => casino.slug));
  const unexpectedCasinos = existingCasinos.filter((casino) => !approvedSlugs.has(casino.slug));
  const unexpectedActors = existingActors.filter((actor) => actor.id !== PREVIEW_ACTOR.id || actor.email !== PREVIEW_ACTOR.email);
  if (unexpectedCasinos.length || ![0, casinoRealCatalog.length].includes(existingCasinos.length)) {
    throw new Error("Preview write refused because the Casino inventory is neither empty nor the exact bounded release set.");
  }
  if (unexpectedActors.length || existingActors.length > 1) {
    throw new Error("Preview write refused because the AdminUser inventory is not empty or the exact Preview executor.");
  }

  const bundles = await loadPreviewFactualBundles();
  const ingestion = existingCasinos.length === 0 ? await ingestCasinoBundles(prisma, bundles) : [];
  const ingestionIdempotency = existingCasinos.length === 0
    ? await verifyCasinoBundlesIdempotency(prisma, bundles)
    : { state: "exact-release-identities-already-present" };
  await prisma.adminUser.upsert({
    where: { email: PREVIEW_ACTOR.email },
    create: { ...PREVIEW_ACTOR, role: "SUPER_ADMIN" },
    update: { name: PREVIEW_ACTOR.name, role: "SUPER_ADMIN" },
  });
  await audit();
  const editorial = [];
  for (const definition of casinoRealCatalog) editorial.push(await seedCasino(definition, PREVIEW_ACTOR.id));
  console.info(JSON.stringify({
    release: CASINO_REAL_CATALOG_RELEASE,
    environment: "preview",
    databaseTargetFingerprint: databaseTargetFingerprint(),
    productionDatabaseTargetFingerprint: process.env.CASINO_REAL_CATALOG_PRODUCTION_DATABASE_FINGERPRINT,
    corpus: { release: corpus.release, sourceFiles: corpus.sourceFiles.length, assets: corpus.assets.length },
    ingestion: ingestion.map((result) => ({ casinoKey: result.casinoKey, reconciliation: result.reconciliation })),
    ingestionIdempotency,
    editorial,
    productionAffiliateWrites: 0,
    destructiveWrites: 0,
  }, null, 2));
  await verify();
}

async function seed() {
  assertWriteAuthority();
  await audit();
  const actor = await selectActor();
  if (!actor) throw new Error("No governed CMS actor is available.");
  const results = [];
  for (const definition of casinoRealCatalog) results.push(await seedCasino(definition, actor.id));
  console.info(JSON.stringify({ release: CASINO_REAL_CATALOG_RELEASE, results }, null, 2));
  await verify();
}

async function verify() {
  assertCasinoRealCatalog();
  await assertReleaseCorpus();
  const records = await prisma.casino.findMany({
    where: { slug: { in: casinoRealCatalog.map((casino) => casino.slug) } },
    select: {
      id: true,
      slug: true,
      status: true,
      editorScore: true,
      publishedVersion: true,
      versions: { where: { status: "PUBLISHED" }, orderBy: { version: "desc" }, take: 1, select: { snapshot: true } },
      editorialReview: { select: { status: true, publishedRevisionId: true } },
      mediaAssets: { where: { status: "ACTIVE", type: "LOGO" }, select: { storageKey: true, checksum: true, publicUrl: true } },
      redirectSlugs: { where: { active: true, archivedAt: null }, select: { slug: true } },
    },
  });
  const issues: string[] = [];
  if (records.length !== casinoRealCatalog.length) issues.push(`Expected 8 casinos, found ${records.length}.`);
  for (const definition of casinoRealCatalog) {
    const record = records.find((candidate) => candidate.slug === definition.slug);
    const snapshot = record?.versions[0]?.snapshot as Record<string, unknown> | undefined;
    const media = record?.mediaAssets.find((asset) => asset.storageKey === mediaIdentity(definition).storageKey);
    if (!record || record.status !== "PUBLISHED" || !record.publishedVersion || !snapshot) issues.push(`${definition.slug} has no current published version.`);
    if (record?.editorScore !== definition.score || snapshot?.editorScore !== definition.score) issues.push(`${definition.slug} does not expose the authorized Editor Score.`);
    if (record?.editorialReview?.status !== "PUBLISHED" || !record.editorialReview.publishedRevisionId) issues.push(`${definition.slug} has no published structured editorial review.`);
    if (!media || media.checksum !== definition.brandMark.checksum || media.publicUrl !== definition.brandMark.path) issues.push(`${definition.slug} has no controlled real brand mark.`);
    if (record?.redirectSlugs.length) issues.push(`${definition.slug} unexpectedly has an active Production redirect.`);
  }
  const ranked = records.slice().sort((a, b) => (b.editorScore ?? -1) - (a.editorScore ?? -1)).map((record) => record.slug);
  if (!equivalent(ranked, casinoRealCatalog.map((casino) => casino.slug))) issues.push("Published score order does not match Founder authority.");
  const counts = await catalogRowCounts(records.map((record) => record.id));
  if (counts.publishedReviews !== casinoRealCatalog.length) issues.push(`Expected 8 published reviews, found ${counts.publishedReviews}.`);
  if (counts.scores !== casinoRealCatalog.length) issues.push(`Expected 8 populated scores, found ${counts.scores}.`);
  if (counts.seoRecords !== casinoRealCatalog.length) issues.push(`Expected 8 SEO records, found ${counts.seoRecords}.`);
  if (counts.activeCommercialRoutes !== 0) issues.push(`Expected zero active commercial routes, found ${counts.activeCommercialRoutes}.`);
  console.info(JSON.stringify({
    release: CASINO_REAL_CATALOG_RELEASE,
    records: records.map((record) => ({ slug: record.slug, score: record.editorScore, status: record.status, version: record.publishedVersion, activeRedirects: record.redirectSlugs.length })),
    counts,
    issues,
  }, null, 2));
  if (issues.length) throw new Error(`${CASINO_REAL_CATALOG_RELEASE} verification failed.`);
}

async function main() {
  const mode = process.argv[2] as Mode | undefined;
  if (!mode || !["audit", "preview-seed", "seed", "verify"].includes(mode)) throw new Error("Use audit, preview-seed, seed or verify.");
  try {
    if (mode === "audit") await audit();
    if (mode === "preview-seed") await previewSeed();
    if (mode === "seed") await seed();
    if (mode === "verify") await verify();
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : `${CASINO_REAL_CATALOG_RELEASE} failed.`);
  process.exitCode = 1;
});
