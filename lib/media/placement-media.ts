import { isIsoCountryCode } from "@/lib/jurisdiction/country-code";
import { marketProfileByCountry } from "@/lib/market/registry";
import {
  casinoMediaPlacements,
  mediaPlacementRegistry,
  mediaPlacements,
  mediaPlacementVariants,
  mediaRenderingModes,
  offerMediaPlacements,
  offerSurfaceMediaPlacements,
  placementAcceptsSubject,
  type MediaPlacementName,
  type MediaPlacementVariantName,
  type MediaRenderingModeName,
} from "@/lib/media/placement-registry";

export {
  casinoMediaPlacements,
  mediaPlacementRegistry,
  mediaPlacements,
  mediaPlacementVariants,
  mediaRenderingModes,
  offerMediaPlacements,
  offerSurfaceMediaPlacements,
  placementAcceptsSubject,
};
export type { MediaPlacementName, MediaPlacementVariantName, MediaRenderingModeName };

export type CasinoMediaPlacementName = (typeof casinoMediaPlacements)[number];
export type OfferMediaPlacementName = (typeof offerMediaPlacements)[number];
export type MediaAssignmentSubjectType = "CASINO" | "CASINO_BONUS" | "AFFILIATE_OFFER";

export type MediaTargetingResolution =
  | "EXACT_COUNTRY_LANGUAGE"
  | "EXACT_COUNTRY_NEUTRAL"
  | "EXACT_COUNTRY_UNKNOWN"
  | "GLOBAL_LANGUAGE"
  | "GLOBAL_ENGLISH_EUR"
  | "GLOBAL_ENGLISH"
  | "GLOBAL_NEUTRAL"
  | "GLOBAL_UNKNOWN"
  | "GLOBAL_OTHER"
  | "CONTROLLED_FALLBACK";

export type PlacementMediaSource =
  | "EXPLICIT"
  | "EXACT_OFFER"
  | "EXACT_OFFER_FORMAT_FALLBACK"
  | "BRAND_FALLBACK"
  | "VARIANT_FALLBACK"
  | "PLACEMENT_FALLBACK"
  | "LEGACY_HERO"
  | "LEGACY_LOGO"
  | "LOGO_COMPOSITION"
  | "CODE_FALLBACK";

export interface PlacementMediaAsset {
  id: string;
  type: string;
  publicUrl?: string | null;
  url?: string | null;
  originalFilename?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  alt?: string | null;
  title?: string | null;
  caption?: string | null;
  credit?: string | null;
  status?: string | null;
  archivedAt?: Date | string | null;
  metadata?: unknown;
  checksum?: string | null;
  sortOrder?: number | null;
  createdAt?: Date | string | null;
  sourceMode?: "FIRST_PARTY_MEDIA" | "PARTNER_HOSTED_IMAGE" | "PARTNER_HOSTED_EMBED";
  provider?: "SUPERFLY" | "BANNERFLOW" | null;
  hostedCreativeId?: string | null;
  externalCreativeId?: string | null;
  currencyCode?: string | null;
  purpose?: string | null;
}

export interface PlacementMediaAssignment {
  id: string;
  mediaAssetId: string;
  placement: string;
  variant: string;
  countryCode?: string | null;
  languageCode?: string | null;
  languageState?: "EXPLICIT" | "NEUTRAL" | "UNKNOWN";
  renderingMode: string;
  sortOrder: number;
  active: boolean;
  cropSafe?: boolean;
  altTextOverride?: string | null;
  focalPointX?: number | string | { toString(): string } | null;
  focalPointY?: number | string | { toString(): string } | null;
  validFrom?: Date | string | null;
  validUntil?: Date | string | null;
  reference?: string | null;
  affiliateOfferId?: string | null;
  casinoBonusId?: string | null;
  creativeSetId?: string | null;
  creativeVariantId?: string | null;
  mediaRevisionId?: string | null;
  purpose?: "BRAND" | "PROMOTION" | null;
  priority?: number | null;
  availability?: "AVAILABLE" | "NOT_FOUND" | "UNSUPPORTED" | "ERROR" | "STALE" | null;
  sourceHash?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  mediaAsset?: PlacementMediaAsset | null;
}

