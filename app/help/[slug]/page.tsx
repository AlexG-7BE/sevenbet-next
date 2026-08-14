import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProtectedHelpArticle } from "@/components/protected-help/ProtectedHelpArticle";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getLearningArticle,
} from "@/lib/responsible-gambling";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearningArticle(slug);

  if (!article) {
    return { title: "Gambling Help Guide | B4GAMBLE", robots: { index: false, follow: true } };
  }

  const title = `${article.title} | B4GAMBLE Help`;
  const url = absoluteUrl(`/help/${article.slug}`);
  return {
    title,
    description: article.summary,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: "article", title, description: article.summary, url },
    twitter: { card: "summary", title, description: article.summary },
  };
}

function breadcrumbSchema(article: NonNullable<ReturnType<typeof getLearningArticle>>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Help",
        item: absoluteUrl("/help"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: absoluteUrl(`/help/${article.slug}`),
      },
    ],
  };
}

function articleSchema(article: NonNullable<ReturnType<typeof getLearningArticle>>) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    articleSection: article.category,
    dateModified: "2026-07-12",
    author: {
      "@type": "Organization",
      name: "B4GAMBLE",
      url: absoluteUrl("/"),
    },
    publisher: {
      "@type": "Organization",
      name: "B4GAMBLE",
    },
    mainEntityOfPage: absoluteUrl(`/help/${article.slug}`),
  };
}

export default async function ProtectedHelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getLearningArticle(slug);

  if (!article) notFound();

  return (
    <>
      <JsonLd data={breadcrumbSchema(article)} />
      <JsonLd data={articleSchema(article)} />
      <ProtectedHelpArticle article={article} />
    </>
  );
}
