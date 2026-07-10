import type { Metadata } from "next";
import { Footer, Header } from "@/components/SiteChrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "SevenBet | Control-first casino bonuses",
  description: "Mindful gambling program, safer casino comparison and welcome bonus catalog.",
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
