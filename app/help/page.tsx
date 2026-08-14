import type { Metadata } from "next";

import { ProtectedHelpHub } from "@/components/protected-help/ProtectedHelpHub";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";

const title = "Gambling Help & Support | B4GAMBLE";
const description =
  "Find practical pause and access-control options plus independently provided UK support, without casino, bonus or affiliate prompts.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/help") },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title,
    description,
    url: absoluteUrl("/help"),
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

const breadcrumbSchema = {
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
      name: "Help",
      item: absoluteUrl("/help"),
    },
  ],
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: title,
  description,
  url: absoluteUrl("/help"),
  isPartOf: {
    "@type": "WebSite",
    name: "B4GAMBLE",
    url: absoluteUrl("/"),
  },
};

export default function HelpPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={webPageSchema} />
      <ProtectedHelpHub />
    </>
  );
}