export interface PlacementMediaResolutionContext {
  casinoName: string;
  casinoAssignments: PlacementMediaAssignment[];
  casinoBonusAssignments?: PlacementMediaAssignment[];
  affiliateOfferAssignments?: PlacementMediaAssignment[];
  legacyMediaAssets: PlacementMediaAsset[];
  targetScopedAssetIds?: readonly string[];
}

export interface ResolvedPlacementMedia {
  asset: PlacementMediaAsset | null;
  assignment: PlacementMediaAssignment | null;
  requestedPlacement: MediaPlacementName;
  resolvedPlacement: MediaPlacementName | null;
  requestedVariant: MediaPlacementVariantName;
  resolvedVariant: MediaPlacementVariantName | null;
  requestedCountryCode: string | null;
  requestedLanguageCode: string | null;
  resolvedCountryCode: string | null;
  resolvedLanguageCode: string | null;
  targetingResolution: MediaTargetingResolution;
  renderingMode: Exclude<MediaRenderingModeName, "AUTO">;
  source: PlacementMediaSource;
  fallback: boolean;
  effectiveAlt: string;
  focalPoint: { x: number; y: number } | null;
  status?: "READY" | "FALLBACK" | "MISSING" | "CONFLICT" | "BLOCKED";
  creativeSetId?: string | null;
  creativeVariantId?: string | null;
  mediaRevisionId?: string | null;
  exactOfferId?: string | null;
  evidence?: {
    consideredAssignmentIds: string[];
    rejected: Array<{ assignmentId: string; reason: string }>;
    reason: string;
  };
}

export const placementMediaGuidance = Object.fromEntries(mediaPlacements.map((placement) => {
  const spec = mediaPlacementRegistry[placement];
  return [placement, {
    label: spec.label,
    ratio: spec.preferredFormats.default.join(" or "),
    minimum: `${spec.minimum.width}×${spec.minimum.height}`,
    subject: spec.subjects.includes("CASINO" as never) ? "casino" : "offer",
    formatGuidance: {
      default: `Preferred ${spec.preferredFormats.default.join(" · compatible ")}`,
      mobile: `Preferred ${spec.preferredFormats.mobile.join(" · compatible ")}`,
      note: `${spec.deviceBehavior} ${spec.safeArea}`,
    },
  }];
})) as Record<MediaPlacementName, {
  label: string;
  ratio: string;
  minimum: string;
  subject: "casino" | "offer";
  formatGuidance?: {
    default: string;
    mobile: string;
    note: string;
  };
}>;

export const placementFallbackChains = Object.fromEntries(mediaPlacements.map((placement) => {
  const spec = mediaPlacementRegistry[placement];
  return [placement, [...spec.promotionFallbacks, ...spec.brandFallbacks.filter((fallback) => fallback !== "CASINO_LOGO")]];
})) as unknown as Record<MediaPlacementName, readonly MediaPlacementName[]>;

export function isCasinoMediaPlacement(value: string): value is CasinoMediaPlacementName {
  return (casinoMediaPlacements as readonly string[]).includes(value);
}

export function isOfferMediaPlacement(value: string): value is OfferMediaPlacementName {
  return (offerMediaPlacements as readonly string[]).includes(value);
}

export function isMediaPlacement(value: string): value is MediaPlacementName {
  return (mediaPlacements as readonly string[]).includes(value);
}

export function isMediaPlacementVariant(value: string): value is MediaPlacementVariantName {
  return (mediaPlacementVariants as readonly string[]).includes(value);
}

export function isMediaRenderingMode(value: string): value is MediaRenderingModeName {
  return (mediaRenderingModes as readonly string[]).includes(value);
}

export function normalizeMediaCountryCode(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase() ?? "";
  return normalized && isIsoCountryCode(normalized) ? normalized : null;
}

