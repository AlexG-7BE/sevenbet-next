import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { CONTROL_PATHS, controlHubLinkLabel } from "@/lib/i18n/static-pages/gambling-control";
import { tenStepsTranslation } from "@/lib/i18n/static-pages/ten-steps";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";
import { helpRoutePath } from "@/lib/site/help-copy";
import { resolveServerSite } from "@/lib/site/server-site";
import { TenStepsPage as TenStepsPresentation } from "./TenStepsPage";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const site = await resolveServerSite();
  const messages = tenStepsTranslation(presentation.locale);
  return productMetadata({ presentation, pathname: "/10-steps", title: messages.metadataTitle, description: messages.metadataDescription, site });
}

export default async function TenStepsPage() {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  const messages = tenStepsTranslation(presentation.locale);
  const shell = publicShellMessages(presentation.locale);
  const canonicalPath = productCanonicalPath(presentation, "/10-steps");
  const programmePath = programmePathForPresentationLocale(presentation.locale);
  const controlLabel = controlHubLinkLabel(presentation.locale);
  const control = controlLabel ? { href: productHref(presentation, CONTROL_PATHS.hub), label: controlLabel } : undefined;
  // "About" is /about on the commercial site and the owner page on the help host (§6.5).
  const aboutPath = helpRoutePath("/about", site);
  return <>
    <JsonLd data={[{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: shell.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/"), site) }, { "@type": "ListItem", position: 2, name: messages.metadataTitle, item: absoluteUrl(canonicalPath, site) }] }, { "@context": "https://schema.org", "@type": "WebPage", name: messages.metadataTitle, description: messages.metadataDescription, url: absoluteUrl(canonicalPath, site) }]} />
    <TenStepsPresentation aboutHref={aboutPath ? productHref(presentation, aboutPath) : undefined} control={control} locale={presentation.locale} programmePath={programmePath} />
  </>;
}
