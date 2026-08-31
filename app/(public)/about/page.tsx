import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { aboutMessages } from "@/lib/i18n/static-pages/about";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { productCanonicalPath, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { absoluteUrl } from "@/lib/site";
import { AboutDocument } from "./AboutDocument";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const messages = aboutMessages(presentation.locale);
  return productMetadata({ presentation, pathname: "/about", title: messages.metadataTitle, description: messages.metadataDescription });
}

export default async function AboutPage() {
  const presentation = await resolveServerPresentationContext();
  const messages = aboutMessages(presentation.locale);
  const shell = publicShellMessages(presentation.locale);
  const canonicalPath = productCanonicalPath(presentation, "/about");
  return <>
    <JsonLd data={[{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: shell.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/")) }, { "@type": "ListItem", position: 2, name: messages.eyebrow, item: absoluteUrl(canonicalPath) }] }, { "@context": "https://schema.org", "@type": "WebPage", name: messages.metadataTitle, description: messages.metadataDescription, url: absoluteUrl(canonicalPath) }]} />
    <AboutDocument messages={messages} />
  </>;
}
