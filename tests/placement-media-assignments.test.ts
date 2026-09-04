import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { MediaAssetStatus, Prisma } from "@prisma/client";

import {
  buildPlacementBackfillManifest,
  deterministicAssignmentId,
  placementMediaDatabaseTarget,
  PLACEMENT_MEDIA_PREVIEW_DATABASE_FINGERPRINT,
  PLACEMENT_MEDIA_PREVIEW_RESOURCE_ID,
  PLACEMENT_MEDIA_PRODUCTION_RESOURCE_ID,
  sha256,
  type LegacyPublishedCasino,
} from "../lib/media/placement-media-backfill";
import {
  casinoMediaPlacements,
  isPlacementMediaAssignmentsEnabled,
  mediaPlacements,
  offerMediaPlacements,
  placementFallbackChains,
  resolveMedia,
  type MediaPlacementName,
  type PlacementMediaAsset,
  type PlacementMediaAssignment,
  type PlacementMediaResolutionContext,
} from "../lib/media/placement-media";
import { mapPublishedCasino } from "../lib/public-casino/public-casino.mapper";
import type { PublishedCasinoSnapshotRecord } from "../lib/public-casino/public-casino.types";
import {
  buildPublishedCasinoSnapshot,
  type CasinoPlacementAggregate,
} from "../lib/repositories/casino.repository";
import type { MediaAssignmentRepository } from "../lib/repositories/media-assignment.repository";
import { MediaAssignmentService } from "../lib/services/media-assignment.service";

const NOW = new Date("2030-06-01T00:00:00.000Z");

test("the release executor binds Preview and Production to distinct exact database authorities", () => {
  const productionFingerprint = "production-fingerprint";
  assert.deepEqual(placementMediaDatabaseTarget("preview", productionFingerprint), {
    databaseFingerprint: PLACEMENT_MEDIA_PREVIEW_DATABASE_FINGERPRINT,
    resourceId: PLACEMENT_MEDIA_PREVIEW_RESOURCE_ID,
  });
  assert.deepEqual(placementMediaDatabaseTarget("production", productionFingerprint), {
    databaseFingerprint: productionFingerprint,
    resourceId: PLACEMENT_MEDIA_PRODUCTION_RESOURCE_ID,
  });
  assert.notEqual(
    placementMediaDatabaseTarget("preview", productionFingerprint).databaseFingerprint,
    placementMediaDatabaseTarget("production", productionFingerprint).databaseFingerprint,
  );
});

function asset(id: string, type = "HERO", patch: Partial<PlacementMediaAsset> = {}): PlacementMediaAsset {
  return {
    id,
    type,
    publicUrl: `https://media.example/${id}.png`,
    originalFilename: `${id}.png`,
    mimeType: "image/png",
    width: 1200,
    height: 900,
    altText: `${id} controlled media`,
    status: "ACTIVE",
    archivedAt: null,
    ...patch,
  };
}

function assignment(
  id: string,
  placement: MediaPlacementName,
  mediaAsset: PlacementMediaAsset,
  patch: Partial<PlacementMediaAssignment> = {},
): PlacementMediaAssignment {
  return {
    id,
    mediaAssetId: mediaAsset.id,
    placement,
    variant: "DEFAULT",
    renderingMode: "AUTO",
    sortOrder: 0,
    active: true,
    cropSafe: false,
    altTextOverride: null,
    focalPointX: null,
    focalPointY: null,
    validFrom: null,
    validUntil: null,
    reference: "test",
    mediaAsset,
    ...patch,
  };
}

function context(input: Partial<PlacementMediaResolutionContext> = {}): PlacementMediaResolutionContext {
  return {
    casinoName: "Independent Casino",
    casinoAssignments: [],
    casinoBonusAssignments: [],
    affiliateOfferAssignments: [],
    legacyMediaAssets: [],
    ...input,
  };
}

test("the resolver selects an exact deterministic assignment for every approved placement", () => {
  const casinoAssignments = casinoMediaPlacements.map((placement, index) => {
    const media = asset(`casino-${index}`, placement === "CASINO_LOGO" ? "LOGO" : "HERO");
    return assignment(`casino-assignment-${index}`, placement, media);
  });
  const casinoBonusAssignments = offerMediaPlacements.map((placement, index) => {
    const media = asset(`bonus-${index}`);
    return assignment(`bonus-assignment-${index}`, placement, media);
  });
  const resolutionContext = context({ casinoAssignments, casinoBonusAssignments });

  for (const [index, placement] of casinoMediaPlacements.entries()) {
    const result = resolveMedia({ placement, context: resolutionContext, now: NOW });
    assert.equal(result.asset?.id, `casino-${index}`, placement);
    assert.equal(result.source, "EXPLICIT", placement);
    assert.equal(result.requestedPlacement, placement);
    assert.equal(result.resolvedPlacement, placement);
  }
  for (const [index, placement] of offerMediaPlacements.entries()) {
    const result = resolveMedia({ placement, context: resolutionContext, now: NOW });
    assert.equal(result.asset?.id, `bonus-${index}`, placement);
    assert.equal(result.source, "EXPLICIT", placement);
    assert.equal(result.resolvedPlacement, placement);
  }
  assert.deepEqual([...casinoMediaPlacements, ...offerMediaPlacements], mediaPlacements);
});

