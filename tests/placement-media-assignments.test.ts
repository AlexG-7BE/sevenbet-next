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
const INDEPENDENCE_CASINO_ID = "11111111-1111-4111-8111-111111111111";
const INDEPENDENCE_BONUS_ID = "22222222-2222-4222-8222-222222222222";
const INDEPENDENCE_OFFER_ID = "44444444-4444-4444-8444-444444444444";

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
  assert.deepEqual(
    [...casinoMediaPlacements, ...offerMediaPlacements, "CASINO_REVIEW_RIGHT_HERO"].sort(),
    [...mediaPlacements].sort(),
  );
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

test("trusted GEO bounds the full language priority matrix without cross-country or wrong-language fallback", () => {
  const targeted = (
    id: string,
    countryCode: string | null,
    languageCode: string | null,
    patch: Partial<PlacementMediaAssignment> = {},
  ) => assignment(id, "BEST_OFFER_FEATURED", asset(id, "BONUS_CREATIVE"), {
    countryCode,
    languageCode,
    ...patch,
  });
  const resolutionContext = context({
    casinoBonusAssignments: [
      targeted("global-en", null, "en"),
      targeted("global-it", null, "it"),
      targeted("global-neutral", null, null),
      targeted("fi-fi", "FI", "fi"),
      targeted("fi-en", "FI", "en"),
      targeted("fi-neutral", "FI", null),
      targeted("se-sv", "SE", "sv"),
      targeted("se-en", "SE", "en"),
      targeted("se-neutral", "SE", null),
      targeted("it-it", "IT", "it"),
      targeted("ee-et", "EE", "et"),
      targeted("ee-en", "EE", "en"),
      targeted("lv-lv", "LV", "lv"),
      targeted("lv-en", "LV", "en"),
    ],
  });
  const resolve = (trustedCountryCode: string | null, presentationLanguage: string) => resolveMedia({
    placement: "BEST_OFFER_FEATURED",
    context: resolutionContext,
    trustedCountryCode,
    presentationLanguage,
    now: NOW,
  });

  const fiFinnish = resolve("FI", "fi");
  assert.equal(fiFinnish.asset?.id, "fi-fi");
  assert.equal(fiFinnish.targetingResolution, "EXACT_COUNTRY_LANGUAGE");
  assert.deepEqual([fiFinnish.requestedCountryCode, fiFinnish.requestedLanguageCode], ["FI", "fi"]);

  assert.equal(resolve("FI", "en").asset?.id, "fi-en");
  assert.equal(resolve("SE", "sv").asset?.id, "se-sv");
  assert.equal(resolve("SE", "en").asset?.id, "se-en");
  assert.equal(resolve("EE", "en").asset?.id, "ee-en");
  assert.equal(resolve("LV", "en").asset?.id, "lv-en");
  assert.equal(resolve("FI", "sv").asset?.id, "fi-neutral");
  assert.equal(resolve(null, "it").asset?.id, "global-it");
  assert.equal(resolve("ZZ", "it").asset?.id, "global-it");
  assert.notEqual(resolve("FI", "sv").asset?.id, "se-sv");
  assert.notEqual(resolve(null, "it").asset?.id, "it-it");
});

