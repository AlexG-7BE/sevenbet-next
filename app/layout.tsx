import type { Metadata } from "next";
import { Footer, Header } from "@/components/SiteChrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "SevenBet | Verified casino bonus comparison",
  description: "Premium casino bonus comparison with ratings, wagering terms, payout signals and responsible gambling context.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
