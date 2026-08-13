import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { ProductAnalytics } from "@/components/analytics/ProductAnalytics";
import { absoluteUrl, siteUrl } from "@/lib/site";
import "./design-system.css";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-seven-sans",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={archivo.variable}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "B4GAMBLE", url: absoluteUrl("/") }) }}
        />
        {children}
        <ProductAnalytics />
      </body>
    </html>
  );
}
