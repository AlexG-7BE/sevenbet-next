import type { Metadata } from "next";
import { Archivo, Instrument_Serif } from "next/font/google";

import { TiltHome } from "@/components/home/TiltHome";
import { absoluteUrl } from "@/lib/site";

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
  title: "SevenBet | Start with more control",
  description:
    "Ten practical missions for recognising patterns, building personal rules and making gambling decisions with more control.",
  alternates: { canonical: absoluteUrl("/") },
};

export default function HomePage() {
  return (
    <div className={`${archivo.variable} ${instrumentSerif.variable}`}>
      <TiltHome />
    </div>
  );
}
