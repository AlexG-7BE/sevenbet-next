import type { Metadata } from "next";
import { AffiliateDisclosureDocument } from "./AffiliateDisclosureDocument";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Affiliate Disclosure | How B4GAMBLE Is Funded",
  description:
    "How affiliate links may fund B4GAMBLE, how commercial relationships relate to editorial work, and what readers should verify.",
  alternates: { canonical: absoluteUrl("/affiliate-disclosure") },
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

export default function AffiliateDisclosurePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema()) }}
      />
      <AffiliateDisclosureDocument />
    </>
  );
}
