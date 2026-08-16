import type { Metadata } from "next";
import Link from "next/link";

import { HandoffLegalPage } from "../_legal/HandoffLegalPage";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = { title:"Terms of Use | B4GAMBLE", description:"The rules for using B4GAMBLE.", alternates:{canonical:absoluteUrl("/terms")}, robots:{index:false,follow:true} };

const operator = <address>7BE Inc., trading as B4GAMBLE<br />447 Broadway, 2nd Floor, 1663<br />New York, NY 10013<br />United States<br /><a href="mailto:info@7be.io">info@7be.io</a></address>;

const sections = [
  { id: "about-b4gamble", title:"What this service is", content:<><p>B4GAMBLE publishes independent casino reviews, bonus comparisons and a self-directed responsible-play Programme. We are not a casino, do not accept bets, and do not hold player funds.</p><p>Nothing here is financial, legal or medical advice. The Programme is an educational tool and has not been clinically evaluated.</p></> },
  { title:"Eligibility — 18+", content:<p>The service is for adults only. Gambling content is restricted or prohibited in some jurisdictions; you are responsible for knowing the rules where you live. Availability of any offer is never guaranteed.</p> },
  { title:"Your account", content:<p>You are responsible for keeping credentials safe. We may suspend accounts used to scrape, spam or abuse the service. You can delete your account and all saved data at any time — see <Link href="/privacy">Privacy</Link>.</p> },
  { title:"Accuracy & liability", content:<p>We test with real money and update reviews continuously, but casino terms change without notice. Always verify terms on the operator&apos;s site before depositing. The service is provided &quot;as is&quot;; to the extent the law allows, we are not liable for losses arising from gambling decisions.</p> },
  { title:"Content & changes", content:<p>All content is ours or licensed; personal, non-commercial use only. We may update these terms; material changes are announced on this page with a new date at the top. Continued use means acceptance.</p> },
] as const;

export default function TermsPage(){return <HandoffLegalPage kind="terms" lead="B4GAMBLE is an information and comparison service. Using it means agreeing to the rules below — written to be read, not skimmed." sections={sections} boundary={<p>B4GAMBLE may receive compensation from some outbound links. Rankings remain editorial; compensation never changes a score. Full detail: <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>.</p>} effective="7 August 2026" updated="9 August 2026" legalContact={operator} />}
