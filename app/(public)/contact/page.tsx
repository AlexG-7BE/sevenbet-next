import type { Metadata } from "next";
import Link from "next/link";

import { NonceStyle } from "@/components/security/NonceStyle";
import { SUPPORT_MAILBOX } from "@/lib/contact/contracts";
import { JsonLd } from "@/components/seo/JsonLd";
import { contactMessages } from "@/lib/i18n/static-pages/contact";
import { productCanonicalPath, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { absoluteUrl } from "@/lib/site";
import { ContactForm } from "./ContactForm";
import styles from "./ContactPage.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const messages = contactMessages(presentation.locale);
  return productMetadata({ presentation, pathname: "/contact", title: messages.metadataTitle, description: messages.metadataDescription });
}

export default async function ContactPage() {
  const presentation = await resolveServerPresentationContext();
  const messages = contactMessages(presentation.locale);
  const canonical = absoluteUrl(productCanonicalPath(presentation, "/contact"));
  return (
    <div className={styles.page} data-contact-page>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ContactPage", name: messages.metadataTitle, description: messages.metadataDescription, url: canonical }} />
      <header className={styles.hero}>
        <div className={styles.shell}>
          <p className={styles.eyebrow}><span aria-hidden="true" />{messages.eyebrow}</p>
          <h1>{messages.titleLead} <em>{messages.titleEmphasis}</em></h1>
          <p className={styles.heroCopy}>{messages.heroCopy}</p>
        </div>
      </header>

      <div className={styles.paint} />
      <section className={styles.content} aria-label={messages.optionsLabel}>
        <div className={`${styles.shell} ${styles.grid}`}>
          <aside className={styles.context}>
            <p className={styles.routesLabel}>{messages.otherWays}</p>
            <section className={styles.contextBlock} aria-labelledby="direct-contact-title"><h2 id="direct-contact-title">{messages.emailTitle}</h2><a className={styles.emailLink} href={`mailto:${SUPPORT_MAILBOX}`}>{SUPPORT_MAILBOX}</a></section>
            <section className={styles.contextBlock}><h2>{messages.correctionsTitle}</h2><p>{messages.correctionsCopy}</p></section>
            <section className={styles.helpBlock} aria-labelledby="gambling-help-title"><h2 id="gambling-help-title">{messages.helpTitle}</h2><p>{messages.helpCopy}</p><Link className={styles.helpAction} href="/help">{messages.helpAction}</Link></section>
            <section className={styles.contextBlock}><h2>{messages.responseTitle}</h2><p>{messages.responseCopy}</p></section>
          </aside>

          <noscript>
            <NonceStyle>{"[data-contact-form-panel] { display: none !important; }"}</NonceStyle>
            <section className={styles.formPanel} aria-labelledby="contact-no-script-title">
              <p className={styles.sectionLabel}>{messages.formLabel}</p>
              <h2 id="contact-no-script-title">{messages.noScriptTitle}</h2>
              <p className={styles.noScript}>
                {messages.noScriptLead} <a href={`mailto:${SUPPORT_MAILBOX}`}>{SUPPORT_MAILBOX}</a>. <Link href="/privacy">{messages.noScriptPrivacy}</Link>
              </p>
            </section>
          </noscript>
          <div data-contact-form-panel>
            <ContactForm messages={messages} />
          </div>
        </div>
      </section>
    </div>
  );
}
