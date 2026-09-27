import { absoluteUrl } from "@/lib/site";

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
