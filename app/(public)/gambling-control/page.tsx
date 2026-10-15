import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { ControlFaqSection, ControlHeader, ControlHelpBox, ControlStart } from "./ControlPage";
import styles from "./GamblingControl.module.css";
import { CONTROL_PATHS, controlLocale, controlSharedMessages, gamblingControlHubMessages } from "@/lib/i18n/static-pages/gambling-control";
import { controlPageSchema } from "@/lib/seo/control-page-schema";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const messages = gamblingControlHubMessages(presentation.locale);
  return productMetadata({ presentation, pathname: CONTROL_PATHS.hub, title: messages.metadataTitle, description: messages.metadataDescription });
}

/**
 * The hub of the answer pages (Founder decision, 15 October 2026): the one phrase first, then a
 * card for each question, the pause plan, the ten steps and Help. It links to no casino.
 */
export default async function GamblingControlPage() {
  const presentation = await resolveServerPresentationContext();
  const messages = gamblingControlHubMessages(presentation.locale);
  const shared = controlSharedMessages(presentation.locale);
  const contentLocale = controlLocale(presentation.locale);
  const url = absoluteUrl(productCanonicalPath(presentation, CONTROL_PATHS.hub));
  const startHref = `${programmePathForPresentationLocale(presentation.locale)}?entry=start`;
  const schema = controlPageSchema({
    name: `${messages.titleLead} ${messages.titleEmphasis}`,
    description: messages.metadataDescription,
    url,
    inLanguage: contentLocale,
    faq: messages.faq,
    breadcrumbs: [
      { name: shared.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/")) },
      { name: shared.hubLabel, item: url },
    ],
  });

  return <div className={`${styles.page} ${instrumentSerif.variable}`} data-runtime-renderer="gambling-control" lang={contentLocale === presentation.locale ? undefined : "en"}>
    <JsonLd data={schema} />
    <ControlHeader answer={messages.answer} eyebrow={messages.eyebrow} intro={[messages.intro]} shared={shared} titleEmphasis={messages.titleEmphasis} titleLead={messages.titleLead} />

    <div className={styles.body}>
      <section className={styles.card} data-control-section="questions" data-nav-theme="dark">
        <h2>{messages.cardsHeading}</h2>
        <ul className={styles.cards}>
          {messages.cards.map((card) => <li key={card.path}>
            <Link data-control-card={card.path} href={productHref(presentation, card.path)}><strong>{card.title}</strong><span>{card.body}</span></Link>
          </li>)}
        </ul>
      </section>

      <ControlHelpBox body={messages.firstStep.body} heading={messages.firstStep.heading} links={shared.help} />

      <ControlStart href={startHref} shared={shared} />

      <ControlFaqSection faq={messages.faq} heading={shared.faqHeading} />
    </div>
  </div>;
}
