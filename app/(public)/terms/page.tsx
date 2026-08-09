import type { Metadata } from "next";

import { LegalDocument, type LegalSection } from "../_legal/LegalDocument";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use | B4GAMBLE",
  description: "Terms governing use of B4GAMBLE's decision-support, Programme, comparison, control tools and affiliate information services.",
  alternates: { canonical: absoluteUrl("/terms") },
  robots: { index: false, follow: true },
};

const operator = (
  <address>
    7BE Inc., trading as B4GAMBLE<br />
    447 Broadway, 2nd Floor, 1663<br />
    New York, NY 10013<br />
    United States
  </address>
);

const sections: readonly LegalSection[] = [
  {
    id: "about-b4gamble",
    label: "About B4GAMBLE",
    title: "About B4GAMBLE",
    content: <><p>B4GAMBLE is a decision-support, editorial, educational, comparison and affiliate information service operated by:</p>{operator}<p>Contact: <a href="mailto:info@7be.io">info@7be.io</a></p><p>These Terms govern your use of B4GAMBLE.</p></>,
  },
  {
    id: "who-may-use",
    label: "Who may use B4GAMBLE",
    title: "Who may use B4GAMBLE and acceptance",
    content: <><h3>Who may use B4GAMBLE</h3><p>Commercial gambling comparison, casino and bonus features are intended only for users aged 18 or over.</p><p>You must not use B4GAMBLE&apos;s commercial gambling features where doing so would be unlawful.</p><p>Protected Help and harm-prevention information may remain available independently of commercial eligibility.</p><h3>Acceptance</h3><p>By creating an account or continuing to use B4GAMBLE after being given access to these Terms, you agree to them.</p><p>Nothing in these Terms removes rights that applicable consumer law gives you and that cannot lawfully be excluded.</p></>,
  },
  {
    id: "not-an-operator",
    label: "Not a gambling operator",
    title: "B4GAMBLE is not a gambling operator",
    content: <><h3>What B4GAMBLE provides</h3><p>B4GAMBLE may provide:</p><ul><li>casino and operator information;</li><li>editorial reviews;</li><li>structured comparisons;</li><li>bonus and promotional information;</li><li>licensing and evidence context;</li><li>educational material;</li><li>the 10-Step Programme;</li><li>Self-Check;</li><li>personal limit/control tools;</li><li>links to third-party gambling operators;</li><li>Protected Help and safer-gambling information.</li></ul><p>The precise features available may change over time.</p><h3>B4GAMBLE is not a gambling operator</h3><p>B4GAMBLE does not operate an online casino.</p><p>B4GAMBLE does not:</p><ul><li>accept bets or wagers;</li><li>accept gambling deposits;</li><li>hold gambling balances;</li><li>determine gambling outcomes;</li><li>pay gambling winnings;</li><li>provide the gambling account through which you place a bet.</li></ul><p>Any gambling transaction takes place separately between you and the relevant operator and is subject to that operator&apos;s terms.</p></>,
  },
  {
    id: "operators-licensing",
    label: "Operators & licensing",
    title: "Operator relationships and licensing",
    content: <><h3>Operator relationships and availability</h3><p>Operators shown on B4GAMBLE are separate businesses.</p><p>B4GAMBLE does not control an operator&apos;s:</p><ul><li>account-opening decision;</li><li>identity checks;</li><li>payment processing;</li><li>deposit or withdrawal limits;</li><li>game availability;</li><li>bonus acceptance;</li><li>account suspension;</li><li>dispute resolution;</li><li>gambling outcome.</li></ul><p>An operator available today may later change its services, terms, licence or geographic availability.</p><h3>Licensing information</h3><p>B4GAMBLE&apos;s Great Britain product is designed to display commercial operators only where there is sufficient evidence of appropriate local licensing.</p><p>Where current licensing cannot be verified, B4GAMBLE should hide or mark the relevant commercial action as unavailable rather than invent or assume a licence.</p><p>The UK Gambling Commission&apos;s public register is the authoritative external source for current Great Britain operating-licence status.</p><p>A B4GAMBLE licensing label records our understanding of the evidence checked.</p><p>It does not make B4GAMBLE a licensing authority and is not a guarantee that a licence can never change after the check.</p></>,
  },
  {
    id: "editorial-affiliate",
    label: "Editorial & affiliate",
    title: "Editorial reviews, comparisons and affiliate relationships",
    content: <><h3>Editorial reviews, comparisons and methodology</h3><p>Reviews and comparisons are informational.</p><p>Where B4GAMBLE publishes a score, ranking or comparison, it follows the criteria in our published methodology.</p><p>A rating is not:</p><ul><li>a prediction that you will win;</li><li>a guarantee of safety;</li><li>a statement that gambling is suitable for you;</li><li>a replacement for current operator terms or regulator information.</li></ul><p>Material uncertainty remains visible rather than being replaced by an invented value.</p><h3>Affiliate relationships</h3><p>Future eligible governed B4GAMBLE links may be affiliate links. GB commercial and referral activity is currently disabled.</p><p>If you follow a future eligible affiliate link and complete a qualifying action, B4GAMBLE may receive a commission.</p><p>Affiliate compensation does not determine B4GAMBLE&apos;s Editor Score or natural editorial ranking. It does not alter factual licensing status, material bonus conditions, evidence-backed editorial findings, Protected Help, Self-Check results or private Programme control information.</p><p>Any future sponsored or paid placement must be identified where its commercial nature would not otherwise be obvious.</p></>,
  },
  {
    id: "bonuses-promotions",
    label: "Bonuses & promotions",
    title: "Bonus and promotional information",
    content: <><p>Bonus terms can change.</p><p>Where B4GAMBLE refers to a promotion, important conditions that materially affect a user&apos;s understanding should be presented clearly and prominently where applicable.</p><p>These may include:</p><ul><li>eligibility;</li><li>geographic restrictions;</li><li>deposit requirement;</li><li>wagering requirement;</li><li>expiry;</li><li>maximum bet or another material restriction.</li></ul><p>The operator&apos;s current full terms govern the promotion between you and the operator.</p><p>If B4GAMBLE becomes aware of a material error, we should correct it rather than rely on a disclaimer to preserve a misleading claim.</p></>,
  },
  {
    id: "programme",
    label: "10-Step Programme",
    title: "The 10-Step Programme",
    content: <><p>The Programme is an educational and behavioural-control product designed to support reflection, planning and personal boundaries.</p><p>It is not medical or psychological treatment and does not diagnose gambling disorder or another condition.</p><p>Programme progress, achievements or scores are not predictions of gambling outcomes.</p><p>No Programme reward should depend on:</p><ul><li>clicking an affiliate link;</li><li>claiming a bonus;</li><li>depositing with an operator;</li><li>taking another commercial gambling action.</li></ul></>,
  },
  {
    id: "self-check-limit-tracker",
    label: "Self-Check & limit tracker",
    title: "Self-Check and Personal Gambling Limit Tracker",
    content: <><h3>Self-Check</h3><p>Self-Check is a non-clinical reflection tool.</p><p>It is not:</p><ul><li>a medical diagnosis;</li><li>a validated clinical assessment unless explicitly identified as one;</li><li>treatment;</li><li>proof that gambling is safe;</li><li>proof that a user can afford to gamble.</li></ul><p>A result should be understood as a prompt for reflection and, where appropriate, support.</p><p>Self-Check results must not be used to recommend a casino, bonus or affiliate offer.</p><h3>Personal Gambling Limit Tracker</h3><p>B4GAMBLE&apos;s Personal Gambling Limit Tracker works from limits chosen by the user.</p><p>B4GAMBLE does not use it to determine how much gambling is safe or affordable.</p><p>The tool is not:</p><ul><li>financial advice;</li><li>an affordability assessment;</li><li>a credit assessment;</li><li>a recommendation to spend the displayed amount on gambling.</li></ul><p>Reaching or staying below a self-selected limit does not make gambling risk-free.</p></>,
  },
  {
    id: "accounts-use",
    label: "Accounts & acceptable use",
    title: "Accounts and acceptable use",
    content: <><h3>No medical, legal or financial advice</h3><p>B4GAMBLE provides general information.</p><p>Nothing on B4GAMBLE is a substitute for advice from an appropriately qualified medical, legal, debt, financial or other professional where such advice is needed.</p><p>Protected Help may direct users to independent support services.</p><h3>Accounts</h3><p>If you create an account, you must provide information reasonably necessary to create and secure it.</p><p>You are responsible for taking reasonable steps to keep login credentials secure.</p><p>You must not:</p><ul><li>access another person&apos;s account without permission;</li><li>attempt to defeat authentication or security controls;</li><li>use automated activity that materially disrupts the service;</li><li>upload malicious code;</li><li>use B4GAMBLE for unlawful activity.</li></ul><h3>Suspension and termination</h3><p>B4GAMBLE may suspend or restrict an account where reasonably necessary for:</p><ul><li>security;</li><li>suspected unauthorised access;</li><li>unlawful use;</li><li>serious abuse of the service;</li><li>protecting users or B4GAMBLE&apos;s integrity.</li></ul><p>Where practicable and appropriate, we will explain the reason.</p><p>Using Protected Help, reporting vulnerability or receiving a concerning Self-Check result must not by itself cause punitive account treatment.</p><p>You may stop using B4GAMBLE at any time and may request account deletion subject to applicable legal requirements.</p></>,
  },
  {
    id: "content-links",
    label: "Content & third parties",
    title: "Intellectual property and third-party links",
    content: <><h3>Intellectual property</h3><p>B4GAMBLE and its licensors retain rights in B4GAMBLE&apos;s original software, design, branding, editorial material and other protected content.</p><p>You may use the service for personal, lawful purposes.</p><p>You may not copy, scrape, reproduce or commercially exploit protected B4GAMBLE content beyond what applicable law allows without permission.</p><p>Nothing in this section limits statutory exceptions or rights that apply under law.</p><h3>Third-party links</h3><p>B4GAMBLE contains links to third-party websites.</p><p>Following a link means you leave B4GAMBLE.</p><p>The third party&apos;s terms, privacy notice and gambling rules then apply.</p><p>B4GAMBLE remains responsible for its own marketing communications and cannot use this clause to avoid responsibility for a misleading B4GAMBLE claim.</p></>,
  },
  {
    id: "accuracy-responsibility",
    label: "Accuracy & responsibility",
    title: "Accuracy, corrections and our responsibility to you",
    content: <><h3>Accuracy and freshness</h3><p>We take reasonable care to present information accurately.</p><p>Gambling licences, promotions, payment methods, availability and operator terms can change after review.</p><p>Where a field is not sufficiently evidenced, B4GAMBLE should show uncertainty, an unavailable state or no data rather than invent a value.</p><p>You should verify current transactional terms on the relevant operator&apos;s website before entering a gambling transaction.</p><h3>Corrections</h3><p>If you believe B4GAMBLE contains a material factual error: <a href="mailto:info@7be.io">info@7be.io</a></p><p>We may review the relevant evidence and correct or qualify information where appropriate.</p><p>A commercial relationship must not prevent a material correction.</p><h3>Our responsibility to you</h3><p>Nothing in these Terms excludes or limits liability where doing so would be unlawful, including liability that cannot be excluded for fraud, fraudulent misrepresentation, death or personal injury caused by negligence, or mandatory consumer rights.</p><p>Where B4GAMBLE fails to use reasonable care and skill or breaches these Terms, we remain responsible for foreseeable loss or damage to the extent required by applicable law.</p><p>B4GAMBLE is not responsible for a separate gambling operator&apos;s performance of its contract with you except to the extent applicable law makes B4GAMBLE responsible for B4GAMBLE&apos;s own act or omission.</p><p>If you use B4GAMBLE as a consumer, these Terms are not intended to exclude remedies available under applicable consumer law.</p></>,
  },
  {
    id: "consumer-rights-contact",
    label: "Consumer rights & contact",
    title: "Changes, consumer rights, complaints and contact",
    content: <><h3>Changes to B4GAMBLE</h3><p>We may modify, add or remove features where reasonably necessary for product, security, legal or commercial reasons.</p><p>We will not use a service change to remove statutory consumer rights.</p><p>Where a material change affects an ongoing paid consumer service, we will provide notice required by applicable law.</p><h3>Changes to these Terms</h3><p>We may update these Terms to reflect changes in B4GAMBLE, law, security or our business.</p><p>Material changes apply prospectively and we will give reasonable notice where appropriate.</p><p>Continued-use language will not be used to impose an unfair material change where applicable consumer law requires something more.</p><h3>Governing law and consumer rights</h3><p>These Terms are governed by the laws of England and Wales, subject to mandatory consumer protections that apply where you live.</p><p>If you are a consumer in another part of Great Britain, nothing in this clause removes mandatory rights or access to courts available under applicable law.</p><h3>Complaints</h3><p>For a complaint about B4GAMBLE:</p>{operator}<p><a href="mailto:info@7be.io">info@7be.io</a></p><p>A complaint about a gambling transaction, withdrawal, operator account or game should normally be addressed to the relevant gambling operator through its applicable complaint process.</p><h3>Contact</h3><p>Questions about these Terms: <a href="mailto:info@7be.io">info@7be.io</a></p></>,
  },
] as const;

export default function TermsPage() {
  return <LegalDocument kind="terms" family="924:3020" desktopNode="924:3021" mobileNode="924:3144" eyebrow="Terms of Use" desktopTitle={<>TERMS THAT SAY WHAT<br />B4GAMBLE IS — AND IS NOT.</>} mobileTitle="TERMS OF USE" lead="A plain-language operating boundary for an editorial, educational and affiliate service." effective="7 August 2026" updated="9 August 2026" sections={sections} boundary={<><p>Service boundary</p><h3>B4GAMBLE informs. It does not operate gambling.</h3><p>B4GAMBLE does not accept wagers or deposits, hold gambling balances, determine outcomes or pay winnings. A gambling transaction is always separate.</p></>} />;
}