test("requested variants use MOBILE exactly and then fall back to DEFAULT", () => {
  const defaultAsset = asset("directory-default");
  const mobileAsset = asset("directory-mobile", "HERO", { width: 600, height: 750 });
  const exact = resolveMedia({
    placement: "CASINO_DIRECTORY_CARD",
    requestedVariant: "MOBILE",
    now: NOW,
    context: context({
      casinoAssignments: [
        assignment("default", "CASINO_DIRECTORY_CARD", defaultAsset),
        assignment("mobile", "CASINO_DIRECTORY_CARD", mobileAsset, { variant: "MOBILE" }),
      ],
    }),
  });
  assert.equal(exact.asset?.id, "directory-mobile");
  assert.equal(exact.resolvedVariant, "MOBILE");
  assert.equal(exact.source, "EXPLICIT");

  const fallback = resolveMedia({
    placement: "CASINO_DIRECTORY_CARD",
    requestedVariant: "MOBILE",
    now: NOW,
    context: context({ casinoAssignments: [assignment("default", "CASINO_DIRECTORY_CARD", defaultAsset)] }),
  });
  assert.equal(fallback.asset?.id, "directory-default");
  assert.equal(fallback.resolvedVariant, "DEFAULT");
  assert.equal(fallback.source, "VARIANT_FALLBACK");
});

test("every approved placement fallback chain resolves its first eligible assignment", () => {
  for (const placement of mediaPlacements) {
    const fallbackPlacement = placementFallbackChains[placement][0];
    if (!fallbackPlacement) continue;
    const fallbackAsset = asset(`${placement}-fallback`, fallbackPlacement === "CASINO_LOGO" ? "LOGO" : "HERO");
    const candidate = assignment(`${placement}-fallback-assignment`, fallbackPlacement, fallbackAsset);
    const result = resolveMedia({
      placement,
      context: context({
        casinoAssignments: casinoMediaPlacements.includes(fallbackPlacement as never) ? [candidate] : [],
        casinoBonusAssignments: offerMediaPlacements.includes(fallbackPlacement as never) ? [candidate] : [],
      }),
      now: NOW,
    });
    assert.equal(result.asset?.id, fallbackAsset.id, placement);
    assert.equal(result.resolvedPlacement, fallbackPlacement, placement);
    assert.equal(result.source, "PLACEMENT_FALLBACK", placement);
  }
});

test("inactive, expired, future and archived candidates are skipped before stable sortOrder and ID selection", () => {
  const inactive = asset("inactive");
  const expired = asset("expired");
  const future = asset("future");
  const archived = asset("archived", "HERO", { archivedAt: "2030-01-01T00:00:00.000Z" });
  const winner = asset("winner");
  const laterId = asset("later-id");
  const result = resolveMedia({
    placement: "BONUS_LISTING_CARD",
    now: NOW,
    context: context({
      casinoBonusAssignments: [
        assignment("00-inactive", "BONUS_LISTING_CARD", inactive, { active: false, sortOrder: 0 }),
        assignment("00-expired", "BONUS_LISTING_CARD", expired, { validUntil: "2030-05-01T00:00:00.000Z", sortOrder: 0 }),
        assignment("00-future", "BONUS_LISTING_CARD", future, { validFrom: "2030-07-01T00:00:00.000Z", sortOrder: 0 }),
        assignment("00-archived", "BONUS_LISTING_CARD", archived, { sortOrder: 0 }),
        assignment("b-stable", "BONUS_LISTING_CARD", laterId, { sortOrder: 10 }),
        assignment("a-stable", "BONUS_LISTING_CARD", winner, { sortOrder: 10 }),
      ],
    }),
  });
  assert.equal(result.asset?.id, "winner");
  assert.equal(result.assignment?.id, "a-stable");
});

