import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { transformHomeHandoff, transformHomeHandoffCss } from "@/lib/final-handoff/transforms";
import { homeMetadata } from "@/lib/i18n/home-catalog";
import { productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const { title, description } = homeMetadata(presentation.locale);
  return productMetadata({ presentation, pathname: "/", title, description, robots: { index: true, follow: true } });
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
