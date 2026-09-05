import { isIsoCountryCode } from "@/lib/jurisdiction/country-code";

export const casinoMediaPlacements = [
  "CASINO_LOGO",
  "CASINO_DIRECTORY_CARD",
  "CASINO_DETAIL_HERO",
  "CASINO_COMPARE",
] as const;

export const offerMediaPlacements = [
  "BONUS_LISTING_CARD",
  "BEST_OFFER_FEATURED",
  "BEST_OFFER_SECONDARY",
  "CASINO_OFFER_BLOCK",
  "OFFER_DETAIL",
] as const;

export const mediaPlacements = [...casinoMediaPlacements, ...offerMediaPlacements] as const;
export const mediaPlacementVariants = ["DEFAULT", "DESKTOP", "MOBILE"] as const;
export const mediaRenderingModes = ["AUTO", "COVER", "CONTAIN", "COMPOSED"] as const;

export type MediaPlacementName = (typeof mediaPlacements)[number];
export type CasinoMediaPlacementName = (typeof casinoMediaPlacements)[number];
export type OfferMediaPlacementName = (typeof offerMediaPlacements)[number];
export type MediaPlacementVariantName = (typeof mediaPlacementVariants)[number];
export type MediaRenderingModeName = (typeof mediaRenderingModes)[number];
export type MediaAssignmentSubjectType = "CASINO" | "CASINO_BONUS" | "AFFILIATE_OFFER";

export type MediaTargetingResolution =
  | "EXACT_COUNTRY_LANGUAGE"
  | "GLOBAL_LANGUAGE"
  | "EXACT_COUNTRY_NEUTRAL"
  | "GLOBAL_NEUTRAL"
  | "CONTROLLED_FALLBACK";

export type PlacementMediaSource =
  | "EXPLICIT"
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
}

export interface PlacementMediaAssignment {
  id: string;
  mediaAssetId: string;
  placement: string;
  variant: string;
  countryCode?: string | null;
  languageCode?: string | null;
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
}

export const placementMediaGuidance: Record<MediaPlacementName, {
  label: string;
  ratio: string;
  minimum: string;
  subject: "casino" | "offer";
  formatGuidance?: {
    default: string;
    mobile: string;
    note: string;
  };
}> = {
  CASINO_LOGO: { label: "Logo", ratio: "1:1", minimum: "256×256", subject: "casino" },
  CASINO_DIRECTORY_CARD: { label: "Casino directory", ratio: "4:3", minimum: "800×600", subject: "casino" },
  CASINO_DETAIL_HERO: { label: "Casino detail hero", ratio: "16:10 or 16:9", minimum: "1600×1000", subject: "casino" },
  CASINO_COMPARE: { label: "Compare", ratio: "4:3", minimum: "640×480", subject: "casino" },
  BONUS_LISTING_CARD: {
    label: "Bonus listing",
    ratio: "300×250 preferred; 250×250 compatible",
    minimum: "security-valid image",
    subject: "offer",
    formatGuidance: {
      default: "Preferred 300×250 · compatible 250×250",
      mobile: "Preferred 320×100 or 320×50 · 300×250 remains a compatible fallback",
      note: "DEFAULT and MOBILE assignments remain independent.",
    },
  },
  BEST_OFFER_FEATURED: {
    label: "Best Offer featured",
    ratio: "300×250 preferred; 250×250 compatible",
    minimum: "security-valid image",
    subject: "offer",
    formatGuidance: {
      default: "Preferred 300×250 · compatible 250×250",
      mobile: "Preferred 320×100 or 320×50 · 300×250 remains a compatible fallback",
      note: "Wide banners are not stretched into the featured card.",
    },
  },
  BEST_OFFER_SECONDARY: {
    label: "Best Offer secondary",
    ratio: "300×250 preferred; 250×250 compatible",
    minimum: "security-valid image",
    subject: "offer",
    formatGuidance: {
      default: "Preferred 300×250 · compatible 250×250",
      mobile: "Preferred 320×100 or 320×50 · 300×250 remains a compatible fallback",
      note: "Use a MOBILE assignment for a supplied mobile banner.",
    },
  },
  CASINO_OFFER_BLOCK: {
    label: "Casino offer block",
    ratio: "300×250 card or deliberate 728×90 wide",
    minimum: "security-valid image",
    subject: "offer",
    formatGuidance: {
      default: "Preferred 300×250 card or 728×90 wide · compatible 250×250",
      mobile: "Preferred 320×100 or 320×50 · card fallback remains supported",
      note: "The review hero remains editorial and is not changed by this assignment.",
    },
  },
  OFFER_DETAIL: {
    label: "Offer detail",
    ratio: "300×250 card; future wide compatibility",
    minimum: "security-valid image",
    subject: "offer",
    formatGuidance: {
      default: "Future contract: 300×250 preferred · 250×250 and 728×90 compatible",
      mobile: "Future contract: 320×100 or 320×50 preferred",
      note: "No public offer-detail surface is created by this contract.",
    },
  },
};

