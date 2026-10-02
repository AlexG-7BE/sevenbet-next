import Link from "next/link";

import { PrivacyChoicesButton } from "@/components/analytics/AnalyticsConsentBanner";
import { protectedHelpResources } from "@/components/protected-help/support-resources";
import { isProductAnalyticsEnabled } from "@/lib/analytics/product-analytics";
import { analyticsConsentMessages } from "@/lib/i18n/analytics-consent-catalog";
import { publicFooterMessages } from "@/lib/i18n/public-shell-catalog";
import type { SupportedLocale } from "@/lib/market/registry";

import styles from "./StartShell.module.css";

/**
 * The /start landing is written for UK help ads and reads the same for every
 * visitor: one fixed language, never the request's country, cookie, referrer
 * or user agent.
 */
export const START_LOCALE: SupportedLocale = "en-GB";

export function StartHeader() {
  return (
    <header className={styles.header} data-start-shell="header">
      <div className={styles.headerInner}>
        <span className={styles.brand} translate="no">B4GAMBLE</span>
      </div>
    </header>
  );
}

/**
 * Only legal, privacy and independent-support destinations: no casino, bonus,
 * offer or partner link, and nothing that leads into the public navigation.
 * UK support comes from the repository's verified list, which deliberately
 * carries no phone numbers.
 */
export function StartFooter() {
  const footer = publicFooterMessages(START_LOCALE);
  return (
    <footer aria-label={footer.label} className={styles.footer} data-start-shell="footer">
      <div className={styles.footerInner}>
        <section aria-labelledby="start-support-title" className={styles.support}>
          <h2 id="start-support-title">Independent support</h2>
          <ul>
            {protectedHelpResources.map((resource) => (
              <li key={resource.name}>
                <a href={resource.href} rel="noopener noreferrer" target="_blank">
                  {resource.name} <span aria-hidden="true">↗</span>
                  <span className="srOnly"> (opens an external site in a new tab)</span>
                </a>
                <p>{resource.description}</p>
              </li>
            ))}
          </ul>
        </section>
        <p className={styles.disclaimer}>
          The B4GAMBLE Programme does not diagnose or treat gambling addiction. Completion does not mean gambling is safe or suitable.
        </p>
        <div className={styles.baseline}>
          <span className={styles.age}>18+</span>
          <span>{footer.financialRisk}</span>
          <Link href="/privacy" prefetch={false}>{footer.privacy}</Link>
          <Link href="/terms" prefetch={false}>{footer.terms}</Link>
          {isProductAnalyticsEnabled()
            ? <PrivacyChoicesButton className={styles.choice} label={analyticsConsentMessages(START_LOCALE).trigger} />
            : null}
        </div>
      </div>
    </footer>
  );
}
