import type { Metadata } from "next";

import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { transformLearnHandoff } from "@/lib/final-handoff/transforms";
import { learningMessages } from "@/lib/i18n/learning-center";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";
import { DEFAULT_MARKET_PROFILE, languageRouteByLocale, publicMarketPath } from "@/lib/market/registry";
import { articleService } from "@/lib/services";
import { helpLearnHubDescription } from "@/lib/site/help-copy";
import { HELP_SITE_NAME } from "@/lib/site/host-gate";
import { resolveServerSite } from "@/lib/site/server-site";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const [presentation, query, site] = await Promise.all([resolveServerPresentationContext(), searchParams, resolveServerSite()]);
  const { ui } = learningMessages(presentation.locale);
  if (site === "help") {
    // RFC-057 §4.1 and §17.1: the hub's own description names casino bonuses, banking, games
    // and reviews. On this host it lists one category and says so.
    return {
      title: `${ui.learn} | ${HELP_SITE_NAME}`,
      description: helpLearnHubDescription(presentation.locale),
      robots: { index: false, follow: true },
    };
  }
  // A category filter (`?category=…`) canonicalises to the hub and carries no hreflang of its own.
  return productMetadata({ presentation, pathname: "/learn", title: ui.metadataTitle, description: ui.metadataDescription, queryVariant: Object.keys(query).length > 0, site });
}

export default async function LearnPage() {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  const messages = learningMessages(presentation.locale);
  const articleLocale = languageRouteByLocale(presentation.locale).defaultLocale;
  const localizedArticles = await articleService.listPublished(articleLocale, { take: 100 }).catch(() => []);
  // A language hub lists its own guides first, then the English guides, marked as English and
  // linked to their English pages (audit 27 Sep 2026; mixed list since
  // LEARN-COMMERCIAL-LOCALIZED-2026-09-30, so the first translation does not hide the rest).
  const englishFallback = articleLocale !== DEFAULT_MARKET_PROFILE.defaultLocale;
  const englishArticles = englishFallback
    ? await articleService.listPublished(DEFAULT_MARKET_PROFILE.defaultLocale, { take: 100 }).catch(() => [])
    : [];
  // The help host publishes one Learn category: the protected help guides, which carry no
  // offer bridge and whose related reading stays inside the category (RFC-057 §4.1).
  const allArticles = [...localizedArticles, ...englishArticles];
  const articles = site === "help"
    ? allArticles.filter((article) => article.category === "responsible-gambling")
    : allArticles;
  const canonical = productCanonicalPath(presentation, "/learn");
  const programmePath = programmePathForPresentationLocale(presentation.locale);
  const localizedHref = (href: string) => productHref(presentation, href);
  const englishArticleHref = (href: string) => publicMarketPath(DEFAULT_MARKET_PROFILE, DEFAULT_MARKET_PROFILE.defaultLocale, href);
  return <>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: messages.ui.metadataTitle, description: site === "help" ? helpLearnHubDescription(presentation.locale) : messages.ui.metadataDescription, url: absoluteUrl(canonical, site) }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: messages.ui.home, item: absoluteUrl(productCanonicalPath(presentation, "/"), site) }, { "@type": "ListItem", position: 2, name: messages.ui.learn, item: absoluteUrl(canonical, site) }] }} />
    <HandoffPage headerAutoHide name="learn" programmePath={programmePath} revealHeadings transform={(html) => transformLearnHandoff(html, presentation.locale, localizedHref, articles, programmePath, englishFallback ? { articleHrefFor: englishArticleHref, articleLanguage: { lang: "en", label: messages.englishGuide } } : undefined, site)} />
  </>;
}
