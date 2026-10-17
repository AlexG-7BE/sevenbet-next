import Link from "next/link";
import type { ReactNode } from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productCanonicalPath } from "@/lib/market/product-context";
import { organizationReference } from "@/lib/seo/structured-data";
import { absoluteUrl } from "@/lib/site";
import { helpLocale, type HelpTextPage } from "@/lib/site/help-copy";
import type { SiteClass } from "@/lib/site/host-gate";

import styles from "./HelpTextPage.module.css";

/**
 * The shared body of the help site's two plain-text pages: the owner disclosure (RFC-057 §17)
 * and the data statement (§16.3). They are text and one contact link; there is no image, no
 * card, no call to action and nothing that could carry a commercial address. The company's
 * other site is named in the copy as plain text and is never a link (§6, rule 2).
 */
export function HelpTextPageView({
  copy,
  pathname,
  presentation,
  site,
}: {
  copy: HelpTextPage;
  pathname: string;
  presentation: PresentationResolution;
  site: SiteClass;
}) {
  const contentLocale = helpLocale(presentation.locale);
  const url = absoluteUrl(productCanonicalPath(presentation, pathname), site);
  return <HelpTextPageBody copy={copy} contentLocale={contentLocale} presentation={presentation} site={site}>
    <JsonLd data={{
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: copy.title,
      description: copy.metadataDescription,
      url,
      inLanguage: contentLocale,
      isAccessibleForFree: true,
      publisher: organizationReference(site),
    }} />
  </HelpTextPageBody>;
}

/**
 * The page without its structured data, so the link guard can render it synchronously:
 * `JsonLd` reads request headers and is an async component, which `renderToStaticMarkup`
 * cannot await. The JSON-LD itself is asserted from `organizationReference` in the same test.
 */
export function HelpTextPageBody({
  children,
  copy,
  contentLocale,
  presentation,
  site: _site,
}: {
  children?: ReactNode;
  copy: HelpTextPage;
  contentLocale: string;
  presentation: PresentationResolution;
  site: SiteClass;
}) {
  return (
    <div className={styles.page} data-runtime-renderer="help-text-page" lang={contentLocale === presentation.locale ? undefined : "en"}>
      {children}
      <header className={styles.header}>
        <small>{copy.eyebrow}</small>
        <h1>{copy.title}</h1>
        <p className={styles.intro}>{copy.intro}</p>
      </header>
      {copy.sections.map((section) => (
        <section className={styles.section} key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
      <footer className={styles.contact}>
        <p>{copy.contactLead}</p>
        <Link href="/contact" prefetch={false}>{copy.contactLabel}</Link>
      </footer>
    </div>
  );
}
