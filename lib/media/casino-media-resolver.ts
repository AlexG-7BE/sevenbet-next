import {
  mediaPlacementRegistry,
  normalizeMediaCountryCode,
  normalizeMediaLanguageCode,
  type MediaPlacementName,
  type MediaPlacementVariantName,
  type PlacementMediaAssignment,
  type PlacementMediaAsset,
  type PlacementMediaResolutionContext,
  type ResolvedPlacementMedia,
} from "@/lib/media/placement-media";

export type CasinoMediaOfferAuthority = {
  id: string;
  status: string;
  startAt?: Date | string | null;
  expiresAt?: Date | string | null;
  archivedAt?: Date | string | null;
  programStatus?: string | null;
  programWorkflowStatus?: string | null;
  programArchivedAt?: Date | string | null;
  networkActive?: boolean | null;
  networkArchivedAt?: Date | string | null;
  bonusStatus?: string | null;
  bonusOfferStatus?: string | null;
  bonusStartsAt?: Date | string | null;
  bonusExpiresAt?: Date | string | null;
};

export type ResolveCasinoMediaInput = {
  casino: { id: string; name: string };
  offer?: CasinoMediaOfferAuthority | null;
  placement: MediaPlacementName;
  country?: string | null;
  language?: string | null;
  device?: MediaPlacementVariantName;
  now?: Date;
  commercialAuthority: boolean;
  context: PlacementMediaResolutionContext;
};

type Candidate = {
  assignment: PlacementMediaAssignment;
  targetRank: number;
  targetingResolution: ResolvedPlacementMedia["targetingResolution"];
  countryCode: string | null;
  languageCode: string | null;
  placement: MediaPlacementName;
  variant: MediaPlacementVariantName;
  formatRank: number;
  priority: number;
};

type Selection = { candidate: Candidate | null; conflict: PlacementMediaAssignment[]; rejected: Array<{ assignmentId: string; reason: string }> };

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function timestamp(value: Date | string | null | undefined) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function currentWindow(input: { validFrom?: Date | string | null; validUntil?: Date | string | null }, now: number) {
  const from = timestamp(input.validFrom);
  const until = timestamp(input.validUntil);
  return (from === null || from <= now) && (until === null || until > now);
}

export function isPromotionalMedia(assignment: PlacementMediaAssignment | null, asset: PlacementMediaAsset | null | undefined) {
  if (assignment?.purpose === "PROMOTION") return true;
  if (!asset) return false;
  if (["BONUS_CREATIVE", "AFFILIATE_CREATIVE"].includes(asset.type)) return true;
  if (asset.purpose?.trim()) return true;
  const metadata = record(asset.metadata);
  const role = typeof metadata.role === "string" ? metadata.role.toUpperCase() : "";
  const purpose = typeof metadata.purpose === "string" ? metadata.purpose.toUpperCase() : "";
  return /OFFER|PROMO|AFFILIATE|GENERIC_PARTNER_CREATIVE/.test(`${role} ${purpose}`);
}

function activeAsset(asset: PlacementMediaAsset | null | undefined) {
  return Boolean(asset && asset.status === "ACTIVE" && !asset.archivedAt && (asset.publicUrl || asset.url));
}

function targetScopedAssetIds(context: PlacementMediaResolutionContext) {
  const ids = new Set(context.targetScopedAssetIds ?? []);
  for (const assignment of [
    ...context.casinoAssignments,
    ...(context.casinoBonusAssignments ?? []),
    ...(context.affiliateOfferAssignments ?? []),
  ]) {
    if (assignment.countryCode !== null && assignment.countryCode !== undefined
      || assignment.languageCode !== null && assignment.languageCode !== undefined
      || assignment.languageState === "UNKNOWN") {
      ids.add(assignment.mediaAssetId);
    }
  }
  return ids;
}