test("AUTO composes ultra-wide art, explicit COVER retains focal data, and OFFER_DETAIL skips legacy HERO", () => {
  const ultraWide = asset("ultra-wide", "HERO", { width: 320, height: 50 });
  const composed = resolveMedia({
    placement: "BONUS_LISTING_CARD",
    now: NOW,
    context: context({ casinoBonusAssignments: [assignment("wide", "BONUS_LISTING_CARD", ultraWide)] }),
  });
  assert.equal(composed.renderingMode, "COMPOSED");

  const coverAsset = asset("crop-safe");
  const cover = resolveMedia({
    placement: "CASINO_DETAIL_HERO",
    now: NOW,
    context: context({
      casinoAssignments: [assignment("cover", "CASINO_DETAIL_HERO", coverAsset, {
        renderingMode: "COVER",
        cropSafe: true,
        focalPointX: new Prisma.Decimal("0.25"),
        focalPointY: new Prisma.Decimal("0.75"),
      })],
    }),
  });
  assert.equal(cover.renderingMode, "COVER");
  assert.deepEqual(cover.focalPoint, { x: 0.25, y: 0.75 });

  const legacyHero = asset("legacy-hero");
  const logo = asset("legacy-logo", "LOGO");
  const offerDetail = resolveMedia({
    placement: "OFFER_DETAIL",
    now: NOW,
    context: context({ legacyMediaAssets: [legacyHero, logo] }),
  });
  assert.equal(offerDetail.asset?.id, "legacy-logo");
  assert.equal(offerDetail.source, "LOGO_COMPOSITION");
});

test("missing media ends in controlled logo composition and then code fallback", () => {
  const logo = asset("logo", "LOGO");
  const logoResult = resolveMedia({
    placement: "CASINO_DETAIL_HERO",
    now: NOW,
    context: context({ legacyMediaAssets: [logo] }),
  });
  assert.equal(logoResult.asset?.id, "logo");
  assert.equal(logoResult.renderingMode, "COMPOSED");
  assert.equal(logoResult.source, "LOGO_COMPOSITION");

  const code = resolveMedia({ placement: "CASINO_DETAIL_HERO", now: NOW, context: context() });
  assert.equal(code.asset, null);
  assert.equal(code.source, "CODE_FALLBACK");
  assert.match(code.effectiveAlt, /Independent Casino/);
});

test("partner-specific offer media can override editorial media without any CTA input", () => {
  const editorial = asset("editorial");
  const partner = asset("partner", "AFFILIATE_CREATIVE");
  const result = resolveMedia({
    placement: "BEST_OFFER_FEATURED",
    now: NOW,
    context: context({
      casinoBonusAssignments: [assignment("editorial", "BEST_OFFER_FEATURED", editorial)],
      affiliateOfferAssignments: [assignment("partner", "BEST_OFFER_FEATURED", partner)],
    }),
  });
  assert.equal(result.asset?.id, "partner");
  assert.doesNotMatch(JSON.stringify(result), /commission|tracking|geo|score|programme/i);
});

test("the assignment-first switch is exact, bounded and defaults to legacy", () => {
  assert.equal(isPlacementMediaAssignmentsEnabled({}), false);
  assert.equal(isPlacementMediaAssignmentsEnabled({ PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED: "false" }), false);
  assert.equal(isPlacementMediaAssignmentsEnabled({ PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED: "TRUE" }), false);
  assert.equal(isPlacementMediaAssignmentsEnabled({ PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED: "true" }), true);
});

function snapshotAsset(id: string, type: string) {
  return {
    id,
    type,
    publicUrl: `https://media.example/${id}.png`,
    originalFilename: `${id}.png`,
    mimeType: "image/png",
    width: 1200,
    height: 900,
    altText: `${id} media`,
    title: `${id} title`,
    caption: null,
    credit: "Controlled source",
    status: "ACTIVE",
    archivedAt: null,
    checksum: `${id}-checksum`,
  };
}

function snapshotAssignment(id: string, placement: MediaPlacementName, media: ReturnType<typeof snapshotAsset>, variant = "DEFAULT") {
  return {
    id,
    mediaAssetId: media.id,
    placement,
    variant,
    renderingMode: "CONTAIN",
    sortOrder: 0,
    active: true,
    cropSafe: false,
    altTextOverride: null,
    focalPointX: null,
    focalPointY: null,
    validFrom: null,
    validUntil: null,
    reference: "fixture",
    mediaAsset: media,
  };
}