export function isMediaLanguageCode(value: string) {
  return /^[a-z]{2,8}$/.test(value);
}

export function normalizeMediaLanguageCode(value: string | null | undefined) {
  const primary = value?.trim().toLowerCase().split(/[-_]/, 1)[0] ?? "";
  return primary && isMediaLanguageCode(primary) ? primary : null;
}

type MediaTargetBucket = {
  countryCode: string | null;
  languageCode: string | null;
  resolution: Exclude<MediaTargetingResolution, "CONTROLLED_FALLBACK">;
};

export function mediaTargetBuckets(input: {
  trustedCountryCode?: string | null;
  presentationLanguage?: string | null;
}): MediaTargetBucket[] {
  const countryCode = normalizeMediaCountryCode(input.trustedCountryCode);
  const languageCode = normalizeMediaLanguageCode(input.presentationLanguage);
  const candidates: MediaTargetBucket[] = countryCode
    ? languageCode
      ? [
          { countryCode, languageCode, resolution: "EXACT_COUNTRY_LANGUAGE" },
          { countryCode, languageCode: null, resolution: "EXACT_COUNTRY_NEUTRAL" },
          { countryCode: null, languageCode, resolution: "GLOBAL_LANGUAGE" },
          { countryCode: null, languageCode: null, resolution: "GLOBAL_NEUTRAL" },
        ]
      : [
          { countryCode, languageCode: null, resolution: "EXACT_COUNTRY_NEUTRAL" },
          { countryCode: null, languageCode: null, resolution: "GLOBAL_NEUTRAL" },
        ]
    : languageCode
      ? [
          { countryCode: null, languageCode, resolution: "GLOBAL_LANGUAGE" },
          { countryCode: null, languageCode: null, resolution: "GLOBAL_NEUTRAL" },
        ]
      : [{ countryCode: null, languageCode: null, resolution: "GLOBAL_NEUTRAL" }];
  return candidates;
}

function dateValue(value: Date | string | null | undefined) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function numeric(value: PlacementMediaAssignment["focalPointX"]) {
  if (value === null || value === undefined) return null;
  const parsed = Number(typeof value === "object" ? value.toString() : value);
  return Number.isFinite(parsed) ? parsed : null;
}

function activeAsset(asset: PlacementMediaAsset | null | undefined) {
  return Boolean(asset && asset.status === "ACTIVE" && !asset.archivedAt && (asset.publicUrl || asset.url));
}

function activeAssignment(assignment: PlacementMediaAssignment, now: number) {
  if (!assignment.active || !activeAsset(assignment.mediaAsset)) return false;
  const validFrom = dateValue(assignment.validFrom);
  const validUntil = dateValue(assignment.validUntil);
  return (validFrom === null || validFrom <= now) && (validUntil === null || validUntil > now);
}

type RankedMediaTarget = {
  rank: number;
  countryCode: string | null;
  languageCode: string | null;
  languageState: "EXPLICIT" | "NEUTRAL" | "UNKNOWN";
  resolution: Exclude<MediaTargetingResolution, "CONTROLLED_FALLBACK">;
};