function targetFor(
  assignment: PlacementMediaAssignment,
  requestedCountry: string | null,
  requestedLanguage: string | null,
): Pick<Candidate, "targetRank" | "targetingResolution" | "countryCode" | "languageCode"> | null {
  const suppliedCountry = assignment.countryCode !== null && assignment.countryCode !== undefined;
  const countryCode = suppliedCountry ? normalizeMediaCountryCode(assignment.countryCode) : null;
  if (suppliedCountry && !countryCode) return null;
  if (countryCode && (!requestedCountry || countryCode !== requestedCountry)) return null;

  const suppliedLanguage = assignment.languageCode !== null && assignment.languageCode !== undefined;
  const languageCode = suppliedLanguage ? normalizeMediaLanguageCode(assignment.languageCode) : null;
  const state = assignment.languageState ?? (languageCode ? "EXPLICIT" : "NEUTRAL");
  if (state === "UNKNOWN" || (state === "EXPLICIT") !== Boolean(languageCode)) return null;

  if (countryCode && requestedLanguage && state === "EXPLICIT" && languageCode === requestedLanguage) {
    return { targetRank: 0, targetingResolution: "EXACT_COUNTRY_LANGUAGE", countryCode, languageCode };
  }
  if (countryCode && state === "NEUTRAL") {
    return { targetRank: 1, targetingResolution: "EXACT_COUNTRY_NEUTRAL", countryCode, languageCode: null };
  }
  if (!countryCode && requestedLanguage && state === "EXPLICIT" && languageCode === requestedLanguage) {
    return { targetRank: 2, targetingResolution: "GLOBAL_LANGUAGE", countryCode: null, languageCode };
  }
  if (!countryCode && state === "NEUTRAL") {
    return { targetRank: 3, targetingResolution: "GLOBAL_NEUTRAL", countryCode: null, languageCode: null };
  }
  return null;
}

function formatRank(placement: MediaPlacementName, device: MediaPlacementVariantName, asset: PlacementMediaAsset) {
  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  if (width <= 0 || height <= 0) return -1;
  const spec = mediaPlacementRegistry[placement];
  if (width < spec.minimum.width || height < spec.minimum.height) return -1;
  const key = device === "MOBILE" ? "mobile" : device === "DESKTOP" ? "desktop" : "default";
  const formats = spec.preferredFormats[key];
  const exact = `${width}×${height}`;
  const exactIndex = formats.indexOf(exact as never);
  if (exactIndex >= 0) return 100 - exactIndex;
  const ratio = width / height;
  const ratioIndex = formats.findIndex((format) => {
    const match = /^(\d+):(\d+)$/.exec(format);
    return Boolean(match && Math.abs(ratio - Number(match[1]) / Number(match[2])) <= 0.08);
  });
  return ratioIndex >= 0 ? 60 - ratioIndex : 10;
}

function assignmentPriority(assignment: PlacementMediaAssignment) {
  return assignment.priority ?? -assignment.sortOrder;
}

function candidateReason(
  assignment: PlacementMediaAssignment,
  input: { now: number; requestedCountry: string | null; requestedLanguage: string | null; exactOfferId: string | null; promotion: boolean; placement: MediaPlacementName; variant: MediaPlacementVariantName },
) {
  if (!assignment.active) return "INACTIVE_ASSIGNMENT";
  if (!activeAsset(assignment.mediaAsset)) return "UNAVAILABLE_ASSET";
  if (assignment.availability && assignment.availability !== "AVAILABLE") return `AVAILABILITY_${assignment.availability}`;
  if (assignment.sourceHash && assignment.mediaAsset?.checksum !== assignment.sourceHash) return "SOURCE_HASH_CHANGED";
  if (!currentWindow(assignment, input.now)) return timestamp(assignment.validFrom)! > input.now ? "FUTURE_VALID_FROM" : "EXPIRED_VALID_UNTIL";
  if (input.promotion && assignment.affiliateOfferId !== input.exactOfferId) return "WRONG_AFFILIATE_OFFER";
  if (input.promotion && !isPromotionalMedia(assignment, assignment.mediaAsset)) return "NOT_PROMOTIONAL_MEDIA";
  if (!input.promotion && isPromotionalMedia(assignment, assignment.mediaAsset)) return "PROMOTIONAL_BRAND_FALLBACK_REJECTED";
  if (!targetFor(assignment, input.requestedCountry, input.requestedLanguage)) return "TARGET_NOT_ELIGIBLE";
  const spec = mediaPlacementRegistry[input.placement];
  if (!(spec.acceptedTypes as readonly string[]).includes(assignment.mediaAsset!.type)) return "ASSET_TYPE_NOT_ACCEPTED";
  const sourceMode = assignment.mediaAsset!.sourceMode ?? "FIRST_PARTY_MEDIA";
  if (!(spec.acceptedSourceModes as readonly string[]).includes(sourceMode)) return "SOURCE_MODE_NOT_ACCEPTED";
  if (!spec.animation && assignment.mediaAsset!.mimeType === "image/gif") return "ANIMATION_NOT_ALLOWED";
  if (formatRank(input.placement, input.variant, assignment.mediaAsset!) < 0) return "FORMAT_NOT_USABLE";
  return null;
}