function independenceRecord(): PublishedCasinoSnapshotRecord {
  const legacyLogo = snapshotAsset("legacy-logo", "LOGO");
  const legacyHero = snapshotAsset("legacy-hero", "HERO");
  const directory = snapshotAsset("asset-a-directory", "HERO");
  const detail = snapshotAsset("asset-b-detail", "HERO");
  const compare = snapshotAsset("asset-c-compare", "HERO");
  const listing = snapshotAsset("asset-d-listing", "BONUS_CREATIVE");
  const featured = snapshotAsset("asset-e-featured", "BONUS_CREATIVE");
  const offerBlock = snapshotAsset("asset-f-offer-block", "BONUS_CREATIVE");
  const directoryMobile = snapshotAsset("asset-a-mobile", "HERO");
  return {
    casinoId: "11111111-1111-4111-8111-111111111111",
    version: 7,
    status: "PUBLISHED",
    archivedAt: null,
    publishedAt: NOW,
    snapshot: {
      id: "11111111-1111-4111-8111-111111111111",
      slug: "independent-casino",
      title: "Independent Casino",
      domain: "independent.invalid",
      summary: "Independent placements",
      status: "PUBLISHED",
      editorScore: 8.4,
      publishedAt: NOW.toISOString(),
      reviewBlocks: { __sevenbetCasinoEditor: { general: {}, licenses: {}, countries: {}, payments: {}, providers: {}, categories: {}, bonuses: {} } },
      licenses: [],
      countries: [],
      paymentMethods: [],
      gameProviders: [],
      gameCategories: [],
      images: [],
      mediaAssets: [legacyLogo, legacyHero, directory, detail, compare, listing, featured, offerBlock, directoryMobile],
      mediaAssignments: [
        snapshotAssignment("casino-directory", "CASINO_DIRECTORY_CARD", directory),
        snapshotAssignment("casino-directory-mobile", "CASINO_DIRECTORY_CARD", directoryMobile, "MOBILE"),
        snapshotAssignment("casino-detail", "CASINO_DETAIL_HERO", detail),
        snapshotAssignment("casino-compare", "CASINO_COMPARE", compare),
      ],
      casinoBonuses: [{
        id: "22222222-2222-4222-8222-222222222222",
        slug: "independent-welcome",
        title: "Independent welcome",
        summary: "Current controlled terms",
        type: "WELCOME",
        status: "PUBLISHED",
        offerStatus: "ACTIVE",
        importantConditions: [],
        mediaAssignments: [
          snapshotAssignment("bonus-listing", "BONUS_LISTING_CARD", listing),
          snapshotAssignment("bonus-featured", "BEST_OFFER_FEATURED", featured),
          snapshotAssignment("bonus-offer-block", "CASINO_OFFER_BLOCK", offerBlock),
        ],
      }],
      seo: {},
    },
  };
}

test("public projection proves six independently assigned surface assets and responsive variants", () => {
  const mapped = mapPublishedCasino(independenceRecord(), [], {
    redirectEnabled: false,
    placementMediaEnabled: true,
    now: NOW,
  });
  assert.ok(mapped);
  assert.equal(mapped.media.placements?.CASINO_DIRECTORY_CARD?.asset?.id, "asset-a-directory");
  assert.equal(mapped.media.placements?.CASINO_DETAIL_HERO?.asset?.id, "asset-b-detail");
  assert.equal(mapped.media.placements?.CASINO_COMPARE?.asset?.id, "asset-c-compare");
  assert.equal(mapped.bonuses[0]?.media?.BONUS_LISTING_CARD?.asset?.id, "asset-d-listing");
  assert.equal(mapped.bonuses[0]?.media?.BEST_OFFER_FEATURED?.asset?.id, "asset-e-featured");
  assert.equal(mapped.bonuses[0]?.media?.CASINO_OFFER_BLOCK?.asset?.id, "asset-f-offer-block");
  assert.equal(mapped.media.placements?.CASINO_DIRECTORY_CARD?.variants.MOBILE?.asset?.id, "asset-a-mobile");
  assert.equal(mapped.media.placements?.CASINO_DIRECTORY_CARD?.variants.DESKTOP?.asset?.id, "asset-a-directory");
  assert.equal(mapped.media.placements?.CASINO_DIRECTORY_CARD?.variants.DESKTOP?.source, "VARIANT_FALLBACK");
  assert.equal(mapped.media.placements?.CASINO_DIRECTORY_CARD?.asset?.variants?.MOBILE?.id, "asset-a-mobile");
});

test("legacy mode ignores assignment arrays and preserves the previous HERO/LOGO projection", () => {
  const mapped = mapPublishedCasino(independenceRecord(), [], {
    redirectEnabled: false,
    placementMediaEnabled: false,
    now: NOW,
  });
  assert.ok(mapped);
  assert.equal(mapped.media.logo?.id, "legacy-logo");
  assert.equal(mapped.media.hero?.id, "legacy-hero");
  assert.equal(mapped.media.placements, undefined);
  assert.equal(mapped.bonuses[0]?.media, undefined);
});

