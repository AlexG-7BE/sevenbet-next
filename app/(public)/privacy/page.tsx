import type { Metadata } from "next";
import Link from "next/link";

import { HandoffLegalPage } from "@/app/(public)/_legal/HandoffLegalPage";
import { currentArticle27Representation } from "@/lib/legal/article-27-representation";
import { absoluteUrl } from "@/lib/site";
import { HELP_OWNER_PATH } from "@/lib/site/help-copy";
import { siteName } from "@/lib/site/help-copy";
import { HELP_SITE_NAME, type SiteClass } from "@/lib/site/host-gate";
import { resolveServerSite } from "@/lib/site/server-site";

import styles from "./PrivacyRepresentatives.module.css";

// RFC-057 §8: the canonical is on the host that answered, so it is built per request.
export async function generateMetadata(): Promise<Metadata> {
  const site = await resolveServerSite();
  return {
    title: `Privacy Policy | ${siteName(site)}`,
    description: `How 7BE Inc., trading as ${siteName(site)}, uses and protects personal data.`,
    alternates: { canonical: absoluteUrl("/privacy", site) },
    robots: { index: false, follow: true },
  };
}

/**
 * RFC-057 §8 and Q2. The trading name is the one place on this page where the site's own name
 * belongs, so it is the name of the host that answered: `b4gamble.com` prints exactly what it
 * printed before, and the help host names itself.
 */
const controllerAddress = (site: SiteClass) => <address>
  7BE Inc., trading as {siteName(site)}<br />
  447 Broadway, 2nd Floor, 1663<br />
  New York, NY 10013<br />
  United States<br />
  <a href="mailto:privacy@7be.io">privacy@7be.io</a>
</address>;

const representativeSection = {
  id: "eu-uk-representative",
  title: "Our EU and UK privacy representative",
  content: <>
    <p>We value your privacy and your rights as a data subject. 7BE Inc. has appointed Prighter Group with its local partners as our privacy representative and your point of contact for Article 27 representation in the European Union and the United Kingdom.</p>
    <div className={styles.regionGrid}>
      {currentArticle27Representation.representatives.map((representative) => <div className={styles.region} key={representative.jurisdiction}>
        <h3>{representative.jurisdictionLabel}</h3>
        <address><strong>{representative.legalName}</strong><br />
          {representative.postalAddress.map((line) => <span key={line}>{line}<br /></span>)}
        </address>
        <p className={styles.scope}>{representative.legalScope}. Letter of Appointment signed 22 August 2026.</p>
      </div>)}
    </div>
    <p>Prighter provides an easy way to contact our representative or exercise privacy-related rights, including requests to access or erase personal data. Visit the <a className={styles.portalLink} href={currentArticle27Representation.portalUrl} rel="noopener noreferrer" target="_blank">Prighter data-subject portal</a>.</p>
    <div className={styles.certificates}>
      <h3>Representation certificates</h3>
      <div className={styles.certificateGrid}>
        {currentArticle27Representation.representatives.map((representative) => <div className={styles.certificate} key={representative.certificate.src}>
          <h4>{representative.jurisdiction === "EU" ? "EU GDPR Representative" : "UK GDPR Representative"}</h4>
          <a aria-label={`Open the Prighter portal for ${representative.jurisdictionLabel}`} className={styles.certificateLink} href={currentArticle27Representation.portalUrl} rel="noopener noreferrer" target="_blank">
            {/* The official certificate must load directly from Prighter so its live status remains authoritative. */}
            <img alt={representative.certificate.alt} className={styles.certificateImage} decoding="async" height={representative.certificate.intrinsicHeight} loading="lazy" src={representative.certificate.src} width={representative.certificate.intrinsicWidth} />
          </a>
        </div>)}
      </div>
    </div>
  </>,
};

