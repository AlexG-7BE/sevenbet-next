export type MediaRatioClass =
  | "square"
  | "landscape"
  | "wide-landscape"
  | "portrait"
  | "tall"
  | "ultra-wide"
  | "unknown";

export type MediaRenderingMode = "CONTAIN" | "COMPOSED";

type MediaDimensions = {
  width: number | null | undefined;
  height: number | null | undefined;
};

export function classifyMediaRatio({ width, height }: MediaDimensions): MediaRatioClass {
  if (!width || !height || width <= 0 || height <= 0) return "unknown";

  const ratio = width / height;
  if (ratio < 0.6) return "tall";
  if (ratio < 0.9) return "portrait";
  if (ratio <= 1.1) return "square";
  if (ratio <= 1.6) return "landscape";
  if (ratio <= 2.05) return "wide-landscape";
  return "ultra-wide";
}

export function isFeaturedCardMediaCompatible(ratio: MediaRatioClass) {
  return ratio !== "tall" && ratio !== "portrait";
}

export function offerMediaRenderingMode({
  hasMedia,
  ratio,
}: {
  hasMedia: boolean;
  ratio: MediaRatioClass;
}): MediaRenderingMode {
  if (!hasMedia || ratio === "ultra-wide" || ratio === "portrait" || ratio === "tall") {
    return "COMPOSED";
  }
  return "CONTAIN";
}

export function isCasinoHeroMediaCompatible(ratio: MediaRatioClass) {
  void ratio;
  return true;
}

export function mayPresentPromotionalMedia({
  demonstration: _demonstration,
  governedActionAvailable: _governedActionAvailable,
}: {
  demonstration: boolean;
  governedActionAvailable: boolean;
}) {
  // Controlled editorial/partner media is public content. The outbound CTA is
  // governed separately and must never erase an otherwise valid asset.
  return true;
}
