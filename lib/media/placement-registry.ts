export const mediaPlacementVariants = ["DEFAULT", "DESKTOP", "MOBILE"] as const;
export const mediaRenderingModes = ["AUTO", "COVER", "CONTAIN", "COMPOSED"] as const;

export const mediaPlacementRegistry = {
  CASINO_LOGO: {
    label: "Logo",
    subjects: ["CASINO"],
    acceptedTypes: ["LOGO", "ICON", "FAVICON"],
    acceptedSourceModes: ["FIRST_PARTY_MEDIA"],
    observedGeometry: "intrinsic identity mark",
    preferredFormats: { default: ["1:1"], desktop: ["1:1"], mobile: ["1:1"] },
    minimum: { width: 64, height: 64 },
    permittedModes: ["CONTAIN", "COMPOSED"],
    promotionalCopy: false,
    animation: false,
    crop: "NEVER",
    safeArea: "Preserve the complete identity mark.",
    exactOfferLink: false,
    deviceBehavior: "DEFAULT is sufficient; device variants are optional.",
    promotionFallbacks: [],
    brandFallbacks: [],
  },
  CASINO_DIRECTORY_CARD: {
    label: "Casino directory",
    subjects: ["CASINO", "AFFILIATE_OFFER"],
    acceptedTypes: ["HERO", "LOGO", "BONUS_CREATIVE", "AFFILIATE_CREATIVE", "OTHER"],
    acceptedSourceModes: ["FIRST_PARTY_MEDIA", "PARTNER_HOSTED_IMAGE"],
    observedGeometry: "bounded offer cell inside a 1281×292 desktop card; stacked mobile card",
    preferredFormats: { default: ["300×250", "336×280", "250×250"], desktop: ["300×250", "336×280", "250×250"], mobile: ["320×100", "300×100", "300×250"] },
    minimum: { width: 250, height: 100 },
    permittedModes: ["CONTAIN", "COMPOSED"],
    promotionalCopy: true,
    animation: false,
    crop: "PROMOTION_NEVER",
    safeArea: "All offer, currency, eligibility and legal copy must remain visible.",
    exactOfferLink: true,
    deviceBehavior: "MOBILE wins on mobile; DEFAULT is the compatible fallback.",
    promotionFallbacks: ["BONUS_LISTING_CARD", "BEST_OFFER_SECONDARY"],
    brandFallbacks: ["CASINO_DETAIL_HERO", "CASINO_LOGO"],
  },
  CASINO_DETAIL_HERO: {
    label: "Casino detail brand art",
    subjects: ["CASINO"],
    acceptedTypes: ["HERO", "LOGO", "OTHER"],
    acceptedSourceModes: ["FIRST_PARTY_MEDIA"],
    observedGeometry: "legacy Casino identity canvas; not the commercial review-right surface",
    preferredFormats: { default: ["16:10", "16:9", "4:3"], desktop: ["16:10", "16:9"], mobile: ["4:3", "1:1"] },
    minimum: { width: 640, height: 480 },
    permittedModes: ["CONTAIN", "COMPOSED", "COVER"],
    promotionalCopy: false,
    animation: false,
    crop: "EXPLICIT_SAFE_ONLY",
    safeArea: "COVER requires recorded crop-safety and focal evidence.",
    exactOfferLink: false,
    deviceBehavior: "Prefer the requested device then DEFAULT.",
    promotionFallbacks: [],
    brandFallbacks: ["CASINO_DIRECTORY_CARD", "CASINO_LOGO"],
  },
  CASINO_REVIEW_RIGHT_HERO: {
    label: "Casino review right hero",
    subjects: ["AFFILIATE_OFFER"],
    acceptedTypes: ["BONUS_CREATIVE", "AFFILIATE_CREATIVE", "HERO", "OTHER"],
    acceptedSourceModes: ["FIRST_PARTY_MEDIA", "PARTNER_HOSTED_IMAGE"],
    observedGeometry: "484×600 at 1440 px; 375×190 at 390 px",
    preferredFormats: { default: ["300×250", "336×280", "250×250"], desktop: ["300×250", "336×280", "250×250", "728×90"], mobile: ["320×100", "300×100", "300×250"] },
    minimum: { width: 250, height: 90 },
    permittedModes: ["CONTAIN"],
    promotionalCopy: true,
    animation: false,
    crop: "NEVER",
    safeArea: "Contain the full creative; never crop promotional or legal copy.",
    exactOfferLink: true,
    deviceBehavior: "MOBILE wins in the stacked hero; DEFAULT is the fallback.",
    promotionFallbacks: ["CASINO_OFFER_BLOCK", "BONUS_LISTING_CARD", "BEST_OFFER_FEATURED", "BEST_OFFER_SECONDARY", "OFFER_DETAIL"],
    brandFallbacks: ["CASINO_DETAIL_HERO", "CASINO_LOGO"],
  },
  CASINO_COMPARE: {
    label: "Compare",
    subjects: ["CASINO"],
    acceptedTypes: ["LOGO", "HERO", "OTHER"],
    acceptedSourceModes: ["FIRST_PARTY_MEDIA"],
    observedGeometry: "compact comparison identity cell",
    preferredFormats: { default: ["1:1", "4:3"], desktop: ["1:1", "4:3"], mobile: ["1:1"] },
    minimum: { width: 128, height: 128 },
    permittedModes: ["CONTAIN", "COMPOSED"],
    promotionalCopy: false,
    animation: false,
    crop: "NEVER",
    safeArea: "Preserve the complete identity.",
    exactOfferLink: false,
    deviceBehavior: "DEFAULT is preferred.",
    promotionFallbacks: [],
    brandFallbacks: ["CASINO_DIRECTORY_CARD", "CASINO_LOGO"],
  },
  BONUS_LISTING_CARD: {
    label: "Bonus listing",
    subjects: ["CASINO_BONUS", "AFFILIATE_OFFER"],
    acceptedTypes: ["BONUS_CREATIVE", "AFFILIATE_CREATIVE", "HERO", "OTHER"],
    acceptedSourceModes: ["FIRST_PARTY_MEDIA", "PARTNER_HOSTED_IMAGE", "PARTNER_HOSTED_EMBED"],
    observedGeometry: "commercial card inventory",
    preferredFormats: { default: ["300×250", "250×250", "336×280"], desktop: ["300×250", "336×280", "250×250"], mobile: ["320×100", "320×50", "300×250"] },
    minimum: { width: 250, height: 50 },
    permittedModes: ["CONTAIN"], promotionalCopy: true, animation: false, crop: "NEVER",
    safeArea: "Contain all customer-facing copy.", exactOfferLink: true,
    deviceBehavior: "MOBILE wins on mobile; DEFAULT card remains compatible.",
    promotionFallbacks: [], brandFallbacks: ["CASINO_LOGO"],
  },
  BEST_OFFER_FEATURED: {
    label: "Best Offer featured",
    subjects: ["CASINO_BONUS", "AFFILIATE_OFFER"],
    acceptedTypes: ["BONUS_CREATIVE", "AFFILIATE_CREATIVE", "HERO", "OTHER"],
    acceptedSourceModes: ["FIRST_PARTY_MEDIA", "PARTNER_HOSTED_IMAGE", "PARTNER_HOSTED_EMBED"],
    observedGeometry: "featured commercial card inventory",
    preferredFormats: { default: ["300×250", "250×250", "336×280"], desktop: ["300×250", "336×280", "250×250"], mobile: ["320×100", "320×50", "300×250"] },
    minimum: { width: 250, height: 50 },
    permittedModes: ["CONTAIN"], promotionalCopy: true, animation: false, crop: "NEVER",
    safeArea: "Contain all customer-facing copy.", exactOfferLink: true,
    deviceBehavior: "MOBILE wins on mobile; DEFAULT card remains compatible.",
    promotionFallbacks: ["BEST_OFFER_SECONDARY", "BONUS_LISTING_CARD"], brandFallbacks: ["CASINO_LOGO"],
  },
  BEST_OFFER_SECONDARY: {
    label: "Best Offer secondary",
    subjects: ["CASINO_BONUS", "AFFILIATE_OFFER"],
    acceptedTypes: ["BONUS_CREATIVE", "AFFILIATE_CREATIVE", "HERO", "OTHER"],
    acceptedSourceModes: ["FIRST_PARTY_MEDIA", "PARTNER_HOSTED_IMAGE", "PARTNER_HOSTED_EMBED"],
    observedGeometry: "secondary commercial card inventory",
    preferredFormats: { default: ["300×250", "250×250", "336×280"], desktop: ["300×250", "336×280", "250×250"], mobile: ["320×100", "320×50", "300×250"] },
    minimum: { width: 250, height: 50 },
    permittedModes: ["CONTAIN"], promotionalCopy: true, animation: false, crop: "NEVER",
    safeArea: "Contain all customer-facing copy.", exactOfferLink: true,
    deviceBehavior: "MOBILE wins on mobile; DEFAULT card remains compatible.",
    promotionFallbacks: ["BONUS_LISTING_CARD"], brandFallbacks: ["CASINO_LOGO"],
  },
  CASINO_OFFER_BLOCK: {
    label: "Casino offer block",
    subjects: ["CASINO_BONUS", "AFFILIATE_OFFER"],
    acceptedTypes: ["BONUS_CREATIVE", "AFFILIATE_CREATIVE", "HERO", "OTHER"],
    acceptedSourceModes: ["FIRST_PARTY_MEDIA", "PARTNER_HOSTED_IMAGE", "PARTNER_HOSTED_EMBED"],
    observedGeometry: "contained card or deliberate wide offer region",
    preferredFormats: { default: ["300×250", "728×90", "250×250"], desktop: ["728×90", "300×250"], mobile: ["320×100", "320×50", "300×250"] },
    minimum: { width: 250, height: 50 },
    permittedModes: ["CONTAIN"], promotionalCopy: true, animation: false, crop: "NEVER",
    safeArea: "Contain all customer-facing copy.", exactOfferLink: true,
    deviceBehavior: "Prefer explicit device format, then DEFAULT.",
    promotionFallbacks: ["BONUS_LISTING_CARD"], brandFallbacks: ["CASINO_LOGO"],
  },
  OFFER_DETAIL: {
    label: "Offer detail",
    subjects: ["CASINO_BONUS", "AFFILIATE_OFFER"],
    acceptedTypes: ["BONUS_CREATIVE", "AFFILIATE_CREATIVE", "HERO", "OTHER"],
    acceptedSourceModes: ["FIRST_PARTY_MEDIA", "PARTNER_HOSTED_IMAGE", "PARTNER_HOSTED_EMBED"],
    observedGeometry: "contained offer-detail inventory",
    preferredFormats: { default: ["300×250", "250×250", "728×90"], desktop: ["300×250", "728×90"], mobile: ["320×100", "320×50", "300×250"] },
    minimum: { width: 250, height: 50 },
    permittedModes: ["CONTAIN"], promotionalCopy: true, animation: false, crop: "NEVER",
    safeArea: "Contain all customer-facing copy.", exactOfferLink: true,
    deviceBehavior: "Prefer explicit device format, then DEFAULT.",
    promotionFallbacks: ["CASINO_OFFER_BLOCK", "BONUS_LISTING_CARD"], brandFallbacks: ["CASINO_LOGO"],
  },
} as const;

