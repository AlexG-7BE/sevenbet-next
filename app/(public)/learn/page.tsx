import type { Metadata } from "next";

import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Learn | B4GAMBLE",
  description: "Plain-language guides to casino bonuses, banking, games, reviews and responsible play.",
  alternates: { canonical: absoluteUrl("/learn") },
};

export default function LearnPage() {
  return <>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "B4GAMBLE", url: absoluteUrl("/") }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Learn", item: absoluteUrl("/learn") }] }} />
    <HandoffPage name="learn" />
  </>;
}
