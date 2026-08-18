import type { Metadata } from "next";
import Link from "next/link";

import { NonceStyle } from "@/components/security/NonceStyle";
import { SUPPORT_MAILBOX } from "@/lib/contact/contracts";
import { absoluteUrl } from "@/lib/site";
import { ContactForm } from "./ContactForm";
import styles from "./ContactPage.module.css";

const contactCanonical = absoluteUrl("/contact");

export const metadata: Metadata = {
  title: "Contact B4GAMBLE | Support and enquiries",
  description: "Contact B4GAMBLE about the website, technical issues, editorial feedback or business enquiries.",
  alternates: { canonical: contactCanonical },
  openGraph: {
    type: "website",
    title: "Contact B4GAMBLE | Support and enquiries",
    description: "Contact B4GAMBLE about the website, technical issues, editorial feedback or business enquiries.",
    url: contactCanonical,
  },
};

export default function ContactPage() {
  return (
    <div className={styles.page} data-contact-page>
      <header className={styles.hero}>
        <div className={styles.shell}>
          <p className={styles.eyebrow}><span aria-hidden="true" />Contact</p>
          <h1>Talk <em>to us.</em></h1>
          <p className={styles.heroCopy}>Corrections, questions and disagreements are welcome. We&apos;ll reply when the team has reviewed your message.</p>
        </div>
      </header>

      <div className={styles.paint} />
      <section className={styles.content} aria-label="Contact options">
        <div className={`${styles.shell} ${styles.grid}`}>
          <aside className={styles.context}>
            <p className={styles.routesLabel}>Other ways to reach us</p>
            <section className={styles.contextBlock} aria-labelledby="direct-contact-title"><h2 id="direct-contact-title">Email</h2><a className={styles.emailLink} href={`mailto:${SUPPORT_MAILBOX}`}>{SUPPORT_MAILBOX}</a></section>
            <section className={styles.contextBlock}><h2>Corrections</h2><p>Spotted an error in a review? Mark the subject &quot;Correction&quot; so the editorial team can review and date any published change.</p></section>
            <section className={styles.helpBlock} aria-labelledby="gambling-help-title"><h2 id="gambling-help-title">Need support, not customer service?</h2><p>Protected Help is commercial-free and confidential.</p><Link className={styles.helpAction} href="/help">Open Help →</Link></section>
            <section className={styles.contextBlock}><h2>Response time</h2><p>Response times vary. If you need immediate gambling support, use Protected Help and its independent support routes.</p></section>
          </aside>

          <noscript>
            <NonceStyle>{"[data-contact-form-panel] { display: none !important; }"}</NonceStyle>
            <section className={styles.formPanel} aria-labelledby="contact-no-script-title">
              <p className={styles.sectionLabel}>General contact</p>
              <h2 id="contact-no-script-title">Email us directly.</h2>
              <p className={styles.noScript}>
                The form needs JavaScript. You can still email <a href={`mailto:${SUPPORT_MAILBOX}`}>{SUPPORT_MAILBOX}</a> directly. Read our <Link href="/privacy">Privacy Notice</Link>.
              </p>
            </section>
          </noscript>
          <div data-contact-form-panel>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
