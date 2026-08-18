import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { transformBonusGuideHandoff } from "@/lib/final-handoff/transforms";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Casino Bonus Terms Guide | B4GAMBLE", description: "Understand wagering turnover, game weighting and material bonus terms through explicitly fictional examples and current GB regulatory context.", alternates: { canonical: absoluteUrl("/bonus-guide") } };
export default function BonusGuidePage() { return <>
  <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Learn", item: absoluteUrl("/learn") }, { "@type": "ListItem", position: 2, name: "Bonus Guide", item: absoluteUrl("/bonus-guide") }] }} />
  <HandoffPage name="article" transform={transformBonusGuideHandoff} />
</>; }