test("published assignment projections are deep immutable snapshots and public reads stay snapshot-bound", () => {
  const logo = {
    ...snapshotAsset("snapshot-logo", "LOGO"),
    type: "LOGO",
    publicUrl: "/snapshot-logo.png",
    sortOrder: 0,
    featured: true,
    createdAt: NOW,
  };
  const mediaAssignment = {
    ...snapshotAssignment("snapshot-assignment", "CASINO_LOGO", logo),
    placement: "CASINO_LOGO",
    variant: "DEFAULT",
    renderingMode: "CONTAIN",
    createdAt: NOW,
    updatedAt: NOW,
  };
  const current = {
    id: "11111111-1111-4111-8111-111111111111",
    status: "APPROVED",
    mediaAssets: [logo],
    mediaAssignments: [mediaAssignment],
    countries: [],
    casinoBonuses: [{ id: "bonus", mediaAssignments: [] }],
  } as unknown as CasinoPlacementAggregate;
  const published = buildPublishedCasinoSnapshot(current, {
    actorId: "33333333-3333-4333-8333-333333333333",
    publishedAt: NOW,
    versionNumber: 7,
  }) as unknown as Record<string, unknown>;
  logo.publicUrl = "/changed-after-publication.png";
  assert.equal((published.mediaAssets as Array<Record<string, unknown>>)[0]?.publicUrl, "/snapshot-logo.png");
  assert.equal((published.mediaAssignments as Array<Record<string, unknown>>)[0]?.placement, "CASINO_LOGO");
  assert.equal(published.status, "PUBLISHED");
  assert.equal(published.publishedVersion, 7);

  const publicRepository = readFileSync("lib/repositories/public-casino.repository.ts", "utf8");
  assert.match(publicRepository, /cv\.snapshot/);
  assert.doesNotMatch(publicRepository, /CasinoMediaAssignment|CasinoBonusMediaAssignment|AffiliateOfferMediaAssignment/);
});

function serviceHarness() {
  const calls: Array<Record<string, unknown>> = [];
  const removedIds: string[] = [];
  const activeChanges: Array<{ assignmentId: string; active: boolean }> = [];
  let subject: { id: string; casinoId: string; casinoName: string; casinoStatus: string; affiliateOfferStatus?: string } = {
    id: "subject",
    casinoId: "casino",
    casinoName: "Independent Casino",
    casinoStatus: "DRAFT",
  };
  let currentAsset: { id: string; casinoId: string; status: MediaAssetStatus; archivedAt: Date | null } = {
    id: "asset",
    casinoId: "casino",
    status: MediaAssetStatus.ACTIVE,
    archivedAt: null,
  };
  const repository = {
    resolveSubject: async () => subject,
    findAsset: async () => currentAsset,
    assign: async (subjectType: string, subjectId: string, input: unknown, actorId: string) => {
      calls.push({ subjectType, subjectId, input, actorId });
      return input;
    },
    unassign: async (_subjectType: string, _subjectId: string, assignmentId: string) => {
      removedIds.push(assignmentId);
      return 1;
    },
    setActive: async (_subjectType: string, _subjectId: string, assignmentId: string, active: boolean) => {
      activeChanges.push({ assignmentId, active });
      return { id: assignmentId, active };
    },
    loadResolutionContext: async () => null,
    listAssetUsage: async () => [],
  } as unknown as MediaAssignmentRepository;
  return {
    calls,
    removedIds,
    activeChanges,
    service: new MediaAssignmentService(repository),
    setSubject(value: typeof subject) { subject = value; },
    setAsset(value: typeof currentAsset) { currentAsset = value; },
  };
}

