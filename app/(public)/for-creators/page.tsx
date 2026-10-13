import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";

import { JsonLd } from "@/components/seo/JsonLd";
import { CreatorCalculator } from "./CreatorCalculator";
import styles from "./ForCreators.module.css";
import { forCreatorsLocale, forCreatorsMessages } from "@/lib/i18n/static-pages/for-creators";
import { productCanonicalPath, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { absoluteUrl } from "@/lib/site";
import { creatorCurrency } from "@/lib/tools/creator-terms";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const messages = forCreatorsMessages(presentation.locale);
  return productMetadata({ presentation, pathname: "/for-creators", title: messages.metadataTitle, description: messages.metadataDescription });
}

/**
 * The open agreement for creators (Founder decision, 13 October 2026): the terms in full, what
 * we never do, what every creator gets regardless, a calculator, and the FAQ. No casino is named
 * or linked; the page is about our terms, not about gambling.
 */
export default async function ForCreatorsPage() {
  const presentation = await resolveServerPresentationContext();
  const messages = forCreatorsMessages(presentation.locale);
  const contentLocale = forCreatorsLocale(presentation.locale);
  const url = absoluteUrl(productCanonicalPath(presentation, "/for-creators"));
  const title = `${messages.titleLead} ${messages.titleEmphasis}`;
  const schema = [
    { "@context": "https://schema.org", "@type": "WebPage", name: title, description: messages.metadataDescription, url, inLanguage: contentLocale, publisher: { "@type": "Organization", name: "B4GAMBLE", url: absoluteUrl("/") } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: messages.faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: messages.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/")) }, { "@type": "ListItem", position: 2, name: messages.breadcrumbLabel, item: url }] },
  ];
  const list = (heading: string, items: readonly string[], key: string) => <section className={styles.card} data-nav-theme="dark" key={key}>
    <h2>{heading}</h2>
    <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
  </section>;

  return <div className={`${styles.page} ${instrumentSerif.variable}`} data-runtime-renderer="for-creators" lang={contentLocale === presentation.locale ? undefined : "en"}>
    <JsonLd data={schema} />
    <header className={styles.header} data-nav-theme="dark"><div>
      <small>{messages.eyebrow}</small>
      <h1>{messages.titleLead} <em>{messages.titleEmphasis}</em></h1>
      <p>{messages.intro}</p>
    </div></header>
    <div className={styles.body}>
      {list(messages.terms.heading, messages.terms.items, "terms")}
      {list(messages.never.heading, messages.never.items, "never")}
      {list(messages.gets.heading, messages.gets.items, "gets")}
      <CreatorCalculator currency={creatorCurrency(contentLocale)} locale={contentLocale} messages={messages.calculator} />
      <section className={styles.faq} data-nav-theme="dark">
        <dl>{messages.faq.map(([question, answer]) => <div key={question}><dt>{question}</dt><dd>{answer}</dd></div>)}</dl>
        <p className={styles.contact}>{messages.contact}</p>
      </section>
    </div>
  </div>;
}
