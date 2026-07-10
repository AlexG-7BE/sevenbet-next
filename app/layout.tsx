import type { Metadata } from "next";
import { Footer, Header } from "@/components/SiteChrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "SevenBet | 10-Step Control Program",
  description: "Responsible gambling program with self-assessment, educational resources and transparent casino comparison.",
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
