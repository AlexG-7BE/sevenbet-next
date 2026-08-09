import type { Metadata } from "next";

import { ProtectedHelpHub } from "@/components/protected-help/ProtectedHelpHub";
import { absoluteUrl } from "@/lib/site";

const title = "Responsible Gambling Help & Support | B4GAMBLE";
const description =
  "Find practical gambling-control options and independently provided UK support without casino, bonus or affiliate prompts.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/responsible-gambling") },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title,
    description,
    url: absoluteUrl("/responsible-gambling"),
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
      name: "Responsible Gambling Help",
      item: absoluteUrl("/responsible-gambling"),
    },
  ],
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: title,
  description,
  url: absoluteUrl("/responsible-gambling"),
  isPartOf: {
    "@type": "WebSite",
    name: "B4GAMBLE",
    url: absoluteUrl("/"),
  },
};

export default function ResponsibleGamblingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <ProtectedHelpHub />
    </>
  );
}
