import type { Metadata } from "next";
import { AffiliateContent, AffiliateHero, affiliateFaqItems } from "@/components/AffiliateSections";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Affiliate Disclosure | How SevenBet Is Funded",
  description:
    "A plain-English explanation of SevenBet affiliate relationships, commissions, editorial independence, and reader responsibility.",
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
        name: "Affiliate Disclosure",
        item: absoluteUrl("/affiliate-disclosure"),
      },
    ],
  };
}

function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: affiliateFaqItems.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export default function AffiliateDisclosurePage() {
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
      <AffiliateHero />
      <AffiliateContent />
    </>
  );
}
