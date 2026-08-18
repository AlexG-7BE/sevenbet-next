import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Use | B4GAMBLE", description: "Terms for using B4GAMBLE.", alternates: { canonical: absoluteUrl("/terms") }, robots: { index: false, follow: true } };

const sectionIdentity = { id: "about-b4gamble" } as const;
const operator = `<address style="font-style:normal;line-height:1.55">7BE Inc., trading as B4GAMBLE<br>447 Broadway, 2nd Floor, 1663<br>New York, NY 10013<br>United States<br><a href="mailto:info@7be.io" style="color:rgb(16,15,15)">info@7be.io</a></address>`;

function applyCurrentTermsContract(html: string) {
  return html
    .replace("Legal · Updated 12 Aug 2026", "Legal · Updated 9 August 2026")
    .replace('<div style="margin-bottom: 56px;">', `<div id="${sectionIdentity.id}" style="margin-bottom: 56px;">`)
    .replace('<a href="/privacy" style=', `<span>Effective 7 August 2026</span>${operator}<a href="/privacy" style=`);
}

export default function TermsPage() { return <HandoffPage effective="7 August 2026" updated="9 August 2026" kind="terms" name="terms" transform={applyCurrentTermsContract} />; }
