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
}

export interface ResolvedPlacementMedia {
  asset: PlacementMediaAsset | null;
  assignment: PlacementMediaAssignment | null;
  requestedPlacement: MediaPlacementName;
  resolvedPlacement: MediaPlacementName | null;
  requestedVariant: MediaPlacementVariantName;
  resolvedVariant: MediaPlacementVariantName | null;
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
}> = {
  CASINO_LOGO: { label: "Logo", ratio: "1:1", minimum: "256×256", subject: "casino" },
  CASINO_DIRECTORY_CARD: { label: "Casino directory", ratio: "4:3", minimum: "800×600", subject: "casino" },
  CASINO_DETAIL_HERO: { label: "Casino detail hero", ratio: "16:10 or 16:9", minimum: "1600×1000", subject: "casino" },
  CASINO_COMPARE: { label: "Compare", ratio: "4:3", minimum: "640×480", subject: "casino" },
  BONUS_LISTING_CARD: { label: "Bonus listing", ratio: "6:5 or 4:3", minimum: "600×500", subject: "offer" },
  BEST_OFFER_FEATURED: { label: "Best Offer featured", ratio: "4:3", minimum: "1200×900", subject: "offer" },
  BEST_OFFER_SECONDARY: { label: "Best Offer secondary", ratio: "4:3", minimum: "800×600", subject: "offer" },
  CASINO_OFFER_BLOCK: { label: "Casino offer block", ratio: "6:5 or 4:3", minimum: "800×667", subject: "offer" },
  OFFER_DETAIL: { label: "Offer detail", ratio: "16:10", minimum: "1200×750", subject: "offer" },
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

function stableCandidates(assignments: PlacementMediaAssignment[], placement: MediaPlacementName, variant: MediaPlacementVariantName, now: number) {
  return assignments
    .filter((assignment) => assignment.placement === placement && assignment.variant === variant && activeAssignment(assignment, now))
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
  now: number,
) {
  const variants = requestedVariant === "DEFAULT" ? ["DEFAULT"] as const : [requestedVariant, "DEFAULT"] as const;
  for (const assignments of assignmentGroups(context, placement)) {
    for (const variant of variants) {
      const assignment = stableCandidates(assignments, placement, variant, now)[0];
      if (assignment) return { assignment, variant };
    }
  }
  return null;
}

function legacyAsset(context: PlacementMediaResolutionContext, type: "HERO" | "LOGO") {
  return context.legacyMediaAssets
    .filter((asset) => asset.type === type && activeAsset(asset))
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
  context: PlacementMediaResolutionContext;
  now?: Date;
}): ResolvedPlacementMedia {
  const requestedVariant = input.requestedVariant ?? "DEFAULT";
  const now = (input.now ?? new Date()).getTime();
  const chain = [input.placement, ...placementFallbackChains[input.placement]];

  for (const placement of chain) {
    const resolved = resolveAssignment(input.context, placement, requestedVariant, now);
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
      renderingMode: inheritedLogoComposition
        ? "COMPOSED"
        : effectiveMode(resolved.assignment.renderingMode, placement, resolved.assignment.mediaAsset),
      source,
      fallback: source !== "EXPLICIT",
      effectiveAlt: effectiveAlt(input.context, resolved.assignment.mediaAsset, resolved.assignment),
      focalPoint: focalPoint(resolved.assignment),
    };
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
      renderingMode: effectiveMode("AUTO", input.placement, hero),
      source: "LEGACY_HERO",
      fallback: true,
      effectiveAlt: effectiveAlt(input.context, hero, null),
      focalPoint: null,
    };
  }

  const logoAssignment = input.placement === "CASINO_LOGO"
    ? null
    : resolveAssignment(input.context, "CASINO_LOGO", requestedVariant, now);
  const logo = logoAssignment?.assignment.mediaAsset ?? legacyAsset(input.context, "LOGO");
  if (logo) {
    const directLogo = input.placement === "CASINO_LOGO";
    return {
      asset: logo,
      assignment: logoAssignment?.assignment ?? null,
      requestedPlacement: input.placement,
      resolvedPlacement: "CASINO_LOGO",
      requestedVariant,
      resolvedVariant: logoAssignment?.variant ?? null,
      renderingMode: directLogo ? "CONTAIN" : "COMPOSED",
      source: directLogo ? "LEGACY_LOGO" : "LOGO_COMPOSITION",
      fallback: true,
      effectiveAlt: effectiveAlt(input.context, logo, logoAssignment?.assignment ?? null),
      focalPoint: focalPoint(logoAssignment?.assignment ?? null),
    };
  }

  return {
    asset: null,
    assignment: null,
    requestedPlacement: input.placement,
    resolvedPlacement: null,
    requestedVariant,
    resolvedVariant: null,
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
