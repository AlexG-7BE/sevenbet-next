import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { cache, Suspense } from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import { offerBridgeKind } from "@/lib/articles/article-bridges";
import { articlePath, type PublicArticle } from "@/lib/articles/article-types";
import { articleLanguageAlternates } from "@/lib/articles/article-seo";
import { retiredArticleSuccessor } from "@/lib/articles/retired-articles";
import { relatedReadingListInput, relatedReadingSelection } from "@/lib/articles/related-reading";
import { learnBridgeMessages } from "@/lib/i18n/learn-bridges-catalog";
import { learningMessages, localizedLearningCategory } from "@/lib/i18n/learning-center";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { getLearningCategory } from "@/lib/learning-center";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { DEFAULT_MARKET_PROFILE, languageRouteByLocale, publicMarketPath } from "@/lib/market/registry";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { offersMayBePresented } from "@/lib/public-offer/offer-visibility";
import { articleService } from "@/lib/services";
import { editorialAuthor, modifiedNotBeforePublished, organizationReference } from "@/lib/seo/structured-data";
import { absoluteUrl, siteUrl } from "@/lib/site";

import { LearningArticleRelated, LearningArticleView, type LearnOfferBridge } from "./LearningArticleView";
import { helpMediaUrl } from "@/lib/site/help-media";
import type { SiteClass } from "@/lib/site/host-gate";
import { resolveServerSite } from "@/lib/site/server-site";

export const dynamic = "force-dynamic";

function categoryTitle(category: string, locale: PresentationResolution["locale"]) {
  const configured = getLearningCategory(category);
  return configured
    ? localizedLearningCategory(configured, locale).title
    : category.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

const loadArticle = cache(async function loadArticle(category: string, slug: string, locale: PresentationResolution["locale"]) {
  return articleService
    .getPublished(category, slug, languageRouteByLocale(locale).defaultLocale)
    .catch(() => null);
});

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  const article = await loadArticle(category, slug, presentation.locale);
  const messages = learningMessages(presentation.locale);
  if (!article) return productMetadata({ presentation, pathname: `/learn/${category}/${slug}`, title: messages.ui.learningGuide, description: messages.ui.metadataDescription, robots: { index: false, follow: false } });
  const metadata = productMetadata({
    presentation,
    pathname: articlePath(article),
    title: article.seoTitle || `${article.title} | B4GAMBLE`,
    description: article.seoDescription || article.excerpt,
    openGraphType: "article",
    languageAlternates: articleLanguageAlternates(article),
    // On the help host the social image is the first-party one or none at all: a
    // media.b4gamble.com URL in a help page's metadata is a commercial address (§13).
    ...(() => {
      const image = site === "help" ? helpMediaUrl(article.heroImageUrl) : article.heroImageUrl;
      return image ? { images: [{ url: image, alt: article.heroImageAlt || article.title }] } : {};
    })(),
  });
  if (!article.canonicalUrl) return metadata;
  const canonical = new URL(article.canonicalUrl, siteUrl).href;
  return { ...metadata, alternates: { ...metadata.alternates, canonical }, openGraph: metadata.openGraph ? { ...metadata.openGraph, url: canonical } : metadata.openGraph };
}

// The category crumb names the filtered hub directly: `/learn/{category}` only answers a 308 to it.
function breadcrumbSchema(article: PublicArticle, presentation: PresentationResolution, site: SiteClass) {
  const messages = learningMessages(presentation.locale);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: messages.ui.home, item: absoluteUrl(productCanonicalPath(presentation, "/"), site) },
      { "@type": "ListItem", position: 2, name: messages.ui.learningCenter, item: absoluteUrl(productCanonicalPath(presentation, "/learn"), site) },
      { "@type": "ListItem", position: 3, name: categoryTitle(article.category, presentation.locale), item: absoluteUrl(productCanonicalPath(presentation, `/learn?category=${encodeURIComponent(article.category)}`), site) },
      { "@type": "ListItem", position: 4, name: article.title, item: absoluteUrl(productCanonicalPath(presentation, articlePath(article)), site) },
    ],
  };
}

