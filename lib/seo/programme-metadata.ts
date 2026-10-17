import type { Metadata } from "next";

import { productIndexingApproved } from "@/lib/market/product-context";
import { PROGRAMME_ROUTES, programmePath, type ProgrammeLocale } from "@/lib/programme/presentation";
import { openGraphImagesForSite } from "@/lib/seo/social-image";
import { absoluteUrl } from "@/lib/site";
import type { SiteClass } from "@/lib/site/host-gate";

/**
 * Search metadata of the Programme entry page. Only the languages open to search
 * (SEO-INDEX-DE-SV-DA-2026-09-27) are indexed and named in hreflang; the other published
 * languages keep a self canonical with noindex, like every other page (audit 27 Sep 2026:
 * `/es|el|it|pt|nl|fi|nb/program` were indexable with a twelve-language hreflang set).
 * A query variant such as `?entry=start` keeps the canonical but names no language versions:
 * hreflang on a page whose canonical points elsewhere is a conflict (Semrush, 2 Oct 2026).
 */
export function programmeSearchMetadata(locale: ProgrammeLocale, copy: { title: string; description: string }, options: { queryVariant?: boolean; site?: SiteClass } = {}): Metadata {
  const path = programmePath(locale);
  const indexable = productIndexingApproved(locale);
  const { title, description } = copy;
  // RFC-057 §8 and §12: the Programme's canonical, its language versions and its share image
  // are all on the host that serves it, and never on the other one.
  const site = options.site ?? "main";
  const images = openGraphImagesForSite(site);
  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(path, site),
      languages: indexable && !options.queryVariant
        ? Object.fromEntries([
            ...PROGRAMME_ROUTES
              .filter((route) => productIndexingApproved(route.locale))
              .map((route) => [route.locale, absoluteUrl(route.path, site)]),
            ["x-default", absoluteUrl(programmePath("en-GB"), site)],
          ])
        : undefined,
    },
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
    openGraph: { title, description, url: absoluteUrl(path, site), locale: locale.replace("-", "_"), images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
