import type { Metadata } from "next";
import Link from "next/link";

import { HandoffLegalPage } from "@/app/(public)/_legal/HandoffLegalPage";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use | B4GAMBLE",
  description: "Terms for using the B4GAMBLE information, comparison and educational service.",
  alternates: { canonical: absoluteUrl("/terms") },
  robots: { index: false, follow: true },
};

const operator = <address>
  7BE Inc., trading as B4GAMBLE<br />
  447 Broadway, 2nd Floor, 1663<br />
  New York, NY 10013<br />
  United States<br />
  <a href="mailto:info@7be.io">info@7be.io</a>
</address>;

const sections = [
  { id: "about-b4gamble", title: "Who we are and these Terms", content: <><p>These Terms govern your use of B4GAMBLE, a service operated by 7BE Inc. By using the service, you agree to them. If you do not agree, do not use the service.</p>{operator}</> },
  { id: "service", title: "What B4GAMBLE is", content: <><p>B4GAMBLE provides gambling-related information, comparison tools, editorial assessments, educational content and a self-directed 10-Step Programme. We are not a gambling operator, do not accept bets, hold gambling funds, open operator accounts or control operator decisions.</p><p>Editorial scores and comparisons are aids, not promises of safety, suitability, winnings, service quality or future conduct.</p></> },
  { id: "eligibility", title: "Age and availability", content: <><p>You must be 18 or over to create an account, use the Programme or access commercial gambling features. Protected Help and harm-prevention information remain available without that gate. We rely on your confirmation and do not perform identity, date-of-birth or KYC verification.</p><p>The service is designed for Great Britain. A feature, operator or offer may be unavailable or unlawful elsewhere. You are responsible for complying with the law that applies to you.</p></> },
  { id: "programme", title: "Programme, AI and health boundary", content: <><p>The Programme is educational and self-directed. It is not medical care, diagnosis, treatment, therapy, crisis support, financial advice or a guarantee of control or safer outcomes. It has not been clinically evaluated as a complete programme.</p><p>If you choose personalisation, AI may suggest a Starting Point from your typed or transcribed input. AI can be inaccurate. Review and edit the suggestion before saving; you remain responsible for decisions and actions. For urgent help, use <Link href="/help">protected Help</Link> or emergency services as appropriate.</p></> },
  { id: "accounts", title: "Accounts and security", content: <><p>Provide accurate information, keep credentials secure and tell us promptly if you suspect unauthorised use. One person must not use another person&apos;s account. Google sign-in provides identity only; it does not verify age.</p><p>We may restrict or suspend access to protect users, enforce these Terms, investigate abuse or comply with law. You may request account deletion as described in the <Link href="/privacy">Privacy Notice</Link>; retention required for legal, security or backup purposes may continue.</p></> },
  { id: "acceptable-use", title: "Acceptable use", content: <><p>You must not misuse the service, break the law, interfere with security, scrape or overload systems, bypass access controls, introduce harmful code, impersonate others, infringe rights, or use outputs to harm another person. Do not upload content you have no right to use.</p><p>You retain rights in content you submit. You give us the limited permission needed to process it to provide, secure and support the feature you requested, subject to the Privacy Notice.</p></> },
  { id: "operators", title: "Operators, offers and bonus terms", content: <><p>Operator eligibility, licences, availability, prices, bonus terms and material restrictions can change. B4GAMBLE may show dated or incomplete information and will not infer a fact that is unavailable. Check the operator&apos;s current licence, eligibility rules and full terms before acting.</p><p>A bonus headline is not the full offer. Age, location, new-customer status, deposit, wagering, game weighting, maximum stake, minimum odds, time limits, exclusions and withdrawal rules may apply. Do not treat gambling or a bonus as income, an investment or a way to recover losses.</p></> },
  { id: "affiliate", title: "Commercial relationships", content: <><p>Clearly labelled affiliate links may generate commission if you visit an eligible operator and complete a qualifying action. Commercial availability may determine whether an outbound button exists. Affiliate compensation does not determine Editor Score or natural editorial ranking. Any sponsored placement must be separately and prominently labelled.</p><p>Programme, Help, pause, self-check and vulnerability information is not used to select, rank or personalise commercial content. Read the <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>.</p></> },
  { id: "third-parties", title: "External services", content: <><p>When you leave B4GAMBLE, the third party&apos;s terms, privacy practices, eligibility checks and decisions apply. We do not control deposits, withdrawals, account closure, self-exclusion, promotions, games or complaints at an operator. A link is not an endorsement or safety guarantee.</p></> },
  { id: "accuracy", title: "Accuracy and availability", content: <><p>We aim to describe source status, dates and material limitations clearly, but do not promise that content is complete, error-free or continuously available. Reviews may rely on public sources, operator materials or dated evidence rather than direct testing. You should verify time-sensitive facts with the primary source.</p><p>We may correct, change, suspend or withdraw content and features. Demonstration data is fictional and cannot be treated as a current operator, offer, partner or commercial route.</p></> },
  { id: "intellectual-property", title: "Intellectual property", content: <><p>The service, branding, software and editorial content are owned by or licensed to 7BE Inc. You may use the public service for personal, non-commercial purposes. You may not reproduce, sell, republish or create a competing dataset from protected content except where law permits or we agree in writing.</p></> },
  { id: "liability", title: "Disclaimers and liability", content: <><p>Nothing in these Terms excludes or limits liability that cannot lawfully be excluded, including liability for fraud, fraudulent misrepresentation, or death or personal injury caused by negligence. Your statutory consumer rights are not affected.</p><p>Subject to that, the service is provided on an “as available” basis. To the fullest extent permitted by law, 7BE Inc. is not responsible for gambling losses, operator acts or omissions, changes in third-party terms, or indirect or consequential loss arising from reliance on the service. We do not limit liability where doing so would be unfair or unlawful.</p></> },
  { id: "changes-law", title: "Changes, termination and law", content: <><p>We may update these Terms for legal, security or service changes. The updated date will appear above, and we will provide additional notice where required. Changes do not remove rights already accrued.</p><p>We may end the service or your access on reasonable notice where practical, or immediately for security, illegality or serious breach. Provisions intended to survive will continue.</p><p>These Terms are governed by the laws of the State of New York, without depriving UK consumers of mandatory protections or the right to bring proceedings in a court available under applicable consumer law. Contact us first if you have a dispute so we can try to resolve it.</p></> },
] as const;

export default function TermsPage() {
  return <HandoffLegalPage
    boundary={<p>We may earn commission from clearly labelled affiliate links. Affiliate compensation does not determine Editor Score or natural editorial ranking.</p>}
    effective="19 August 2026"
    kind="terms"
    lead="These rules describe the B4GAMBLE service, its limits and the responsibilities that apply when you use it."
    legalContact={operator}
    sections={sections}
    updated="19 August 2026"
  />;
}