export const placementFallbackChains: Record<MediaPlacementName, readonly MediaPlacementName[]> = {
  CASINO_LOGO: [],
  CASINO_DIRECTORY_CARD: [],
  CASINO_DETAIL_HERO: ["CASINO_DIRECTORY_CARD"],
  CASINO_COMPARE: ["CASINO_DIRECTORY_CARD"],
  BONUS_LISTING_CARD: ["CASINO_DIRECTORY_CARD"],
  BEST_OFFER_FEATURED: ["BEST_OFFER_SECONDARY", "BONUS_LISTING_CARD", "CASINO_DIRECTORY_CARD"],
  BEST_OFFER_SECONDARY: ["BONUS_LISTING_CARD", "CASINO_DIRECTORY_CARD"],
  CASINO_OFFER_BLOCK: ["BONUS_LISTING_CARD", "CASINO_DETAIL_HERO"],
  OFFER_DETAIL: ["CASINO_OFFER_BLOCK", "BONUS_LISTING_CARD", "CASINO_DETAIL_HERO"],
};

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
          { countryCode: null, languageCode, resolution: "GLOBAL_LANGUAGE" },
          { countryCode, languageCode: null, resolution: "EXACT_COUNTRY_NEUTRAL" },
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

function stableCandidates(
  assignments: PlacementMediaAssignment[],
  placement: MediaPlacementName,
  variant: MediaPlacementVariantName,
  target: MediaTargetBucket,
  now: number,
) {
  return assignments
    .filter((assignment) => {
      if (assignment.placement !== placement || assignment.variant !== variant || !activeAssignment(assignment, now)) return false;
      const hasCountryTarget = assignment.countryCode !== null && assignment.countryCode !== undefined;
      const hasLanguageTarget = assignment.languageCode !== null && assignment.languageCode !== undefined;
      const assignmentCountry = !hasCountryTarget
        ? null
        : normalizeMediaCountryCode(assignment.countryCode);
      const assignmentLanguage = !hasLanguageTarget
        ? null
        : normalizeMediaLanguageCode(assignment.languageCode);
      if (hasCountryTarget && !assignmentCountry) return false;
      if (hasLanguageTarget && !assignmentLanguage) return false;
      return assignmentCountry === target.countryCode && assignmentLanguage === target.languageCode;
    })
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
}

function assignmentGroups(context: PlacementMediaResolutionContext, placement: MediaPlacementName) {
  if (isCasinoMediaPlacement(placement)) return [context.casinoAssignments];
  return [context.affiliateOfferAssignments ?? [], context.casinoBonusAssignments ?? []];
}

function resolveAssignment(
  context: PlacementMediaResolutionContext,
  placement: MediaPlacementName,
  requestedVariant: MediaPlacementVariantName,
  target: MediaTargetBucket,
  now: number,
) {
  const variants = requestedVariant === "DEFAULT" ? ["DEFAULT"] as const : [requestedVariant, "DEFAULT"] as const;
  for (const assignments of assignmentGroups(context, placement)) {
    for (const variant of variants) {
      const assignment = stableCandidates(assignments, placement, variant, target, now)[0];
      if (assignment) return { assignment, variant };
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
  const targets = mediaTargetBuckets(input);

  for (const target of targets) {
    for (const placement of chain) {
      const resolved = resolveAssignment(input.context, placement, requestedVariant, target, now);
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
        resolvedCountryCode: target.countryCode,
        resolvedLanguageCode: target.languageCode,
        targetingResolution: target.resolution,
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
    : targets.map((target) => ({ target, resolved: resolveAssignment(input.context, "CASINO_LOGO", requestedVariant, target, now) }))
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
      resolvedCountryCode: logoAssignment?.target.countryCode ?? null,
      resolvedLanguageCode: logoAssignment?.target.languageCode ?? null,
      targetingResolution: logoAssignment?.target.resolution ?? "CONTROLLED_FALLBACK",
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
