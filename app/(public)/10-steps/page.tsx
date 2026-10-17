import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { CONTROL_PATHS, controlHubLinkLabel } from "@/lib/i18n/static-pages/gambling-control";
import { tenStepsTranslation } from "@/lib/i18n/static-pages/ten-steps";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";
import { helpOwnerLinkLabel, helpRoutePath, helpShellCopy, withSiteName } from "@/lib/site/help-copy";
import { resolveServerSite } from "@/lib/site/server-site";
import { TenStepsPage as TenStepsPresentation } from "./TenStepsPage";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const site = await resolveServerSite();
  const messages = tenStepsTranslation(presentation.locale);
  // The title names the site in every language ("B4GAMBLEs 10-stegsprogram"), so it reads the
  // name of the site that is answering (Founder, 17 October 2026).
  return productMetadata({ presentation, pathname: "/10-steps", title: withSiteName(messages.metadataTitle, site), description: withSiteName(messages.metadataDescription, site), site });
}

export default async function TenStepsPage() {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  const messages = tenStepsTranslation(presentation.locale);
  const shell = publicShellMessages(presentation.locale);
  const canonicalPath = productCanonicalPath(presentation, "/10-steps");
  const programmePath = programmePathForPresentationLocale(presentation.locale);
  const controlLabel = controlHubLinkLabel(presentation.locale);
  const control = controlLabel ? { href: productHref(presentation, CONTROL_PATHS.hub), label: controlLabel } : undefined;
  // "About" is /about on the commercial site and the owner page on the help host (§6.5), and
  // the link's label asks what that page answers instead of naming the other brand.
  const aboutPath = helpRoutePath("/about", site);
  const help = site === "help";
  // §4.2: the hero photograph is `public/home/`, which the help-host Firewall rule denies, so
  // the help host takes the same picture hashed under `/_next/static/`.
  const art = help ? (await import("@/lib/media/help-host-photos")).helpHostPhoto("hero-plan.jpg") : undefined;
  return <>
    <JsonLd data={[{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: help ? helpShellCopy(presentation.locale).homeLabel : shell.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/"), site) }, { "@type": "ListItem", position: 2, name: withSiteName(messages.metadataTitle, site), item: absoluteUrl(canonicalPath, site) }] }, { "@context": "https://schema.org", "@type": "WebPage", name: withSiteName(messages.metadataTitle, site), description: withSiteName(messages.metadataDescription, site), url: absoluteUrl(canonicalPath, site) }]} />
    <TenStepsPresentation aboutHref={aboutPath ? productHref(presentation, aboutPath) : undefined} aboutLabel={help ? helpOwnerLinkLabel(presentation.locale) : undefined} art={art} control={control} locale={presentation.locale} programmePath={programmePath} />
  </>;
}
