import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "../ForCreators.module.css";
import { readSocialTraffic } from "@/lib/analytics/social-traffic.server";
import { forCreatorsLocale, forCreatorsMessages } from "@/lib/i18n/static-pages/for-creators";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { absoluteUrl } from "@/lib/site";
import { creatorPage } from "@/lib/tools/creator-terms";

export const dynamic = "force-dynamic";

const COUNTER_DAYS = 90;

export async function generateMetadata({ params }: { params: Promise<{ creator: string }> }): Promise<Metadata> {
  const { creator } = await params;
  const page = creatorPage(creator);
  const presentation = await resolveServerPresentationContext();
  const messages = forCreatorsMessages(presentation.locale);
  // A page that carries a person's name is reached by its link only: never listed, never indexed.
  return productMetadata({ presentation, pathname: `/for-creators/${page?.slug ?? creator}`, title: page ? `${messages.named.title} – ${page.name}` : messages.named.title, description: messages.named.intro, robots: { index: false, follow: false } });
}

/** Consented visits with the creator's tag and the partner clicks among them that reached an operator, last 90 days. Counts only. */
async function counter(slug: string) {
  try {
    const now = new Date();
    const from = new Date(now.getTime() - COUNTER_DAYS * 86_400_000);
    const result = await readSocialTraffic({ from: from.toISOString(), to: now.toISOString(), utmSource: slug, groupBy: "source", limit: 1 });
    return { visits: result.totals.sessions, clicks: result.totals.partnerClicks };
  } catch {
    return null;
  }
}

/**
 * A creator's named page with a live counter that starts at zero (Founder decision, 13 October
 * 2026): it exists before any request, and one email removes it. The counter reads the same
 * aggregates as the Founder's social-traffic reports: counts only, nothing about any visitor.
 */
export default async function CreatorPage({ params }: { params: Promise<{ creator: string }> }) {
  const { creator } = await params;
  const page = creatorPage(creator);
  if (!page) notFound();
  const presentation = await resolveServerPresentationContext();
  const messages = forCreatorsMessages(presentation.locale);
  const contentLocale = forCreatorsLocale(presentation.locale);
  const counts = await counter(page.slug);
  const link = `${absoluteUrl(productCanonicalPath(presentation, "/"))}?utm_source=${page.slug}&utm_medium=creator`;
  const number = new Intl.NumberFormat(contentLocale, { maximumFractionDigits: 0 });

  return <div className={styles.page} data-runtime-renderer="for-creators-named" lang={contentLocale === presentation.locale ? undefined : "en"}>
    <header className={styles.header} data-nav-theme="dark"><div>
      <small>{messages.named.eyebrow}</small>
      <h1>{messages.named.title} <em>{page.name}</em></h1>
      <p>{messages.named.intro}</p>
    </div></header>
    <div className={styles.body}>
      <section className={styles.card} data-nav-theme="dark">
        <h2>{messages.named.linkLabel}</h2>
        <p className={styles.link} data-creator-link>{link}</p>
      </section>
      <section className={styles.counter} data-creator-counter={counts ? "live" : "unavailable"} data-nav-theme="dark">
        {counts
          ? <dl>
            <div><dt>{messages.named.visits} · {messages.named.period}</dt><dd>{number.format(counts.visits)}</dd></div>
            <div><dt>{messages.named.clicks} · {messages.named.period}</dt><dd>{number.format(counts.clicks)}</dd></div>
          </dl>
          : <p>{messages.named.unavailable}</p>}
        <p>{messages.named.cards}</p>
        <p>{messages.named.keep}</p>
        <p><Link href={productHref(presentation, "/for-creators")}>{messages.breadcrumbLabel}</Link></p>
      </section>
    </div>
  </div>;
}
