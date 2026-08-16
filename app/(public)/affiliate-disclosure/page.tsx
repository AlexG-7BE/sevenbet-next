import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Affiliate Disclosure | How B4GAMBLE Is Funded", description: "How affiliate links may fund B4GAMBLE and how commercial relationships relate to editorial work.", alternates: { canonical: absoluteUrl("/affiliate-disclosure") } };
export default function AffiliateDisclosurePage() { return <HandoffPage name="affiliateDisclosure" />; }
