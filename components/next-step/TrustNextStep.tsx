import Link from "next/link";

import { nextStepMessages } from "@/lib/i18n/next-step-catalog";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { productHref } from "@/lib/market/product-context";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { offersMayBePresented } from "@/lib/public-offer/offer-visibility";

import styles from "./TrustNextStep.module.css";

/**
 * Founder decision 25 Sep 2026: About, FAQ and Methodology end with one next step.
 * The Programme leads; Best Offers follows only where published offers may be presented.
 */
export function TrustNextStep({ presentation, page }: { presentation: PresentationResolution; page: "about" | "faq" | "methodology" }) {
  const text = nextStepMessages(presentation.locale);
  const shell = publicShellMessages(presentation.locale);
  const programmeHref = `${programmePathForPresentationLocale(presentation.locale)}?entry=start`;
  const offers = offersMayBePresented(presentation.marketCountryCode);
  return <section aria-labelledby={`${page}-next-step-title`} className={styles.section} data-nav-theme="dark" data-trust-next-step={page}>
    <div className={styles.inner}>
      <p className={styles.eyebrow}>{text.eyebrow}</p>
      <h2 id={`${page}-next-step-title`}>{text.title}</h2>
      <p className={styles.body}>{text.body}</p>
      <div className={styles.actions}>
        <Link className={styles.primary} data-trust-next-step-action="programme" href={programmeHref} prefetch={false}>{shell.startProgramme}</Link>
        {offers ? <Link className={styles.secondary} data-trust-next-step-action="best-offers" href={productHref(presentation, "/best-offers")} prefetch={false}>{shell.bestOffers}</Link> : null}
      </div>
    </div>
  </section>;
}