function select(
  assignments: PlacementMediaAssignment[],
  placements: readonly MediaPlacementName[],
  input: { now: number; requestedCountry: string | null; requestedLanguage: string | null; exactOfferId: string | null; promotion: boolean; requestedVariant: MediaPlacementVariantName },
): Selection {
  const rejected: Selection["rejected"] = [];
  const variants: MediaPlacementVariantName[] = input.requestedVariant === "DEFAULT" ? ["DEFAULT"] : [input.requestedVariant, "DEFAULT"];
  for (const targetRank of [0, 1, 2, 3]) {
    for (const placement of placements) {
      for (const variant of variants) {
        const eligible = assignments.flatMap((assignment): Candidate[] => {
          if (assignment.placement !== placement || assignment.variant !== variant) return [];
          const reason = candidateReason(assignment, { ...input, placement, variant });
          if (reason) {
            rejected.push({ assignmentId: assignment.id, reason });
            return [];
          }
          const target = targetFor(assignment, input.requestedCountry, input.requestedLanguage)!;
          if (target.targetRank !== targetRank) return [];
          return [{
            assignment, ...target, placement, variant,
            formatRank: formatRank(placement, variant, assignment.mediaAsset!),
            priority: assignmentPriority(assignment),
          }];
        });
        if (!eligible.length) continue;
        const bestFormat = Math.max(...eligible.map((candidate) => candidate.formatRank));
        const formatted = eligible.filter((candidate) => candidate.formatRank === bestFormat);
        const bestPriority = Math.max(...formatted.map((candidate) => candidate.priority));
        const winners = formatted.filter((candidate) => candidate.priority === bestPriority);
        if (winners.length > 1) return { candidate: null, conflict: winners.map((candidate) => candidate.assignment), rejected };
        return { candidate: winners[0] ?? null, conflict: [], rejected };
      }
    }
  }
  return { candidate: null, conflict: [], rejected };
}

function offerBlocker(offer: CasinoMediaOfferAuthority | null | undefined, commercialAuthority: boolean, now: number) {
  if (!commercialAuthority) return "COMMERCIAL_AUTHORITY_UNAVAILABLE";
  if (!offer) return "EXACT_OFFER_REQUIRED";
  if (offer.status !== "ACTIVE") return "AFFILIATE_OFFER_INACTIVE";
  if (offer.archivedAt) return "AFFILIATE_OFFER_ARCHIVED";
  if (offer.programStatus && offer.programStatus !== "ACTIVE") return "AFFILIATE_PROGRAM_INACTIVE";
  if (offer.programWorkflowStatus && offer.programWorkflowStatus !== "PUBLISHED") return "AFFILIATE_PROGRAM_NOT_PUBLISHED";
  if (offer.programArchivedAt) return "AFFILIATE_PROGRAM_ARCHIVED";
  if (offer.networkActive === false) return "AFFILIATE_NETWORK_INACTIVE";
  if (offer.networkArchivedAt) return "AFFILIATE_NETWORK_ARCHIVED";
  if (offer.bonusStatus && offer.bonusStatus !== "PUBLISHED") return "CASINO_BONUS_NOT_PUBLISHED";
  if (offer.bonusOfferStatus && offer.bonusOfferStatus !== "ACTIVE") return "CASINO_BONUS_INACTIVE";
  if (!currentWindow({ validFrom: offer.startAt, validUntil: offer.expiresAt }, now)) return "AFFILIATE_OFFER_OUTSIDE_VALIDITY";
  if (!currentWindow({ validFrom: offer.bonusStartsAt, validUntil: offer.bonusExpiresAt }, now)) return "CASINO_BONUS_OUTSIDE_VALIDITY";
  return null;
}

