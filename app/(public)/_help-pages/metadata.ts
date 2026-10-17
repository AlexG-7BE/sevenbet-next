import type { Metadata } from "next";

import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productCanonicalPath } from "@/lib/market/product-context";
import { absoluteUrl } from "@/lib/site";
import { HELP_SHARE_IMAGE_PATH, type HelpTextPage } from "@/lib/site/help-copy";
import { HELP_SITE_NAME, helpSiteSwitchesFromProcessEnv, type SiteClass } from "@/lib/site/host-gate";

/**
 * The help pages do not go through `productMetadata`: that helper resolves its canonical and
 * its default social image against the main origin, which is exactly what RFC-057 §8 forbids
 * on this host. The canonical is built per site here, and the image is the help share image.
 *
 * These two pages are `HELP` routes, so until phase 3 the main host serves them too. They are
 * indexable only where they belong — on the help host, once `HELP_SITE_REDIRECTS` makes it the
 * only host that serves them. Before that they are `noindex` everywhere, so the same page is
 * never a candidate on two origins at once (§7.3).
 */
export function helpPageMetadata({
  copy,
  pathname,
  presentation,
  site,
}: {
  copy: HelpTextPage;
  pathname: string;
  presentation: PresentationResolution;
  site: SiteClass;
}): Metadata {
  const indexable = site === "help" && helpSiteSwitchesFromProcessEnv().redirects;
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
    alternates: { canonical: absoluteUrl(productCanonicalPath(presentation, pathname), site) },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website",
      siteName: HELP_SITE_NAME,
      title: copy.metadataTitle,
      description: copy.metadataDescription,
      images: [{ url: HELP_SHARE_IMAGE_PATH, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [HELP_SHARE_IMAGE_PATH] },
  };
}
