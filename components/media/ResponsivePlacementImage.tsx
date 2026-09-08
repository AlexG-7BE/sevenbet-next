"use client";

import { useEffect, useState, type ImgHTMLAttributes } from "react";

import type { MediaPlacementVariantName } from "@/lib/media/placement-media";

type ResponsiveMedia = {
  url: string;
  sourceMode?: "FIRST_PARTY_MEDIA" | "PARTNER_HOSTED_IMAGE" | "PARTNER_HOSTED_EMBED";
  variants?: Partial<Record<MediaPlacementVariantName, { url: string }>>;
};

export function ResponsivePlacementImage({
  media,
  fallbackMedia,
  alt,
  onError,
  ...imageProps
}: {
  media: ResponsiveMedia;
  fallbackMedia?: ResponsiveMedia | null;
  alt: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "alt" | "src" | "srcSet">) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [media.url]);
  const presented = failed && fallbackMedia ? fallbackMedia : media;
  const mobile = presented.variants?.MOBILE;
  const desktop = presented.variants?.DESKTOP;
  return <picture data-responsive-placement-media style={{ display: "contents" }}>
    {mobile ? <source data-placement-variant="MOBILE" media="(max-width: 767px)" srcSet={mobile.url} /> : null}
    {desktop ? <source data-placement-variant="DESKTOP" media="(min-width: 768px)" srcSet={desktop.url} /> : null}
    <img
      alt={alt}
      {...imageProps}
      data-media-fallback={failed && fallbackMedia ? true : undefined}
      data-placement-variant="DEFAULT"
      onError={(event) => {
        if (!failed && fallbackMedia) setFailed(true);
        onError?.(event);
      }}
      referrerPolicy={presented.sourceMode === "PARTNER_HOSTED_IMAGE" ? "no-referrer" : imageProps.referrerPolicy}
      src={presented.url}
    />
  </picture>;
}
