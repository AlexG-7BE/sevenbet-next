import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { articlePath, type PublicArticle } from "@/lib/articles/article-types";
import { learningMessages, localizedLearningCategory } from "@/lib/i18n/learning-center";
import { getLearningCategory } from "@/lib/learning-center";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { languageRouteByLocale } from "@/lib/market/registry";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { articleService } from "@/lib/services";
import { absoluteUrl } from "@/lib/site";

import { LearningArticleView } from "./LearningArticleView";

export const dynamic = "force-dynamic";

function categoryTitle(category: string, locale: PresentationResolution["locale"]) {
  const configured = getLearningCategory(category);
  return configured
    ? localizedLearningCategory(configured, locale).title
    : category.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

async function loadArticle(category: string, slug: string, presentation: PresentationResolution) {
  return articleService
    .getPublished(category, slug, languageRouteByLocale(presentation.locale).defaultLocale)
    .catch(() => null);
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const presentation = await resolveServerPresentationContext();
  const article = await loadArticle(category, slug, presentation);
  const messages = learningMessages(presentation.locale);
  if (!article) return productMetadata({ presentation, pathname: `/learn/${category}/${slug}`, title: messages.ui.learningGuide, description: messages.ui.metadataDescription, robots: { index: false, follow: false } });
  const metadata = productMetadata({
    presentation,
    pathname: articlePath(article),
    title: article.seoTitle || `${article.title} | B4GAMBLE`,
    description: article.seoDescription || article.excerpt,
    openGraphType: "article",
    ...(article.heroImageUrl ? { images: [{ url: article.heroImageUrl, alt: article.heroImageAlt || article.title }] } : {}),
  });
  if (!article.canonicalUrl) return metadata;
  const canonical = absoluteUrl(article.canonicalUrl);
  return { ...metadata, alternates: { ...metadata.alternates, canonical }, openGraph: metadata.openGraph ? { ...metadata.openGraph, url: canonical } : metadata.openGraph };
}

function breadcrumbSchema(article: PublicArticle, presentation: PresentationResolution) {
  const messages = learningMessages(presentation.locale);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: messages.ui.home, item: absoluteUrl(productCanonicalPath(presentation, "/")) },
      { "@type": "ListItem", position: 2, name: messages.ui.learningCenter, item: absoluteUrl(productCanonicalPath(presentation, "/learn")) },
      { "@type": "ListItem", position: 3, name: categoryTitle(article.category, presentation.locale), item: absoluteUrl(productCanonicalPath(presentation, `/learn/${article.category}`)) },
      { "@type": "ListItem", position: 4, name: article.title, item: absoluteUrl(productCanonicalPath(presentation, articlePath(article))) },
    ],
  };
}

function articleSchema(article: PublicArticle, presentation: PresentationResolution) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    articleSection: categoryTitle(article.category, presentation.locale),
    keywords: article.tags.join(", "),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: article.locale,
    author: { "@type": "Organization", name: "B4GAMBLE Editorial Team", url: absoluteUrl(productCanonicalPath(presentation, "/about")) },
    publisher: { "@type": "Organization", name: "B4GAMBLE", url: absoluteUrl(productCanonicalPath(presentation, "/")) },
    mainEntityOfPage: absoluteUrl(productCanonicalPath(presentation, articlePath(article))),
    ...(article.heroImageUrl ? { image: [absoluteUrl(article.heroImageUrl)] } : {}),
  };
}

export default async function LearningArticlePage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const presentation = await resolveServerPresentationContext();
  const article = await loadArticle(category, slug, presentation);
  if (!article) notFound();
  const related = await articleService.listPublished(article.locale, { take: 3, excludeId: article.id }).catch(() => []);
  const messages = learningMessages(presentation.locale);
  return <>
    <JsonLd data={breadcrumbSchema(article, presentation)} />
    <JsonLd data={articleSchema(article, presentation)} />
    <LearningArticleView article={article} categoryTitle={categoryTitle(article.category, presentation.locale)} hrefFor={(href) => productHref(presentation, href)} messages={messages} programmePath={programmePathForPresentationLocale(presentation.locale)} relatedArticles={related} />
  </>;
}