test("exact-country neutral outranks global language and wrong-language global media fails closed", () => {
  const globalEnglish = asset("global-en", "BONUS_CREATIVE");
  const finlandNeutral = asset("fi-neutral", "BONUS_CREATIVE");
  const globalNeutral = asset("global-neutral", "BONUS_CREATIVE");
  const contextWithNeutral = context({ casinoBonusAssignments: [
    assignment("global-en", "BEST_OFFER_FEATURED", globalEnglish, { languageCode: "en" }),
    assignment("fi-neutral", "BEST_OFFER_FEATURED", finlandNeutral, { countryCode: "FI" }),
    assignment("global-neutral", "BEST_OFFER_FEATURED", globalNeutral),
  ] });
  const english = resolveMedia({ placement: "BEST_OFFER_FEATURED", trustedCountryCode: "FI", presentationLanguage: "en", context: contextWithNeutral, now: NOW });
  assert.equal(english.asset?.id, "fi-neutral");
  assert.equal(english.targetingResolution, "EXACT_COUNTRY_NEUTRAL");
  const italian = resolveMedia({ placement: "BEST_OFFER_FEATURED", trustedCountryCode: "FI", presentationLanguage: "it", context: contextWithNeutral, now: NOW });
  assert.equal(italian.asset?.id, "fi-neutral");
  assert.equal(italian.targetingResolution, "EXACT_COUNTRY_NEUTRAL");

  const wrongLanguagesOnly = context({ casinoBonusAssignments: [
    assignment("fi-fi", "BEST_OFFER_FEATURED", asset("fi-fi", "BONUS_CREATIVE"), { countryCode: "FI", languageCode: "fi" }),
    assignment("global-de", "BEST_OFFER_FEATURED", asset("global-de", "BONUS_CREATIVE"), { languageCode: "de" }),
  ] });
  const finalGlobal = resolveMedia({ placement: "BEST_OFFER_FEATURED", trustedCountryCode: "FI", presentationLanguage: "en", context: wrongLanguagesOnly, now: NOW });
  assert.equal(finalGlobal.asset, null);
  assert.equal(finalGlobal.source, "CODE_FALLBACK");
  assert.equal(finalGlobal.targetingResolution, "CONTROLLED_FALLBACK");
});

test("target-scoped assets never re-enter through unscoped HERO or LOGO fallback", () => {
  const finlandHero = asset("fi-hero", "HERO");
  const globalItalianLogo = asset("global-it-logo", "LOGO");
  const safeLegacyHero = asset("safe-legacy-hero", "HERO", { sortOrder: 20 });
  const resolutionContext = context({
    casinoAssignments: [
      assignment("fi-hero-assignment", "CASINO_DIRECTORY_CARD", finlandHero, { countryCode: "FI", languageCode: "fi" }),
      assignment("global-it-logo-assignment", "CASINO_LOGO", globalItalianLogo, { languageCode: "it" }),
    ],
    legacyMediaAssets: [finlandHero, globalItalianLogo, safeLegacyHero],
  });
  const unknownEnglish = resolveMedia({
    placement: "CASINO_DIRECTORY_CARD",
    presentationLanguage: "en",
    context: resolutionContext,
    now: NOW,
  });
  assert.equal(unknownEnglish.asset?.id, "safe-legacy-hero");
  assert.equal(unknownEnglish.source, "LEGACY_HERO");

  const noSafeLegacy = resolveMedia({
    placement: "CASINO_DIRECTORY_CARD",
    presentationLanguage: "en",
    context: { ...resolutionContext, legacyMediaAssets: [finlandHero, globalItalianLogo] },
    now: NOW,
  });
  assert.equal(noSafeLegacy.asset, null);
  assert.equal(noSafeLegacy.source, "CODE_FALLBACK");
  assert.equal(noSafeLegacy.targetingResolution, "CONTROLLED_FALLBACK");
});