function resolved(input: ResolveCasinoMediaInput, candidate: Candidate, status: "READY" | "FALLBACK" | "CONFLICT", reason: string, rejected: Selection["rejected"]): ResolvedPlacementMedia {
  const assignment = candidate.assignment;
  const asset = assignment.mediaAsset!;
  const promo = isPromotionalMedia(assignment, asset);
  return {
    asset,
    assignment,
    requestedPlacement: input.placement,
    resolvedPlacement: candidate.placement,
    requestedVariant: input.device ?? "DEFAULT",
    resolvedVariant: candidate.variant,
    requestedCountryCode: normalizeMediaCountryCode(input.country),
    requestedLanguageCode: normalizeMediaLanguageCode(input.language),
    resolvedCountryCode: candidate.countryCode,
    resolvedLanguageCode: candidate.languageCode,
    targetingResolution: candidate.targetingResolution,
    renderingMode: promo ? "CONTAIN" : assignment.renderingMode === "COVER" && assignment.cropSafe ? "COVER" : asset.type === "LOGO" || asset.type === "FAVICON" ? "COMPOSED" : "CONTAIN",
    source: promo ? (candidate.placement === input.placement ? "EXACT_OFFER" : "EXACT_OFFER_FORMAT_FALLBACK") : asset.type === "LOGO" || asset.type === "FAVICON" ? "LOGO_COMPOSITION" : "BRAND_FALLBACK",
    fallback: status !== "READY",
    effectiveAlt: assignment.altTextOverride?.trim() || asset.altText?.trim() || asset.alt?.trim() || `${input.casino.name} controlled media`,
    focalPoint: !promo && assignment.focalPointX !== null && assignment.focalPointX !== undefined && assignment.focalPointY !== null && assignment.focalPointY !== undefined
      ? { x: Number(assignment.focalPointX), y: Number(assignment.focalPointY) }
      : null,
    status,
    creativeSetId: assignment.creativeSetId ?? null,
    creativeVariantId: assignment.creativeVariantId ?? null,
    mediaRevisionId: assignment.mediaRevisionId ?? null,
    exactOfferId: input.offer?.id ?? null,
    evidence: {
      consideredAssignmentIds: [assignment.id],
      rejected,
      reason,
    },
  };
}

function codeFallback(input: ResolveCasinoMediaInput, status: "MISSING" | "CONFLICT" | "BLOCKED", reason: string, rejected: Selection["rejected"]): ResolvedPlacementMedia {
  return {
    asset: null,
    assignment: null,
    requestedPlacement: input.placement,
    resolvedPlacement: null,
    requestedVariant: input.device ?? "DEFAULT",
    resolvedVariant: null,
    requestedCountryCode: normalizeMediaCountryCode(input.country),
    requestedLanguageCode: normalizeMediaLanguageCode(input.language),
    resolvedCountryCode: null,
    resolvedLanguageCode: null,
    targetingResolution: "CONTROLLED_FALLBACK",
    renderingMode: "COMPOSED",
    source: "CODE_FALLBACK",
    fallback: true,
    effectiveAlt: `${input.casino.name} media fallback`,
    focalPoint: null,
    status,
    creativeSetId: null,
    creativeVariantId: null,
    mediaRevisionId: null,
    exactOfferId: input.offer?.id ?? null,
    evidence: { consideredAssignmentIds: [], rejected, reason },
  };
}