test("central assignment validation enforces ownership, domain, mode, focal, archive and validity rules", async () => {
  const harness = serviceHarness();
  const base = {
    casinoId: "casino",
    subjectType: "CASINO" as const,
    subjectId: "subject",
    mediaAssetId: "asset",
    placement: "CASINO_DIRECTORY_CARD",
    actorId: "actor",
  };
  await assert.rejects(() => harness.service.assignMedia({ ...base, placement: "BONUS_LISTING_CARD" }), /Casino assignments only/);
  await assert.rejects(() => harness.service.assignMedia({ ...base, variant: "TABLET" }), /variant/);
  await assert.rejects(() => harness.service.assignMedia({ ...base, renderingMode: "STRETCH" }), /rendering mode/);
  await assert.rejects(() => harness.service.assignMedia({ ...base, renderingMode: "COVER" }), /crop-safe/);
  await assert.rejects(() => harness.service.assignMedia({ ...base, focalPointX: 0.5 }), /Both focal/);
  await assert.rejects(() => harness.service.assignMedia({ ...base, focalPointX: -0.1, focalPointY: 0.5 }), /between 0 and 1/);
  await assert.rejects(() => harness.service.assignMedia({ ...base, validFrom: new Date("2030-02-01"), validUntil: new Date("2030-01-01") }), /later than/);

  harness.setAsset({ id: "asset", casinoId: "other", status: MediaAssetStatus.ACTIVE, archivedAt: null });
  await assert.rejects(() => harness.service.assignMedia(base), /does not belong/);
  harness.setAsset({ id: "asset", casinoId: "casino", status: MediaAssetStatus.ARCHIVED, archivedAt: NOW });
  await assert.rejects(() => harness.service.assignMedia(base), /Archived or inactive/);
  harness.setSubject({ id: "subject", casinoId: "other", casinoName: "Other", casinoStatus: "DRAFT" });
  harness.setAsset({ id: "asset", casinoId: "other", status: MediaAssetStatus.ACTIVE, archivedAt: null });
  await assert.rejects(() => harness.service.assignMedia(base), /subject does not belong/);

  harness.setSubject({ id: "subject", casinoId: "casino", casinoName: "Independent Casino", casinoStatus: "PUBLISHED" });
  harness.setAsset({ id: "asset", casinoId: "casino", status: MediaAssetStatus.ACTIVE, archivedAt: null });
  await assert.rejects(() => harness.service.assignMedia(base), /Return the Casino to draft/);
});

test("central assignment mutation accepts safe COVER metadata and unassign remains relationship-only", async () => {
  const harness = serviceHarness();
  await harness.service.assignMedia({
    casinoId: "casino",
    subjectType: "CASINO_BONUS",
    subjectId: "subject",
    mediaAssetId: "asset",
    placement: "BONUS_LISTING_CARD",
    variant: "MOBILE",
    renderingMode: "COVER",
    cropSafe: true,
    focalPointX: 0.2,
    focalPointY: 0.8,
    reference: " governed source ",
    actorId: "actor",
  });
  assert.equal(harness.calls.length, 1);
  const input = harness.calls[0]?.input as { focalPointX: Prisma.Decimal; focalPointY: Prisma.Decimal; reference: string; cropSafe: boolean };
  assert.equal(input.focalPointX.toString(), "0.2");
  assert.equal(input.focalPointY.toString(), "0.8");
  assert.equal(input.reference, "governed source");
  assert.equal(input.cropSafe, true);

  const removed = await harness.service.unassignMedia({
    casinoId: "casino",
    subjectType: "CASINO_BONUS",
    subjectId: "subject",
    assignmentId: "assignment-mobile",
    actorId: "actor",
  });
  assert.equal(removed, 1);
  assert.deepEqual(harness.removedIds, ["assignment-mobile"]);

  await harness.service.setAssignmentActive({
    casinoId: "casino",
    subjectType: "CASINO_BONUS",
    subjectId: "subject",
    assignmentId: "assignment-mobile",
    active: false,
    actorId: "actor",
  });
  await harness.service.setAssignmentActive({
    casinoId: "casino",
    subjectType: "CASINO_BONUS",
    subjectId: "subject",
    assignmentId: "assignment-mobile",
    active: true,
    actorId: "actor",
  });
  assert.deepEqual(harness.activeChanges, [
    { assignmentId: "assignment-mobile", active: false },
    { assignmentId: "assignment-mobile", active: true },
  ]);
});

test("Affiliate Offer placement mutations follow the offer lifecycle instead of the Casino publication lifecycle", async () => {
  const harness = serviceHarness();
  harness.setSubject({
    id: "subject",
    casinoId: "casino",
    casinoName: "Independent Casino",
    casinoStatus: "PUBLISHED",
    affiliateOfferStatus: "ACTIVE",
  });
  await harness.service.assignMedia({
    casinoId: "casino",
    subjectType: "AFFILIATE_OFFER",
    subjectId: "subject",
    mediaAssetId: "asset",
    placement: "BEST_OFFER_FEATURED",
    actorId: "actor",
  });
  assert.equal(harness.calls.length, 1);

  harness.setSubject({
    id: "subject",
    casinoId: "casino",
    casinoName: "Independent Casino",
    casinoStatus: "PUBLISHED",
    affiliateOfferStatus: "ARCHIVED",
  });
  await assert.rejects(() => harness.service.assignMedia({
    casinoId: "casino",
    subjectType: "AFFILIATE_OFFER",
    subjectId: "subject",
    mediaAssetId: "asset",
    placement: "BEST_OFFER_SECONDARY",
    actorId: "actor",
  }), /Restore the Affiliate Offer/);
});

