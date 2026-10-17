import type { Metadata } from "next";
import type { ReactNode } from "react";

import { absoluteUrl } from "@/lib/site";
import { siteName } from "@/lib/site/help-copy";
import { resolveServerSite } from "@/lib/site/server-site";

// RFC-057 §8: the canonical is on the host that answered, so it is built per request.
export async function generateMetadata(): Promise<Metadata> {
  const site = await resolveServerSite();
  return {
    title: `Personal Gambling Limit Tracker | ${siteName(site)}`,
    description: "Track a gambling limit you choose yourself. This site does not calculate a safe or affordable gambling amount.",
    alternates: { canonical: absoluteUrl("/tools/budget-calculator", site) },
  };
}

export default function PersonalLimitTrackerLayout({ children }: { children: ReactNode }) {
  return children;
}
