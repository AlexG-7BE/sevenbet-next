import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout } from "@/components/ResponsibleGamblingHub";
import {
  getLearningArticle,
  learningArticles,
} from "@/lib/responsible-gambling";
import { absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return learningArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearningArticle(slug);

  if (!article) {
    return { title: "Responsible Gambling Guide | SevenBet" };
  }

  return {
    title: `${article.title} | SevenBet`,
    description: article.summary,
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
        name: "Responsible Gambling",
        item: absoluteUrl("/responsible-gambling"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: absoluteUrl(`/responsible-gambling/${article.slug}`),
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
      name: "SevenBet",
      url: absoluteUrl("/"),
    },
    publisher: {
      "@type": "Organization",
      name: "SevenBet",
    },
    mainEntityOfPage: absoluteUrl(`/responsible-gambling/${article.slug}`),
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

export default async function ResponsibleGamblingArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getLearningArticle(slug);

  if (!article) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(article)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema(article)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(article)) }}
      />
      <ArticleLayout article={article} />
    </>
  );
}
