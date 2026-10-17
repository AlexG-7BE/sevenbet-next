import { absoluteUrl } from "@/lib/site";
import type { SiteClass } from "@/lib/site/host-gate";

/** The default social image served by app/opengraph-image.tsx (keep the two in step). */
export const OPEN_GRAPH_IMAGE_PATH = "/opengraph-image";
export const OPEN_GRAPH_IMAGE_ALT = "B4GAMBLE: know the terms before you play";
export const OPEN_GRAPH_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/**
 * A page that sets its own `openGraph` replaces the root layout's, including the file-based
 * default image, so pages built through productMetadata name the default image explicitly.
 */
export const DEFAULT_OPEN_GRAPH_IMAGES = [{
  url: absoluteUrl(OPEN_GRAPH_IMAGE_PATH),
  width: OPEN_GRAPH_IMAGE_SIZE.width,
  height: OPEN_GRAPH_IMAGE_SIZE.height,
  alt: OPEN_GRAPH_IMAGE_ALT,
}];

/**
 * RFC-057 §8. `/opengraph-image` is `COMMERCIAL`: its text reads "Reviews, bonus terms side by
 * side" and it answers 404 on the help host, so a help page may not name it — a
 * `b4gamble.com` image URL on a help response is exactly what the one-way link rule forbids
 * (§6, rule 1).
 *
 * The help site's own share image (`/help-share-image`, §8) lands with the pull request that
 * carries the help shell and the host-aware root metadata, and it is named here then. Until it
 * exists a help page names **no** image rather than the commercial one, which is why this
 * returns `undefined` instead of a second constant.
 */
export function openGraphImagesForSite(site: SiteClass = "main") {
  return site === "help" ? undefined : DEFAULT_OPEN_GRAPH_IMAGES;
}
