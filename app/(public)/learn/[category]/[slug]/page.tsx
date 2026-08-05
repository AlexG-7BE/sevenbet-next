import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout } from "@/components/LearningCenterSections";
import {
  getArticlePath,
  getAuthor,
  getLearningArticle,
  getLearningCategory,
  learningArticles,
} from "@/lib/learning-center";
import { absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return learningArticles.map((article) => ({
    category: article.categorySlug,
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const article = getLearningArticle(category, slug);

  if (!article) {
    return { title: "Learning Guide | SevenBet" };
  }

  return {
    title: `${article.title} | SevenBet Learning Center`,
    description: article.summary,
    alternates: {
      canonical: absoluteUrl(getArticlePath(article)),
    },
  };
}

function breadcrumbSchema(article: NonNullable<ReturnType<typeof getLearningArticle>>) {
  const category = getLearningCategory(article.categorySlug);

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
        name: "Learning Center",
        item: absoluteUrl("/learn"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category?.title || "Learning Category",
        item: absoluteUrl(`/learn/${article.categorySlug}`),
      },
      {
        "@type": "ListItem",
        position: 4,
        name: article.title,
        item: absoluteUrl(getArticlePath(article)),
      },
    ],
  };
}

function articleSchema(article: NonNullable<ReturnType<typeof getLearningArticle>>) {
  const author = getAuthor(article.authorId);
  const editor = getAuthor(article.editorId);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    articleSection: getLearningCategory(article.categorySlug)?.title || "Learning Center",
    keywords: article.tags.join(", "),
    dateModified: article.lastUpdated,
    author: {
      "@type": "Organization",
      name: author.name,
      url: absoluteUrl("/about"),
    },
    editor: {
      "@type": "Organization",
      name: editor.name,
      url: absoluteUrl("/methodology"),
    },
    publisher: {
      "@type": "Organization",
      name: "SevenBet",
      url: absoluteUrl("/"),
    },
    mainEntityOfPage: absoluteUrl(getArticlePath(article)),
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
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const article = getLearningArticle(category, slug);

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
