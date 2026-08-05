import type { Metadata } from "next";
import { Archivo, Instrument_Serif } from "next/font/google";

import { ActiveControlProgramme } from "@/components/programme/ActiveControlProgramme";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-seven-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: "400",
  variable: "--font-seven-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SevenBet 10-Step Control Program | Personal Control Plan",
  description:
    "Build a private Moment Map, a practical seven-day goal and an editable early-signal card through SevenBet's evidence-informed Control Program.",
  alternates: {
    canonical: absoluteUrl("/program"),
  },
};

function breadcrumbSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "10-Step Control Program",
        item: absoluteUrl("/program"),
      },
    ],
  };
}

export default function ProgramPage() {
  return (
    <main id="main-content">
      <div className={`${archivo.variable} ${instrumentSerif.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              breadcrumbSchema(),
            ),
          }}
        />
        <ActiveControlProgramme />
      </div>
    </main>
  );
}
