import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { FirstWaveSafetyPage } from "@/components/market-safety/FirstWaveSafetyPage";
import { transformResponsibleGamblingHandoff } from "@/lib/final-handoff/transforms";
import { firstWaveMarketEvidence } from "@/lib/market/first-wave-evidence";
import { firstWaveSafetyLanguageAlternates, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";

const title = "Responsible Gambling | B4GAMBLE";
const description = "Practical control information and protected support routes.";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const profile = firstWaveMarketEvidence(presentation.market.countryCode);
  return productMetadata({
    presentation,
    pathname: "/responsible-gambling",
    title: profile ? `${profile.copy.responsibleTitle} | B4GAMBLE` : title,
    description: profile?.copy.responsibleLead ?? description,
    robots: { index: true, follow: true },
    languageAlternates: firstWaveSafetyLanguageAlternates("/responsible-gambling"),
  });
}

export default async function ResponsibleGamblingPage() {
  const presentation = await resolveServerPresentationContext();
  const profile = firstWaveMarketEvidence(presentation.market.countryCode);
  return profile
    ? <FirstWaveSafetyPage presentation={presentation} profile={profile} variant="responsible" />
    : <HandoffPage name="responsibleGambling" transform={transformResponsibleGamblingHandoff} />;
}
