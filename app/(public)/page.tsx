import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { PublicRouteLoadingFrame } from "@/components/public-shell/PublicRouteLoadingFrame";
import { transformHomeHandoff, transformHomeHandoffCss } from "@/lib/final-handoff/transforms";
import { homeMetadata } from "@/lib/i18n/home-catalog";
import { productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { shouldStreamRouteFrame } from "@/lib/seo/route-frame";
import { HELP_SHARE_IMAGE_PATH, helpShellCopy } from "@/lib/site/help-copy";
import { HELP_SITE_NAME, helpSiteSwitchesFromProcessEnv } from "@/lib/site/host-gate";
import { resolveServerSite } from "@/lib/site/server-site";
import { PausePlanView } from "./pause-plan/page";

export async function generateMetadata(): Promise<Metadata> {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  if (site === "help") {
    // The help home is the pause plan (Founder, Q5 (b)), and it is the help site's front
    // door, so it carries the site's own title and description rather than the plan's.
    const help = helpShellCopy(presentation.locale);
    const indexable = helpSiteSwitchesFromProcessEnv().redirects;
    return {
      title: help.metadataTitle,
      description: help.metadataDescription,
      robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
      openGraph: { type: "website", siteName: HELP_SITE_NAME, title: help.metadataTitle, description: help.metadataDescription, images: [{ url: HELP_SHARE_IMAGE_PATH, width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image", images: [HELP_SHARE_IMAGE_PATH] },
    };
  }
  const { title, description } = homeMetadata(presentation.locale);
  return productMetadata({ presentation, pathname: "/", title, description, robots: { index: true, follow: true }, site });
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

/**
 * People get the instant frame while the home page loads; crawlers, agents and HTTP clients
 * get the complete page in the first response (audit 27 Sep 2026: GPTBot, ClaudeBot and
 * Googlebot read 176 words of navigation with the content hidden after the footer).
 */
export default async function HomePage() {
  // RFC-057 §4.1: `/` is SHARED, and on the help host it is the pause plan. The handoff home
  // is never rendered there — its capture carries /best-offers, /casinos and /bonuses in the
  // raw HTML, which is exactly what the one-way link rule forbids (§6, rule 1).
  if (await resolveServerSite() === "help") return <PausePlanView pathname="/" site="help" />;
  if (!shouldStreamRouteFrame(await headers())) return <HomeContent />;
  return <Suspense fallback={<PublicRouteLoadingFrame destination="home" label="B4GAMBLE" />}><HomeContent /></Suspense>;
}
