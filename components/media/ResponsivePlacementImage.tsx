import type { ImgHTMLAttributes } from "react";

import type { MediaPlacementVariantName } from "@/lib/media/placement-media";

type ResponsiveMedia = {
  url: string;
  variants?: Partial<Record<MediaPlacementVariantName, { url: string }>>;
};

export function ResponsivePlacementImage({
  media,
  alt,
  ...imageProps
}: {
  media: ResponsiveMedia;
  alt: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "alt" | "src" | "srcSet">) {
  const mobile = media.variants?.MOBILE;
  const desktop = media.variants?.DESKTOP;
  return <picture data-responsive-placement-media style={{ display: "contents" }}>
    {mobile ? <source data-placement-variant="MOBILE" media="(max-width: 767px)" srcSet={mobile.url} /> : null}
    {desktop ? <source data-placement-variant="DESKTOP" media="(min-width: 768px)" srcSet={desktop.url} /> : null}
    <img alt={alt} {...imageProps} data-placement-variant="DEFAULT" src={media.url} />
  </picture>;
}
