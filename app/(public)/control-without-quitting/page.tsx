import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";

import { JsonLd } from "@/components/seo/JsonLd";
import { ControlCard, ControlFaqSection, ControlHeader, ControlRelated, ControlHelpBox, ControlStart } from "../gambling-control/ControlPage";
import styles from "../gambling-control/GamblingControl.module.css";
import { withoutQuittingMessages } from "@/lib/i18n/static-pages/control-without-quitting";
import { CONTROL_PATHS, controlLocale, controlRelatedLinks, controlSharedMessages } from "@/lib/i18n/static-pages/gambling-control";
import { currentProgrammeJourney } from "@/lib/i18n/static-pages/ten-steps";
import { controlPageSchema } from "@/lib/seo/control-page-schema";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";
import { resolveServerSite } from "@/lib/site/server-site";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const messages = withoutQuittingMessages(presentation.locale);
  return productMetadata({ presentation, pathname: CONTROL_PATHS.withoutQuitting, title: messages.metadataTitle, description: messages.metadataDescription });
}

/**
 * "How can I keep my gambling under control without quitting?" (Founder decision, 15 October
 * 2026): the complete answer first, the three rules, the Programme's real steps in journey order
 * (read from the catalogue, never written here) and the first step when gambling already hurts.
 */
export default async function ControlWithoutQuittingPage() {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  const messages = withoutQuittingMessages(presentation.locale);
  const shared = controlSharedMessages(presentation.locale);
  const contentLocale = controlLocale(presentation.locale);
  const steps = currentProgrammeJourney(contentLocale);
  const url = absoluteUrl(productCanonicalPath(presentation, CONTROL_PATHS.withoutQuitting), site);
  const startHref = `${programmePathForPresentationLocale(presentation.locale)}?entry=start`;
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

  return <div className={`${styles.page} ${instrumentSerif.variable}`} data-runtime-renderer="control-without-quitting" lang={contentLocale === presentation.locale ? undefined : "en"}>
    <JsonLd data={schema} />
    <ControlHeader presentation={presentation} site={site} answer={messages.answer} eyebrow={messages.eyebrow} shared={shared} titleEmphasis={messages.titleEmphasis} titleLead={messages.titleLead} />

    <div className={styles.body}>
      <ControlCard heading={messages.control.heading} id="control">
        <p>{messages.control.intro}</p>
        <ul className={styles.rules}>
          {messages.control.rules.map((rule) => <li key={rule.title}><h3>{rule.title}</h3><p>{rule.body}</p></li>)}
        </ul>
        <p className={styles.line} data-control-line>{messages.control.line}</p>
      </ControlCard>

      <ControlCard heading={messages.steps.heading} id="steps">
        <p>{messages.steps.intro}</p>
        <ol className={styles.steps} data-control-steps>
          {steps.map((step) => <li key={step.title}><strong>{step.title}</strong><p>{step.description}</p></li>)}
        </ol>
        <p className={styles.note}>{messages.steps.note}</p>
      </ControlCard>

      <ControlHelpBox body={messages.notForYou.body} heading={messages.notForYou.heading} links={shared.help} />

      <ControlStart href={startHref} shared={shared} />

      <ControlFaqSection faq={messages.faq} heading={shared.faqHeading} />

      <ControlRelated site={site} heading={shared.relatedHeading} hrefFor={(href) => productHref(presentation, href)} links={controlRelatedLinks(presentation.locale, CONTROL_PATHS.withoutQuitting)} />
    </div>
  </div>;
}
