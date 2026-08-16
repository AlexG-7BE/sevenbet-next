import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { transformTenStepsHandoff } from "@/lib/final-handoff/transforms";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";

const title = "The B4GAMBLE 10-Step Programme";
const description = "See how ten private missions build a personal Starting Point and control plan.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/10-steps") },
  robots: { index: true, follow: true },
  openGraph: { type: "website", title, description, url: absoluteUrl("/10-steps") },
  twitter: { card: "summary", title, description },
};

export default function TenStepsPage() {
  return <>
    <JsonLd data={[{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "10-Step Programme", item: absoluteUrl("/10-steps") }] }, { "@context": "https://schema.org", "@type": "WebPage", name: title, description, url: absoluteUrl("/10-steps") }]} />
    <HandoffPage name="tenSteps" transform={transformTenStepsHandoff} />
  </>;
}
