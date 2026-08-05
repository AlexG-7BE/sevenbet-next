import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryHero, CategoryPageContent } from "@/components/LearningCenterSections";
import { getLearningCategory, learningCategories } from "@/lib/learning-center";
import { absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return learningCategories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getLearningCategory(categorySlug);

  if (!category) {
    return { title: "Learning Category | SevenBet" };
  }

  return {
    title: `${category.title} | SevenBet Learning Center`,
    description: category.description,
    alternates: {
      canonical: absoluteUrl(`/learn/${category.slug}`),
    },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(category)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(category)) }}
      />
      <CategoryHero category={category} />
      <CategoryPageContent category={category} />
    </>
  );
}
