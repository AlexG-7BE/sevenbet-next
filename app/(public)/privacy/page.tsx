import type { Metadata } from "next";
import Link from "next/link";

import { HandoffLegalPage } from "../_legal/HandoffLegalPage";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = { title:"Privacy Policy | B4GAMBLE", description:"How B4GAMBLE handles your data.", alternates:{canonical:absoluteUrl("/privacy")}, robots:{index:false,follow:true} };

const controller = <address>7BE Inc., trading as B4GAMBLE<br />447 Broadway, 2nd Floor, 1663<br />New York, NY 10013<br />United States<br /><a href="mailto:privacy@7be.io">privacy@7be.io</a></address>;

const sections = [
  { title:"What we collect", content:<><p>Account data (email, password hash) if you create an account. Neutral Programme progress — which missions are complete — if you choose to save it. Basic analytics: pages visited, approximate region, device type.</p><p>We do not collect your narrative answers inside Missions. They stay in this browser session unless you explicitly save a rule or output to your dashboard.</p><p>If you choose Google sign-in, Google provides account identity only and does not provide B4GAMBLE with your date of birth, contacts, mailbox contents or a gambling profile. Google credentials are used transiently by the server to verify the sign-in and are stripped before the application account relationship is stored. Google sign-in, age confirmation, Terms acceptance and Programme participation do not create reminder or marketing permission.</p></> },
  { title:"What we never do", content:<p>We do not sell personal data. We do not share Programme activity with casinos, advertisers or affiliate partners. Help pages carry no tracking beyond an anonymous page-view count.</p> },
  { title:"Cookies", content:<p>Strictly necessary cookies keep you logged in. Optional analytics cookies are off until you accept them. Affiliate links carry their own tracking parameters set by the operator — that is disclosed next to every outbound offer.</p> },
  { title:"Your rights", content:<p>Export or delete your account and all saved Programme data at any time, in one action, from your dashboard. Deletion is immediate and irreversible. For anything else, <Link href="/contact">contact us</Link>.</p> },
  { title:"Retention & security", content:<p>Account data is kept while the account exists; analytics are aggregated after 14 months. Data is encrypted in transit and at rest. If a breach ever affects you, we notify you directly and without delay.</p> },
] as const;

export default function PrivacyPage(){return <HandoffLegalPage kind="privacy" lead="The short version: your Programme narrative stays in your browser, we collect the minimum needed to run the service, and we never sell personal data." sections={sections} boundary={<p>The separation is structural: commercial pages (offers, rankings) and support pages (Help, Programme) run on separate analytics with no shared identifier.</p>} effective="9 August 2026" updated="13 August 2026" legalContact={controller} />}
