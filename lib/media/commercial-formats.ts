import type {
  MediaPlacementVariantName,
  OfferMediaPlacementName,
} from "./placement-media";

export type CommercialCreativeFamily =
  | "MEDIUM_RECTANGLE"
  | "SQUARE"
  | "MOBILE_LARGE"
  | "MOBILE_BANNER"
  | "LEADERBOARD"
  | "WIDE_SKYSCRAPER"
  | "HALF_PAGE"
  | "BILLBOARD"
  | "LARGE_LEADERBOARD"
  | "LARGE_RECTANGLE"
  | "FULL_BANNER"
  | "SKYSCRAPER"
  | "MOBILE_COMPATIBILITY"
  | "SMALL_RECTANGLE";

export type CommercialCreativeSuitability = "DESKTOP" | "MOBILE" | "BOTH" | "INVENTORY";
export type CommercialCreativeTier = "CORE" | "SQUARE" | "MOBILE" | "WIDE" | "SUPPORTED_INVENTORY" | "COMPATIBILITY";
export type CommercialCreativeFrequency = "VERY_COMMON" | "COMMON" | "ESTABLISHED";

export interface CommercialCreativeFormat {
  id: string;
  width: number;
  height: number;
  aspectRatio: number;
  family: CommercialCreativeFamily;
  label: string;
  suitability: CommercialCreativeSuitability;
  tier: CommercialCreativeTier;
  frequency: CommercialCreativeFrequency;
}

function format(
  id: string,
  width: number,
  height: number,
  family: CommercialCreativeFamily,
  label: string,
  suitability: CommercialCreativeSuitability,
  tier: CommercialCreativeTier,
  frequency: CommercialCreativeFrequency,
): CommercialCreativeFormat {
  return { id, width, height, aspectRatio: width / height, family, label, suitability, tier, frequency };
}

/**
 * Application-level commercial creative vocabulary. Physical formats do not
 * create new RFC-040 placements or database enums.
 */
export const commercialCreativeFormats = [
  format("MEDIUM_RECTANGLE_300_250", 300, 250, "MEDIUM_RECTANGLE", "Medium rectangle", "BOTH", "CORE", "VERY_COMMON"),
  format("SQUARE_250_250", 250, 250, "SQUARE", "Square", "BOTH", "SQUARE", "COMMON"),
  format("MOBILE_LARGE_320_100", 320, 100, "MOBILE_LARGE", "Large mobile banner", "MOBILE", "MOBILE", "COMMON"),
  format("MOBILE_BANNER_320_50", 320, 50, "MOBILE_BANNER", "Mobile banner", "MOBILE", "MOBILE", "VERY_COMMON"),
  format("LEADERBOARD_728_90", 728, 90, "LEADERBOARD", "Leaderboard", "DESKTOP", "WIDE", "VERY_COMMON"),
  format("WIDE_SKYSCRAPER_160_600", 160, 600, "WIDE_SKYSCRAPER", "Wide skyscraper", "INVENTORY", "SUPPORTED_INVENTORY", "VERY_COMMON"),
  format("HALF_PAGE_300_600", 300, 600, "HALF_PAGE", "Half page", "INVENTORY", "SUPPORTED_INVENTORY", "VERY_COMMON"),
  format("BILLBOARD_970_250", 970, 250, "BILLBOARD", "Billboard", "DESKTOP", "COMPATIBILITY", "COMMON"),
  format("LARGE_LEADERBOARD_970_90", 970, 90, "LARGE_LEADERBOARD", "Large leaderboard", "DESKTOP", "COMPATIBILITY", "COMMON"),
  format("LARGE_RECTANGLE_336_280", 336, 280, "LARGE_RECTANGLE", "Large rectangle", "BOTH", "COMPATIBILITY", "COMMON"),
  format("FULL_BANNER_468_60", 468, 60, "FULL_BANNER", "Full banner", "DESKTOP", "COMPATIBILITY", "COMMON"),
  format("SKYSCRAPER_120_600", 120, 600, "SKYSCRAPER", "Skyscraper", "INVENTORY", "COMPATIBILITY", "COMMON"),
  format("MOBILE_LARGE_300_100", 300, 100, "MOBILE_COMPATIBILITY", "300 mobile banner", "MOBILE", "COMPATIBILITY", "COMMON"),
  format("MOBILE_BANNER_300_50", 300, 50, "MOBILE_COMPATIBILITY", "300 mobile banner", "MOBILE", "COMPATIBILITY", "COMMON"),
  format("SMALL_RECTANGLE_180_150", 180, 150, "SMALL_RECTANGLE", "Small rectangle", "BOTH", "COMPATIBILITY", "ESTABLISHED"),
] as const;

export type CommercialCreativeCompatibility = "PREFERRED" | "COMPATIBLE" | "POOR_FIT" | "UNRECOGNIZED";

export interface CommercialCreativeAssessment {
  format: CommercialCreativeFormat | null;
  state: CommercialCreativeCompatibility;
  label: string;
  detail: string;
}

export function commercialCreativeFormat(width: number | null | undefined, height: number | null | undefined) {
  if (!width || !height) return null;
  return commercialCreativeFormats.find((candidate) => candidate.width === width && candidate.height === height) ?? null;
}

