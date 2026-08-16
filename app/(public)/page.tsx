import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { absoluteUrl } from "@/lib/site";

const title = "B4GAMBLE | Know your limits before you play";
const description = "Educational tools, private self-checks and transparent casino comparison to help adults understand risks and set personal limits before they play.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: { type: "website", siteName: "B4GAMBLE", title, description, url: absoluteUrl("/") },
  twitter: { card: "summary", title, description },
};
export default function HomePage() { return <HandoffPage name="home" />; }
