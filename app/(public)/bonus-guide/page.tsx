import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/JsonLd";
import { BonusGuideDocument } from "./BonusGuideDocument";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Casino Bonus Terms Guide | B4GAMBLE",
  description: "Learn how to read wagering, max-bet, expiry, deposit, and withdrawal terms before considering an offer.",
  alternates: { canonical: absoluteUrl("/bonus-guide") },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Bonus Guide", item: absoluteUrl("/bonus-guide") },
  ],
};

export default function BonusGuidePage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <BonusGuideDocument />
    </>
  );
}
