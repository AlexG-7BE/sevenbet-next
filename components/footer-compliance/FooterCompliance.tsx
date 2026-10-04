import Link from "next/link";

import type { PublicFooterMessages } from "@/lib/i18n/public-shell-catalog";

import styles from "./FooterCompliance.module.css";

/**
 * Google UK gambling certification (Founder decision, 4 October 2026): every
 * footer states that outbound links go only to operators licensed where the
 * visitor is, lists free support in Great Britain, names the company and
 * marks the site 18+. The UK services are proper names and stay in English;
 * the National Gambling Helpline is run by GamCare, and begambleaware.org
 * forwards to GambleAware's live help site.
 */
export const FOOTER_SUPPORT_LINKS = Object.freeze({
  helplineName: "National Gambling Helpline",
  helplineNumber: "0808 8020 133",
  helplineHref: "tel:+448088020133",
  gamCare: "https://www.gamcare.org.uk/",
  gambleAware: "https://www.begambleaware.org/",
  gambleAwareName: "BeGambleAware.org",
  gamstop: "https://www.gamstop.co.uk/",
});

export function FooterCompliance({
  footer,
  localHelpHref,
  showAge = true,
}: {
  footer: PublicFooterMessages;
  /** Where visitors outside Great Britain find help in their own country; omitted on pages without public navigation. */
  localHelpHref?: string;
  /** Pages whose footer already carries the 18+ notice leave it out here. */
  showAge?: boolean;
}) {
  const external = (href: string, label: string) => (
    <a href={href} rel="noopener noreferrer" target="_blank">{label}<span className="srOnly"> {footer.opensInNewTab}</span></a>
  );
  return (
    <div className={styles.compliance} data-footer-compliance>
      {showAge
        ? <p className={styles.age} data-footer-age><span className={styles.ageBadge}>18+</span><span>{footer.ageNotice} {footer.financialRisk}</span></p>
        : null}
      <p className={styles.licensed} data-footer-licensed-links>{footer.licensedLinks}</p>
      {/* A wrapping row of links rather than a sentence: every footer link is a 44px target on phones. */}
      <p className={styles.support} data-footer-support>
        <span className={styles.supportLead}>{footer.supportLead}</span>
        <a href={FOOTER_SUPPORT_LINKS.helplineHref}>{FOOTER_SUPPORT_LINKS.helplineName} <span className={styles.number}>{FOOTER_SUPPORT_LINKS.helplineNumber}</span></a>
        {external(FOOTER_SUPPORT_LINKS.gamCare, "GamCare")}
        {external(FOOTER_SUPPORT_LINKS.gambleAware, FOOTER_SUPPORT_LINKS.gambleAwareName)}
        {external(FOOTER_SUPPORT_LINKS.gamstop, footer.gamstop)}
        {localHelpHref ? <Link href={localHelpHref} prefetch={false}>{footer.localHelp}</Link> : null}
      </p>
      <p className={styles.entity} data-footer-entity>{footer.entity}</p>
    </div>
  );
}
