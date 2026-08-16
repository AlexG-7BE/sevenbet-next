import type { Metadata } from "next";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy | B4GAMBLE", description: "How B4GAMBLE handles your data.", alternates: { canonical: absoluteUrl("/privacy") }, robots: { index: false, follow: true } };

const googleIdentityNotice = `<p style="color: rgb(38, 37, 37); margin: 16px 0px 0px;">If you choose Google sign-in, Google provides account identity only and does not provide B4GAMBLE with your date of birth, contacts, mailbox contents or a gambling profile. Google credentials are used transiently by the server to verify the sign-in and are stripped before the application account relationship is stored. Google sign-in, age confirmation, Terms acceptance and Programme participation do not create reminder or marketing permission.</p>`;
const controller = `<address style="font-style:normal;line-height:1.55">7BE Inc., trading as B4GAMBLE<br>447 Broadway, 2nd Floor, 1663<br>New York, NY 10013<br>United States<br><a href="mailto:privacy@7be.io" style="color:rgb(16,15,15)">privacy@7be.io</a></address>`;

function applyCurrentPrivacyContract(html: string) {
  return html
    .replace("Legal · Updated 12 Aug 2026", "Legal · Updated 13 August 2026")
    .replace("They stay in this browser session unless you explicitly save a rule or output to your dashboard.</p>", `They stay in this browser session unless you explicitly save a rule or output to your dashboard.</p>${googleIdentityNotice}`)
    .replace('<a href="/terms" style=', `${controller}<a href="/terms" style=`);
}

export default function PrivacyPage() { return <HandoffPage kind="privacy" name="privacy" transform={applyCurrentPrivacyContract} updated="13 August 2026" />; }
