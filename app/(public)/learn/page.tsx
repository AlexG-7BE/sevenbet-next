import type { Metadata } from "next";
import {
  CategoryNavigation,
  LearningGrid,
  LearningHero,
  LearningPathGrid,
} from "@/components/LearningCenterSections";
import { LearningSearch } from "@/components/LearningSearch";
import { Badge, Card, CTA, Section } from "@/components/ui";
import { learningArticles, learningCategories, learningTags } from "@/lib/learning-center";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "SevenBet Learning Center | Casino Education, Bonuses and Safety Guides",
  description:
    "Explore SevenBet's scalable Learning Center for casino basics, bonuses, responsible gambling, reviews, payments, licensing, crypto casinos, game guides and glossary terms.",
  alternates: {
    canonical: absoluteUrl("/learn"),
  },
};

function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SevenBet",
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
  const featuredArticles = learningArticles.filter((article) => article.featured);
  const popularArticles = learningArticles.filter((article) => article.popular);

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
      <LearningHero />
      <LearningSearch />

      <Section
        eyebrow="Categories"
        title="Main Learning Center categories."
        intro="The structure is designed for a future library of 500-1000 articles without changing the URL model."
      >
        <div id="categories">
          <CategoryNavigation />
        </div>
      </Section>

      <Section eyebrow="Featured guides" title="Start with foundational guides.">
        <LearningGrid articles={featuredArticles} />
      </Section>

      <Section eyebrow="Popular guides" title="Frequently useful starting points.">
        <LearningGrid articles={popularArticles} />
      </Section>

      <Section
        eyebrow="Learning paths"
        title="Follow a structured path."
        intro="Reusable learning paths connect articles across categories and can expand as more guides are added."
      >
        <LearningPathGrid />
      </Section>

      <Section
        eyebrow="Tag system"
        title="Reusable tags for search and internal linking."
        intro="Tags can power topic hubs, filters, related articles and glossary links."
      >
        <div className="miniTasks articleTips">
          {learningTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </Section>

      <Section eyebrow="Scalability" title="Built for a large SEO knowledge base.">
        <div className="statsGrid">
          <Card><strong>{learningCategories.length}</strong><span>main categories</span></Card>
          <Card><strong>{learningArticles.length}</strong><span>seed articles</span></Card>
          <Card><strong>{learningTags.length}</strong><span>reusable tags</span></Card>
          <Card><strong>500+</strong><span>future article capacity</span></Card>
        </div>
      </Section>

      <Section eyebrow="Next step" title="Continue from education into comparison only when ready.">
        <CTA
          title="Use the Learning Center before reviewing casino offers or operator pages."
          primary={{ href: "/responsible-gambling", label: "Responsible Gambling Hub" }}
          secondary={{ href: "/casinos", label: "Browse Casino Reviews" }}
        />
      </Section>
    </>
  );
}