/** The sole public media resolver. It performs no network or AI work. */
export function resolveCasinoMedia(input: ResolveCasinoMediaInput): ResolvedPlacementMedia {
  const now = (input.now ?? new Date()).getTime();
  const requestedVariant = input.device ?? "DEFAULT";
  const requestedCountry = normalizeMediaCountryCode(input.country);
  const requestedLanguage = normalizeMediaLanguageCode(input.language);
  const spec = mediaPlacementRegistry[input.placement];
  const exactOfferId = input.offer?.id ?? null;
  const blocker = spec.exactOfferLink ? offerBlocker(input.offer, input.commercialAuthority, now) : null;
  let conflict = false;
  const rejected: Selection["rejected"] = [];

  if (spec.promotionalCopy && spec.exactOfferLink && !blocker) {
    const promotion = select(
      input.context.affiliateOfferAssignments ?? [],
      [input.placement, ...spec.promotionFallbacks] as MediaPlacementName[],
      { now, requestedCountry, requestedLanguage, exactOfferId, promotion: true, requestedVariant },
    );
    rejected.push(...promotion.rejected);
    if (promotion.conflict.length) {
      conflict = true;
      rejected.push(...promotion.conflict.map((assignment) => ({ assignmentId: assignment.id, reason: "EQUAL_EXPLICIT_PRIORITY_CONFLICT" })));
    } else if (promotion.candidate) {
      return resolved(input, promotion.candidate, "READY", "EXACT_OFFER_PROMOTION", rejected);
    }
  }

  const brandPlacements = [
    ...(spec.subjects.includes("CASINO" as never) ? [input.placement] : []),
    ...spec.brandFallbacks,
  ].filter((placement, index, all): placement is MediaPlacementName => all.indexOf(placement) === index);
  const brand = select(input.context.casinoAssignments, brandPlacements, {
    now, requestedCountry, requestedLanguage, exactOfferId, promotion: false, requestedVariant,
  });
  rejected.push(...brand.rejected);
  if (brand.candidate) return resolved(input, brand.candidate, conflict ? "CONFLICT" : "FALLBACK", blocker ?? (conflict ? "PROMOTION_CONFLICT_BRAND_FALLBACK" : "NO_EXACT_OFFER_PROMOTION"), rejected);

  const scopedAssetIds = targetScopedAssetIds(input.context);
  const legacy = input.context.legacyMediaAssets
    .filter((asset) => activeAsset(asset) && !isPromotionalMedia(null, asset))
    .filter((asset) => !scopedAssetIds.has(asset.id))
    .filter((asset) => asset.type === "LOGO" || asset.type === "FAVICON" || asset.type === "HERO")
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || (timestamp(left.createdAt) ?? 0) - (timestamp(right.createdAt) ?? 0));
  if (legacy[0] && (legacy.length === 1 || (legacy[0].sortOrder ?? 0) !== (legacy[1].sortOrder ?? 0) || timestamp(legacy[0].createdAt) !== timestamp(legacy[1].createdAt))) {
    const asset = legacy[0];
    const assignment: PlacementMediaAssignment = {
      id: `legacy:${asset.id}`, mediaAssetId: asset.id, placement: asset.type === "LOGO" || asset.type === "FAVICON" ? "CASINO_LOGO" : "CASINO_DETAIL_HERO",
      variant: "DEFAULT", countryCode: null, languageCode: null, languageState: "NEUTRAL", renderingMode: "COMPOSED", sortOrder: asset.sortOrder ?? 0,
      active: true, mediaAsset: asset, purpose: "BRAND",
    };
    const candidate: Candidate = {
      assignment, targetRank: 3, targetingResolution: "GLOBAL_NEUTRAL", countryCode: null, languageCode: null,
      placement: assignment.placement as MediaPlacementName, variant: "DEFAULT", formatRank: 0, priority: -assignment.sortOrder,
    };
    return resolved(input, candidate, conflict ? "CONFLICT" : "FALLBACK", blocker ?? (conflict ? "PROMOTION_CONFLICT_LEGACY_FALLBACK" : "LEGACY_BRAND_FALLBACK"), rejected);
  }

  return codeFallback(input, conflict ? "CONFLICT" : blocker ? "BLOCKED" : "MISSING", blocker ?? (conflict ? "PROMOTIONAL_CANDIDATE_CONFLICT" : "NO_USABLE_MEDIA"), rejected);
}
