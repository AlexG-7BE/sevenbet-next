import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { transformBonusGuideHandoff, type LearnOfferBridgeCopy } from "@/lib/final-handoff/transforms";
import { learnBridgeMessages } from "@/lib/i18n/learn-bridges-catalog";
import { learningMessages } from "@/lib/i18n/learning-center";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { offersMayBePresented } from "@/lib/public-offer/offer-visibility";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Casino Bonus Terms Guide | B4GAMBLE", description: "Understand wagering turnover, game weighting and material bonus terms through explicitly fictional examples and current GB regulatory context.", alternates: { canonical: absoluteUrl("/bonus-guide") } };
// The guide is written in English, so its bridge to current offers is too.
function offerBridge(): LearnOfferBridgeCopy {
  const learning = learningMessages("en-GB");
  const shell = publicShellMessages("en-GB");
  return { title: learning.ui.applyChecklist, body: learnBridgeMessages("en-GB").offerBridgeBody, bonusesLabel: shell.bonuses, bestOffersLabel: shell.bestOffers, disclosure: learning.ui.commercialDisclosure, bonusesHref: "/bonuses", bestOffersHref: "/best-offers" };
}

export default async function BonusGuidePage() {
  const presentation = await resolveServerPresentationContext();
  const bridge = offersMayBePresented(presentation.marketCountryCode) ? offerBridge() : null;
  return <>
  <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Learn", item: absoluteUrl("/learn") }, { "@type": "ListItem", position: 2, name: "Bonus Guide", item: absoluteUrl("/bonus-guide") }] }} />
  <HandoffPage name="article" transform={(html) => transformBonusGuideHandoff(html, { offerBridge: bridge })} />
</>;
}
