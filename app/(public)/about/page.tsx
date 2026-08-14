import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { AboutDocument } from "./AboutDocument";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About B4GAMBLE | Learn, Reflect, Compare",
  description:
    "How B4GAMBLE puts education before comparison, keeps Programme reflection separate from commercial information, and defines its product boundaries.",
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
        name: "About B4GAMBLE",
        item: absoluteUrl("/about"),
      },
    ],
  };
}

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema()} />
      <AboutDocument />
    </>
  );
}
