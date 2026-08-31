import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LearningArticleView } from "./LearningArticleView";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getArticlePath,
  getAuthor,
  getLearningArticle,
  getLearningCategory,
} from "@/lib/learning-center";
import { learningMessages, localizedLearningArticle, localizedLearningArticles, localizedLearningCategory } from "@/lib/i18n/learning-center";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";
import { isLocalHandoffVisualDataFixture, withHandoffLearningArticleData } from "@/lib/final-handoff/visual-data-fixture";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const article = getLearningArticle(category, slug);
  const presentation = await resolveServerPresentationContext();
  const messages = learningMessages(presentation.locale);

  if (!article) {
    return { title: messages.ui.learningGuide };
  }
  const localized = localizedLearningArticle(article, presentation.locale);
  return productMetadata({ presentation, pathname: getArticlePath(article), title: `${localized.title} | B4GAMBLE`, description: localized.summary, openGraphType: "article" });
}

function breadcrumbSchema(article: NonNullable<ReturnType<typeof getLearningArticle>>, presentation: PresentationResolution) {
  const messages = learningMessages(presentation.locale);
  const sourceCategory = getLearningCategory(article.categorySlug);
  const category = sourceCategory ? localizedLearningCategory(sourceCategory, presentation.locale) : null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: messages.ui.home,
        item: absoluteUrl(productCanonicalPath(presentation, "/")),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: messages.ui.learningCenter,
        item: absoluteUrl(productCanonicalPath(presentation, "/learn")),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category?.title || messages.ui.learningCenter,
        item: absoluteUrl(productCanonicalPath(presentation, `/learn/${article.categorySlug}`)),
      },
      {
        "@type": "ListItem",
        position: 4,
        name: article.title,
        item: absoluteUrl(productCanonicalPath(presentation, getArticlePath(article))),
      },
    ],
  };
}

function articleSchema(article: NonNullable<ReturnType<typeof getLearningArticle>>, presentation: PresentationResolution) {
  const author = getAuthor(article.authorId);
  const editor = getAuthor(article.editorId);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    articleSection: getLearningCategory(article.categorySlug)
      ? localizedLearningCategory(getLearningCategory(article.categorySlug)!, presentation.locale).title
      : learningMessages(presentation.locale).ui.learningCenter,
    keywords: article.tags.join(", "),
    datePublished: article.publishedAt,
    dateModified: article.lastUpdated,
    author: {
      "@type": "Organization",
      name: author.name,
      url: absoluteUrl(productCanonicalPath(presentation, "/about")),
    },
    editor: {
      "@type": "Organization",
      name: editor.name,
      url: absoluteUrl(productCanonicalPath(presentation, "/methodology")),
    },
    publisher: {
      "@type": "Organization",
      name: "B4GAMBLE",
      url: absoluteUrl(productCanonicalPath(presentation, "/")),
    },
    mainEntityOfPage: absoluteUrl(productCanonicalPath(presentation, getArticlePath(article))),
  };
}

function faqSchema(article: NonNullable<ReturnType<typeof getLearningArticle>>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export default async function LearningArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const { category, slug } = await params;
  const sourceArticle = getLearningArticle(category, slug);

  if (!sourceArticle) notFound();
  const presentation = await resolveServerPresentationContext();
  const messages = learningMessages(presentation.locale);
  const article = localizedLearningArticle(sourceArticle, presentation.locale);
  const presentedArticle = withHandoffLearningArticleData(article, presentation.locale === "en-GB" && isLocalHandoffVisualDataFixture(raw.visualFixture));
  const sourceCategory = getLearningCategory(presentedArticle.categorySlug)!;
  const categoryRecord = localizedLearningCategory(sourceCategory, presentation.locale);
  const localizedArticles = localizedLearningArticles(presentation.locale);
  const relatedArticles = presentedArticle.relatedArticles
    .map((relatedSlug) => localizedArticles.find((candidate) => candidate.slug === relatedSlug))
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));
  const programmePath = programmePathForPresentationLocale(presentation.locale);

  return (
    <>
      <JsonLd data={breadcrumbSchema(presentedArticle, presentation)} />
      <JsonLd data={articleSchema(presentedArticle, presentation)} />
      <JsonLd data={faqSchema(presentedArticle)} />
      <LearningArticleView
        article={presentedArticle}
        category={categoryRecord}
        author={getAuthor(presentedArticle.authorId)}
        editor={getAuthor(presentedArticle.editorId)}
        relatedArticles={relatedArticles}
        locale={presentation.locale}
        messages={messages}
        hrefFor={(href) => productHref(presentation, href)}
        programmePath={programmePath}
      />
    </>
  );
}
