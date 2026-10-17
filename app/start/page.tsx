import type { Metadata } from "next";

import { TenStepsPage } from "@/app/(public)/10-steps/TenStepsPage";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";
import { siteName } from "@/lib/site/help-copy";
import { resolveServerSite } from "@/lib/site/server-site";

import { START_LOCALE } from "./StartShell";

const titleTemplate = "Free 10-step plan to control your gambling | {site}";
const description = "Ten short, private steps to understand your gambling, set your own limits and find support. Free to use. No account needed to begin.";

// An ad landing, not a search destination: noindex, and absent from the sitemap and llms.txt.
// The social preview names no image, because the site default shows the comparison.
// RFC-057 §8: the canonical is on the host that answered, so this is generated per request
// instead of being a module constant built from the one main origin.
export async function generateMetadata(): Promise<Metadata> {
  const site = await resolveServerSite();
  const canonical = absoluteUrl("/start", site);
  const title = titleTemplate.replace("{site}", siteName(site));
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: false, follow: true },
    openGraph: { type: "website", siteName: siteName(site), title, description, url: canonical, locale: "en_GB" },
    twitter: { card: "summary", title, description },
  };
}

export default async function StartPage() {
  // §4.2: the hero photograph is `public/home/`, denied on the help host, so the help host
  // takes the same picture hashed under `/_next/static/`.
  const art = await resolveServerSite() === "help"
    ? (await import("@/lib/media/help-host-photos")).helpHostPhoto("hero-plan.jpg")
    : undefined;
  return <TenStepsPage art={art} locale={START_LOCALE} programmePath={programmePathForPresentationLocale(START_LOCALE)} />;
}
