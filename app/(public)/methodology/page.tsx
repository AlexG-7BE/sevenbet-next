import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { transformMethodologyHandoff } from "@/lib/final-handoff/transforms";
import { methodologyMessages } from "@/lib/i18n/static-pages/methodology";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { absoluteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const messages = methodologyMessages(presentation.locale);
  return productMetadata({ presentation, pathname: "/methodology", title: messages.metadataTitle, description: messages.metadataDescription });
}

export default async function MethodologyPage() {
  const presentation = await resolveServerPresentationContext();
  const messages = methodologyMessages(presentation.locale);
  const path = productCanonicalPath(presentation, "/methodology");
  return <>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: messages.metadataTitle, description: messages.metadataDescription, url: absoluteUrl(path) }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "B4GAMBLE", item: absoluteUrl(productCanonicalPath(presentation, "/")) }, { "@type": "ListItem", position: 2, name: messages.metadataTitle, item: absoluteUrl(path) }] }} />
    <HandoffPage name="methodology" transform={(html) => transformMethodologyHandoff(html, messages, (href) => productHref(presentation, href))} />
  </>;
}
