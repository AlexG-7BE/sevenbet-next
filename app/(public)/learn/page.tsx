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

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const { ui } = learningMessages(presentation.locale);
  return productMetadata({ presentation, pathname: "/learn", title: ui.metadataTitle, description: ui.metadataDescription });
}

export default async function LearnPage() {
  const presentation = await resolveServerPresentationContext();
  const messages = learningMessages(presentation.locale);
  const articleLocale = languageRouteByLocale(presentation.locale).defaultLocale;
  const localizedArticles = await articleService.listPublished(articleLocale, { take: 100 }).catch(() => []);
  // A language with no guide of its own lists the English guides, marked as English and
  // linked to their English pages, instead of an empty hub (audit 27 Sep 2026).
  const englishFallback = !localizedArticles.length && articleLocale !== DEFAULT_MARKET_PROFILE.defaultLocale;
  const articles = englishFallback
    ? await articleService.listPublished(DEFAULT_MARKET_PROFILE.defaultLocale, { take: 100 }).catch(() => [])
    : localizedArticles;
  const canonical = productCanonicalPath(presentation, "/learn");
  const programmePath = programmePathForPresentationLocale(presentation.locale);
  const localizedHref = (href: string) => productHref(presentation, href);
  const englishArticleHref = (href: string) => publicMarketPath(DEFAULT_MARKET_PROFILE, DEFAULT_MARKET_PROFILE.defaultLocale, href);
  return <>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: messages.ui.metadataTitle, description: messages.ui.metadataDescription, url: absoluteUrl(canonical) }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: messages.ui.home, item: absoluteUrl(productCanonicalPath(presentation, "/")) }, { "@type": "ListItem", position: 2, name: messages.ui.learn, item: absoluteUrl(canonical) }] }} />
    <HandoffPage headerAutoHide name="learn" programmePath={programmePath} revealHeadings transform={(html) => transformLearnHandoff(html, presentation.locale, localizedHref, articles, programmePath, englishFallback ? { articleHrefFor: englishArticleHref, articleLanguage: { lang: "en", label: messages.englishGuide } } : undefined)} />
  </>;
}
