import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { ControlCard, ControlFaqSection, ControlHeader, ControlRelated, ControlStart } from "../gambling-control/ControlPage";
import styles from "../gambling-control/GamblingControl.module.css";
import { trustMessages } from "@/lib/i18n/static-pages/can-you-trust-b4gamble";
import { CONTROL_PATHS, controlLocale, controlRelatedLinks, controlSharedMessages } from "@/lib/i18n/static-pages/gambling-control";
import { controlPageSchema } from "@/lib/seo/control-page-schema";
import { productCanonicalPath, productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { absoluteUrl } from "@/lib/site";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });

export async function generateMetadata(): Promise<Metadata> {
  const presentation = await resolveServerPresentationContext();
  const messages = trustMessages(presentation.locale);
  return productMetadata({ presentation, pathname: CONTROL_PATHS.trust, title: messages.metadataTitle, description: messages.metadataDescription });
}

/**
 * "Can you trust B4GAMBLE if it earns money from casinos?" (Founder decision, 15 October 2026):
 * how the site earns, what is free, what it does not do, when casino pages appear for a person in
 * the Programme and what stays private, each as the code behaves (see the copy module). The page
 * body links to no casino page; since 17 October 2026 the site menu around it does, and the copy
 * says so (docs/07_Decisions/COMMERCIAL-MENU-FOR-EVERYONE-2026-10-17.md).
 */
export default async function CanYouTrustPage() {
  const presentation = await resolveServerPresentationContext();
  const messages = trustMessages(presentation.locale);
  const shared = controlSharedMessages(presentation.locale);
  const contentLocale = controlLocale(presentation.locale);
  const url = absoluteUrl(productCanonicalPath(presentation, CONTROL_PATHS.trust));
  const startHref = `${programmePathForPresentationLocale(presentation.locale)}?entry=start`;
  const schema = controlPageSchema({
    name: `${messages.titleLead} ${messages.titleEmphasis}`,
    description: messages.metadataDescription,
    url,
    inLanguage: contentLocale,
    faq: messages.faq,
    breadcrumbs: [
      { name: shared.homeLabel, item: absoluteUrl(productCanonicalPath(presentation, "/")) },
      { name: shared.hubLabel, item: absoluteUrl(productCanonicalPath(presentation, CONTROL_PATHS.hub)) },
      { name: messages.breadcrumbLabel, item: url },
    ],
  });

  return <div className={`${styles.page} ${instrumentSerif.variable}`} data-runtime-renderer="can-you-trust-b4gamble" lang={contentLocale === presentation.locale ? undefined : "en"}>
    <JsonLd data={schema} />
    <ControlHeader presentation={presentation} site="main" answer={messages.answer} eyebrow={messages.eyebrow} shared={shared} titleEmphasis={messages.titleEmphasis} titleLead={messages.titleLead} />

    <div className={styles.body}>
      {messages.sections.map((section) => <ControlCard heading={section.heading} id={section.id} key={section.id}>
        {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {section.items ? <ul className={styles.list}>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
      </ControlCard>)}

      <ControlCard heading={messages.linksHeading} id="rules">
        <ul className={styles.list}>
          {messages.links.map((link) => <li key={link.path}><Link href={productHref(presentation, link.path)}>{link.label}</Link></li>)}
        </ul>
      </ControlCard>

      <ControlStart href={startHref} shared={shared} />

      <ControlFaqSection faq={messages.faq} heading={shared.faqHeading} />

      <ControlRelated site="main" heading={shared.relatedHeading} hrefFor={(href) => productHref(presentation, href)} links={controlRelatedLinks(presentation.locale, CONTROL_PATHS.trust)} />
    </div>
  </div>;
}
