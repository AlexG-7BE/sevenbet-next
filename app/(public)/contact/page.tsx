import type { Metadata } from "next";
import Link from "next/link";

import { ActionLink } from "@/components/design-system/Action";
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
          <p className={styles.eyebrow}>Contact B4GAMBLE</p>
          <h1>Talk <em>to us.</em></h1>
          <p className={styles.heroCopy}>A human answers within 24 hours, usually faster. Corrections, questions, disagreements — all welcome.</p>
        </div>
      </header>

      <section className={styles.content} aria-label="Contact options">
        <div className={`${styles.shell} ${styles.grid}`}>
          <aside className={styles.context}>
            <section className={styles.contextBlock} aria-labelledby="direct-contact-title">
              <p className={styles.sectionLabel}>Other ways to reach us</p>
              <h2 id="direct-contact-title">Email</h2>
              <a className={styles.emailLink} href={`mailto:${SUPPORT_MAILBOX}`}>{SUPPORT_MAILBOX}</a>
            </section>

            <section className={styles.helpBlock} aria-labelledby="gambling-help-title">
              <p className={styles.sectionLabel}>Control &amp; support</p>
              <h2 id="gambling-help-title">Need help with gambling?</h2>
              <p>B4GAMBLE&apos;s Help section opens without casino, bonus or affiliate prompts.</p>
              <ActionLink className={styles.helpAction} href="/help" variant="ghost-paper">Open Help</ActionLink>
            </section>
            <section className={styles.contextBlock}><p className={styles.sectionLabel}>Corrections</p><p>Spotted an error in a review? Mark the subject &quot;Correction&quot; — these go to the editorial desk and ship within 48 hours.</p></section>
            <section className={styles.contextBlock}><p className={styles.sectionLabel}>Response time</p><p>Within 24 hours, usually faster. Weekends included.</p></section>
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
