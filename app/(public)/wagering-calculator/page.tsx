import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { WageringCalculator } from "./WageringCalculator";
import styles from "./WageringCalculator.module.css";
import { wageringCalculatorDefaults, wageringCalculatorLocale, wageringCalculatorMessages } from "@/lib/i18n/static-pages/wagering-calculator";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { offersMayBePresented } from "@/lib/public-offer/offer-visibility";
import { absoluteUrl } from "@/lib/site";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const messages = wageringCalculatorMessages(presentation.locale);
  return productMetadata({ presentation, pathname: "/wagering-calculator", title: messages.metadataTitle, description: messages.metadataDescription });
}

export default async function WageringCalculatorPage() {
  const presentation = await resolveServerPresentationContext();
  const messages = wageringCalculatorMessages(presentation.locale);
  const contentLocale = wageringCalculatorLocale(presentation.locale);
  const url = absoluteUrl(productCanonicalPath(presentation, "/wagering-calculator"));
  const title = `${messages.titleLead} ${messages.titleEmphasis.replace(/\.$/, "")}`;
  const schema = [
    { "@context": "https://schema.org", "@type": "WebApplication", name: title, description: messages.metadataDescription, url, applicationCategory: "FinanceApplication", operatingSystem: "Any", inLanguage: contentLocale, isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" }, publisher: { "@type": "Organization", name: "B4GAMBLE", url: absoluteUrl("/") } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: messages.faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: messages.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/")) }, { "@type": "ListItem", position: 2, name: messages.breadcrumbLabel, item: url }] },
  ];

  return <div className={`${styles.page} ${instrumentSerif.variable}`} data-runtime-renderer="wagering-calculator" lang={contentLocale === presentation.locale ? undefined : "en"}>
    <JsonLd data={schema} />
    <header className={styles.header} data-nav-theme="dark"><div>
      <small>{messages.eyebrow}</small>
      <h1>{messages.titleLead} <em>{messages.titleEmphasis}</em></h1>
      <p>{messages.intro}</p>
    </div></header>
    <WageringCalculator defaults={wageringCalculatorDefaults(presentation.locale)} label={title} locale={contentLocale} messages={messages.widget} />
    <article className={styles.article} data-nav-theme="cream"><div>
      {messages.sections.map((section) => <section id={section.id} key={section.id}>
        <h2>{section.title}</h2>
        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>)}
      <aside className={styles.checklist}><h2>{messages.checklistTitle}</h2><ul>{messages.checklist.map((item) => <li key={item}>{item}</li>)}</ul></aside>
      <section className={styles.faq} id="faq">
        <h2>{messages.faqTitle}</h2>
        {messages.faq.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}
      </section>
    </div></article>
    {offersMayBePresented(presentation.marketCountryCode) ? <section className={styles.offers} data-nav-theme="dark"><div>
      <h2>{messages.offersTitle}</h2>
      <p>{messages.offersCopy}</p>
      <Link href={productHref(presentation, "/bonuses")}>{messages.offersAction} <span aria-hidden="true">→</span></Link>
    </div></section> : null}
  </div>;
}
