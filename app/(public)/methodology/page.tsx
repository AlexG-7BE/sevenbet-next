import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  MethodologyDocument,
  methodologyFaqItems,
} from "./MethodologyDocument";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Methodology | How B4GAMBLE Reviews Casinos and Bonuses",
  description:
    "B4GAMBLE's editorial methodology for casino reviews, bonus comparisons, rating criteria, affiliate relationships, limitations, and corrections.",
  alternates: { canonical: absoluteUrl("/methodology") },
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
      <JsonLd data={breadcrumbSchema()} />
      <JsonLd data={faqSchema()} />
      <MethodologyDocument />
    </>
  );
}
