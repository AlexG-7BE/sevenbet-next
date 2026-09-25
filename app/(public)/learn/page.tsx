import type { Metadata } from "next";

import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { transformLearnHandoff } from "@/lib/final-handoff/transforms";
import { learningMessages } from "@/lib/i18n/learning-center";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";
import { languageRouteByLocale } from "@/lib/market/registry";
import { articleService } from "@/lib/services";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const { ui } = learningMessages(presentation.locale);
  return productMetadata({ presentation, pathname: "/learn", title: ui.metadataTitle, description: ui.metadataDescription });
}

export default async function LearnPage() {
  const presentation = await resolveServerPresentationContext();
  const messages = learningMessages(presentation.locale);
  const articleLocale = languageRouteByLocale(presentation.locale).defaultLocale;
  const articles = await articleService.listPublished(articleLocale, { take: 100 }).catch(() => []);
  const canonical = productCanonicalPath(presentation, "/learn");
  const programmePath = programmePathForPresentationLocale(presentation.locale);
  return <>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "B4GAMBLE", url: absoluteUrl(productCanonicalPath(presentation, "/")) }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: messages.ui.metadataTitle, description: messages.ui.metadataDescription, url: absoluteUrl(canonical) }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: messages.ui.home, item: absoluteUrl(productCanonicalPath(presentation, "/")) }, { "@type": "ListItem", position: 2, name: messages.ui.learn, item: absoluteUrl(canonical) }] }} />
    <HandoffPage headerAutoHide name="learn" programmePath={programmePath} transform={(html) => transformLearnHandoff(html, presentation.locale, (href) => productHref(presentation, href), articles, programmePath)} />
  </>;
}