function rankedMediaTarget(
  assignment: PlacementMediaAssignment,
  input: { trustedCountryCode?: string | null; presentationLanguage?: string | null },
): RankedMediaTarget | null {
  const requestedCountry = normalizeMediaCountryCode(input.trustedCountryCode);
  const requestedLanguage = normalizeMediaLanguageCode(input.presentationLanguage);
  const hasCountry = assignment.countryCode !== null && assignment.countryCode !== undefined;
  const countryCode = hasCountry ? normalizeMediaCountryCode(assignment.countryCode) : null;
  if (hasCountry && !countryCode) return null;
  const hasLanguage = assignment.languageCode !== null && assignment.languageCode !== undefined;
  const languageCode = hasLanguage ? normalizeMediaLanguageCode(assignment.languageCode) : null;
  const languageState = assignment.languageState ?? (hasLanguage ? "EXPLICIT" : "NEUTRAL");
  if ((hasLanguage && !languageCode) || (languageState === "EXPLICIT") !== Boolean(languageCode)) return null;
  if (countryCode) {
    if (!requestedCountry || countryCode !== requestedCountry) return null;
    if (requestedLanguage && languageState === "EXPLICIT" && languageCode === requestedLanguage) {
      return { rank: 0, countryCode, languageCode, languageState, resolution: "EXACT_COUNTRY_LANGUAGE" };
    }
    if (languageState === "NEUTRAL") return { rank: 1, countryCode, languageCode: null, languageState, resolution: "EXACT_COUNTRY_NEUTRAL" };
    return null;
  }
  if (requestedLanguage && languageState === "EXPLICIT" && languageCode === requestedLanguage) {
    return { rank: 2, countryCode: null, languageCode, languageState, resolution: "GLOBAL_LANGUAGE" };
  }
  if (languageState === "NEUTRAL") return { rank: 3, countryCode: null, languageCode: null, languageState, resolution: "GLOBAL_NEUTRAL" };
  return null;
}

function localCurrencyRank(assignment: PlacementMediaAssignment, countryCode: string | null) {
  if (!countryCode) return 1;
  const hints = marketProfileByCountry(countryCode)?.currencyHints ?? [];
  const currency = assignment.mediaAsset?.currencyCode?.trim().toUpperCase();
  return currency && hints.includes(currency) ? 0 : 1;
}

function stableCandidates(
  assignments: PlacementMediaAssignment[],
  placement: MediaPlacementName,
  variant: MediaPlacementVariantName,
  targetRank: number,
  targeting: { trustedCountryCode?: string | null; presentationLanguage?: string | null },
  now: number,
) {
  const requestedCountry = normalizeMediaCountryCode(targeting.trustedCountryCode);
  return assignments
    .flatMap((assignment) => {
      if (assignment.placement !== placement || assignment.variant !== variant || !activeAssignment(assignment, now)) return [];
      const target = rankedMediaTarget(assignment, targeting);
      return target?.rank === targetRank ? [{ assignment, target }] : [];
    })
    .sort((left, right) => {
      const localCurrency = localCurrencyRank(left.assignment, requestedCountry) - localCurrencyRank(right.assignment, requestedCountry);
      if (localCurrency) return localCurrency;
      const languageCertainty = (left.target.languageState === "UNKNOWN" ? 1 : 0) - (right.target.languageState === "UNKNOWN" ? 1 : 0);
      return languageCertainty || left.assignment.sortOrder - right.assignment.sortOrder || left.assignment.id.localeCompare(right.assignment.id);
    });
}

function assignmentGroups(context: PlacementMediaResolutionContext, placement: MediaPlacementName) {
  if (isCasinoMediaPlacement(placement)) return [context.casinoAssignments];
  return [context.affiliateOfferAssignments ?? [], context.casinoBonusAssignments ?? []];
}

function resolveAssignment(
  context: PlacementMediaResolutionContext,
  placement: MediaPlacementName,
  requestedVariant: MediaPlacementVariantName,
  targetRank: number,
  targeting: { trustedCountryCode?: string | null; presentationLanguage?: string | null },
  now: number,
) {
  const variants = requestedVariant === "DEFAULT" ? ["DEFAULT"] as const : [requestedVariant, "DEFAULT"] as const;
  for (const assignments of assignmentGroups(context, placement)) {
    for (const variant of variants) {
      const candidate = stableCandidates(assignments, placement, variant, targetRank, targeting, now)[0];
      if (candidate) return { ...candidate, variant };
    }
  }
  return null;
}

function targetScopedAssetIds(context: PlacementMediaResolutionContext) {
  const ids = new Set(context.targetScopedAssetIds ?? []);
  for (const assignment of [
    ...context.casinoAssignments,
    ...(context.casinoBonusAssignments ?? []),
    ...(context.affiliateOfferAssignments ?? []),
  ]) {
    if (assignment.countryCode !== null && assignment.countryCode !== undefined
      || assignment.languageCode !== null && assignment.languageCode !== undefined) {
      ids.add(assignment.mediaAssetId);
    }
  }
  return ids;
}

