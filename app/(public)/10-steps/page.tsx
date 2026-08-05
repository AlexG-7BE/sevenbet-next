import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";

import { TenStepsLanding } from "./TenStepsLanding";
import { getServerSession } from "@/lib/auth/session";
import { programmeDashboardService } from "@/lib/programme/application/programme-dashboard.service";
import { absoluteUrl } from "@/lib/site";
import { resolveTenStepsLandingState } from "@/lib/ten-steps-landing";

export const dynamic = "force-dynamic";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: "400",
  variable: "--font-seven-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "10 Steps Before You Choose | SevenBet",
  description:
    "Build a clearer way to compare casino options, understand offers and set your own rules before you choose.",
  alternates: { canonical: absoluteUrl("/10-steps") },
};

export default async function TenStepsPage() {
  const state = await resolveTenStepsLandingState({
    getSession: getServerSession,
    getDashboard: (userId) => programmeDashboardService.getDashboard(userId),
  });

  return (
    <div className={instrumentSerif.variable}>
      <TenStepsLanding state={state} />
    </div>
  );
}
