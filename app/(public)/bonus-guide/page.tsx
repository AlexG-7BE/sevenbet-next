import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Casino Bonus Guide | B4GAMBLE", description: "Read casino bonus terms before treating a headline offer as value.", alternates: { canonical: absoluteUrl("/bonus-guide") } };
export default function BonusGuidePage() { return <HandoffPage name="article" />; }
