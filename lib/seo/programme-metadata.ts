import type { Metadata } from "next";

import { productIndexingApproved } from "@/lib/market/product-context";
import { PROGRAMME_ROUTES, programmePath, type ProgrammeLocale } from "@/lib/programme/presentation";
import { DEFAULT_OPEN_GRAPH_IMAGES } from "@/lib/seo/social-image";
import { absoluteUrl } from "@/lib/site";

/**
 * Search metadata of the Programme entry page. Only the languages open to search
 * (SEO-INDEX-DE-SV-DA-2026-09-27) are indexed and named in hreflang; the other published
 * languages keep a self canonical with noindex, like every other page (audit 27 Sep 2026:
 * `/es|el|it|pt|nl|fi|nb/program` were indexable with a twelve-language hreflang set).
 */
export function programmeSearchMetadata(locale: ProgrammeLocale, copy: { title: string; description: string }): Metadata {
  const path = programmePath(locale);
  const indexable = productIndexingApproved(locale);
  const { title, description } = copy;
  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(path),
      languages: indexable
        ? Object.fromEntries([
            ...PROGRAMME_ROUTES
              .filter((route) => productIndexingApproved(route.locale))
              .map((route) => [route.locale, absoluteUrl(route.path)]),
            ["x-default", absoluteUrl(programmePath("en-GB"))],
          ])
        : undefined,
    },
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
    openGraph: { title, description, url: absoluteUrl(path), locale: locale.replace("-", "_"), images: DEFAULT_OPEN_GRAPH_IMAGES },
    twitter: { card: "summary_large_image", title, description, images: DEFAULT_OPEN_GRAPH_IMAGES },
  };
}