function legacyAsset(context: PlacementMediaResolutionContext, type: "HERO" | "LOGO") {
  const restrictedAssetIds = targetScopedAssetIds(context);
  return context.legacyMediaAssets
    .filter((asset) => asset.type === type && activeAsset(asset) && !restrictedAssetIds.has(asset.id))
    .sort((left, right) => {
      const sortOrder = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
      if (sortOrder) return sortOrder;
      const leftCreated = dateValue(left.createdAt);
      const rightCreated = dateValue(right.createdAt);
      if (leftCreated !== null && rightCreated !== null && leftCreated !== rightCreated) return leftCreated - rightCreated;
      return left.id.localeCompare(right.id);
    })[0] ?? null;
}

function effectiveMode(
  mode: string,
  placement: MediaPlacementName,
  asset: PlacementMediaAsset,
): Exclude<MediaRenderingModeName, "AUTO"> {
  if (mode === "COVER" || mode === "CONTAIN" || mode === "COMPOSED") return mode;
  if (placement === "CASINO_LOGO") return "CONTAIN";
  if (asset.type === "LOGO" || asset.type === "FAVICON") return "COMPOSED";
  if (asset.type === "BONUS_CREATIVE" || asset.type === "AFFILIATE_CREATIVE") return "CONTAIN";
  const ratio = asset.width && asset.height ? asset.width / asset.height : null;
  return ratio !== null && (ratio > 2.05 || ratio < 0.9) ? "COMPOSED" : "CONTAIN";
}

function effectiveAlt(context: PlacementMediaResolutionContext, asset: PlacementMediaAsset | null, assignment: PlacementMediaAssignment | null) {
  return assignment?.altTextOverride?.trim()
    || asset?.altText?.trim()
    || asset?.alt?.trim()
    || `${context.casinoName} controlled media`;
}

function focalPoint(assignment: PlacementMediaAssignment | null) {
  const x = numeric(assignment?.focalPointX);
  const y = numeric(assignment?.focalPointY);
  return x !== null && y !== null ? { x, y } : null;
}

