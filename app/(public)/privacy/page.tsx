import type { Metadata } from "next";
import Link from "next/link";

import { HandoffLegalPage } from "@/app/(public)/_legal/HandoffLegalPage";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy | B4GAMBLE",
  description: "How 7BE Inc., trading as B4GAMBLE, uses and protects personal data.",
  alternates: { canonical: absoluteUrl("/privacy") },
  robots: { index: false, follow: true },
};

const controller = <address>
  7BE Inc., trading as B4GAMBLE<br />
  447 Broadway, 2nd Floor, 1663<br />
  New York, NY 10013<br />
  United States<br />
  <a href="mailto:privacy@7be.io">privacy@7be.io</a>
</address>;

const sections = [
  {
    id: "controller",
    title: "Who controls your information",
    content: <><p>7BE Inc., trading as B4GAMBLE, is the controller of personal data described in this notice. B4GAMBLE is an information, comparison and educational service. It is not a gambling operator.</p>{controller}</>,
  },
  {
    id: "data-we-use",
    title: "Information we use",
    content: <><p>Depending on how you use the service, we may process:</p><ul>
      <li><strong>Account and identity data:</strong> name, email address, profile image, sign-in provider identifiers, account and session records. If you use Google, Google supplies identity information for sign-in; it does not verify your age or supply your mailbox, contacts, date of birth or a gambling profile to B4GAMBLE.</li>
      <li><strong>Programme data:</strong> your access confirmations, progress, XP, saved structured plan fields and the Starting Point that you confirm. What you type or say may reveal health or other special-category information.</li>
      <li><strong>Transient Programme input:</strong> text, clarifications, audio and transcripts used to create a suggested Starting Point. Audio is held in short-lived memory for transcription and is not saved by B4GAMBLE. Draft text remains in the browser session unless and until you choose to save the confirmed output.</li>
      <li><strong>Technical and security data:</strong> session token, expiry, IP address, user agent, request and security records.</li>
      <li><strong>Contact data:</strong> the name, email, subject and message you send through Contact.</li>
      <li><strong>Limited product analytics:</strong> page-view and closed, categorical interaction events when analytics is enabled. Programme words, audio, transcripts, saved plan content, email addresses and account identifiers are excluded from the product-analytics event contract.</li>
    </ul></>,
  },
  {
    id: "purposes-bases",
    title: "Why we use it and our legal bases",
    content: <><p>We use personal data only for the purposes below:</p><dl>
      <div><dt>Provide accounts and the Programme</dt><dd>To authenticate you, maintain a session, save the output you choose to keep, show progress and deliver requested features. Legal basis: performance of our contract with you.</dd></div>
      <div><dt>Process optional personal Programme input</dt><dd>To transcribe voice input and use AI to suggest a personalised Starting Point. Legal basis: consent. Where the input reveals special-category data, we rely on your explicit consent. You can use protected Help without giving this consent.</dd></div>
      <div><dt>Security and service integrity</dt><dd>To prevent abuse, diagnose failures, protect accounts, keep bounded operational records and establish or defend legal claims. Legal basis: our legitimate interests in operating a secure and reliable service.</dd></div>
      <div><dt>Respond to you</dt><dd>To receive and answer a Contact message or privacy request. Legal basis: steps at your request and our legitimate interests in communicating and keeping an appropriate record.</dd></div>
      <div><dt>Comply with law</dt><dd>To meet legal, regulatory and lawful disclosure duties. Legal basis: legal obligation.</dd></div>
      <div><dt>Understand product use</dt><dd>To measure aggregate page and feature performance using limited events, where enabled. Legal basis: consent where storage or access technology requires it; otherwise our legitimate interests, subject to your rights.</dd></div>
    </dl><p>Our legitimate interests do not override your rights. We do not use Programme, Help, pause, self-check or vulnerability information to select, rank or personalise casinos, bonuses, affiliate links or advertising.</p></>,
  },
  {
    id: "ai",
    title: "AI and voice transcription",
    content: <><p>If you opt in, the text you submit—or audio and its transcript—may be sent to OpenAI acting as a service provider so that B4GAMBLE can transcribe your recording and generate a suggested Starting Point. The response request uses <code>store: false</code> and does not create an OpenAI conversation. OpenAI states that API data is not used to train its models unless the customer opts in; its current default data controls allow Responses API content in abuse-monitoring logs for up to 30 days, while the audio-transcription endpoint has no abuse-monitoring or application-state retention. Contracted or account-specific controls may differ. B4GAMBLE records operational metadata such as model, timing, success or error and input size, not the words you supplied.</p><p>AI output can be incomplete or wrong. Review and edit it before saving. B4GAMBLE does not use AI to diagnose you, decide whether gambling is safe, make a solely automated decision producing legal or similarly significant effects, or determine commercial offers or rankings.</p></>,
  },
  {
    id: "consent",
    title: "Consent and withdrawal",
    content: <><p>Your Programme-input consent is optional, specific to personalisation and separate from the age and legal checks. You may withdraw before saving by using the withdrawal control. Withdrawal stops future processing under that consent and clears the current browser draft; it cannot undo processing already completed. If you have saved a confirmed output, contact <a href="mailto:privacy@7be.io">privacy@7be.io</a> to exercise your rights.</p><p>Withdrawing consent does not affect processing that was lawful before withdrawal. We may still retain information where another lawful basis or a legal obligation applies.</p></>,
  },
  {
    id: "sharing",
    title: "Who receives information",
    content: <><p>We use service providers only for defined operational purposes. Current categories include hosting and application infrastructure, managed database services, Google identity, email delivery, AI and transcription, and limited product analytics. Authorised B4GAMBLE personnel may access information where needed to operate, secure or support the service.</p><p>A Contact message is delivered to the B4GAMBLE support mailbox through our email provider. We do not create a marketing permission from your message. We do not sell personal data.</p><p>We may disclose information if law requires it, to protect legal rights or safety, or in connection with a corporate transaction subject to appropriate protections.</p></>,
  },
  {
    id: "transfers",
    title: "International transfers",
    content: <><p>B4GAMBLE is operated by a United States company, and some service providers may process information in the United States or other countries outside the United Kingdom. Where UK data-protection law restricts a transfer, we require an applicable legal transfer basis and safeguards. Contact us for information about the destination and safeguard applying to a particular transfer.</p></>,
  },
  {
    id: "retention",
    title: "How long we keep information",
    content: <><p>We keep information only as long as needed for the stated purpose, security, disputes and legal duties. Current operational periods include:</p><ul>
      <li>browser Programme drafts: for the tab or browser-session lifecycle, subject to browser crash or session restoration;</li>
      <li>short-lived Programme access authority: up to about 60 minutes;</li>
      <li>anonymous Programme continuation records: about 24 hours;</li>
      <li>pending account-claim records: about 30 minutes;</li>
      <li>account, saved Programme and progress data: while the account is active, then until deletion can be completed subject to legal, security and backup requirements;</li>
      <li>Contact messages: under the retention settings of the B4GAMBLE mailbox and email provider;</li>
      <li>security, provider and analytics records: for the period reasonably required by the applicable service, security and legal purpose.</li>
      <li>OpenAI Responses API content: under OpenAI&apos;s current default controls, up to 30 days in abuse-monitoring logs; OpenAI currently lists no retention for the audio-transcription endpoint.</li>
    </ul><p>Managed backups may persist for a limited backup cycle after live deletion. We do not promise immediate selective deletion from backups; deleted data is not restored to ordinary use and expires through the backup lifecycle unless it must be retained by law.</p></>,
  },
  {
    id: "cookies",
    title: "Cookies and similar technology",
    content: <><p>Strictly necessary cookies or browser storage support authentication, security, access confirmation and temporary Programme continuity. Product analytics may be enabled to measure pages and bounded feature outcomes. B4GAMBLE does not use Programme or Help content for advertising profiles, and the current service does not operate behavioural advertising or session replay.</p><p>Where consent is legally required for a non-essential technology, it must not be used before the required consent is obtained. Browser controls can remove stored data, but disabling necessary storage may prevent account or Programme features from working.</p></>,
  },
  {
    id: "affiliate",
    title: "Affiliate links",
    content: <><p>Some clearly identified links may route through B4GAMBLE before sending you to an eligible third-party operator. This allows the destination and eligibility to be checked and may enable commission attribution. B4GAMBLE does not use Programme or protected Help data for this purpose. The operator&apos;s own privacy notice applies after you leave B4GAMBLE. See our <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>.</p></>,
  },
  {
    id: "rights",
    title: "Your UK data-protection rights",
    content: <><p>Depending on the circumstances, you may ask us to give you a copy of your personal data; correct it; delete it; restrict or object to its use; or provide data you supplied in a portable format. You may withdraw consent at any time and object to direct marketing. B4GAMBLE does not currently use your data for direct marketing.</p><p>Email <a href="mailto:privacy@7be.io">privacy@7be.io</a>. We may need information to verify identity and locate the data. We normally respond within one month, subject to lawful extensions. You may complain to the UK Information Commissioner&apos;s Office at <a href="https://ico.org.uk/make-a-complaint/" rel="noopener noreferrer" target="_blank">ico.org.uk</a>, and you may seek a judicial remedy.</p></>,
  },
  {
    id: "children-security",
    title: "Age, security and third-party sites",
    content: <><p>The account, Programme and commercial gambling content are for people aged 18 or over. We do not knowingly provide those features to children. Protected Help remains available without an age gate. If you believe a child has supplied personal data, contact us.</p><p>We use technical and organisational safeguards designed for the nature of the service, but no service can promise absolute security. Third-party sites control their own processing; review their privacy information before supplying data.</p></>,
  },
  {
    id: "changes",
    title: "Changes and contact",
    content: <><p>We may update this notice when the service, law or providers change. We will show the new date here and provide additional notice where required. Questions and rights requests should be sent to <a href="mailto:privacy@7be.io">privacy@7be.io</a>.</p></>,
  },
] as const;

export default function PrivacyPage() {
  return <HandoffLegalPage
    boundary={<p>Your Programme and protected Help activity is not used to target offers, set rankings or personalise commercial content.</p>}
    effective="19 August 2026"
    kind="privacy"
    lead="This notice explains what B4GAMBLE processes, why, who receives it, how long it is kept and the choices available to you."
    legalContact={controller}
    sections={sections}
    updated="19 August 2026"
  />;
}
