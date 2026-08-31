import type { Metadata } from "next";

import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { FirstWaveSafetyPage } from "@/components/market-safety/FirstWaveSafetyPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";
import { transformHelpHandoff } from "@/lib/final-handoff/transforms";
import { firstWaveMarketEvidence } from "@/lib/market/first-wave-evidence";
import { firstWaveSafetyLanguageAlternates, productCanonicalPath, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";

const title = "Gambling Help & Support | B4GAMBLE";
const description = "Find practical pause, self-exclusion and access-control options without casino, bonus or affiliate prompts.";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const profile = firstWaveMarketEvidence(presentation.market.countryCode);
  return productMetadata({
    presentation,
    pathname: "/help",
    title: profile ? `${profile.copy.helpTitle} | B4GAMBLE` : title,
    description: profile?.copy.helpLead ?? description,
    robots: { index: true, follow: true },
    languageAlternates: firstWaveSafetyLanguageAlternates("/help"),
  });
}

export default async function HelpPage() {
  const presentation = await resolveServerPresentationContext();
  const profile = firstWaveMarketEvidence(presentation.market.countryCode);
  const pageTitle = profile?.copy.helpTitle ?? title;
  const pageDescription = profile?.copy.helpLead ?? description;
  const pageUrl = absoluteUrl(productCanonicalPath(presentation, "/help"));
  return <>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "B4GAMBLE", item: absoluteUrl(productCanonicalPath(presentation, "/")) }, { "@type": "ListItem", position: 2, name: pageTitle, item: pageUrl }] }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: pageTitle, description: pageDescription, url: pageUrl }} />
    {profile
      ? <FirstWaveSafetyPage presentation={presentation} profile={profile} variant="help" />
      : <HandoffPage name="help" transform={transformHelpHandoff} />}
  </>;
}
