import type { Metadata } from "next";
import { KnowledgeCenterContent } from "@/components/KnowledgeCenter";
import { Breadcrumbs } from "@/components/ResponsibleGamblingHub";
import { Badge, Button, Container } from "@/components/ui";
import { knowledgeQuestions } from "@/lib/knowledge-center";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "SevenBet Help Center | Casino Bonuses, Reviews and Responsible Gambling FAQ",
  description:
    "Search SevenBet answers about the 10-Step Program, responsible gambling, casino bonuses, reviews, methodology, affiliate disclosure, payments, and licensing.",
};

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
        name: "SevenBet Help Center",
        item: absoluteUrl("/faq"),
      },
    ],
  };
}

function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: knowledgeQuestions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema()) }}
      />
      <section className="pageShell">
        <Container>
          <p className="eyebrow">Knowledge center</p>
          <h1>SevenBet Help Center</h1>
          <p className="lead">
            Find answers about casino bonuses, responsible gambling, our 10-Step Program, casino reviews, affiliate
            disclosure, and editorial methodology.
          </p>
          <div className="heroActions">
            <Button href="#knowledge-search" variant="primary">Search Knowledge Base</Button>
            <Button href="#categories" variant="ghost">Browse Categories</Button>
          </div>
          <Breadcrumbs />
          <div className="trustStrip">
            <Badge tone="green">Searchable answers</Badge>
            <Badge>FAQ schema</Badge>
            <Badge tone="dark">Internal guide links</Badge>
            <Badge tone="warning">Reader-first explanations</Badge>
          </div>
        </Container>
      </section>
      <KnowledgeCenterContent />
    </>
  );
}
