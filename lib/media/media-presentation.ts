export type MediaRatioClass =
  | "square"
  | "landscape"
  | "wide-landscape"
  | "portrait"
  | "tall"
  | "ultra-wide"
  | "unknown";

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
  return ratio === "square" || ratio === "landscape" || ratio === "wide-landscape" || ratio === "unknown";
}

export function isCasinoHeroMediaCompatible(ratio: MediaRatioClass) {
  return ratio !== "ultra-wide";
}

export function mayPresentPromotionalMedia({
  demonstration,
  governedActionAvailable,
}: {
  demonstration: boolean;
  governedActionAvailable: boolean;
}) {
  return demonstration || governedActionAvailable;
}
