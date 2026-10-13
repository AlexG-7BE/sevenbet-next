import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";

import { CopyText } from "@/components/clean-route/CopyText";
import { JsonLd } from "@/components/seo/JsonLd";
import { PausePlanTool } from "./PausePlanTool";
import styles from "./PausePlan.module.css";
import { pausePlanLocale, pausePlanMessages } from "@/lib/i18n/static-pages/pause-plan";
import { productCanonicalPath, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const messages = pausePlanMessages(presentation.locale);
  return productMetadata({ presentation, pathname: "/pause-plan", title: messages.metadataTitle, description: messages.metadataDescription });
}

/**
 * The ten-day plan beside a Spelpaus or ROFUS break (Founder, 12 October 2026). The tool and
 * the plan render in the browser; the rest is static. The page links to the Programme start and
 * to the national helplines, and never to a casino. A visitor who names a pause here, or who
 * merely arrives here, sees no research links until they open the door themselves on this page
 * (the clean route, lib/research-access.ts).
 */
export default async function PausePlanPage() {
  const presentation = await resolveServerPresentationContext();
  const messages = pausePlanMessages(presentation.locale);
  const contentLocale = pausePlanLocale(presentation.locale);
  const url = absoluteUrl(productCanonicalPath(presentation, "/pause-plan"));
  const title = `${messages.titleLead} ${messages.titleEmphasis}`;
  const startHref = `${programmePathForPresentationLocale(presentation.locale)}?entry=start`;
  const schema = [
    { "@context": "https://schema.org", "@type": "WebPage", name: title, description: messages.metadataDescription, url, inLanguage: contentLocale, isAccessibleForFree: true, publisher: { "@type": "Organization", name: "B4GAMBLE", url: absoluteUrl("/") } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: messages.faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: messages.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/")) }, { "@type": "ListItem", position: 2, name: messages.breadcrumbLabel, item: url }] },
  ];

  return <div className={`${styles.page} ${instrumentSerif.variable}`} data-runtime-renderer="pause-plan" lang={contentLocale === presentation.locale ? undefined : "en"}>
    <JsonLd data={schema} />
    <header className={styles.header} data-nav-theme="dark"><div>
      <small>{messages.eyebrow}</small>
      <h1>{messages.titleLead} <em>{messages.titleEmphasis}</em></h1>
      <p>{messages.intro}</p>
      <p className={styles.revenue} data-clean-route-line>{messages.revenueLine}</p>
    </div></header>

    <PausePlanTool days={messages.days} door={messages.door} ics={messages.ics} locale={contentLocale} messages={messages.tool} register={messages.register} registers={messages.registers} />

    <section className={styles.dayEleven} data-nav-theme="dark"><div>
      <h2>{messages.dayEleven.heading}</h2>
      <p>{messages.dayEleven.body}</p>
      <Link className={styles.cta} href={startHref}>{messages.dayEleven.cta}</Link>
    </div></section>

    <section className={styles.notBack} data-nav-theme="dark" data-pause-plan-not-back><div>
      <h2>{messages.notBack.heading}</h2>
      <p>{messages.notBack.intro}</p>
      <CopyText className={styles.copy} copiedLabel={messages.notBack.copied} copyLabel={messages.notBack.copy} lines={messages.notBack.lines} />
      <p><a href={messages.notBack.supportHref} rel="noopener noreferrer" target="_blank">{messages.notBack.supportLabel}</a></p>
    </div></section>

    <section className={styles.faq} data-nav-theme="dark"><div>
      <h2>{messages.faqHeading}</h2>
      <dl>
        {messages.faq.map(([question, answer]) => <div key={question}><dt>{question}</dt><dd>{answer}</dd></div>)}
      </dl>
    </div></section>

    <section className={styles.support} data-nav-theme="dark"><div>
      <h2>{messages.supportHeading}</h2>
      <ul>
        {messages.support.map((line) => <li key={line.href}><a href={line.href} rel="noopener noreferrer" target="_blank">{line.label}</a></li>)}
      </ul>
    </div></section>
  </div>;
}