export function resolveMedia(input: {
  placement: MediaPlacementName;
  requestedVariant?: MediaPlacementVariantName;
  trustedCountryCode?: string | null;
  presentationLanguage?: string | null;
  context: PlacementMediaResolutionContext;
  now?: Date;
}): ResolvedPlacementMedia {
  const requestedVariant = input.requestedVariant ?? "DEFAULT";
  const requestedCountryCode = normalizeMediaCountryCode(input.trustedCountryCode);
  const requestedLanguageCode = normalizeMediaLanguageCode(input.presentationLanguage);
  const now = (input.now ?? new Date()).getTime();
  const chain = [input.placement, ...placementFallbackChains[input.placement]];
  const targetRanks = [0, 1, 2, 3] as const;

  for (const targetRank of targetRanks) {
    for (const placement of chain) {
      const resolved = resolveAssignment(input.context, placement, requestedVariant, targetRank, input, now);
      if (!resolved?.assignment.mediaAsset) continue;
      const directPlacement = placement === input.placement;
      const directVariant = resolved.variant === requestedVariant;
      const source: PlacementMediaSource = directPlacement
        ? directVariant ? "EXPLICIT" : "VARIANT_FALLBACK"
        : "PLACEMENT_FALLBACK";
      const inheritedLogoComposition = !directPlacement
        && (resolved.assignment.mediaAsset.type === "LOGO" || resolved.assignment.mediaAsset.type === "FAVICON");
      return {
        asset: resolved.assignment.mediaAsset,
        assignment: resolved.assignment,
        requestedPlacement: input.placement,
        resolvedPlacement: placement,
        requestedVariant,
        resolvedVariant: resolved.variant,
        requestedCountryCode,
        requestedLanguageCode,
        resolvedCountryCode: resolved.target.countryCode,
        resolvedLanguageCode: resolved.target.languageCode,
        targetingResolution: resolved.target.resolution,
        renderingMode: inheritedLogoComposition
          ? "COMPOSED"
          : effectiveMode(resolved.assignment.renderingMode, placement, resolved.assignment.mediaAsset),
        source,
        fallback: source !== "EXPLICIT",
        effectiveAlt: effectiveAlt(input.context, resolved.assignment.mediaAsset, resolved.assignment),
        focalPoint: focalPoint(resolved.assignment),
      };
    }
  }

  if (input.placement !== "CASINO_LOGO" && input.placement !== "OFFER_DETAIL") {
    const hero = legacyAsset(input.context, "HERO");
    if (hero) return {
      asset: hero,
      assignment: null,
      requestedPlacement: input.placement,
      resolvedPlacement: null,
      requestedVariant,
      resolvedVariant: null,
      requestedCountryCode,
      requestedLanguageCode,
      resolvedCountryCode: null,
      resolvedLanguageCode: null,
      targetingResolution: "CONTROLLED_FALLBACK",
      renderingMode: effectiveMode("AUTO", input.placement, hero),
      source: "LEGACY_HERO",
      fallback: true,
      effectiveAlt: effectiveAlt(input.context, hero, null),
      focalPoint: null,
    };
  }

  const logoAssignment = input.placement === "CASINO_LOGO"
    ? null
    : targetRanks.map((targetRank) => ({ resolved: resolveAssignment(input.context, "CASINO_LOGO", requestedVariant, targetRank, input, now) }))
      .find((candidate) => candidate.resolved?.assignment.mediaAsset) ?? null;
  const logo = logoAssignment?.resolved?.assignment.mediaAsset ?? legacyAsset(input.context, "LOGO");
  if (logo) {
    const directLogo = input.placement === "CASINO_LOGO";
    return {
      asset: logo,
      assignment: logoAssignment?.resolved?.assignment ?? null,
      requestedPlacement: input.placement,
      resolvedPlacement: "CASINO_LOGO",
      requestedVariant,
      resolvedVariant: logoAssignment?.resolved?.variant ?? null,
      requestedCountryCode,
      requestedLanguageCode,
      resolvedCountryCode: logoAssignment?.resolved?.target.countryCode ?? null,
      resolvedLanguageCode: logoAssignment?.resolved?.target.languageCode ?? null,
      targetingResolution: logoAssignment?.resolved?.target.resolution ?? "CONTROLLED_FALLBACK",
      renderingMode: directLogo ? "CONTAIN" : "COMPOSED",
      source: directLogo ? "LEGACY_LOGO" : "LOGO_COMPOSITION",
      fallback: true,
      effectiveAlt: effectiveAlt(input.context, logo, logoAssignment?.resolved?.assignment ?? null),
      focalPoint: focalPoint(logoAssignment?.resolved?.assignment ?? null),
    };
  }

  return {
    asset: null,
    assignment: null,
    requestedPlacement: input.placement,
    resolvedPlacement: null,
    requestedVariant,
    resolvedVariant: null,
    requestedCountryCode,
    requestedLanguageCode,
    resolvedCountryCode: null,
    resolvedLanguageCode: null,
    targetingResolution: "CONTROLLED_FALLBACK",
    renderingMode: "COMPOSED",
    source: "CODE_FALLBACK",
    fallback: true,
    effectiveAlt: `${input.context.casinoName} media fallback`,
    focalPoint: null,
  };
}

export interface PlacementMediaRuntimeEnvironment {
  PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED?: string;
}

export function isPlacementMediaAssignmentsEnabled(
  environment: PlacementMediaRuntimeEnvironment = process.env as PlacementMediaRuntimeEnvironment,
) {
  return environment.PLACEMENT_MEDIA_ASSIGNMENTS_ENABLED === "true";
}
