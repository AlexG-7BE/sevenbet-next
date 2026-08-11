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
  title: "10-Step Programme | Start Mission 01 | B4GAMBLE",
  description:
    "Start Mission 01 privately, build a personal Starting Point and choose whether to save your result in B4GAMBLE's 10-Step Programme.",
  alternates: { canonical: absoluteUrl("/10-steps") },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "10-Step Programme | Start Mission 01 | B4GAMBLE",
    description: "Start Mission 01 privately and build a personal Starting Point before choosing whether to create an account.",
    url: absoluteUrl("/10-steps"),
  },
  twitter: {
    card: "summary",
    title: "10-Step Programme | Start Mission 01 | B4GAMBLE",
    description: "Start Mission 01 privately and choose whether to save your Starting Point after completion.",
  },
};

function structuredData() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "10-Step Programme", item: absoluteUrl("/10-steps") },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "B4GAMBLE 10-Step Programme",
      description: metadata.description,
      url: absoluteUrl("/10-steps"),
    },
  ];
}

export default async function TenStepsPage() {
  const state = await resolveTenStepsLandingState({
    getSession: getServerSession,
    getDashboard: (userId) => programmeDashboardService.getDashboard(userId),
  });

  return (
    <div className={instrumentSerif.variable}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
      />
      <TenStepsLanding state={state} />
    </div>
  );
}