export type MediaPlacementName = keyof typeof mediaPlacementRegistry;
export type MediaPlacementVariantName = (typeof mediaPlacementVariants)[number];
export type MediaRenderingModeName = (typeof mediaRenderingModes)[number];

export const casinoMediaPlacements = [
  "CASINO_LOGO", "CASINO_DIRECTORY_CARD", "CASINO_DETAIL_HERO", "CASINO_COMPARE",
] as const satisfies readonly MediaPlacementName[];

export const offerMediaPlacements = [
  "BONUS_LISTING_CARD", "BEST_OFFER_FEATURED", "BEST_OFFER_SECONDARY", "CASINO_OFFER_BLOCK", "OFFER_DETAIL",
] as const satisfies readonly MediaPlacementName[];

export const offerSurfaceMediaPlacements = [
  ...offerMediaPlacements, "CASINO_DIRECTORY_CARD", "CASINO_REVIEW_RIGHT_HERO",
] as const satisfies readonly MediaPlacementName[];

export const mediaPlacements = Object.freeze(Object.keys(mediaPlacementRegistry) as MediaPlacementName[]);

export function mediaPlacementSpec(placement: MediaPlacementName) {
  return mediaPlacementRegistry[placement];
}

export function placementAcceptsSubject(placement: MediaPlacementName, subject: "CASINO" | "CASINO_BONUS" | "AFFILIATE_OFFER") {
  return (mediaPlacementRegistry[placement].subjects as readonly string[]).includes(subject);
}
