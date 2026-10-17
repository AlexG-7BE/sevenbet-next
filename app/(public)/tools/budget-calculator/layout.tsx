import type { Metadata } from "next";
import type { ReactNode } from "react";

import { absoluteUrl } from "@/lib/site";
import { resolveServerSite } from "@/lib/site/server-site";

// RFC-057 §8: the canonical is on the host that answered, so it is built per request.
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Personal Gambling Limit Tracker | B4GAMBLE",
    description: "Track a gambling limit you choose yourself without B4GAMBLE calculating a safe or affordable gambling amount.",
    alternates: { canonical: absoluteUrl("/tools/budget-calculator", await resolveServerSite()) },
  };
}

export default function PersonalLimitTrackerLayout({ children }: { children: ReactNode }) {
  return children;
}
