import type { Metadata } from "next";
import { AboutContent, AboutHero, aboutFaqItems } from "@/components/AboutSections";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About SevenBet | Educational Casino Guides and Editorial Reviews",
  description:
    "Learn what SevenBet is, why it exists, what it does, what it does not do, and how its editorial casino comparison platform works.",
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
        name: "About SevenBet",
        item: absoluteUrl("/about"),
      },
    ],
  };
}

function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: aboutFaqItems.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export default function AboutPage() {
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
      <AboutHero />
      <AboutContent />
    </>
  );
}
