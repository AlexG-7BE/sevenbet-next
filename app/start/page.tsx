import type { Metadata } from "next";

import { TenStepsPage } from "@/app/(public)/10-steps/TenStepsPage";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";
import { HELP_SITE_NAME } from "@/lib/site/host-gate";
import { resolveServerSite } from "@/lib/site/server-site";

import { START_LOCALE } from "./StartShell";

const title = "Free 10-step plan to control your gambling | B4GAMBLE";
const description = "Ten short, private steps to understand your gambling, set your own limits and find support. Free to use. No account needed to begin.";

// An ad landing, not a search destination: noindex, and absent from the sitemap and llms.txt.
// The social preview names no image, because the site default shows the comparison.
// RFC-057 §8: the canonical is on the host that answered, so this is generated per request
// instead of being a module constant built from the one main origin.
export async function generateMetadata(): Promise<Metadata> {
  const site = await resolveServerSite();
  const canonical = absoluteUrl("/start", site);
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: false, follow: true },
    openGraph: { type: "website", siteName: site === "help" ? HELP_SITE_NAME : "B4GAMBLE", title, description, url: canonical, locale: "en_GB" },
    twitter: { card: "summary", title, description },
  };
}

export default function StartPage() {
  return <TenStepsPage locale={START_LOCALE} programmePath={programmePathForPresentationLocale(START_LOCALE)} />;
}