function preferred(detail: string, creativeFormat: CommercialCreativeFormat): CommercialCreativeAssessment {
  return { format: creativeFormat, state: "PREFERRED", label: "Preferred ✓", detail };
}

function compatible(detail: string, creativeFormat: CommercialCreativeFormat): CommercialCreativeAssessment {
  return { format: creativeFormat, state: "COMPATIBLE", label: "Compatible ✓", detail };
}

function poorFit(detail: string, creativeFormat: CommercialCreativeFormat): CommercialCreativeAssessment {
  return { format: creativeFormat, state: "POOR_FIT", label: "Poor fit", detail };
}

export function assessCommercialCreative(input: {
  placement: OfferMediaPlacementName;
  variant: MediaPlacementVariantName;
  width: number | null | undefined;
  height: number | null | undefined;
}): CommercialCreativeAssessment {
  const creativeFormat = commercialCreativeFormat(input.width, input.height);
  if (!creativeFormat) {
    return {
      format: null,
      state: "UNRECOGNIZED",
      label: "Unrecognised format",
      detail: "Valid commercial images remain assignable; preview this unusual geometry before publication.",
    };
  }

  const mobileVariant = input.variant === "MOBILE";
  const mobileBanner = creativeFormat.id === "MOBILE_LARGE_320_100"
    || creativeFormat.id === "MOBILE_BANNER_320_50"
    || creativeFormat.id === "MOBILE_LARGE_300_100"
    || creativeFormat.id === "MOBILE_BANNER_300_50";
  const nativeCard = creativeFormat.id === "MEDIUM_RECTANGLE_300_250";
  const squareCard = creativeFormat.id === "SQUARE_250_250";
  const compatibleCard = creativeFormat.id === "LARGE_RECTANGLE_336_280";
  const leaderboard = creativeFormat.id === "LEADERBOARD_728_90";
  const wideCompatibility = creativeFormat.id === "BILLBOARD_970_250"
    || creativeFormat.id === "LARGE_LEADERBOARD_970_90"
    || creativeFormat.id === "FULL_BANNER_468_60";

  if (mobileVariant) {
    if (mobileBanner) return preferred("Mobile variant uses a native mobile banner.", creativeFormat);
    if (nativeCard || squareCard || compatibleCard) return compatible("Responsive card creative is a deterministic mobile fallback.", creativeFormat);
    return poorFit("This geometry is not intended for the current mobile commercial stage.", creativeFormat);
  }

  if (input.placement === "OFFER_DETAIL") {
    if (nativeCard) return preferred("Future offer-detail card format.", creativeFormat);
    if (squareCard || compatibleCard || leaderboard || wideCompatibility) return compatible("Supported by the future offer-detail format contract; no public surface exists yet.", creativeFormat);
    if (mobileBanner) return poorFit("Mobile preferred; assign this asset to the MOBILE variant.", creativeFormat);
    return poorFit("Supported inventory, but no future offer-detail treatment is defined for this geometry.", creativeFormat);
  }

  if (input.placement === "CASINO_OFFER_BLOCK") {
    if (nativeCard) return preferred("Native commercial card mode.", creativeFormat);
    if (leaderboard) return preferred("Native wide Casino offer-block mode.", creativeFormat);
    if (squareCard || compatibleCard || wideCompatibility) return compatible("Supported deliberate card or wide treatment.", creativeFormat);
    if (mobileBanner) return poorFit("Mobile preferred; assign this asset to the MOBILE variant.", creativeFormat);
    return poorFit("Supported inventory, but not suited to the current Casino offer block.", creativeFormat);
  }

  if (nativeCard) return preferred("Native desktop commercial card.", creativeFormat);
  if (squareCard || compatibleCard) return compatible("Deliberate contained card treatment.", creativeFormat);
  if (mobileBanner) return poorFit("Mobile preferred; assign this asset to the MOBILE variant.", creativeFormat);
  if (leaderboard || wideCompatibility) return poorFit("Wide creative must not be stretched into this card placement.", creativeFormat);
  return poorFit("Supported library inventory, but no current public card placement uses this geometry.", creativeFormat);
}

export const commercialCreativeHeavyWarningBytes = 1024 * 1024;

export function commercialCreativeWeightWarning(sizeBytes: number | null | undefined) {
  if (!sizeBytes || sizeBytes <= commercialCreativeHeavyWarningBytes) return null;
  return sizeBytes > 3 * commercialCreativeHeavyWarningBytes
    ? "Very heavy creative — verify mobile transfer and animation cost before publication."
    : "Heavy creative — verify mobile transfer and animation cost before publication.";
}

export function isNativeMobileCommercialFormat(width: number | null | undefined, height: number | null | undefined) {
  const creativeFormat = commercialCreativeFormat(width, height);
  return creativeFormat?.suitability === "MOBILE";
}

export function isWideCommercialFormat(width: number | null | undefined, height: number | null | undefined) {
  const creativeFormat = commercialCreativeFormat(width, height);
  return creativeFormat?.family === "LEADERBOARD"
    || creativeFormat?.family === "BILLBOARD"
    || creativeFormat?.family === "LARGE_LEADERBOARD"
    || creativeFormat?.family === "FULL_BANNER";
}
