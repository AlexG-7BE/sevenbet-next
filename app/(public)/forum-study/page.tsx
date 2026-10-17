import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";

import { CleanRouteRevenueLine } from "@/components/clean-route/CleanRouteRevenueLine";
import { JsonLd } from "@/components/seo/JsonLd";
import styles from "./ForumStudy.module.css";
import { forumStudyLocale, forumStudyMessages, type ForumStudyRow } from "@/lib/i18n/static-pages/forum-study";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";
import { withSiteNameDeep } from "@/lib/site/help-copy";
import { HELP_SITE_NAME } from "@/lib/site/host-gate";
import { resolveServerSite } from "@/lib/site/server-site";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const site = await resolveServerSite();
  const messages = withSiteNameDeep(forumStudyMessages(presentation.locale), site);
  return productMetadata({ presentation, pathname: "/forum-study", title: messages.metadataTitle, description: messages.metadataDescription, site });
}

/** Every figure prints its own denominator, because no row on this page is a share of people. */
function Figures({ rows }: { rows: readonly ForumStudyRow[] }) {
  return <div className={styles.scroll}><table>
    <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.value}</td><td>{row.of}</td></tr>)}</tbody>
  </table></div>;
}

/**
 * Open data instead of a press release (Founder decision, 13 October 2026): the read-out of
 * 3,299 coded forum posts about gambling, debt and self-exclusion. The study is in the content
 * repo at `research/study/`; `research/study/aggregates-csv.mjs` writes the CSV this page links.
 *
 * Every number was recomputed from the coded files on 18 October 2026. The page publishes no
 * payday claim, no year-on-year trend and no Danish figure — the material cannot carry them, and
 * the "what this cannot show" section says so rather than hiding it in a method note. No casino
 * and no offer is named or linked anywhere in the page body.
 */
export default async function ForumStudyPage() {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  const messages = withSiteNameDeep(forumStudyMessages(presentation.locale), site);
  const contentLocale = forumStudyLocale(presentation.locale);
  const url = absoluteUrl(productCanonicalPath(presentation, "/forum-study"), site);
  const title = `${messages.titleLead} ${messages.titleEmphasis}`;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: title,
      description: messages.metadataDescription,
      url,
      inLanguage: contentLocale,
      license: "https://creativecommons.org/licenses/by/4.0/",
      creator: { "@type": "Organization", name: site === "help" ? HELP_SITE_NAME : "B4GAMBLE", url: absoluteUrl("/", site) },
      distribution: [{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: absoluteUrl(messages.data.csvHref, site) }],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: messages.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/"), site) },
        { "@type": "ListItem", position: 2, name: messages.breadcrumbLabel, item: url },
      ],
    },
  ];

  return <div className={`${styles.page} ${instrumentSerif.variable}`} data-runtime-renderer="forum-study" lang={contentLocale === presentation.locale ? undefined : "en"}>
    <JsonLd data={schema} />
    <header className={styles.header} data-nav-theme="dark"><div>
      <small>{messages.eyebrow}</small>
      <h1>{messages.titleLead} <em>{messages.titleEmphasis}</em></h1>
      <p>{messages.intro}</p>
      <p className={styles.revenue} data-clean-route-line><CleanRouteRevenueLine mainLine={messages.revenueLine} presentation={presentation} site={site} /></p>
    </div></header>

    <div className={styles.body}>
      <section className={styles.card} data-nav-theme="dark" data-study="material">
        <h2>{messages.material.heading}</h2>
        <p>{messages.material.body}</p>
        <Figures rows={messages.material.rows} />
        <p className={styles.note}>{messages.material.note}</p>
      </section>

      <section className={styles.card} data-nav-theme="dark" data-study="who">
        <h2>{messages.whoWrites.heading}</h2>
        <p>{messages.whoWrites.body}</p>
        <Figures rows={messages.whoWrites.rows} />
      </section>

      <section className={`${styles.card} ${styles.lead}`} data-nav-theme="dark" data-study="register">
        <h2>{messages.register.heading}</h2>
        <p>{messages.register.body}</p>
        <Figures rows={messages.register.rows} />
        <p className={styles.note}>{messages.register.note}</p>
      </section>

      <section className={styles.card} data-nav-theme="dark" data-study="money">
        <h2>{messages.money.heading}</h2>
        <p>{messages.money.body}</p>
        <Figures rows={messages.money.rows} />
        <p className={styles.note}>{messages.money.note}</p>
      </section>

      <section className={styles.card} data-nav-theme="dark" data-study="helped">
        <h2>{messages.helped.heading}</h2>
        <p>{messages.helped.body}</p>
        <Figures rows={messages.helped.rows} />
        <p className={styles.note}>{messages.helped.note}</p>
      </section>

      <section className={styles.card} data-nav-theme="dark" data-study="counters">
        <h2>{messages.counters.heading}</h2>
        <p>{messages.counters.body}</p>
        <Figures rows={messages.counters.rows} />
      </section>

      <section className={`${styles.card} ${styles.cannot}`} data-nav-theme="dark" data-study="cannot">
        <h2>{messages.cannot.heading}</h2>
        <p>{messages.cannot.intro}</p>
        <ul>{messages.cannot.items.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className={styles.card} data-nav-theme="dark" data-study="method">
        <h2>{messages.method.heading}</h2>
        <ul>{messages.method.items.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className={styles.card} data-nav-theme="dark" data-study="data">
        <h2>{messages.data.heading}</h2>
        <p>{messages.data.body}</p>
        <p><a className={styles.download} download href={messages.data.csvHref}>{messages.data.csvLabel}</a></p>
        <p className={styles.note}>{messages.data.licence}</p>
      </section>

      <section className={`${styles.card} ${styles.next}`} data-nav-theme="dark" data-study="next">
        <h2>{messages.next.heading}</h2>
        <p>{messages.next.body}</p>
        <p className={styles.actions}>
          <Link className={styles.cta} href={productHref(presentation, "/pause-plan")}>{messages.next.planLabel}</Link>
          <Link className={styles.ctaQuiet} href={`${programmePathForPresentationLocale(presentation.locale)}?entry=start`}>{messages.next.programmeLabel}</Link>
        </p>
      </section>

      <section className={styles.sources} data-nav-theme="dark" data-study="sources">
        <h2>{messages.sources.heading}</h2>
        <p>{messages.sources.body}</p>
        <p><Link href={productHref(presentation, "/pause-statistics")}>{messages.sources.statisticsLabel}</Link></p>
      </section>
    </div>
  </div>;
}
