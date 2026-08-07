import type { Metadata } from "next";
import type { ReactNode } from "react";

import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Personal Gambling Limit Tracker | SevenBet",
  description: "Track a gambling limit you choose yourself without SevenBet calculating a safe or affordable gambling amount.",
  alternates: { canonical: absoluteUrl("/tools/budget-calculator") },
};

export default function PersonalLimitTrackerLayout({ children }: { children: ReactNode }) {
  return children;
}
