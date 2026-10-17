import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";

import { CopyText } from "@/components/clean-route/CopyText";
import { JsonLd } from "@/components/seo/JsonLd";
import styles from "./Beside.module.css";
import { besideLocale, besideMessages } from "@/lib/i18n/static-pages/beside";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { absoluteUrl } from "@/lib/site";
import { CleanRouteRevenueLine } from "@/components/clean-route/CleanRouteRevenueLine";
import { resolveServerSite } from "@/lib/site/server-site";
import { HELP_HOST, withHelpOrigin, withSiteNameDeep } from "@/lib/site/help-copy";
import { HELP_SITE_NAME } from "@/lib/site/host-gate";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const site = await resolveServerSite();
  const messages = withSiteNameDeep(besideMessages(presentation.locale), site);
  return productMetadata({ presentation, pathname: "/beside", title: messages.metadataTitle, description: messages.metadataDescription, site });
}

/**
 * For the person beside a player (Founder decision, 13 October 2026): an entrance from search,
 * not an exit from a Mission. An ordinary landing page: no casino, no account, and it changes
 * nothing in the menu.
 */
export default async function BesidePage() {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  const messages = withSiteNameDeep(besideMessages(presentation.locale), site);
  const contentLocale = besideLocale(presentation.locale);
  const url = absoluteUrl(productCanonicalPath(presentation, "/beside"), site);
  const title = `${messages.titleLead} ${messages.titleEmphasis}`;
  const schema = [
    { "@context": "https://schema.org", "@type": "WebPage", name: title, description: messages.metadataDescription, url, inLanguage: contentLocale, isAccessibleForFree: true, publisher: { "@type": "Organization", name: site === "help" ? HELP_SITE_NAME : "B4GAMBLE", url: absoluteUrl("/", site) } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: messages.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/"), site) }, { "@type": "ListItem", position: 2, name: messages.breadcrumbLabel, item: url }] },
  ];

  return <div className={`${styles.page} ${instrumentSerif.variable}`} data-runtime-renderer="beside" lang={contentLocale === presentation.locale ? undefined : "en"}>
    <JsonLd data={schema} />
    <header className={styles.header} data-nav-theme="dark"><div>
      <small>{messages.eyebrow}</small>
      <h1>{messages.titleLead} <em>{messages.titleEmphasis}</em></h1>
      <p>{messages.intro}</p>
      <p className={styles.revenue} data-clean-route-line><CleanRouteRevenueLine mainLine={messages.revenueLine} presentation={presentation} site={site} /></p>
    </div></header>

    <div className={styles.body}>
      <section className={styles.card} data-nav-theme="dark">
        <h2>{messages.realNumber.heading}</h2>
        <p>{messages.realNumber.body}</p>
        <ul>{messages.realNumber.items.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className={`${styles.card} ${styles.message}`} data-nav-theme="dark">
        <h2>{messages.message.heading}</h2>
        <p>{messages.message.intro}</p>
        <CopyText className={styles.copy} copiedLabel={messages.message.copied} copyLabel={messages.message.copy} text={withHelpOrigin(messages.message.text, site)} />
        <p className={styles.note}>{messages.message.after} <Link href={productHref(presentation, messages.planLink)}>{site === "help" ? HELP_HOST : "b4gamble.com"}{productCanonicalPath(presentation, messages.planLink)}</Link></p>
      </section>

      <section className={`${styles.card} ${styles.dayEleven}`} data-nav-theme="dark">
        <h2>{messages.dayEleven.heading}</h2>
        <p>{messages.dayEleven.body}</p>
      </section>

      <section className={styles.card} data-nav-theme="dark">
        <h2>{messages.forYou.heading}</h2>
        <p>{messages.forYou.body}</p>
      </section>

      <section className={styles.support} data-nav-theme="dark">
        <h2>{messages.supportHeading}</h2>
        <ul>{messages.support.map((line) => <li key={line.href}><a href={line.href} rel="noopener noreferrer" target="_blank">{line.label}</a></li>)}</ul>
      </section>
    </div>
  </div>;
}
