import type { Metadata } from "next";
import { AffiliateDisclosureDocument } from "@/app/(public)/affiliate-disclosure/AffiliateDisclosureDocument";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Affiliate Disclosure | How B4GAMBLE Is Funded", description: "How affiliate links may fund B4GAMBLE and how commercial relationships relate to editorial work.", alternates: { canonical: absoluteUrl("/affiliate-disclosure") } };
export default function AffiliateDisclosurePage() { return <>
  <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Affiliate Disclosure", item: absoluteUrl("/affiliate-disclosure") }] }} />
  <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: "Affiliate Disclosure | How B4GAMBLE Is Funded", description: metadata.description, url: absoluteUrl("/affiliate-disclosure") }} />
  <AffiliateDisclosureDocument />
</>; }
