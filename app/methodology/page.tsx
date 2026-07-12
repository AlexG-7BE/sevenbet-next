import type { Metadata } from "next";
import {
  MethodologyContent,
  MethodologyHero,
  methodologyFaqItems,
} from "@/components/MethodologySections";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Methodology | How SevenBet Reviews Casinos and Bonuses",
  description:
    "SevenBet's editorial methodology for casino reviews, bonus comparisons, rating criteria, affiliate relationships, limitations, and corrections.",
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
        name: "Methodology",
        item: absoluteUrl("/methodology"),
      },
    ],
  };
}

function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: methodologyFaqItems.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export default function MethodologyPage() {
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
      <MethodologyHero />
      <MethodologyContent />
    </>
  );
}
