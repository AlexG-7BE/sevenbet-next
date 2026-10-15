import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";

import { CopyText } from "@/components/clean-route/CopyText";
import { JsonLd } from "@/components/seo/JsonLd";
import { PausePlanTool } from "./PausePlanTool";
import styles from "./PausePlan.module.css";
import { articlePath } from "@/lib/articles/article-types";
import { pauseLettersEnabled } from "@/lib/email/pause-letters/schedule";
import { pauseHubGuides } from "@/lib/articles/pause-hub.server";
import { CONTROL_PATHS, controlSharedMessages } from "@/lib/i18n/static-pages/gambling-control";
import { pausePlanLocale, pausePlanMessages } from "@/lib/i18n/static-pages/pause-plan";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
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
 * to the national helplines, and never to a casino. It is an ordinary landing page: it changes
 * nothing in the menu (Founder, 13 October 2026). It keeps nothing unless the pause letters are
 * switched on (Founder, 13 October 2026; docs/07_Decisions/PAUSE-LETTERS-2026-10-14.md): then
 * the Programme button carries the pause date to the account in a one-hour cookie, and the tool
 * offers an email field, both for the timing of letters only. It is also the hub of the
 * guides for a person on a pause: it lists the published guides of its language that carry the
 * register's name as a tag (lib/articles/pause-hub.server.ts).
 */
export default async function PausePlanPage() {
  const presentation = await resolveServerPresentationContext();
  const messages = pausePlanMessages(presentation.locale);
  const contentLocale = pausePlanLocale(presentation.locale);
  const url = absoluteUrl(productCanonicalPath(presentation, "/pause-plan"));
  const title = `${messages.titleLead} ${messages.titleEmphasis}`;
  const startHref = `${programmePathForPresentationLocale(presentation.locale)}?entry=start`;
  const registerName = messages.register === "both" ? "" : messages.registers[messages.register]?.name ?? "";
  const guides = await pauseHubGuides(contentLocale, registerName);
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

    <PausePlanTool days={messages.days} ics={messages.ics} letters={pauseLettersEnabled()} locale={contentLocale} messages={messages.tool} register={messages.register} registers={messages.registers} />

    <section className={styles.dayEleven} data-nav-theme="dark"><div>
      <h2>{messages.dayEleven.heading}</h2>
      <p>{messages.dayEleven.body}</p>
      <Link className={styles.cta} data-pause-plan-start href={startHref}>{messages.dayEleven.cta}</Link>
    </div></section>

    <section className={styles.notBack} data-nav-theme="dark" data-pause-plan-not-back><div>
      <h2>{messages.notBack.heading}</h2>
      <p>{messages.notBack.intro}</p>
      <CopyText className={styles.copy} copiedLabel={messages.notBack.copied} copyLabel={messages.notBack.copy} lines={messages.notBack.lines} />
      <p><a href={messages.notBack.supportHref} rel="noopener noreferrer" target="_blank">{messages.notBack.supportLabel}</a></p>
    </div></section>

    {guides.length > 0 ? <section className={styles.questions} data-nav-theme="dark" data-pause-plan-guides><div>
      <h2>{messages.questionsHeading}</h2>
      <p>{messages.questionsIntro}</p>
      <ul>
        {guides.map((guide) => <li key={guide.id}><Link href={productHref(presentation, articlePath(guide))}>{guide.title}</Link></li>)}
      </ul>
    </div></section> : null}

    <section className={styles.faq} data-nav-theme="dark"><div>
      <h2>{messages.faqHeading}</h2>
      <dl>
        {messages.faq.map(([question, answer]) => <div key={question}><dt>{question}</dt><dd>{answer}</dd></div>)}
      </dl>
      <p className={styles.more}><Link data-pause-plan-control-link href={productHref(presentation, CONTROL_PATHS.hub)}>{controlSharedMessages(contentLocale).moreLink}</Link></p>
    </div></section>

    <section className={styles.support} data-nav-theme="dark"><div>
      <h2>{messages.supportHeading}</h2>
      <ul>
        {messages.support.map((line) => <li key={line.href}><a href={line.href} rel="noopener noreferrer" target="_blank">{line.label}</a></li>)}
      </ul>
    </div></section>
  </div>;
}
