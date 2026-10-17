import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import styles from "./PauseStatistics.module.css";
import { pauseStatisticsLocale, pauseStatisticsMessages, type StatisticsRow } from "@/lib/i18n/static-pages/pause-statistics";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { absoluteUrl } from "@/lib/site";
import { CleanRouteRevenueLine } from "@/components/clean-route/CleanRouteRevenueLine";
import { resolveServerSite } from "@/lib/site/server-site";
import { HELP_SITE_NAME } from "@/lib/site/host-gate";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const site = await resolveServerSite();
  const messages = pauseStatisticsMessages(presentation.locale);
  return productMetadata({ presentation, pathname: "/pause-statistics", title: messages.metadataTitle, description: messages.metadataDescription, site });
}

function Table({ rows }: { rows: readonly StatisticsRow[] }) {
  return <div className={styles.scroll}><table>
    <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.value}</td><td>{row.source}</td></tr>)}</tbody>
  </table></div>;
}

/**
 * Open data instead of a press release (Founder decision, 13 October 2026): the regulators'
 * figures with sources and CSV, what nobody publishes, our public-records requests, the first
 * cut of the forum corpus. No casino is named or linked; the page's only call is the day after.
 */
export default async function PauseStatisticsPage() {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  const messages = pauseStatisticsMessages(presentation.locale);
  const contentLocale = pauseStatisticsLocale(presentation.locale);
  const url = absoluteUrl(productCanonicalPath(presentation, "/pause-statistics"), site);
  const title = `${messages.titleLead} ${messages.titleEmphasis}`;
  const schema = [
    { "@context": "https://schema.org", "@type": "Dataset", name: title, description: messages.metadataDescription, url, inLanguage: contentLocale, license: "https://creativecommons.org/licenses/by/4.0/", creator: { "@type": "Organization", name: site === "help" ? HELP_SITE_NAME : "B4GAMBLE", url: absoluteUrl("/", site) }, distribution: [{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: absoluteUrl(messages.register.csvHref, site) }] },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: messages.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/"), site) }, { "@type": "ListItem", position: 2, name: messages.breadcrumbLabel, item: url }] },
  ];

  return <div className={`${styles.page} ${instrumentSerif.variable}`} data-runtime-renderer="pause-statistics" lang={contentLocale === presentation.locale ? undefined : "en"}>
    <JsonLd data={schema} />
    <header className={styles.header} data-nav-theme="dark"><div>
      <small>{messages.eyebrow}</small>
      <h1>{messages.titleLead} <em>{messages.titleEmphasis}</em></h1>
      <p>{messages.intro}</p>
      <p className={styles.revenue} data-clean-route-line><CleanRouteRevenueLine mainLine={messages.revenueLine} presentation={presentation} site={site} /></p>
    </div></header>

    <div className={styles.body}>
      <section className={styles.card} data-nav-theme="dark" data-statistics="register">
        <h2>{messages.register.heading}</h2>
        <Table rows={messages.register.rows} />
        <p><a className={styles.download} download href={messages.register.csvHref}>{messages.register.csvLabel}</a></p>
        <p className={styles.note}>{messages.register.licence}</p>
      </section>

      <section className={styles.card} data-nav-theme="dark">
        <h2>{messages.periods.heading}</h2>
        <p>{messages.periods.body}</p>
      </section>

      <section className={`${styles.card} ${styles.unknown}`} data-nav-theme="dark" data-statistics="unknown">
        <h2>{messages.unknown.heading}</h2>
        <p>{messages.unknown.intro}</p>
        <ul>{messages.unknown.items.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className={styles.card} data-nav-theme="dark" data-statistics="requests">
        <h2>{messages.requests.heading}</h2>
        <p>{messages.requests.body}</p>
        <p className={styles.status}>{messages.requests.status}</p>
      </section>

      <section className={styles.card} data-nav-theme="dark" data-statistics="corpus">
        <h2>{messages.corpus.heading}</h2>
        <p>{messages.corpus.body}</p>
        <Table rows={messages.corpus.rows} />
        <p className={styles.note}>{messages.corpus.method}</p>
      </section>

      <section className={`${styles.card} ${styles.dayEleven}`} data-nav-theme="dark">
        <h2>{messages.dayEleven.heading}</h2>
        <p>{messages.dayEleven.body}</p>
        <Link className={styles.cta} href={productHref(presentation, "/pause-plan")}>{messages.dayEleven.cta}</Link>
      </section>

      <section className={styles.sources} data-nav-theme="dark">
        <h2>{messages.sources.heading}</h2>
        <ul>{messages.sources.items.map((item) => <li key={item.href}><a href={item.href} rel="noopener noreferrer" target="_blank">{item.label}</a></li>)}</ul>
      </section>
    </div>
  </div>;
}
