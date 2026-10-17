import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/JsonLd";
import { InnanTool } from "./InnanTool";
import styles from "./Innan.module.css";
import { innanLocale, innanMessages } from "@/lib/i18n/static-pages/innan";
import { productCanonicalPath, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { resolveServerSite } from "@/lib/site/server-site";
import { absoluteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const site = await resolveServerSite();
  const messages = innanMessages(presentation.locale);
  return productMetadata({ presentation, pathname: "/innan", title: messages.metadataTitle, description: messages.metadataDescription, site });
}

/**
 * The rule before the app (Founder decision, 13 October 2026). An ordinary landing page: it
 * never links to a casino and changes nothing in the menu. The rule and the weekly count live
 * in the browser only.
 */
export default async function InnanPage() {
  const presentation = await resolveServerPresentationContext();
  const site = await resolveServerSite();
  const messages = innanMessages(presentation.locale);
  const contentLocale = innanLocale(presentation.locale);
  const url = absoluteUrl(productCanonicalPath(presentation, "/innan"), site);
  const schema = [
    { "@context": "https://schema.org", "@type": "WebPage", name: messages.title, description: messages.metadataDescription, url, inLanguage: contentLocale, isAccessibleForFree: true, publisher: { "@type": "Organization", name: "B4GAMBLE", url: absoluteUrl("/", site) } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: messages.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/"), site) }, { "@type": "ListItem", position: 2, name: messages.breadcrumbLabel, item: url }] },
  ];

  return <div className={styles.page} data-runtime-renderer="innan" lang={contentLocale === presentation.locale ? undefined : "en"}>
    <JsonLd data={schema} />
    <header className={styles.header} data-nav-theme="dark"><div>
      <small>{messages.eyebrow}</small>
      <h1>{messages.title}</h1>
      <p>{messages.intro}</p>
      <p className={styles.revenue} data-clean-route-line>{messages.revenueLine}</p>
    </div></header>
    <div className={styles.body}>
      <InnanTool messages={messages} />
      <section className={styles.howTo} data-nav-theme="dark">
        <h2>{messages.howTo.heading}</h2>
        <ol>{messages.howTo.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      </section>
    </div>
  </div>;
}
