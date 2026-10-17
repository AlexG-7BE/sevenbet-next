import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./GamblingControl.module.css";
import { CleanRouteRevenueLine } from "@/components/clean-route/CleanRouteRevenueLine";
import { CONTROL_PAGES_UPDATED, type ControlFaq, type ControlLink, type ControlSharedMessages } from "@/lib/i18n/static-pages/gambling-control";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { helpRoutePath } from "@/lib/site/help-copy";
import type { SiteClass } from "@/lib/site/host-gate";

/**
 * The parts the four answer pages share (Founder decision, 15 October 2026): the header with the
 * visible update line and the revenue line, the first step when gambling already hurts, the FAQ,
 * the Programme start. Server components only; nothing runs in the browser. The structured data
 * lives in lib/seo/control-page-schema.ts.
 */
export function ControlHeader({ eyebrow, titleLead, titleEmphasis, answer, intro = [], shared, presentation, site }: {
  eyebrow: string;
  titleLead: string;
  titleEmphasis: string;
  /** The complete answer, first on the page, so an assistant can lift it whole. */
  answer: string;
  intro?: readonly string[];
  shared: ControlSharedMessages;
  presentation: PresentationResolution;
  site: SiteClass;
}) {
  return <header className={styles.header} data-nav-theme="dark"><div>
    <small>{eyebrow}</small>
    <h1>{titleLead} <em>{titleEmphasis}</em></h1>
    <p className={styles.answer} data-control-answer>{answer}</p>
    {intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    <p className={styles.meta}>
      <span data-control-updated>{shared.updatedLabel} <time dateTime={CONTROL_PAGES_UPDATED}>{shared.updatedDate}</time></span>
      <span data-clean-route-line><CleanRouteRevenueLine mainLine={shared.revenueLine} presentation={presentation} site={site} /></span>
    </p>
  </div></header>;
}

export function ControlHelpBox({ heading, body, links }: { heading: string; body: string; links: readonly ControlLink[] }) {
  return <section className={styles.firstStep} data-control-first-step data-nav-theme="dark">
    <h2>{heading}</h2>
    <p>{body}</p>
    <ul className={styles.help}>
      {links.map((link) => <li key={link.href + link.label}>
        <a href={link.href} rel="noopener noreferrer" target="_blank">{link.label}</a>
        {link.note ? <span>{link.note}</span> : null}
      </li>)}
    </ul>
  </section>;
}

export function ControlFaqSection({ heading, faq }: { heading: string; faq: ControlFaq }) {
  return <section className={`${styles.card} ${styles.faq}`} data-control-faq data-nav-theme="dark">
    <h2>{heading}</h2>
    <dl>
      {faq.map(([question, answer]) => <div key={question}><dt>{question}</dt><dd>{answer}</dd></div>)}
    </dl>
  </section>;
}

export function ControlStart({ shared, href }: { shared: ControlSharedMessages; href: string }) {
  return <section className={styles.start} data-control-start data-nav-theme="dark">
    <h2>{shared.start.heading}</h2>
    <p>{shared.start.body}</p>
    <Link className={styles.cta} data-control-programme-start href={href}>{shared.start.cta}</Link>
  </section>;
}

export function ControlCard({ heading, children, id }: { heading: string; children: ReactNode; id?: string }) {
  return <section className={styles.card} data-control-section={id} data-nav-theme="dark">
    <h2>{heading}</h2>
    {children}
  </section>;
}

/** The hub and the other questions; `hrefFor` keeps the page's language in each link. */
export function ControlRelated({ heading, links, hrefFor, site = "main" }: { heading: string; links: readonly ControlLink[]; hrefFor: (path: string) => string; site?: SiteClass }) {
  // On the help host a link to /can-you-trust-b4gamble becomes the owner page, and a link
  // with no help equivalent is not rendered at all (RFC-057 §6.5).
  const resolved = links.flatMap((link) => {
    const href = helpRoutePath(link.href, site);
    return href ? [{ ...link, href }] : [];
  });
  return <nav aria-label={heading} className={`${styles.card} ${styles.related}`} data-control-related data-nav-theme="dark">
    <h2>{heading}</h2>
    <ul className={styles.list}>
      {resolved.map((link) => <li key={link.href}><Link href={hrefFor(link.href)}>{link.label}</Link></li>)}
    </ul>
  </nav>;
}