const sectionsFor = (site: SiteClass) => [
  {
    id: "controller",
    title: "Who controls your information",
    content: <><p>7BE Inc., trading as {siteName(site)}, is the controller of personal data described in this notice. {site === "help"
      ? "It is an information and educational service. It is not a gambling operator and it sells nothing."
      : "B4GAMBLE is an information, comparison and educational service. It is not a gambling operator."}</p>{controllerAddress(site)}</>,
  },
  representativeSection,
  {
    id: "data-we-use",
    title: "Information we use",
    content: <><p>Depending on how you use the service, we may process:</p><ul>
      <li><strong>Account and identity data:</strong> name, email address, profile image, sign-in provider identifiers, account and session records. If you choose Google sign-in, Google supplies identity information for sign-in. It does not provide us with your date of birth, contacts, mailbox contents or a gambling profile, and it does not verify your age. Google credentials are used transiently by the server to verify the sign-in and are stripped before the application account relationship is stored. Google sign-in, age confirmation, Terms acceptance and Programme participation do not create reminder or marketing permission.</li>
      <li><strong>Programme data:</strong> your access confirmations, progress, XP, saved structured plan fields and the Starting Point that you confirm. What you pick or type may reveal health or other special-category information.</li>
      <li><strong>Transient Programme input:</strong> picked answers, text and clarifications used to create a suggested Starting Point. Draft text remains in the browser session unless and until you choose to save the confirmed output.</li>
      <li><strong>Technical and security data:</strong> session token, expiry, IP address, the coarse country/region derived by our hosting provider for the request, user agent, language preference, request and security records.</li>
          <li><strong>Outbound link records:</strong> each time a controlled link to a partner site is used, the page on this site it was used from (its path only, without query parameters), the position of the button, the casino and offer, the coarse country and whether the redirect succeeded. Unless you allow analytics, these records carry no browser, session or account identifier.</li>
      <li><strong>Optional first-party analytics:</strong> if you allow analytics, random browser and session identifiers, page path, referring host, selected campaign parameters, device category, coarse country, numbered Programme step, and internal casino, offer and click identifiers. Analytics does not contain your email address, password, Programme words, protected Help activity or partner tracking tokens.</li>
      <li><strong>Google Analytics:</strong> unless you reject cookies, Google Analytics 4 records the pages you view, how you reached them, approximate location derived by Google, device and browser type, and on-page interactions such as scrolls and outbound clicks, linked to a random Google Analytics identifier. It sends nothing from protected Help, the self-check or staff pages, and Google signals and advertising personalisation are turned off.</li>
      <li><strong>Email and consent records:</strong> your separate marketing choice, changes to that choice, template/version, recipient address, send and delivery state, bounce or complaint suppression, and unsubscribe state.</li>
      <li><strong>Contact data:</strong> the name, email, subject and message you send through Contact.</li>
    </ul></>,
  },
  {
    id: "purposes-bases",
    title: "Why we use it and our legal bases",
    content: <><p>We use personal data only for the purposes below:</p><dl>
      <div><dt>Provide accounts and the Programme</dt><dd>To authenticate you, maintain a session, save the output you choose to keep, show progress and deliver requested features. Legal basis: performance of our contract with you.</dd></div>
      <div><dt>Process optional personal Programme input</dt><dd>To use AI to suggest a personalised Starting Point. Legal basis: consent. Where the input reveals special-category data, we rely on your explicit consent. You can use protected Help without giving this consent.</dd></div>
      <div><dt>Security and service integrity</dt><dd>To prevent abuse, diagnose failures, protect accounts, keep bounded operational records and establish or defend legal claims. Legal basis: our legitimate interests in operating a secure and reliable service.</dd></div>
          <div><dt>Outbound link measurement</dt><dd>To reconcile commission with partners and to learn which pages and button positions help readers reach an offer. Legal basis: our legitimate interests in operating and measuring our affiliate links. Unless you allow analytics, the record identifies no browser, session or account.</dd></div>
      <div><dt>Optional product analytics</dt><dd>To understand aggregate use of the site, Programme steps and controlled outbound routes and improve reliability. Legal basis: your consent. Declining analytics does not stop the site, account, Programme or controlled redirects from working.</dd></div>
      <div><dt>Google Analytics</dt><dd>To measure visits, traffic sources and page use in aggregate reports. Legal basis: our legitimate interests in running and improving the site. You can switch it off at any time with “Reject cookies”.</dd></div>
      <div><dt>Service and marketing email</dt><dd>Where the relevant delivery flow is activated, to send necessary account or security messages, a welcome message, and—only where you separately opt in—Programme reminders or product updates. Legal basis: performance of our contract for necessary service messages and consent for electronic marketing.</dd></div>
      <div><dt>Language and regional presentation</dt><dd>To show a language you request and apply the coarse request-country context needed for locally appropriate information and commercial safeguards. The language preference does not select a commercial country. Legal basis: performance of our contract with you and our legitimate interests in providing a safe, relevant service.</dd></div>
      <div><dt>Respond to you</dt><dd>To receive and answer a Contact message or privacy request. Legal basis: steps at your request and our legitimate interests in communicating and keeping an appropriate record.</dd></div>
      <div><dt>Comply with law</dt><dd>To meet legal, regulatory and lawful disclosure duties. Legal basis: legal obligation.</dd></div>
    </dl><p>Our legitimate interests do not override your rights. We do not use Programme, Help, pause, self-check or vulnerability information to select, rank or personalise casinos, bonuses, affiliate links or advertising.</p></>,
  },
  {
    id: "ai",
    title: "AI",
    content: <><p>If you opt in, the answers you pick and the text you submit may be sent to OpenAI acting as a service provider so that we can generate a suggested Starting Point or Programme guidance. The response request uses <code>store: false</code> and does not create an OpenAI conversation. OpenAI states that API data is not used to train its models unless the customer opts in; its current default data controls allow Responses API content in abuse-monitoring logs for up to 30 days. Contracted or account-specific controls may differ. We record operational metadata such as model, timing, success or error and input size, not the words you supplied.</p><p>AI output can be incomplete or wrong. Review and edit it before saving. We do not use AI to diagnose you, decide whether gambling is safe, make a solely automated decision producing legal or similarly significant effects, or determine commercial offers or rankings.</p></>,
  },
  {
    id: "consent",
    title: "Consent and withdrawal",
    content: <><p>Your Programme-input consent is optional, specific to personalisation and separate from the age and legal checks. You may withdraw before saving by using the withdrawal control. Withdrawal stops future processing under that consent and clears the current browser draft; it cannot undo processing already completed. If you have saved a confirmed output, contact <a href="mailto:privacy@7be.io">privacy@7be.io</a> to exercise your rights.</p><p>Analytics permission and email-marketing permission are separate choices. Use “Cookie settings” in the footer to accept or reject our own analytics cookies and Google Analytics. An email opt-in is unchecked by default; every marketing message provides a secure unsubscribe route, and withdrawal blocks future marketing immediately. Neither choice affects necessary account/security messages.</p><p>Withdrawing consent does not affect processing that was lawful before withdrawal. We may still retain information where another lawful basis or a legal obligation applies.</p></>,
  },
  {
    id: "sharing",
    title: "Who receives information",
    content: <><p>We use service providers only for defined operational purposes: Vercel for hosting and application infrastructure; Prisma&apos;s managed Postgres service for application data; Google for identity-only sign-in and Google Analytics; Resend for Contact delivery and, only if separately activated, account and eligible lifecycle email delivery; Google Workspace for the support mailbox; and OpenAI for optional AI after your explicit consent. Authorised 7BE Inc. personnel may access information where needed to operate, secure or support the service.</p><p>Published casino and offer pages use operator logos and our own editorial imagery. They do not load partner-hosted promotional creatives. Historical creative-provider records are retained only as inert audit history and are not sent to your browser.</p><p>A Contact message delivered through Resend does not create marketing permission. Email delivery events are normalized; we do not retain the provider&apos;s full webhook payload. We do not sell personal data.</p><p>We may disclose information if law requires it, to protect legal rights or safety, or in connection with a corporate transaction subject to appropriate protections.</p></>,
  },
  {
    id: "transfers",
    title: "International transfers",
    content: <><p>This service is operated by a United States company, and some service providers may process information in the United States or other countries outside the United Kingdom. Where UK data-protection law restricts a transfer, we require an applicable legal transfer basis and safeguards. Contact us for information about the destination and safeguard applying to a particular transfer.</p></>,
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
      <li>Contact messages: under the retention settings of our support mailbox and email provider;</li>
      <li>consented first-party analytics sessions, events and detailed click attribution: generally up to 395 days, with non-identifying daily commercial aggregates retained separately;</li>
      <li>terminal email delivery history: generally up to 730 days; current unsubscribe or suppression state is retained while needed to honour the choice and prevent an unwanted send;</li>
      <li>security and provider records: for the period reasonably required by the applicable service, security and legal purpose.</li>
      <li>OpenAI Responses API content: under OpenAI&apos;s current default controls, up to 30 days in abuse-monitoring logs. Account-specific controls may differ.</li>
    </ul><p>Managed backups may persist for a limited backup cycle after live deletion. We do not promise immediate selective deletion from backups; deleted data is not restored to ordinary use and expires through the backup lifecycle unless it must be retained by law.</p></>,
  },
  {
    id: "cookies",
    title: "Cookies and similar technology",
    content: <><p>This service uses cookies or browser storage needed for a service you request, authentication, security, access confirmation, language preference, same-tab comparison selection and temporary Programme continuity. The presentation cookie stores language only; it does not store your country, raw IP address or commercial eligibility.</p><p>If you pick a country above the casino or offer lists, a <code>b4g_offer_country</code> cookie remembers that country for up to six months. It changes only which country’s offers the lists show. Links to casinos still follow the country your connection comes from, and picking the country shown by default removes the cookie.</p><p>With your affirmative permission, B4GAMBLE sets signed first-party analytics preference and random identifier cookies. A logical analytics session expires after 30 minutes of inactivity. Declining or withdrawing clears analytics identifiers and prevents future analytics collection.</p><p>Google Analytics runs from your first page and sets the <code>_ga</code> and <code>_ga_*</code> cookies for up to two years. “Reject cookies” stops it and removes those cookies. We do not use session replay or third-party advertising pixels.</p><p>Casino and offer pages do not load partner-hosted promotional creative frames, media pixels or impression requests. Language preference remains separate from trusted country detection and commercial eligibility.</p><p>No Programme step sets a cookie that changes the menu or any page. Until 16 October 2026, finishing the step “Research responsibly” set a <code>b4g_research_access</code> cookie holding the word “open”; B4GAMBLE no longer sets or reads it, and one already in your browser expires by itself or can be removed in your browser settings.</p><p>Other necessary B4GAMBLE storage is not reused for advertising, affiliate measurement or commercial personalisation. Browser controls can remove stored data, but disabling necessary storage may prevent requested language, account or Programme features from working.</p></>,
  },
  {
    id: "affiliate",
    title: "Affiliate links",
    content: <><p>Some clearly identified links may route through B4GAMBLE before sending you to an eligible third-party operator. This allows the destination and eligibility to be checked and may enable commission attribution. B4GAMBLE does not use Programme or protected Help data for this purpose. The operator&apos;s own privacy notice applies after you leave B4GAMBLE. See our <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>.</p></>,
  },
  {
    id: "rights",
    title: "Your UK data-protection rights",
    content: <><p>Depending on the circumstances, you may ask us to give you a copy of your personal data; correct it; delete it; restrict or object to its use; or provide data you supplied in a portable format. You may withdraw consent at any time and object to direct marketing. Use the unsubscribe link in a marketing email to stop it immediately; you do not need to sign in.</p><p>Email <a href="mailto:privacy@7be.io">privacy@7be.io</a>. We may need information to verify identity and locate the data. We normally respond within one month, subject to lawful extensions. You may complain to the UK Information Commissioner&apos;s Office at <a href="https://ico.org.uk/make-a-complaint/" rel="noopener noreferrer" target="_blank">ico.org.uk</a>, and you may seek a judicial remedy.</p></>,
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

/**
 * RFC-057 §6.5 and §17.1. The "Affiliate links" section and the cookie paragraph about Google
 * Analytics describe the commercial site. On the help host there are no affiliate links and no
 * Google tag at all (Q3), so both are replaced rather than carried over: a legal notice that
 * describes tracking a visitor is not subjected to is not a smaller problem than one that
 * omits it.
 *
 * The consent-control words `tests/fe-gap-01-structural.test.ts` forbids in this file stay out
 * of it: a legal notice must never read as if it gated itself behind one. The sentence below
 * says the same thing in plainer words, which is what the reader wants anyway.
 */
const helpSections = sectionsFor("help").flatMap((section) => {
  if (section.id === "affiliate") {
    return [{
      id: "affiliate",
      title: "No affiliate links on this site",
      content: <><p>This site carries no casino, bonus or partner link, and no link on it is paid for. The company behind it also runs a casino-comparison site at a different address, which is how it earns; that is explained in full on <Link href={HELP_OWNER_PATH}>Who runs this site</Link>.</p></>,
    }];
  }
  if (section.id === "cookies") {
    return [{
      id: "cookies",
      title: "Cookies and similar technology",
      content: <><p>This site uses only the storage a page you asked for needs: authentication, security, your language preference and keeping your place in the Programme. There is no Google tag, no advertising pixel and no analytics cookie, so nothing pops up asking you to accept or decline anything.</p><p>No Programme step sets a cookie that changes the menu or any page. Browser controls can remove stored data, but disabling necessary storage may prevent requested language, account or Programme features from working.</p></>,
    }];
  }
  return [section];
});

export default async function PrivacyPage() {
  const site = await resolveServerSite();
  return <HandoffLegalPage
    boundary={<p>Your Programme and protected Help activity is not used to target offers, set rankings or personalise commercial content. The Programme links to no casino, bonus or offer page.</p>}
    effective="19 August 2026"
    kind="privacy"
    lead={site === "help"
      ? `This notice explains what ${HELP_SITE_NAME} processes, why, who receives it, how long it is kept and the choices available to you.`
      : "This notice explains what B4GAMBLE processes, why, who receives it, how long it is kept and the choices available to you."}
    legalContact={controllerAddress(site)}
    sections={site === "help" ? helpSections : sectionsFor("main")}
    updated="16 October 2026"
  />;
}