test("target specificity is evaluated before device and placement fallback specificity", () => {
  const exactDefault = assignment("fi-default", "BEST_OFFER_FEATURED", asset("fi-default", "BONUS_CREATIVE"), {
    countryCode: "FI", languageCode: "fi", variant: "DEFAULT",
  });
  const globalMobile = assignment("global-mobile", "BEST_OFFER_FEATURED", asset("global-mobile", "BONUS_CREATIVE"), {
    languageCode: "fi", variant: "MOBILE",
  });
  const device = resolveMedia({
    placement: "BEST_OFFER_FEATURED",
    requestedVariant: "MOBILE",
    trustedCountryCode: "FI",
    presentationLanguage: "fi",
    context: context({ casinoBonusAssignments: [globalMobile, exactDefault] }),
    now: NOW,
  });
  assert.equal(device.asset?.id, "fi-default");
  assert.equal(device.resolvedVariant, "DEFAULT");
  assert.equal(device.source, "VARIANT_FALLBACK");
  assert.equal(device.targetingResolution, "EXACT_COUNTRY_LANGUAGE");

  const exactPlacementFallback = assignment("fi-listing", "BONUS_LISTING_CARD", asset("fi-listing", "BONUS_CREATIVE"), {
    countryCode: "FI", languageCode: "en", variant: "DEFAULT",
  });
  const globalDirect = assignment("global-featured", "BEST_OFFER_FEATURED", asset("global-featured", "BONUS_CREATIVE"), {
    languageCode: "en", variant: "MOBILE",
  });
  const placement = resolveMedia({
    placement: "BEST_OFFER_FEATURED",
    requestedVariant: "MOBILE",
    trustedCountryCode: "FI",
    presentationLanguage: "en",
    context: context({ casinoBonusAssignments: [globalDirect, exactPlacementFallback] }),
    now: NOW,
  });
  assert.equal(placement.asset?.id, "fi-listing");
  assert.equal(placement.resolvedPlacement, "BONUS_LISTING_CARD");
  assert.equal(placement.resolvedVariant, "DEFAULT");
  assert.equal(placement.source, "PLACEMENT_FALLBACK");
  assert.equal(placement.targetingResolution, "EXACT_COUNTRY_LANGUAGE");
});

