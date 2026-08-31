import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { transformTenStepsHandoff } from "@/lib/final-handoff/transforms";
import { JsonLd } from "@/components/seo/JsonLd";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { tenStepsTranslation } from "@/lib/i18n/static-pages/ten-steps";
import { productMetadata, productCanonicalPath } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const messages = tenStepsTranslation(presentation.locale);
  return productMetadata({ presentation, pathname: "/10-steps", title: messages.metadataTitle, description: messages.metadataDescription });
}

export default async function TenStepsPage() {
  const presentation = await resolveServerPresentationContext();
  const messages = tenStepsTranslation(presentation.locale);
  const shell = publicShellMessages(presentation.locale);
  const canonicalPath = productCanonicalPath(presentation, "/10-steps");
  const programmePath = programmePathForPresentationLocale(presentation.locale);
  return <>
    <JsonLd data={[{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: shell.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/")) }, { "@type": "ListItem", position: 2, name: messages.metadataTitle, item: absoluteUrl(canonicalPath) }] }, { "@context": "https://schema.org", "@type": "WebPage", name: messages.metadataTitle, description: messages.metadataDescription, url: absoluteUrl(canonicalPath) }]} />
    <HandoffPage name="tenSteps" programmePath={programmePath} transform={(html) => transformTenStepsHandoff(html, presentation.locale, programmePath)} />
  </>;
}
