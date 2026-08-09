import type { Metadata } from "next";

import { LegalDocument, type LegalSection } from "../_legal/LegalDocument";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy | SevenBet",
  description: "How SevenBet handles account, Programme, Self-Check, control-tool, technical and affiliate-related personal data.",
  alternates: { canonical: absoluteUrl("/privacy") },
  robots: { index: false, follow: true },
};

const controller = (
  <address>
    7BE Inc., trading as SevenBet<br />
    447 Broadway, 2nd Floor, 1663<br />
    New York, NY 10013<br />
    United States
  </address>
);

const sections: readonly LegalSection[] = [
  {
    id: "who-we-are",
    label: "Who we are",
    title: "Who we are",
    content: <><p>SevenBet is a decision-support, educational, comparison and affiliate information service.</p><p>The controller responsible for personal data processed through SevenBet is:</p>{controller}<p>Privacy: <a href="mailto:privacy@7be.io">privacy@7be.io</a></p><p>SevenBet does not operate an online casino, accept wagers or deposits, or hold gambling balances.</p></>,
  },
  {
    id: "scope",
    label: "Scope",
    title: "Scope",
    content: <><p>This Policy explains how SevenBet handles personal data when you use our website, create an account, use the 10-Step Programme, use safety and control tools, follow an affiliate link, or contact us.</p><p>It applies to SevenBet&apos;s Great Britain service.</p><p>Third-party gambling operators and other external websites have their own privacy practices. If you leave SevenBet, their privacy notices apply to their processing.</p></>,
  },
  {
    id: "privacy-boundary",
    label: "Our privacy boundary",
    title: "Our privacy boundary",
    content: <><p>SevenBet separates private control and support information from commercial gambling activity.</p><p>We do not use:</p><ul><li>Protected Help activity;</li><li>Self-Check answers or results;</li><li>private Programme reflections;</li><li>vulnerability indicators;</li><li>urge-learning information;</li><li>personal control boundaries;</li></ul><p>to select casino offers, rank operators for an individual, personalise bonuses, target affiliate marketing, or increase commercial gambling prompts.</p><p>We do not sell this information to gambling operators.</p></>,
  },
  {
    id: "personal-data",
    label: "Personal data",
    title: "Account and Programme data",
    content: <><h3>Account and authentication data</h3><p>If you create an account, we may process:</p><ul><li>name;</li><li>email address;</li><li>email-verification status;</li><li>profile image where provided;</li><li>authentication credentials and account identifiers;</li><li>session identifiers;</li><li>session expiry information;</li><li>IP address and browser/user-agent information used for account security.</li></ul><h3>10-Step Programme data</h3><p>The account may store the minimum facts needed for requested continuity:</p><ul><li>enrollment, mission, task and completion status;</li><li>XP, achievements, streak and activity dates;</li><li>timezone;</li><li>goal direction, review date, confidence and status;</li><li>boundary category, a value you enter, structured method, review date and status;</li><li>neutral technical continuity markers.</li></ul><p>Your raw Moment Map, goal wording, early-signal wording, boundary rule, execution detail and coping wording are kept in memory or tab-scoped browser session storage. New Programme routes do not save that narrative to SevenBet&apos;s application database. It normally ends with the browser tab session and you can clear it from the Programme Dashboard.</p><p>Historic Programme rows created before this local-first change may remain in an account until deletion or an approved legacy cleanup. They are not used to repopulate current narrative inputs and remain available to authenticated access and erasure processes.</p><p>Programme information is not commercial targeting data. SevenBet does not require a medical diagnosis or treatment history to use ordinary Programme functionality.</p><h3>Anonymous Programme sessions</h3><p>An anonymous Programme session uses an opaque cookie token so the server can maintain neutral task state. The raw narrative is not included in that request.</p><p>Access to the current anonymous Programme session expires after approximately 24 hours. A short-lived account-claim token expires after approximately 30 minutes. These are access-expiry periods; physical database cleanup periods are still being verified.</p></>,
  },
  {
    id: "lawful-bases",
    label: "Lawful bases",
    title: "Why we use personal data",
    content: <><p>We process account and ordinary Programme information where necessary to provide features you request and perform our agreement with you.</p><p>We process security, abuse-prevention, service-reliability and limited diagnostic information where necessary for our legitimate interests in operating a secure and reliable service, balanced against your rights and expectations.</p><p>We process information where necessary to comply with legal obligations.</p><p>Where we intentionally process special-category information, including health information, we also identify an applicable condition under Article 9 UK GDPR.</p><p>Ordinary acceptance of our Terms is not treated as a substitute for an Article 9 condition.</p><p>Where explicit consent is required, we ask for it separately and allow you to withdraw it.</p></>,
  },
  {
    id: "sensitive-information",
    label: "Sensitive information",
    title: "Special-category and vulnerability information",
    content: <><p>Information about physical or mental health can receive additional protection under UK data-protection law.</p><p>SevenBet minimises gambling-control and vulnerability information. We do not intentionally create a commercial health or vulnerability profile.</p><p>Raw Programme narrative remains in the browser session rather than being cloud-saved. Do not enter a diagnosis or treatment history; it is not needed for the Programme.</p><p>Where the legal basis necessary for storing a sensitive field is not established, the field remains local, ephemeral or unavailable for cloud saving in Great Britain.</p><h3>Protected Help</h3><p>Protected Help is separated from SevenBet&apos;s commercial experience.</p><p>Visiting Protected Help, using a support route, or showing possible vulnerability must not cause SevenBet to:</p><ul><li>increase gambling advertising;</li><li>rank a casino differently for you;</li><li>personalise a bonus;</li><li>create an affiliate targeting segment.</li></ul><p>Protected Help remains available independently of commercial eligibility and without an age-attested account.</p></>,
  },
  {
    id: "local-tools",
    label: "Self-Check & limit tracker",
    title: "Self-Check and Personal Limit Tracker",
    content: <><h3>Self-Check</h3><p>The Great Britain launch version of Self-Check works locally in your browser.</p><p>Your individual answers and result state are not sent to SevenBet&apos;s application database and are not used for casino, bonus or affiliate recommendations.</p><p>The page may still generate ordinary technical request data needed to serve and secure a web page.</p><h3>Personal Limit Tracker</h3><p>The Great Britain launch version of the Personal Gambling Limit Tracker processes the amounts you enter locally in the page.</p><p>SevenBet does not use those entries to calculate an amount that it considers safe or affordable for you to gamble.</p><p>Those entries are not used to recommend casinos or bonuses. The entered values are not stored in SevenBet&apos;s application database.</p></>,
  },
  {
    id: "technical-affiliate",
    label: "Technical & affiliate data",
    title: "Technical, security and affiliate-link information",
    content: <><h3>Technical and security data</h3><p>We may process technical information needed to operate and protect SevenBet, such as:</p><ul><li>IP address;</li><li>browser or device information;</li><li>request time;</li><li>requested URL;</li><li>authentication/security events;</li><li>error and diagnostic information;</li><li>country signals supplied by infrastructure providers where relevant to jurisdiction controls.</li></ul><p>We limit technical logs to what is reasonably needed for security, reliability, fraud/abuse prevention and debugging.</p><h3>Affiliate-link information</h3><p>Some links on SevenBet are affiliate links.</p><p>When affiliate routing is enabled, SevenBet may process information needed to determine whether a commercial destination is available for the relevant jurisdiction, such as:</p><ul><li>affiliate redirect identifier;</li><li>country signal;</li><li>optional currency or language context;</li><li>diagnostic status where a redirect cannot be completed.</li></ul><p>Following an affiliate link may take you to an operator or affiliate-network domain. That recipient may receive information normally associated with a web request and may process the referral under its own privacy notice.</p><p>SevenBet must not attach Self-Check, Protected Help or Programme vulnerability information to affiliate referrals.</p><h3>Communications</h3><p>If you contact SevenBet directly, we process the contact details and content necessary to respond.</p></>,
  },
  {
    id: "cookies-analytics",
    label: "Cookies & storage",
    title: "Cookies, similar technologies and analytics",
    content: <><p>SevenBet uses, or may use, storage necessary for features you request, including authentication and short-lived Programme sessions.</p><p>Strictly necessary storage does not require opt-in consent where the applicable PECR exception applies.</p><p>At this launch stage, SevenBet&apos;s application code does not contain a dedicated behavioural advertising or user-level analytics SDK.</p><p>If we introduce analytics that qualifies for the statutory statistical-purpose exception, we will provide the required clear information and simple means to object.</p><p>If we introduce storage/access technology for advertising, ad affiliation, cross-site tracking or similar non-exempt purposes, we will obtain consent before using it where required.</p><p>We will update this Policy if our storage or tracking practices materially change.</p><h3>Analytics</h3><p>SevenBet does not use Self-Check answers, Personal Limit Tracker entries or private Programme vulnerability information for analytics about individual users.</p><p>We may use aggregate statistics about service performance or usage where permitted by law and designed so that the statistics are not used to identify or profile individual visitors.</p></>,
  },
  {
    id: "sharing-transfers",
    label: "Sharing & transfers",
    title: "Sharing personal data and international transfers",
    content: <><p>We use service providers where needed to host the application and database. Repository evidence currently identifies Vercel hosting and Prisma Postgres database services.</p><p>Contracting entities, processing locations, subprocessors, retention and transfer safeguards are under launch verification. SevenBet will not present an unverified safeguard as complete.</p><p>When you voluntarily follow a future governed link to a gambling operator or affiliate network, that recipient may process information as a separate controller under its own privacy notice. GB referral activity is currently disabled.</p><p>We may also disclose information where required by law, court order or a competent authority, or where reasonably necessary to establish, exercise or defend legal rights.</p><p>We do not disclose Protected Help, Self-Check or private Programme vulnerability information to gambling operators for marketing or commercial personalisation.</p><h3>International transfers</h3><p>The controller is based in the United States and service-provider processing may occur outside the United Kingdom.</p><p>Where a transfer is a restricted transfer, SevenBet must establish and document the applicable lawful mechanism and required transfer assessment before relying on it. That evidence review remains open for launch.</p><h3>UK representative</h3><p>A UK representative is required for the intended GB service. SevenBet has not yet appointed or published one. We will add real representative contact details after an appointment is completed.</p></>,
  },
  {
    id: "retention-security",
    label: "Retention & security",
    title: "Retention and security",
    content: <><p>We keep personal data only for as long as needed for its purpose. Current implemented boundaries include:</p><ul><li>raw Programme narrative: browser tab session only, with an explicit local-clear control;</li><li>anonymous Programme access: approximately 24 hours;</li><li>pending Programme claim access: approximately 30 minutes;</li><li>Self-Check answers/results and Personal Limit Tracker entries: no SevenBet application-database retention;</li><li>account, progress, rewards and structured Programme continuity: while needed to provide the requested account and until verified deletion or another applicable event;</li><li>historic Programme narrative: until verified deletion or an approved legacy cleanup;</li><li>information required for a legal claim or obligation: for the required period.</li></ul><p>Physical cleanup periods for expired rows, logs and provider backups are still being verified. Deletion applies to the active application database; encrypted provider backups may expire on a separate verified schedule and must not be restored without reapplying relevant erasures.</p><h3>Security</h3><p>SevenBet uses controls including authenticated access, private cookies, exact server field allow-lists, restricted server-side access and bounded error responses.</p><p>No internet service can guarantee absolute security.</p><p>If a personal-data breach occurs, SevenBet will assess risk, keep an incident record and make notifications required by applicable law.</p></>,
  },
  {
    id: "rights-contact",
    label: "Your rights & contact",
    title: "Your rights, complaints and contact",
    content: <><h3>Your rights</h3><p>Depending on the circumstances, UK data-protection law may give you the right to:</p><ul><li>be informed about our processing;</li><li>request access to your personal data;</li><li>ask us to correct inaccurate personal data;</li><li>request erasure;</li><li>request restriction of processing;</li><li>object to processing based on legitimate interests;</li><li>receive certain data in a portable format where data portability applies;</li><li>withdraw consent where processing is based on consent;</li><li>complain to the Information Commissioner&apos;s Office.</li></ul><p>Requests: <a href="mailto:privacy@7be.io">privacy@7be.io</a></p><p>We may need to verify your identity. Some rights are subject to legal exceptions. We respond without undue delay and ordinarily within one month. If a lawful extension is needed because a request is complex or numerous, we will explain this within the first month.</p><h3>Automated decisions and profiling</h3><p>SevenBet does not use Self-Check or Programme information to make solely automated decisions that produce legal or similarly significant effects.</p><p>Self-Check provides a local, non-clinical reflection summary. It does not determine eligibility to gamble, diagnose a health condition, establish affordability or decide which gambling product you should use.</p><p>SevenBet must not turn that result into commercial gambling personalisation.</p><h3>Children and people under 18</h3><p>SevenBet&apos;s persistent account, Programme saving, casino comparison, bonus and affiliate experience is intended only for adults aged 18 or over. Account creation uses an unchecked self-attestation; this launch does not collect date of birth or perform KYC.</p><p>We do not knowingly design gambling marketing for children. Help and harm-prevention information remains open without an account.</p><p>If we discover that an under-18 user has created an account contrary to the age requirement, we may close the account and delete information where appropriate.</p><h3>Affiliate relationships</h3><p>SevenBet may receive a commission from a future eligible governed link. GB commercial and referral activity is currently disabled.</p><p>Affiliate compensation does not determine Editor Score or natural editorial ranking. Commercial relationships do not change factual licensing information, operator terms, Protected Help content or private vulnerability information.</p><p>Any sponsored placement must be clearly distinguishable from an editorial conclusion.</p><h3>Changes to this Policy</h3><p>We may update this Policy when our product, processing or legal obligations change. We will update the date at the top and provide additional notice where a change materially affects processing.</p><h3>Complaints and contact</h3><p>Send a privacy complaint, question or rights request to:</p>{controller}<p><a href="mailto:privacy@7be.io">privacy@7be.io</a></p><p>We record and investigate privacy complaints through our rights and complaints workflow. You also have the right to complain directly to the UK Information Commissioner&apos;s Office; contacting SevenBet first is not a condition of that right.</p><p>An ICO fee/registration assessment remains open. We will not publish a registration claim until it is verified.</p></>,
  },
] as const;

export default function PrivacyPage() {
  return <LegalDocument kind="privacy" family="924:2798" desktopNode="924:2799" mobileNode="924:2926" eyebrow="Privacy Policy" desktopTitle={<>PRIVACY, WITHOUT THE<br />FINE-PRINT THEATRE.</>} mobileTitle="PRIVACY POLICY" lead="Clear boundaries for account, local-first Programme, control-tool and affiliate data." effective="9 August 2026" updated="9 August 2026" sections={sections} boundary={<><p>Private control boundary</p><h3>Private control data does not become commercial targeting.</h3><p>Self-Check answers, Personal Limit Tracker entries, Protected Help activity and private Programme narrative stay outside offer ranking and affiliate personalisation.</p></>} />;
}