function articleSchema(article: PublicArticle, presentation: PresentationResolution, site: SiteClass) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    articleSection: categoryTitle(article.category, presentation.locale),
    keywords: article.tags.join(", "),
    datePublished: article.publishedAt,
    dateModified: modifiedNotBeforePublished(article.publishedAt, article.updatedAt) ?? article.updatedAt,
    inLanguage: article.locale,
    author: editorialAuthor(site),
    publisher: organizationReference(site),
    mainEntityOfPage: absoluteUrl(productCanonicalPath(presentation, articlePath(article)), site),
    // On the help host the image is the first-party one or none at all (RFC-057 §13); a
    // media.b4gamble.com URL may not appear in a help page's JSON-LD either (§6 rule 1).
    ...(() => {
      const image = site === "help" ? helpMediaUrl(article.heroImageUrl) : article.heroImageUrl;
      return image ? { image: [absoluteUrl(image, site)] } : {};
    })(),
  };
}

export default async function LearningArticlePage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  const article = await loadArticle(category, slug, presentation.locale);
  if (!article) {
    // A guide not published in this language opens in English, where it exists. A neutral
    // `/learn/...` link (an English page, a social post) resolves to the visitor's language
    // first, and German or Swedish visitors got a 404 (Semrush follow-up, 2 Oct 2026).
    const english = languageRouteByLocale(presentation.locale).defaultLocale !== DEFAULT_MARKET_PROFILE.defaultLocale
      ? await loadArticle(category, slug, DEFAULT_MARKET_PROFILE.defaultLocale)
      : null;
    if (english) redirect(publicMarketPath(DEFAULT_MARKET_PROFILE, DEFAULT_MARKET_PROFILE.defaultLocale, articlePath(english)));
    const successor = retiredArticleSuccessor(category, slug);
    if (!successor) notFound();
    // A retired, once-indexed guide moves permanently to its successor: in this language
    // when the successor is published in it, otherwise in English, where it was published.
    const localized = await loadArticle(successor.category, successor.slug, presentation.locale);
    permanentRedirect(localized
      ? productHref(presentation, successor.path)
      : publicMarketPath(DEFAULT_MARKET_PROFILE, DEFAULT_MARKET_PROFILE.defaultLocale, successor.path));
  }
  const messages = learningMessages(presentation.locale);
  return <>
    <JsonLd data={breadcrumbSchema(article, presentation, site)} />
    <JsonLd data={articleSchema(article, presentation, site)} />
    <LearningArticleView
      article={article}
      categoryTitle={categoryTitle(article.category, presentation.locale)}
      hrefFor={(href) => productHref(presentation, href)}
      messages={messages}
      offerBridge={offerBridgeFor(article, presentation)}
      programmePath={programmePathForPresentationLocale(presentation.locale)}
      relatedArticlesSlot={<Suspense fallback={null}><RelatedLearningArticles article={article} presentation={presentation} /></Suspense>}
      site={site}
    />
  </>;
}

/**
 * Bonus guides lead to Bonuses and Best Offers; casino-choice and payment guides
 * lead to Casinos and Best Offers — only where published offers may be presented.
 * Protected guides have no offer bridge.
 */
function offerBridgeFor(article: PublicArticle, presentation: PresentationResolution): LearnOfferBridge | null {
  const kind = offerBridgeKind(article.category);
  if (!kind || !offersMayBePresented(presentation.marketCountryCode)) return null;
  const learning = learningMessages(presentation.locale);
  const shell = publicShellMessages(presentation.locale);
  const bridges = learnBridgeMessages(presentation.locale);
  const casinos = kind === "casinos";
  return {
    kind,
    title: casinos ? bridges.casinoBridgeTitle : learning.ui.applyChecklist,
    body: casinos ? bridges.casinoBridgeBody : bridges.offerBridgeBody,
    lead: casinos ? bridges.casinoBridgeLead : bridges.offerBridgeLead,
    primaryLabel: casinos ? shell.casinos : shell.bonuses,
    primaryHref: productHref(presentation, casinos ? "/casinos" : "/bonuses"),
    bestOffersLabel: shell.bestOffers,
    bestOffersHref: productHref(presentation, "/best-offers"),
    disclosure: learning.ui.commercialDisclosure,
  };
}

async function RelatedLearningArticles({ article, presentation }: {
  article: PublicArticle;
  presentation: PresentationResolution;
}) {
  const candidates = await articleService
    .listPublished(article.locale, relatedReadingListInput(article))
    .catch(() => []);
  const relatedArticles = relatedReadingSelection(article, candidates);
  return <LearningArticleRelated
    hrefFor={(href) => productHref(presentation, href)}
    messages={learningMessages(presentation.locale)}
    relatedArticles={relatedArticles}
  />;
}
