import type { Metadata } from "next";
import { Archivo, Instrument_Serif } from "next/font/google";
import { connection } from "next/server";
import { SiteMotionController } from "@/components/motion/SiteMotionController";
import { JsonLd } from "@/components/seo/JsonLd";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { absoluteUrl, siteUrl } from "@/lib/site";
import "./design-system.css";
import "./globals.css";

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
  metadataBase: new URL(siteUrl),
  title: {
    default: "B4GAMBLE | Know your limits before you play",
    template: "%s",
  },
  description: "Educational tools, private self-checks and transparent casino comparison to help adults understand risks and set personal limits before they play.",
  openGraph: {
    type: "website",
    siteName: "B4GAMBLE",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  // Child route params are not exposed to the root layout, so middleware supplies
  // a validated request-local presentation context for the server-rendered lang.
  const presentation = await resolveServerPresentationContext();
  return (
    <html lang={presentation.locale}>
      <body className={`${archivo.variable} ${instrumentSerif.variable}`}>
        <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "B4GAMBLE", url: absoluteUrl("/") }} />
        {children}
        <SiteMotionController />
      </body>
    </html>
  );
}