test("0027 is an additive typed migration with domain, focal, validity, COVER and RESTRICT guards", () => {
  const migration = readFileSync("prisma/migrations/0027_placement_media_assignments/migration.sql", "utf8");
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  for (const table of ["CasinoMediaAssignment", "CasinoBonusMediaAssignment", "AffiliateOfferMediaAssignment"]) {
    assert.match(migration, new RegExp(`CREATE TABLE "${table}"`));
    assert.match(migration, new RegExp(`${table}_mediaAssetId_fkey[\\s\\S]+ON DELETE RESTRICT`));
    assert.match(migration, new RegExp(`${table}_focal_points_check`));
    assert.match(migration, new RegExp(`${table}_validity_check`));
    assert.match(migration, new RegExp(`${table}_cover_check`));
    assert.match(schema, new RegExp(`model ${table}`));
  }
  for (const value of mediaPlacements) assert.match(migration, new RegExp(`'${value}'`));
  for (const value of ["DEFAULT", "DESKTOP", "MOBILE", "AUTO", "COVER", "CONTAIN", "COMPOSED"]) assert.match(migration, new RegExp(`'${value}'`));
  assert.match(migration, /CasinoMediaAssignment_placement_check/);
  assert.match(migration, /CasinoBonusMediaAssignment_placement_check/);
  assert.match(migration, /AffiliateOfferMediaAssignment_placement_check/);
  assert.doesNotMatch(migration, /DROP\s+(TABLE|COLUMN|TYPE)|TRUNCATE|DELETE\s+FROM|ALTER\s+COLUMN/i);
  assert.match(migration, /Legacy MediaAsset[\s\S]+remain intact/);
  assert.match(schema, /mediaAssets\s+MediaAsset\[\]/);
  assert.doesNotMatch(schema, /model\s+MediaAssignment\s*\{[\s\S]*subjectType[\s\S]*subjectId/);
});

test("the governed live manifest is exact, checksummed, deterministic and covers every current subject/placement", () => {
  const bytes = readFileSync("data/placement-media-assignments-01-backfill.json");
  const manifest = JSON.parse(bytes.toString("utf8")) as {
    release: string;
    expectedDatabaseFingerprint: string;
    sourceStateChecksum: string;
    expectedPublishedCasinoCount: number;
    expectedPublishedBonusCount: number;
    expectedAssignmentCount: number;
    rows: Array<{ casinoSlug: string; subjectType: string; subjectId: string; placement: MediaPlacementName; newAssignment: { id: string; mediaAssetId: string } | null }>;
  };
  assert.equal(sha256(bytes), "958d2b15f96d4871105d605de413020814b26de9183684a7620b8694afcb0d1d");
  assert.equal(manifest.release, "PLACEMENT-MEDIA-ASSIGNMENTS-01");
  assert.match(manifest.expectedDatabaseFingerprint, /^[a-f0-9]{64}$/);
  assert.match(manifest.sourceStateChecksum, /^[a-f0-9]{64}$/);
  assert.equal(manifest.expectedPublishedCasinoCount, 8);
  assert.equal(manifest.expectedPublishedBonusCount, 6);
  assert.equal(manifest.expectedAssignmentCount, 46);
  assert.equal(manifest.rows.length, 62);
  assert.deepEqual([...new Set(manifest.rows.map((row) => row.casinoSlug))].sort(), [
    "21-prive", "betsson", "diamond7", "dragonbet", "gday-casino", "hello-casino", "skol-casino", "slotnite",
  ]);
  assert.deepEqual([...new Set(manifest.rows.map((row) => row.placement))].sort(), [...mediaPlacements].sort());
  for (const row of manifest.rows) if (row.newAssignment) {
    assert.equal(row.newAssignment.id, deterministicAssignmentId(`${row.subjectType}:${row.subjectId}:${row.placement}:DEFAULT:${row.newAssignment.mediaAssetId}`));
  }
});

test("manifest generation is stable for identical source state and does not invent missing media", () => {
  const logo = {
    ...asset("legacy-logo", "LOGO"),
    id: "legacy-logo",
    type: "LOGO",
    publicUrl: "/logo.png",
    status: "ACTIVE",
    sortOrder: 0,
    createdAt: NOW,
    featured: true,
  };
  const source: LegacyPublishedCasino[] = [{
    id: "casino",
    slug: "casino",
    title: "Casino",
    publishedVersion: 1,
    mediaAssets: [logo],
    casinoBonuses: [{ id: "bonus", slug: "welcome", title: "Welcome" }],
  }];
  const first = buildPlacementBackfillManifest(source, { generatedAt: "one", expectedDatabaseFingerprint: "fingerprint" });
  const second = buildPlacementBackfillManifest(source, { generatedAt: "two", expectedDatabaseFingerprint: "fingerprint" });
  assert.equal(first.sourceStateChecksum, second.sourceStateChecksum);
  assert.equal(first.expectedAssignmentCount, 2);
  assert.equal(first.rows.find((row) => row.placement === "CASINO_DETAIL_HERO")?.newAssignment, null);
  assert.equal(first.rows.find((row) => row.placement === "BONUS_LISTING_CARD")?.newAssignment, null);
  assert.equal(first.rows.find((row) => row.placement === "OFFER_DETAIL")?.newAssignment, null);
});

test("real Admin surfaces expose semantic slots through the authorized centralized API without asset deletion", () => {
  const editor = readFileSync("components/admin/media/PlacementMediaEditor.tsx", "utf8");
  const casino = readFileSync("components/admin/CasinoBuilder.tsx", "utf8");
  const bonus = readFileSync("components/admin/casino-editors/BonusEditor.tsx", "utf8");
  const affiliate = readFileSync("components/admin/affiliate/AffiliateEditors.tsx", "utf8");
  const route = readFileSync("app/api/admin/media/assignments/route.ts", "utf8");
  const placementContract = readFileSync("lib/media/placement-media.ts", "utf8");
  for (const placement of mediaPlacements) assert.match(placementContract, new RegExp(placement));
  assert.match(editor, /casinoMediaPlacements/);
  assert.match(editor, /offerMediaPlacements/);
  assert.match(casino, /PlacementMediaEditor/);
  assert.match(bonus, /PlacementMediaEditor/);
  assert.match(affiliate, /PlacementMediaEditor/);
  assert.match(editor, /EXPLICIT/);
  assert.match(editor, /FALLBACK/);
  assert.match(editor, /Optional Desktop\/Mobile overrides/);
  assert.match(editor, /Upload and assign/);
  assert.match(editor, /Choose an active asset/);
  assert.match(editor, /Remove assignment/);
  assert.match(editor, /Deactivate assignment/);
  assert.match(editor, /Reactivate assignment/);
  assert.match(editor, /Usage/);
  assert.doesNotMatch(editor, /deleteMedia|DELETE ASSET|method:\s*["']DELETE/);
  assert.match(route, /requireAdminPermission\(request, "media\.manage"\)/);
  assert.match(route, /mediaAssignmentService\.assignMedia/);
  assert.match(route, /mediaAssignmentService\.unassignMedia/);
  assert.match(route, /mediaAssignmentService\.setAssignmentActive/);
  assert.doesNotMatch(route, /export async function DELETE/);
});

test("all required public surfaces read their dedicated semantic placement", () => {
  const files = {
    CASINO_DIRECTORY_CARD: readFileSync("lib/services/public-casino-discovery.service.ts", "utf8"),
    CASINO_DETAIL_HERO: readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8"),
    CASINO_COMPARE: readFileSync("lib/services/public-comparison.service.ts", "utf8"),
    BONUS_LISTING_CARD: readFileSync("components/commercial-media/CommercialOfferMedia.tsx", "utf8"),
    BEST_OFFER_FEATURED: readFileSync("components/commercial-media/CommercialOfferMedia.tsx", "utf8"),
    BEST_OFFER_SECONDARY: readFileSync("components/commercial-media/CommercialOfferMedia.tsx", "utf8"),
    CASINO_OFFER_BLOCK: readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8"),
  } as const;
  for (const [placement, source] of Object.entries(files)) assert.match(source, new RegExp(placement));
  const contextualComparison = readFileSync("components/comparison-context/ContextualComparison.tsx", "utf8");
  assert.match(contextualComparison, /ResponsivePlacementImage/);
  assert.match(contextualComparison, /data-media-placement="CASINO_COMPARE"/);
  assert.match(contextualComparison, /casino\.logo/);
  const responsive = readFileSync("components/media/ResponsivePlacementImage.tsx", "utf8");
  assert.match(responsive, /max-width: 767px/);
  assert.match(responsive, /data-placement-variant="MOBILE"/);
  assert.match(responsive, /data-placement-variant="DESKTOP"/);
});
