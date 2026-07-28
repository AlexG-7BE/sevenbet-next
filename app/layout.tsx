import type { Metadata } from "next";
import { Footer, Header } from "@/components/SiteChrome";
import { absoluteUrl, siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SevenBet | 10-Step Control Program",
    template: "%s",
  },
  description: "Responsible gambling program with self-assessment, educational resources and transparent casino comparison.",
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    type: "website",
    siteName: "SevenBet",
    title: "SevenBet | 10-Step Control Program",
    description: "Responsible gambling program with self-assessment, educational resources and transparent casino comparison.",
    url: absoluteUrl("/"),
  },
  twitter: { card: "summary", title: "SevenBet | 10-Step Control Program" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skipLink" href="#main-content">Skip to main content</a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "SevenBet", url: absoluteUrl("/") }) }}
        />
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
