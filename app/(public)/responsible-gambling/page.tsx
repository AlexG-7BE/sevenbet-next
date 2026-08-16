import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { transformResponsibleGamblingHandoff } from "@/lib/final-handoff/transforms";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Responsible Gambling | B4GAMBLE", description: "Practical control information and protected support routes.", alternates: { canonical: absoluteUrl("/responsible-gambling") } };
export default function ResponsibleGamblingPage() { return <HandoffPage name="responsibleGambling" transform={transformResponsibleGamblingHandoff} />; }
