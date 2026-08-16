import type { Metadata } from "next";
import { Archivo, Instrument_Serif } from "next/font/google";
import { connection } from "next/server";
import { ProductAnalytics } from "@/components/analytics/ProductAnalytics";
import { JsonLd } from "@/components/seo/JsonLd";
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
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${instrumentSerif.variable}`}>
        <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "B4GAMBLE", url: absoluteUrl("/") }} />
        {children}
        <ProductAnalytics />
      </body>
    </html>
  );
}
