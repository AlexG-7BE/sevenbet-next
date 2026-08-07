import type { Metadata } from "next";
import { AboutDocument } from "./AboutDocument";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About SevenBet | Learn, Reflect, Compare",
  description:
    "How SevenBet puts education before comparison, keeps Programme reflection separate from commercial information, and defines its product boundaries.",
  alternates: { canonical: absoluteUrl("/about") },
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

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema()) }}
      />
      <AboutDocument />
    </>
  );
}
