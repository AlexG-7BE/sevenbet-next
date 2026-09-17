import type { Metadata } from "next";
import { Suspense } from "react";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { PublicRouteLoadingFrame } from "@/components/public-shell/PublicRouteLoadingFrame";
import { transformHomeHandoff, transformHomeHandoffCss } from "@/lib/final-handoff/transforms";
import { homeMetadata } from "@/lib/i18n/home-catalog";
import { productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const { title, description } = homeMetadata(presentation.locale);
  return productMetadata({ presentation, pathname: "/", title, description, robots: { index: true, follow: true } });
}

async function HomeContent() {
  const presentation = await resolveServerPresentationContext();
  const programmePath = programmePathForPresentationLocale(presentation.locale);
  return (
    <HandoffPage
      cssTransform={transformHomeHandoffCss}
      name="home"
      programmePath={programmePath}
      transform={(html) => transformHomeHandoff(html, presentation.locale)}
    />
  );
}

export default function HomePage() {
  return <Suspense fallback={<PublicRouteLoadingFrame destination="home" label="B4GAMBLE" />}><HomeContent /></Suspense>;
}
