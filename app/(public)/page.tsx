import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { transformHomeHandoff, transformHomeHandoffCss } from "@/lib/final-handoff/transforms";
import { homeMetadata } from "@/lib/i18n/home-catalog";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { localizedMarketPath } from "@/lib/market/registry";
import { absoluteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const { title, description } = homeMetadata(presentation.locale);
  const canonicalPath = presentation.source === "EXPLICIT_ROUTE"
    ? localizedMarketPath(presentation.market, presentation.locale)
    : "/";
  const canonical = absoluteUrl(canonicalPath);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", siteName: "B4GAMBLE", title, description, url: canonical, locale: presentation.locale.replace("-", "_") },
    twitter: { card: "summary", title, description },
  };
}

export default async function HomePage() {
  const presentation = await resolveServerPresentationContext();
  return (
    <HandoffPage
      cssTransform={transformHomeHandoffCss}
      name="home"
      transform={(html) => transformHomeHandoff(html, presentation.locale)}
    />
  );
}
