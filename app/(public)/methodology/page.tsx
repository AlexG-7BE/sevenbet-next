import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Review Methodology | B4GAMBLE", description: "How B4GAMBLE researches, tests and scores casinos.", alternates: { canonical: absoluteUrl("/methodology") } };
export default function MethodologyPage() { return <HandoffPage name="methodology" />; }
