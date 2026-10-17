import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { ControlCard, ControlFaqSection, ControlHeader, ControlRelated, ControlStart } from "../gambling-control/ControlPage";
import styles from "../gambling-control/GamblingControl.module.css";
import { CONTROL_PATHS, controlLocale, controlRelatedLinks, controlSharedMessages } from "@/lib/i18n/static-pages/gambling-control";
import { controlToolsMessages } from "@/lib/i18n/static-pages/gambling-control-tools";
import { controlPageSchema } from "@/lib/seo/control-page-schema";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";
import { resolveServerSite } from "@/lib/site/server-site";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const messages = controlToolsMessages(presentation.locale);
  return productMetadata({ presentation, pathname: CONTROL_PATHS.tools, title: messages.metadataTitle, description: messages.metadataDescription });
}

/**
 * "Which gambling control tool fits you?" (Founder decision, 15 October 2026): one honest table
 * for the page language's market, B4GAMBLE in its own row, and the sources every cell was read on.
 * The table is a real <table>; on a phone each tool becomes a card (GamblingControl.module.css).
 */
export default async function GamblingControlToolsPage() {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  const messages = controlToolsMessages(presentation.locale);
  const shared = controlSharedMessages(presentation.locale);
  const contentLocale = controlLocale(presentation.locale);
  const url = absoluteUrl(productCanonicalPath(presentation, CONTROL_PATHS.tools), site);
  const startHref = `${programmePathForPresentationLocale(presentation.locale)}?entry=start`;
  const { columns } = messages;
  const schema = controlPageSchema({
    site,
    name: messages.question,
    description: messages.metadataDescription,
    url,
    inLanguage: contentLocale,
    faq: messages.faq,
    breadcrumbs: [
      { name: shared.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/"), site) },
      { name: shared.hubLabel, item: absoluteUrl(productCanonicalPath(presentation, CONTROL_PATHS.hub)) },
      { name: messages.breadcrumbLabel, item: url },
    ],
  });

  return <div className={`${styles.page} ${instrumentSerif.variable}`} data-runtime-renderer="gambling-control-tools" lang={contentLocale === presentation.locale ? undefined : "en"}>
    <JsonLd data={schema} />
    <ControlHeader presentation={presentation} site={site} answer={messages.answer} eyebrow={messages.eyebrow} shared={shared} titleEmphasis={messages.titleEmphasis} titleLead={messages.titleLead} />

    <div className={styles.body}>
      <ControlCard heading={messages.tableHeading} id="tools">
        <table className={styles.table} data-control-tools-table>
          <caption>{messages.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{columns.tool}</th>
              <th scope="col">{columns.does}</th>
              <th scope="col">{columns.cost}</th>
              <th scope="col">{columns.notCovered}</th>
              <th scope="col">{columns.fits}</th>
            </tr>
          </thead>
          <tbody>
            {messages.rows.map((row) => <tr data-control-tool={row.id} key={row.id}>
              <th scope="row">{row.tool}<small>{row.kind}</small></th>
              <td data-label={columns.does}>{row.does}</td>
              <td data-label={columns.cost}>{row.cost}</td>
              <td data-label={columns.notCovered}>{row.notCovered}</td>
              <td data-label={columns.fits}>
                {row.fits}
                {row.fitsLink ? <> <Link href={productHref(presentation, row.fitsLink.path)}>{row.fitsLink.label}</Link></> : null}
              </td>
            </tr>)}
          </tbody>
        </table>
        {messages.notes.map((note) => <p className={styles.note} key={note}>{note}</p>)}
        {messages.otherMarkets ? <>
          <p>{messages.otherMarkets.text}</p>
          <ul className={styles.list}>
            {messages.otherMarkets.links.map((link) => <li key={link.href}><Link hrefLang={link.href.slice(1, 3)} href={link.href}>{link.label}</Link></li>)}
          </ul>
        </> : null}
      </ControlCard>

      <ControlStart href={startHref} shared={shared} />

      <ControlFaqSection faq={messages.faq} heading={shared.faqHeading} />

      <section className={`${styles.card} ${styles.sources}`} data-control-sources data-nav-theme="dark">
        <h2>{messages.sourcesHeading}</h2>
        <ul>
          {messages.sources.map((source) => <li key={source.href}><a href={source.href} rel="noopener noreferrer" target="_blank">{source.label}</a></li>)}
        </ul>
      </section>

      <ControlRelated site={site} heading={shared.relatedHeading} hrefFor={(href) => productHref(presentation, href)} links={controlRelatedLinks(presentation.locale, CONTROL_PATHS.tools)} />
    </div>
  </div>;
}
