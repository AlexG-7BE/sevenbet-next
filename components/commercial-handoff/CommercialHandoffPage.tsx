import Link from "next/link";

import type { OutboundRecoveryCasino } from "@/lib/commercial-handoff/recovery.server";
import { type OutboundRecoveryMessages, withCasinoName } from "@/lib/i18n/outbound-recovery-catalog";

import styles from "./CommercialHandoffPage.module.css";

/**
 * Founder decision 25 Sep 2026: a refused casino click leads somewhere useful. The page itself
 * never shows an offer or an outbound route; it offers the casino's review first, published
 * offers only where they may be presented, and the homepage when neither applies.
 */
export function CommercialHandoffUnavailable({ casino, bestOffersHref, homeHref, homeLabel, text }: {
  casino: OutboundRecoveryCasino | null;
  bestOffersHref: string | null;
  homeHref: string;
  homeLabel: string;
  text: OutboundRecoveryMessages;
}) {
  const primary = casino
    ? { href: casino.reviewHref, label: withCasinoName(text.backToReview, casino.name), action: "review" }
    : bestOffersHref
      ? { href: bestOffersHref, label: text.bestOffers, action: "best-offers" }
      : { href: homeHref, label: homeLabel, action: "home" };
  const secondary = casino && bestOffersHref
    ? { href: bestOffersHref, label: text.bestOffers, action: "best-offers" }
    : primary.action === "home" ? null : { href: homeHref, label: homeLabel, action: "home" };
  return (
    <section className={styles.page} data-commercial-handoff="unavailable" data-nav-theme="dark">
      <div className={styles.unavailableCard}>
        <p className={styles.eyebrow}>{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p className={styles.copy}>{casino ? withCasinoName(text.bodyCasino, casino.name) : text.bodyGeneric}</p>
        <div className={styles.recoveryAction}>
          <Link className={styles.primary} data-recovery-action={primary.action} href={primary.href} prefetch={false}>{primary.label}</Link>
          {secondary ? <Link className={styles.secondary} data-recovery-action={secondary.action} href={secondary.href} prefetch={false}>{secondary.label}</Link> : null}
        </div>
      </div>
    </section>
  );
}
