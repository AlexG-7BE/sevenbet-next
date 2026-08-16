import type { Metadata } from "next";

import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";
import { transformHelpHandoff } from "@/lib/final-handoff/transforms";

const title = "Gambling Help & Support | B4GAMBLE";
const description = "Find practical pause, self-exclusion and access-control options without casino, bonus or affiliate prompts.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/help") },
  robots: { index: true, follow: true },
  openGraph: { type: "website", title, description, url: absoluteUrl("/help") },
  twitter: { card: "summary", title, description },
};

export default function HelpPage() {
  return <>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Help", item: absoluteUrl("/help") }] }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: title, description, url: absoluteUrl("/help") }} />
    <HandoffPage name="help" transform={transformHelpHandoff} />
  </>;
}
