import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { ControlCard, ControlFaqSection } from "../gambling-control/ControlPage";
import styles from "../gambling-control/GamblingControl.module.css";
import {
  NAPP_REGISTER_URLS,
  UZ_LICENSED_OPERATORS_PATH,
  UZ_LICENSEES,
  UZ_REGISTER_READ_ON,
  formatRegisterDate,
  uzLicensedOperatorsLocale,
  uzLicensedOperatorsMessages,
} from "@/lib/i18n/static-pages/uzbekistan-licensed-operators";
import { existingLanguageAlternates, productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { organizationReference } from "@/lib/seo/structured-data";
import { absoluteUrl } from "@/lib/site";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const messages = uzLicensedOperatorsMessages(presentation.locale);
  return productMetadata({
    presentation,
    pathname: UZ_LICENSED_OPERATORS_PATH,
    title: messages.metadataTitle,
    description: messages.metadataDescription,
    openGraphType: "article",
    // English and Uzbek are the only versions; no other language lists this page.
    languageAlternates: existingLanguageAlternates(UZ_LICENSED_OPERATORS_PATH),
  });
}

/**
 * Who holds an Uzbek licence for online casino and betting, and how a player tells the licensed
 * site and app from mirrors and copies (Founder pick «Страница о лицензиатах», 20 October 2026;
 * docs/07_Decisions/UZ-LICENSED-OPERATORS-2026-10-20.md).
 *
 * A neutral reference page under Uzbekistan's ban on gambling advertising and RFC-054: no offer,
 * no partner button or partner redirect, no ranking, and no link to any operator — the register's
 * domains are printed as plain text. The only outbound links go to the NAPP register and to
 * lex.uz; the page's own links go to Help and Responsible Gambling. It lives on the main site
 * only (COMMERCIAL in lib/site/host-routes.ts): the help site names no operator.
 */
export default async function UzbekistanLicensedOperatorsPage() {
  const presentation = await resolveServerPresentationContext();
  const messages = uzLicensedOperatorsMessages(presentation.locale);
  const contentLocale = uzLicensedOperatorsLocale(presentation.locale);
  const registerUrl = contentLocale === "uz-UZ" ? NAPP_REGISTER_URLS["uz-UZ"] : NAPP_REGISTER_URLS["en-GB"];
  const url = absoluteUrl(productCanonicalPath(presentation, UZ_LICENSED_OPERATORS_PATH));
  const title = `${messages.titleLead} ${messages.titleEmphasis}`;
  const rows = UZ_LICENSEES.flatMap((licensee) => licensee.licences.map((licence) => ({ licensee, licence })));
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description: messages.metadataDescription,
      url,
      inLanguage: contentLocale,
      isAccessibleForFree: true,
      datePublished: UZ_REGISTER_READ_ON,
      dateModified: UZ_REGISTER_READ_ON,
      publisher: organizationReference("main"),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: messages.faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: messages.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/")) },
        { "@type": "ListItem", position: 2, name: messages.breadcrumbLabel, item: url },
      ],
    },
  ];

  return <div className={`${styles.page} ${instrumentSerif.variable}`} data-runtime-renderer="uzbekistan-licensed-operators" lang={contentLocale === presentation.locale ? undefined : "en"}>
    <JsonLd data={schema} />
    <header className={styles.header} data-nav-theme="dark"><div>
      <small>{messages.eyebrow}</small>
      <h1>{messages.titleLead} <em>{messages.titleEmphasis}</em></h1>
      <p className={styles.answer} data-uz-licensed-answer>{messages.answer}</p>
      <p>{messages.intro}</p>
      <p className={styles.meta}>
        <span data-uz-register-checked>{messages.asOfLabel} <time dateTime={UZ_REGISTER_READ_ON}>{messages.asOfDate}</time></span>
        <span data-clean-route-line>{messages.revenueLine}</span>
      </p>
    </div></header>

    <div className={styles.body}>
      <ControlCard heading={messages.register.heading} id="register">
        <p>{messages.register.intro}</p>
        <table className={styles.table} data-uz-register-table>
          <thead>
            <tr>
              <th scope="col">{messages.register.columns.company}</th>
              <th scope="col">{messages.register.columns.domain}</th>
              <th scope="col">{messages.register.columns.licence}</th>
              <th scope="col">{messages.register.columns.issued}</th>
              <th scope="col">{messages.register.columns.validTo}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ licensee, licence }) => <tr data-uz-licence={licence.index} key={licence.index}>
              <th scope="row">“{licensee.name}” {messages.companyForm}<small>{messages.register.tinLabel} {licensee.tin}</small></th>
              <td data-label={messages.register.columns.domain} translate="no">{licensee.domain}</td>
              <td data-label={messages.register.columns.licence}>{licence.index}<br />{messages.register.kinds[licence.kind]}</td>
              <td data-label={messages.register.columns.issued}>{formatRegisterDate(licence.issuedOn, contentLocale)}</td>
              <td data-label={messages.register.columns.validTo}>{formatRegisterDate(licence.validTo, contentLocale)}</td>
            </tr>)}
          </tbody>
        </table>
        <p className={styles.note}>{messages.register.note}</p>
        <p><a data-uz-register-link href={registerUrl} rel="noopener noreferrer" target="_blank">{messages.register.linkLabel}</a></p>
      </ControlCard>

      <ControlCard heading={messages.notListed.heading} id="not-listed">
        <p>{messages.notListed.body}</p>
      </ControlCard>

      <ControlCard heading={messages.law.heading} id="law">
        <ul className={styles.list}>{messages.law.items.map((item) => <li key={item}>{item}</li>)}</ul>
      </ControlCard>

      <ControlCard heading={messages.site.heading} id="site">
        <ol className={styles.list}>{messages.site.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      </ControlCard>

      <ControlCard heading={messages.app.heading} id="app">
        <p>{messages.app.intro}</p>
        <ol className={styles.list}>{messages.app.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      </ControlCard>

      <ControlCard heading={messages.protections.heading} id="protections">
        <ul className={styles.list}>{messages.protections.items.map((item) => <li key={item}>{item}</li>)}</ul>
      </ControlCard>

      <section className={styles.firstStep} data-uz-help data-nav-theme="dark">
        <h2>{messages.help.heading}</h2>
        <p>{messages.help.body}</p>
        <ul className={styles.help}>
          <li><Link data-uz-help-link href={productHref(presentation, "/help")}>{messages.help.helpLabel}</Link></li>
          <li><Link href={productHref(presentation, "/responsible-gambling")}>{messages.help.responsibleLabel}</Link></li>
        </ul>
      </section>

      <ControlFaqSection faq={messages.faq} heading={messages.faqHeading} />

      <section className={`${styles.card} ${styles.sources}`} data-uz-sources data-nav-theme="dark">
        <h2>{messages.sources.heading}</h2>
        <p>{messages.sources.intro}</p>
        <ul>{messages.sources.items.map((source) => <li key={source.href}><a href={source.href} rel="noopener noreferrer" target="_blank">{source.label}</a></li>)}</ul>
      </section>
    </div>
  </div>;
}
