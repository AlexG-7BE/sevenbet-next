import type { Metadata } from "next";

import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { FirstWaveSafetyPage } from "@/components/market-safety/FirstWaveSafetyPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";
import { transformHelpHandoff } from "@/lib/final-handoff/transforms";
import { firstWaveSafetyProfile } from "@/lib/market/first-wave-evidence";
import { firstWaveSafetyLanguageAlternates, productCanonicalPath, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { resolveServerSite } from "@/lib/site/server-site";
import { siteName } from "@/lib/site/help-copy";

const titleTemplate = "Gambling Help & Support | {site}";
const description = "Find practical pause, self-exclusion and access-control options without casino, bonus or affiliate prompts.";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const site = await resolveServerSite();
  const profile = firstWaveSafetyProfile(presentation);
  return productMetadata({
    presentation,
    pathname: "/help",
    title: profile ? `${profile.copy.helpTitle} | ${siteName(site)}` : titleTemplate.replace("{site}", siteName(site)),
    description: profile?.copy.helpLead ?? description,
    robots: { index: true, follow: true },
    languageAlternates: firstWaveSafetyLanguageAlternates("/help", site),
    site,
  });
}

export default async function HelpPage() {
  const presentation = await resolveServerPresentationContext();
  const site = await resolveServerSite();
  const profile = firstWaveSafetyProfile(presentation);
  const pageTitle = profile?.copy.helpTitle ?? titleTemplate.replace("{site}", siteName(site));
  const pageDescription = profile?.copy.helpLead ?? description;
  const pageUrl = absoluteUrl(productCanonicalPath(presentation, "/help"), site);
  return <>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: siteName(site), item: absoluteUrl(productCanonicalPath(presentation, "/"), site) }, { "@type": "ListItem", position: 2, name: pageTitle, item: pageUrl }] }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: pageTitle, description: pageDescription, url: pageUrl }} />
    {profile
      ? <FirstWaveSafetyPage presentation={presentation} profile={profile} variant="help" />
      : <HandoffPage name="help" site={site} transform={transformHelpHandoff} />}
  </>;
}