test("malformed explicit assignment targets fail closed instead of becoming global inventory", () => {
  const malformedCountry = assignment("malformed-country", "BEST_OFFER_FEATURED", asset("malformed-country"), { countryCode: "F1", languageCode: "en" });
  const malformedLanguage = assignment("malformed-language", "BEST_OFFER_FEATURED", asset("malformed-language"), { countryCode: "FI", languageCode: "e" });
  const emptyCountry = assignment("empty-country", "BEST_OFFER_FEATURED", asset("empty-country"), { countryCode: "", languageCode: "en" });
  const emptyLanguage = assignment("empty-language", "BEST_OFFER_FEATURED", asset("empty-language"), { countryCode: "FI", languageCode: "" });
  const safeGlobal = assignment("safe-global", "BEST_OFFER_FEATURED", asset("safe-global"));
  const result = resolveMedia({
    placement: "BEST_OFFER_FEATURED",
    trustedCountryCode: "FI",
    presentationLanguage: "en",
    context: context({ casinoBonusAssignments: [malformedCountry, malformedLanguage, emptyCountry, emptyLanguage, safeGlobal] }),
    now: NOW,
  });
  assert.equal(result.asset?.id, "safe-global");
  assert.equal(result.targetingResolution, "GLOBAL_NEUTRAL");
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

function snapshotAssignment(
  id: string,
  placement: MediaPlacementName,
  media: ReturnType<typeof snapshotAsset>,
  variant = "DEFAULT",
  target: { countryCode?: string | null; languageCode?: string | null } = {},
) {
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
    ...target,
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
    casinoId: INDEPENDENCE_CASINO_ID,
    version: 7,
    status: "PUBLISHED",
    archivedAt: null,
    publishedAt: NOW,
    snapshot: {
      id: INDEPENDENCE_CASINO_ID,
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
        id: INDEPENDENCE_BONUS_ID,
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
      affiliatePrograms: [{
        id: "33333333-3333-4333-8333-333333333333",
        status: "ACTIVE",
        offers: [{
          id: INDEPENDENCE_OFFER_ID,
          casinoBonusId: INDEPENDENCE_BONUS_ID,
          status: "ACTIVE",
          startAt: null,
          expiresAt: null,
          mediaAssignments: [
            snapshotAssignment("offer-listing", "BONUS_LISTING_CARD", listing),
            snapshotAssignment("offer-featured", "BEST_OFFER_FEATURED", featured),
            snapshotAssignment("offer-block", "CASINO_OFFER_BLOCK", offerBlock),
          ],
        }],
      }],
      seo: {},
    },
  };
}

function governedOffer(record: PublishedCasinoSnapshotRecord) {
  const snapshot = record.snapshot as Record<string, unknown>;
  const programmes = snapshot.affiliatePrograms as Array<Record<string, unknown>>;
  return (programmes[0]?.offers as Array<Record<string, unknown>>)[0]!;
}

test("public projection preserves the operator logo while retired promotional assignments stay private", () => {
  const record = independenceRecord();
  const mapped = mapPublishedCasino(record, {
    now: NOW,
  });
  assert.ok(mapped);
  assert.equal(mapped.media.logo?.id, "legacy-logo");
  assert.equal(mapped.media.placements, undefined);
  assert.equal(mapped.bonuses[0]?.media, undefined);
  assert.doesNotMatch(JSON.stringify(mapped), /asset-[a-f]-(?:directory|detail|compare|listing|featured|offer-block|mobile)/);
});

test("historical targeting remains deterministic while retired assignments stay out of public projection", () => {
  const record = independenceRecord();
  const targets = [
    ["global-en", null, "en"],
    ["global-neutral", null, null],
    ["fi-fi", "FI", "fi"],
    ["fi-en", "FI", "en"],
    ["se-sv", "SE", "sv"],
    ["se-en", "SE", "en"],
  ] as const;
  governedOffer(record).mediaAssignments = targets.map(([id, countryCode, languageCode]) => snapshotAssignment(
    id,
    "BEST_OFFER_FEATURED",
    snapshotAsset(id, "BONUS_CREATIVE"),
    "DEFAULT",
    { countryCode, languageCode },
  ));
  const historicalContext = context({
    casinoBonusAssignments: targets.map(([id, countryCode, languageCode]) => assignment(
      id,
      "BEST_OFFER_FEATURED",
      asset(id, "BONUS_CREATIVE"),
      { countryCode, languageCode },
    )),
  });
  const resolve = (trustedCountryCode: string | null, presentationLanguage: string) => resolveMedia({
    placement: "BEST_OFFER_FEATURED",
    trustedCountryCode,
    presentationLanguage,
    context: historicalContext,
    now: NOW,
  });
  const resolvePublic = (countryCode: string | null, _presentationLanguage: string) => mapPublishedCasino(record, {
    countryCode,
    now: NOW,
  });
  assert.equal(resolve("FI", "fi").asset?.id, "fi-fi");
  assert.equal(resolve("FI", "en").asset?.id, "fi-en");
  assert.equal(resolve("SE", "sv").asset?.id, "se-sv");
  assert.equal(resolve("SE", "en").asset?.id, "se-en");
  assert.equal(resolve(null, "en").asset?.id, "global-en");
  const sweden = resolvePublic("SE", "sv");
  const publicPayload = JSON.stringify(sweden?.bonuses[0]?.media) ?? "";
  assert.equal(sweden?.bonuses[0]?.media, undefined);
  assert.doesNotMatch(publicPayload, /global-en|global-neutral|fi-fi|fi-en|se-sv|se-en/);
});

test("targeted creatives are retired while exact governed CTA authority remains independent", () => {
  const record = independenceRecord();
  governedOffer(record).mediaAssignments = [snapshotAssignment(
    "fi-targeted-creative",
    "BEST_OFFER_FEATURED",
    snapshotAsset("fi-targeted-creative", "BONUS_CREATIVE"),
    "DEFAULT",
    { countryCode: "FI", languageCode: "fi" },
  )];
  const blocked = mapPublishedCasino(record, {
    countryCode: "FI",
    now: NOW,
  });
  assert.equal(blocked?.bonuses[0]?.media, undefined);
  assert.equal(blocked?.action, null);

  const eligible = mapPublishedCasino(record, {
    countryCode: "FI",
    now: NOW,
  });
  assert.equal(eligible?.bonuses[0]?.media, undefined);
  assert.equal(eligible?.action, null, "the editorial mapper cannot mint commercial authority from route input");
  assert.doesNotMatch(JSON.stringify(eligible), /fi-targeted-creative|trackingUrl|destinationUrl|partner\.example/i);
});

test("canonical CTA survives stale media compatibility without exposing promotional inventory", () => {
  const record = independenceRecord();
  const mapped = mapPublishedCasino(record, {
    countryCode: "FI",
    now: NOW,
  });
  assert.equal(mapped?.action, null, "media compatibility never creates a public action");
  assert.equal(mapped?.bonuses[0]?.media, undefined);
  assert.equal(mapped?.media.placements, undefined);
  assert.doesNotMatch(JSON.stringify(mapped), /asset-[a-f]-|offer-(listing|featured|block)/);
});

test("historical resolver targets stay fail-closed while neither form enters the retired public projection", () => {
  const historicalRecord = independenceRecord();
  const historicalResolution = resolveMedia({
    placement: "BEST_OFFER_FEATURED",
    trustedCountryCode: "FI",
    presentationLanguage: "en",
    context: context({ casinoBonusAssignments: [assignment("asset-e-featured", "BEST_OFFER_FEATURED", asset("asset-e-featured", "BONUS_CREATIVE"))] }),
    now: NOW,
  });
  assert.equal(historicalResolution.asset?.id, "asset-e-featured");
  assert.equal(historicalResolution.targetingResolution, "GLOBAL_NEUTRAL");
  const historical = mapPublishedCasino(historicalRecord, {
    countryCode: "FI",
    now: NOW,
  });
  assert.equal(historical?.bonuses[0]?.media, undefined);
  assert.doesNotMatch(JSON.stringify(historical), /asset-e-featured/);

  const malformed = independenceRecord();
  const malformedSnapshot = malformed.snapshot as Record<string, unknown>;
  governedOffer(malformed).mediaAssignments = [snapshotAssignment(
    "invalid-target",
    "BEST_OFFER_FEATURED",
    snapshotAsset("invalid-target", "BONUS_CREATIVE"),
    "DEFAULT",
    { countryCode: "Finland", languageCode: "EN" },
  )];
  malformedSnapshot.mediaAssets = [];
  malformedSnapshot.images = [];
  malformedSnapshot.mediaAssignments = [];
  const result = mapPublishedCasino(malformed, {
    countryCode: "FI",
    now: NOW,
  });
  const malformedResolution = resolveMedia({
    placement: "BEST_OFFER_FEATURED",
    trustedCountryCode: "FI",
    presentationLanguage: "en",
    context: context({ casinoBonusAssignments: [assignment("invalid-target", "BEST_OFFER_FEATURED", asset("invalid-target"), { countryCode: "Finland", languageCode: "EN" })] }),
    now: NOW,
  });
  assert.equal(malformedResolution.asset, null);
  assert.equal(malformedResolution.source, "CODE_FALLBACK");
  assert.equal(result?.bonuses[0]?.media, undefined);
  assert.doesNotMatch(JSON.stringify(result), /invalid-target/);
});

test("published target-scoped assets cannot bypass retirement through historical media fallback", () => {
  const record = independenceRecord();
  const snapshot = record.snapshot as Record<string, unknown>;
  const targetedHero = snapshotAsset("published-fi-only-hero", "HERO");
  snapshot.mediaAssets = [...(snapshot.mediaAssets as unknown[]), targetedHero];
  snapshot.mediaAssignments = [snapshotAssignment(
    "published-fi-only-assignment",
    "CASINO_DIRECTORY_CARD",
    targetedHero,
    "DEFAULT",
    { countryCode: "FI", languageCode: "fi" },
  )];
  const unknownEnglish = mapPublishedCasino(record, {
    countryCode: null,
    now: NOW,
  });
  assert.equal(unknownEnglish?.media.logo?.id, "legacy-logo");
  assert.equal(unknownEnglish?.media.placements, undefined);
  assert.doesNotMatch(JSON.stringify(unknownEnglish), /published-fi-only-hero|published-fi-only-assignment/);
});

test("legacy feature flags cannot reactivate assignment or promotional HERO projection", () => {
  const mapped = mapPublishedCasino(independenceRecord(), {
    now: NOW,
  });
  assert.ok(mapped);
  assert.equal(mapped.media.logo?.id, "legacy-logo");
  assert.equal(mapped.media.hero, null);
  assert.equal(mapped.media.placements, undefined);
  assert.equal(mapped.bonuses[0]?.media, undefined);
  assert.doesNotMatch(JSON.stringify(mapped), /legacy-hero|asset-[a-f]-/);
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
  await assert.rejects(() => harness.service.assignMedia({ ...base, countryCode: "F1" }), /ISO 3166/);
  await assert.rejects(() => harness.service.assignMedia({ ...base, countryCode: "EU" }), /ISO 3166/);
  await assert.rejects(() => harness.service.assignMedia({ ...base, languageCode: "e" }), /language/);
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
    countryCode: "fi",
    languageCode: "EN",
    renderingMode: "COVER",
    cropSafe: true,
    focalPointX: 0.2,
    focalPointY: 0.8,
    reference: " governed source ",
    actorId: "actor",
  });
  assert.equal(harness.calls.length, 1);
  const input = harness.calls[0]?.input as { focalPointX: Prisma.Decimal; focalPointY: Prisma.Decimal; reference: string; cropSafe: boolean; countryCode: string; languageCode: string };
  assert.equal(input.focalPointX.toString(), "0.2");
  assert.equal(input.focalPointY.toString(), "0.8");
  assert.equal(input.reference, "governed source");
  assert.equal(input.cropSafe, true);
  assert.equal(input.countryCode, "FI");
  assert.equal(input.languageCode, "en");

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
  for (const value of mediaPlacements.filter((placement) => placement !== "CASINO_REVIEW_RIGHT_HERO")) {
    assert.match(migration, new RegExp(`'${value}'`));
  }
  assert.doesNotMatch(migration, /CASINO_REVIEW_RIGHT_HERO/);
  assert.match(readFileSync("prisma/migrations/0033_media_geo3_pipeline/migration.sql", "utf8"), /CASINO_REVIEW_RIGHT_HERO/);
  for (const value of ["DEFAULT", "DESKTOP", "MOBILE", "AUTO", "COVER", "CONTAIN", "COMPOSED"]) assert.match(migration, new RegExp(`'${value}'`));
  assert.match(migration, /CasinoMediaAssignment_placement_check/);
  assert.match(migration, /CasinoBonusMediaAssignment_placement_check/);
  assert.match(migration, /AffiliateOfferMediaAssignment_placement_check/);
  assert.doesNotMatch(migration, /DROP\s+(TABLE|COLUMN|TYPE)|TRUNCATE|DELETE\s+FROM|ALTER\s+COLUMN/i);
  assert.match(migration, /Legacy MediaAsset[\s\S]+remain intact/);
  assert.match(schema, /mediaAssets\s+MediaAsset\[\]/);
  assert.doesNotMatch(schema, /model\s+MediaAssignment\s*\{[\s\S]*subjectType[\s\S]*subjectId/);
});

