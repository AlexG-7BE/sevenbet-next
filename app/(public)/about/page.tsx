import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "About B4GAMBLE | Learn, Reflect, Compare", description: "How B4GAMBLE puts education before comparison and keeps Programme reflection separate from commercial information.", alternates: { canonical: absoluteUrl("/about") } };
export default function AboutPage() { return <HandoffPage name="about" />; }
