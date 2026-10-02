import type { Metadata } from "next";

import { TenStepsPage } from "@/app/(public)/10-steps/TenStepsPage";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";

import { START_LOCALE } from "./StartShell";

const title = "Free 10-step plan to control your gambling | B4GAMBLE";
const description = "Ten short, private steps to understand your gambling, set your own limits and find support. Free to use. No account needed to begin.";
const canonical = absoluteUrl("/start");

// An ad landing, not a search destination: noindex, and absent from the sitemap and llms.txt.
// The social preview names no image, because the site default shows the comparison.
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  robots: { index: false, follow: true },
  openGraph: { type: "website", siteName: "B4GAMBLE", title, description, url: canonical, locale: "en_GB" },
  twitter: { card: "summary", title, description },
};

export default function StartPage() {
  return <TenStepsPage locale={START_LOCALE} programmePath={programmePathForPresentationLocale(START_LOCALE)} />;
}
