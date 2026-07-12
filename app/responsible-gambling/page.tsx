import type { Metadata } from "next";
import { Breadcrumbs, CategoryCard, LearningCard, ResourceCard } from "@/components/ResponsibleGamblingHub";
import { PageHero } from "@/components/PageTemplates";
import { Badge, Button, Card, CTA, FAQ, Section } from "@/components/ui";
import {
  learningArticles,
  learningCategories,
  learningPaths,
  practicalTools,
  responsibleTools,
} from "@/lib/responsible-gambling";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Responsible Gambling Learning Center | SevenBet",
  description:
    "Practical guides, educational articles and tools for budgeting, bonus terms, casino licensing and responsible gambling decisions.",
};

const featuredSlugs = [
  "bonus-terms",
  "budgeting",
  "deposit-limits",
  "reality-checks",
  "cooling-off",
  "self-exclusion",
  "casino-licenses",
  "payment-safety",
];

const hubFaqItems: Array<[string, string]> = [
  [
    "What is responsible gambling?",
    "Responsible gambling means using planning, limits and information to support controlled, informed gambling decisions.",
  ],
  [
    "What is a deposit limit?",
    "A deposit limit sets the maximum amount that can be deposited during a chosen time period.",
  ],
  [
    "What is self-exclusion?",
    "Self-exclusion is a longer restriction on gambling access, usually managed through an operator or regulator tool.",
  ],
  [
    "What is a wagering requirement?",
    "A wagering requirement describes how much qualifying play may be required before bonus-related withdrawals are allowed.",
  ],
  [
    "How do cooling-off periods work?",
    "Cooling-off periods create a temporary pause from gambling access for a defined period.",
  ],
  [
    "How can I compare casinos?",
    "Compare licensing, bonus terms, payment methods, withdrawal speed and responsible gambling tools before any offer button.",
  ],
];

function articleBySlug(slug: string) {
  return learningArticles.find((article) => article.slug === slug);
}

function hubBreadcrumbSchema() {
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
    ],
  };
}

function hubFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: hubFaqItems.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export default function ResponsibleGamblingPage() {
  const featuredArticles = featuredSlugs
    .map((slug) => articleBySlug(slug))
    .filter((article): article is (typeof learningArticles)[number] => Boolean(article));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hubBreadcrumbSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hubFaqSchema()) }}
      />
      <PageHero
        eyebrow="Responsible gambling"
        title="Responsible Gambling Learning Center"
        intro="Practical guides, educational articles, and tools to help you better understand gambling decisions and industry terminology."
        primary={{ href: "#featured-topics", label: "Start Learning" }}
        secondary={{ href: "/program", label: "Start the 10-Step Program" }}
      >
        <Breadcrumbs />
        <div className="trustStrip">
          <Badge tone="green">Educational hub</Badge>
          <Badge>10 learning guides</Badge>
          <Badge tone="dark">No medical claims</Badge>
        </div>
      </PageHero>

      <Section
        eyebrow="Featured topics"
        title="Start with the concepts that shape safer decisions."
        intro="Each guide explains one topic in plain language and links to related resources across SevenBet."
      >
        <div id="featured-topics" className="guideGrid">
          {featuredArticles.map((article) => (
            <LearningCard article={article} key={article.slug} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Learning paths"
        title="Choose a beginner-friendly path."
        intro="These paths group articles into practical sequences based on what you want to understand first."
      >
        <div className="guideGrid">
          {learningPaths.map((path) => (
            <Card className="guideCard learningPath" key={path.title}>
              <Badge tone="green">Path</Badge>
              <h3>{path.title}</h3>
              <p className="muted">{path.summary}</p>
              <div className="pathLinks">
                {path.links.map((slug) => {
                  const article = articleBySlug(slug);
                  if (!article) return null;
                  return (
                    <Button href={`/responsible-gambling/${article.slug}`} variant="ghost" key={slug}>
                      {article.title}
                    </Button>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Practical tools"
        title="Use simple worksheets and checklists before opening an operator page."
      >
        <div className="guideGrid">
          {practicalTools.map((tool) => (
            <ResourceCard title={tool.title} description={tool.text} href={tool.href} key={tool.title} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Latest guides"
        title="Recent educational articles."
        intro="The learning center is organized around practical decisions: money, time, terms, tools and casino safety."
      >
        <div className="guideGrid">
          {learningArticles.slice(0, 6).map((article) => (
            <LearningCard article={article} key={article.slug} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Protection tools"
        title="Responsible gambling resources and what they do."
        intro="Availability varies by operator and jurisdiction. Review the exact rules on the casino website before relying on any tool."
      >
        <div className="guideGrid">
          {responsibleTools.map((tool) => (
            <ResourceCard title={tool.title} description={tool.description} href={tool.href} key={tool.title} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Content categories"
        title="Browse by learning area."
        intro="Use categories to move from broad education into specific guides."
      >
        <div className="guideGrid">
          {learningCategories.map((category) => (
            <CategoryCard category={category} key={category.id} />
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Responsible gambling basics.">
        <FAQ items={hubFaqItems} />
      </Section>

      <Section eyebrow="Continue learning" title="Build the plan before comparing offers.">
        <CTA
          title="Continue Learning"
          intro="Explore the guide library or start the SevenBet 10-Step Control Program before reviewing casino comparisons."
          primary={{ href: "/responsible-gambling#featured-topics", label: "Explore All Guides" }}
          secondary={{ href: "/program", label: "Start the 10-Step Program" }}
        />
      </Section>
    </>
  );
}
