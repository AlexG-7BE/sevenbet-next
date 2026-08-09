import type { Metadata } from "next";
import { LearningCenterPage } from "./LearningCenterPage";
import { learningArticles, learningCategories, learningPaths, learningTags } from "@/lib/learning-center";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "B4GAMBLE Learning Center | Casino Education, Bonuses and Risk Guides",
  description:
    "Explore B4GAMBLE's scalable Learning Center for casino basics, bonuses, responsible gambling, reviews, payments, licensing, crypto casinos, game guides and glossary terms.",
  alternates: {
    canonical: absoluteUrl("/learn"),
  },
};

function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "B4GAMBLE",
    url: absoluteUrl("/"),
    sameAs: [],
  };
}

function breadcrumbSchema() {
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
    ],
  };
}

export default function LearnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema()) }}
      />
      <LearningCenterPage articles={learningArticles} categories={learningCategories} tags={learningTags} paths={learningPaths} />
    </>
  );
}