test("0028 adds nullable assignment targeting with bounded checks and resolver indexes only", () => {
  const migration = readFileSync("prisma/migrations/0028_geo_localized_creative_assignments/migration.sql", "utf8");
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  for (const table of ["CasinoMediaAssignment", "CasinoBonusMediaAssignment", "AffiliateOfferMediaAssignment"]) {
    assert.match(migration, new RegExp(`ALTER TABLE "${table}"[\\s\\S]+ADD COLUMN "countryCode" TEXT[\\s\\S]+ADD COLUMN "languageCode" TEXT`));
    assert.match(migration, new RegExp(`${table}_countryCode_check`));
    assert.match(migration, new RegExp(`${table}_languageCode_check`));
    assert.match(migration, new RegExp(`${table}_target_resolver_idx`));
    assert.match(schema, new RegExp(`model ${table}[\\s\\S]+countryCode\\s+String\\?[\\s\\S]+languageCode\\s+String\\?`));
  }
  assert.match(migration, /\^\[A-Z\]\{2\}\$/);
  assert.match(migration, /\^\[a-z\]\{2,8\}\$/);
  assert.doesNotMatch(migration, /DROP\s+(TABLE|COLUMN|TYPE)|TRUNCATE|DELETE\s+FROM|UPDATE\s+/i);
  assert.doesNotMatch(migration, /DEFAULT\s+/i);
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
  assert.deepEqual(
    [...new Set(manifest.rows.map((row) => row.placement))].sort(),
    mediaPlacements.filter((placement) => placement !== "CASINO_REVIEW_RIGHT_HERO").sort(),
  );
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

test("historical semantic slots remain documented while promotional Admin writes fail closed", () => {
  const editor = readFileSync("components/admin/media/PlacementMediaEditor.tsx", "utf8");
  const selector = readFileSync("components/admin/media/MediaSelector.tsx", "utf8");
  const casino = readFileSync("components/admin/CasinoBuilder.tsx", "utf8");
  const bonus = readFileSync("components/admin/casino-editors/BonusEditor.tsx", "utf8");
  const affiliate = readFileSync("components/admin/affiliate/AffiliateEditors.tsx", "utf8");
  const route = readFileSync("app/api/admin/media/assignments/route.ts", "utf8");
  const uploadRoute = readFileSync("app/api/admin/media/upload/route.ts", "utf8");
  const placementContract = `${readFileSync("lib/media/placement-registry.ts", "utf8")}\n${readFileSync("lib/media/placement-media.ts", "utf8")}`;
  for (const placement of mediaPlacements) assert.match(placementContract, new RegExp(placement));
  assert.match(editor, /Promotional placement media retired/);
  assert.match(editor, /MarketActivation/);
  assert.doesNotMatch(casino, /PlacementMediaEditor/);
  assert.doesNotMatch(bonus, /PlacementMediaEditor/);
  assert.match(affiliate, /PlacementMediaEditor/);
  assert.doesNotMatch(editor, /Upload and assign|Choose an active asset|Remove assignment|Deactivate assignment|Reactivate assignment/);
  assert.match(selector, /props\.type !== "SOCIAL_IMAGE"/);
  assert.match(selector, /Promotional media retired/);
  assert.match(uploadRoute, /isActiveAdminMediaType\(input\.type\)/);
  assert.match(uploadRoute, /input\.type === "SOCIAL_IMAGE"[\s\S]+cannot be linked to an offer, bonus, or market/);
  assert.match(route, /retiredMediaResponse/);
  assert.doesNotMatch(route, /mediaAssignmentService|assignMedia|unassignMedia|setAssignmentActive/);
  assert.doesNotMatch(route, /export async function DELETE/);
});

test("active public surfaces exclude promotional media while preserving governed CTA semantics", () => {
  const discovery = readFileSync("lib/services/public-casino-discovery.service.ts", "utf8");
  const profile = readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8");
  const comparison = readFileSync("lib/services/public-comparison.service.ts", "utf8");
  const bestOffers = readFileSync("components/best-offers/BestOffersExperience.tsx", "utf8");
  const bonuses = readFileSync("components/bonus-directory/BonusOfferDirectory.tsx", "utf8");
  assert.match(discovery, /logo:\s*logoMediaDto/);
  assert.match(discovery, /hero:\s*null/);
  assert.match(profile, /casino\.media\.logo/);
  assert.match(profile, /source: "CTA", placement: "CASINO_OFFER_SECTION"/);
  assert.doesNotMatch(profile, /source: "CREATIVE"|CASINO_REVIEW_RIGHT_HERO/);
  assert.match(comparison, /casino\.media\.logo/);
  assert.match(bestOffers, /ResponsivePlacementImage/);
  assert.match(bonuses, /offerCardPresentation/);
  assert.match(bonuses, /CommercialFacts/);
  assert.doesNotMatch(`${bestOffers}\n${bonuses}`, /CommercialOfferMedia|OperatorIdentityPanel/);
  const responsive = readFileSync("components/media/ResponsivePlacementImage.tsx", "utf8");
  assert.match(responsive, /max-width: 767px/);
  assert.match(responsive, /data-placement-variant="MOBILE"/);
  assert.match(responsive, /data-placement-variant="DESKTOP"/);
});
