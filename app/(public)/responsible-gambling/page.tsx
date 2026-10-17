import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { FirstWaveSafetyPage } from "@/components/market-safety/FirstWaveSafetyPage";
import { transformResponsibleGamblingHandoff } from "@/lib/final-handoff/transforms";
import { firstWaveSafetyProfile } from "@/lib/market/first-wave-evidence";
import { firstWaveSafetyLanguageAlternates, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { siteName } from "@/lib/site/help-copy";
import { resolveServerSite } from "@/lib/site/server-site";

const titleTemplate = "Responsible Gambling | {site}";
const description = "Practical control information and protected support routes.";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const site = await resolveServerSite();
  const profile = firstWaveSafetyProfile(presentation);
  return productMetadata({
    presentation,
    pathname: "/responsible-gambling",
    // The title names the site that is answering (Founder, 17 October 2026).
    title: profile ? `${profile.copy.responsibleTitle} | ${siteName(site)}` : titleTemplate.replace("{site}", siteName(site)),
    description: profile?.copy.responsibleLead ?? description,
    robots: { index: true, follow: true },
    languageAlternates: firstWaveSafetyLanguageAlternates("/responsible-gambling", site),
    site,
  });
}

export default async function ResponsibleGamblingPage() {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  const profile = firstWaveSafetyProfile(presentation);
  return profile
    ? <FirstWaveSafetyPage presentation={presentation} profile={profile} variant="responsible" />
    : <HandoffPage name="responsibleGambling" site={site} transform={transformResponsibleGamblingHandoff} />;
}
