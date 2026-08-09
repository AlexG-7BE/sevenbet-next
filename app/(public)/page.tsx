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
  title: "B4GAMBLE | Know your limits before you play",
  description:
    "Educational tools, private self-checks and transparent casino comparison to help adults understand risks and set personal limits before they play.",
  alternates: { canonical: absoluteUrl("/") },
};

export default function HomePage() {
  return (
    <div className={`${archivo.variable} ${instrumentSerif.variable}`}>
      <TiltHome />
    </div>
  );
}
