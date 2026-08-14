import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LearningCategoryView } from "./LearningCategoryView";
import { JsonLd } from "@/components/seo/JsonLd";
import { getArticlesByCategory, getLearningCategory, getRelatedCategories } from "@/lib/learning-center";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getLearningCategory(categorySlug);

  if (!category) {
    return { title: "Learning Category | B4GAMBLE" };
  }

  const title = category.slug === "responsible-gambling"
    ? "Responsible Gambling Education | B4GAMBLE Learning Center"
    : `${category.title} | B4GAMBLE Learning Center`;
  const description = category.description;
  const url = absoluteUrl(`/learn/${category.slug}`);
  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    robots: { index: true, follow: true },
    openGraph: { type: "website", title, description, url },
    twitter: { card: "summary", title, description },
  };
}

function breadcrumbSchema(category: NonNullable<ReturnType<typeof getLearningCategory>>) {
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
        name: category.title,
        item: absoluteUrl(`/learn/${category.slug}`),
      },
    ],
  };
}

function faqSchema(category: NonNullable<ReturnType<typeof getLearningCategory>>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: category.faq.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

function webPageSchema(category: NonNullable<ReturnType<typeof getLearningCategory>>) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: category.slug === "responsible-gambling" ? "Responsible Gambling Education" : category.title,
    description: category.description,
    url: absoluteUrl(`/learn/${category.slug}`),
    isPartOf: { "@type": "WebSite", name: "B4GAMBLE Learning Center", url: absoluteUrl("/learn") },
  };
}

export default async function LearningCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const category = getLearningCategory(categorySlug);

  if (!category) notFound();

  return (
    <>
      <JsonLd data={breadcrumbSchema(category)} />
      <JsonLd data={faqSchema(category)} />
      <JsonLd data={webPageSchema(category)} />
      <LearningCategoryView
        category={category}
        articles={getArticlesByCategory(category.slug)}
        relatedCategories={getRelatedCategories(category)}
      />
    </>
  );
}
