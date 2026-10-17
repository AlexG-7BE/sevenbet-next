import Link from "next/link";
import type { ReactNode } from "react";

import { PrivacyChoicesButton } from "@/components/analytics/AnalyticsConsentBanner";
import { isProductAnalyticsEnabled } from "@/lib/analytics/product-analytics";
import { analyticsConsentMessages } from "@/lib/i18n/analytics-consent-catalog";
import { publicFooterMessages, publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { resolvePresentationContext } from "@/lib/market/presentation-resolver";
import { finalPublicHref, isLocalizedPublicDestination, localizePublicPath } from "@/lib/market/routing";
import { DEFAULT_MARKET_PROFILE, marketProfileByLocale } from "@/lib/market/registry";
import type { CommercialProductState } from "@/lib/market/commercial-product-state";
import { commercialProductsAvailable } from "@/lib/market/commercial-product-state";
import { commercialDestinationsNavigable, publicCommercialDestinationVisible } from "@/lib/public-shell";
import { FooterCompliance } from "@/components/footer-compliance/FooterCompliance";
import {
  HELP_ORGANISATIONS_PATH,
  HELP_OWNER_PATH,
  helpOriginPathForLocale,
  helpShellCopy,
  needHelpLine,
} from "@/lib/site/help-copy";
import { HELP_CANONICAL_ORIGIN, HELP_SITE_NAME, type SiteClass } from "@/lib/site/host-gate";
import { BrandSocialLinks } from "./BrandSocialLinks";
import styles from "./PublicShell.module.css";

export function PublicFooter({
  authenticated = false,
  presentation = resolvePresentationContext({}),
  programme,
  commercialProductState = "SUPPORTED_COMMERCIAL",
  commercialBestOffersNavigation,
  commercialBonusesNavigation,
  deferCommercialNavigation = false,
  researchNavigation = true,
  site = "main",
  helpSiteLinked = false,
}: {
  /** The session cookie the document was rendered with, as in the header: it only picks the Programme link's label. */
  authenticated?: boolean;
  presentation?: PresentationResolution;
  programme?: Readonly<{ path: string; localizePublicLinks: boolean }>;
  commercialProductState?: CommercialProductState;
  commercialBestOffersNavigation?: ReactNode;
  commercialBonusesNavigation?: ReactNode;
  deferCommercialNavigation?: boolean;
  /**
   * False in the Programme's shell: the footer is built without Best Offers, Casinos and Bonuses.
   * The name is historical, as in `PublicHeader`: no research gate remains and nothing reads the
   * path. Renamed to `commercialNavigation` in the RFC-057 phase.
   */
  researchNavigation?: boolean;
  /** Which host is answering (RFC-057 §7.2). `help` renders the help site's own footer. */
  site?: SiteClass;
  /**
   * The main host's one quiet "need help" line (§6.6), which only exists once the help routes
   * have actually moved. It is driven by `HELP_SITE_REDIRECTS`, the phase-3 switch, so until
   * that deployment the line is not rendered and the main site's footer is unchanged. Ignored
   * on the help host, which never links to itself from its own footer.
   */
  helpSiteLinked?: boolean;
}) {
  const shell = publicShellMessages(presentation.locale);
  const footer = publicFooterMessages(presentation.locale);
  const editorialProfile = marketProfileByLocale(presentation.locale) ?? DEFAULT_MARKET_PROFILE;
  if (site === "help") {
    const help = helpShellCopy(presentation.locale);
    const helpHref = (href: string) => (presentation.source === "EXPLICIT_ROUTE"
      && isLocalizedPublicDestination(href, editorialProfile)
      ? localizePublicPath(editorialProfile, presentation.locale, href)
      : finalPublicHref(href, presentation.neutralRouteLocale));
    // Four site links, three about-this-site links, three legal links, and nothing else: no
    // Explore column, no Trust column, no social profiles, no commission line, no operator
    // disclaimer, no cookie choices button (there are no optional cookies here, Q3). The
    // commercial links are not built, so they are absent from the inline page data too.
    const helpGroups = [
      {
        title: help.footer.siteLinks,
        links: [
          [help.navigation.tenSteps, "/10-steps"],
          [help.navigation.pausePlan, "/pause-plan"],
          [help.navigation.guides, "/learn"],
          [help.navigation.help, "/help"],
        ],
      },
      {
        title: help.footer.aboutThisSite,
        links: [
          [help.footer.owner, HELP_OWNER_PATH],
          [help.footer.organisations, HELP_ORGANISATIONS_PATH],
          [footer.contact, "/contact"],
        ],
      },
      {
        title: help.footer.legal,
        links: [[footer.privacy, "/privacy"], [footer.terms, "/terms"]],
      },
    ] as const;
    return (
      <footer aria-label={help.footer.label} className={styles.footer} data-public-shell="footer" data-public-footer-site="help">
        <div className={styles.footerInner}>
          <div className={styles.footerColumns}>
            <div className={styles.footerLead}>
              <Link className={styles.footerBrand} href={helpHref("/")} prefetch={false} translate="no">{HELP_SITE_NAME}</Link>
              <p>{help.footer.description}</p>
            </div>
            {helpGroups.map((group) => (
              <div className={styles.footerGroup} key={group.title}>
                <h2>{group.title}</h2>
                {group.links.map(([label, href]) => (
                  <Link data-footer-navigation-href={href} href={helpHref(href)} key={href} prefetch={false}>{label}</Link>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.footerBaseline}>
            <div><Link href={helpHref("/terms")} prefetch={false}>{footer.terms}</Link><Link href={helpHref("/privacy")} prefetch={false}>{footer.privacy}</Link><Link href={helpHref("/contact")} prefetch={false}>{footer.contact}</Link></div>
            <p className={styles.footerCommission}>{help.footer.noTracking}</p>
          </div>
          <span aria-hidden="true" className={styles.footerEnd} data-public-footer-bottom />
        </div>
      </footer>
    );
  }
  const showCommercialProducts = deferCommercialNavigation
    ? false
    : commercialDestinationsNavigable(commercialProductsAvailable(commercialProductState), presentation.marketCountryCode);
  const groups = [
    { title: footer.explore, links: [[shell.bestOffers, "/best-offers"], [shell.casinos, "/casinos"], [shell.bonuses, "/bonuses"], [shell.learn, "/learn"]] },
    { title: footer.programmeAndSupport, links: [[authenticated ? shell.myProgramme : shell.startProgramme, "/program"], [footer.tenSteps, "/10-steps"], [footer.responsibleGambling, "/responsible-gambling"], [footer.protectedHelp, "/help"], [footer.pausePlan, "/pause-plan"], [footer.beside, "/beside"], [footer.pauseStatistics, "/pause-statistics"], [footer.gamblingControl, "/gambling-control"]] },
    { title: footer.trust, links: [[footer.about, "/about"], [footer.methodology, "/methodology"], [footer.faq, "/faq"], [footer.affiliateDisclosure, "/affiliate-disclosure"], [footer.forCreators, "/for-creators"]] },
  ] as const;
  const deferredCommercialLinks = {
    "/best-offers": commercialBestOffersNavigation,
    "/bonuses": commercialBonusesNavigation,
  } as const;
  // The commercial links follow the header: every public page, withheld only by the market rule
  // (Founder, 17 October 2026). The Programme's footer is built without them.
  const researchLinks = new Set(["/best-offers", "/casinos", "/bonuses"]);
  // Hidden on the Home page, whose screen paging measures the footer (PublicShell.module.css).
  const extraLinks = new Set(["/pause-plan", "/beside", "/pause-statistics", "/gambling-control", "/for-creators"]);
  const localizedHref = (href: string) => {
    if (href === "/program" && programme) return programme.path;
    return presentation.source === "EXPLICIT_ROUTE"
      && (!programme || programme.localizePublicLinks)
      && isLocalizedPublicDestination(href, editorialProfile)
      ? localizePublicPath(editorialProfile, presentation.locale, href)
      : finalPublicHref(href, presentation.neutralRouteLocale);
  };
  return (
    <footer aria-label={footer.label} className={styles.footer} data-public-shell="footer">
      <div className={styles.footerInner}>
        <div className={styles.footerColumns}>
          <div className={styles.footerLead}>
            <Link className={styles.footerBrand} href={localizedHref("/")} prefetch={false} translate="no">B4GAMBLE</Link>
            <p>{footer.description}<br />{footer.operatorDisclaimer}</p>
            <BrandSocialLinks label={footer.social} opensInNewTab={footer.opensInNewTab} />
          </div>
          {groups.map((group) => (
            <div className={styles.footerGroup} key={group.title}>
              <h2>{group.title}</h2>
              {group.links.map(([label, href]) => {
                if (!researchNavigation && researchLinks.has(href)) return null;
                const commercialNavigation = deferredCommercialLinks[href as keyof typeof deferredCommercialLinks];
                if (deferCommercialNavigation && commercialNavigation !== undefined) {
                  return <span className={styles.footerNavigationSlot} key={href}>{commercialNavigation}</span>;
                }
                if (!publicCommercialDestinationVisible(href, showCommercialProducts)) return null;
                return <Link className={extraLinks.has(href) ? styles.footerExtra : undefined} data-footer-navigation-href={href} href={localizedHref(href)} key={href} prefetch={false}>{label}</Link>;
              })}
            </div>
          ))}
        </div>
        <FooterCompliance footer={footer} localHelpHref={localizedHref("/help")} />
        <div className={styles.footerBaseline}>
          <div><Link href="/terms" prefetch={false}>{footer.terms}</Link><Link href="/privacy" prefetch={false}>{footer.privacy}</Link>{isProductAnalyticsEnabled() ? <PrivacyChoicesButton className={styles.footerChoice} label={analyticsConsentMessages(presentation.locale).trigger} /> : null}<Link href={localizedHref("/contact")} prefetch={false}>{footer.contact}</Link></div>
          <p className={styles.footerCommission}>{footer.commissionDisclosure}</p>
        </div>
        {/* RFC-057 §6.6: exactly one link from the commercial site to the help site, in the
            page's own language, nofollow, no logo and no banner. It appears only once the
            help routes have moved (HELP_SITE_REDIRECTS), because before that deployment the
            help host answers 404 for them. */}
        {helpSiteLinked ? (
          <p className={styles.footerCommission} data-footer-help-site="">
            <a href={`${HELP_CANONICAL_ORIGIN}${helpOriginPathForLocale(presentation.locale)}`} rel="nofollow">{needHelpLine(presentation.locale)}</a>
          </p>
        ) : null}
        <span aria-hidden="true" className={styles.footerEnd} data-public-footer-bottom />
      </div>
    </footer>
  );
}

export function PublicCommercialFooterLink({
  destination,
  presentation,
  programme,
}: {
  destination: "/best-offers" | "/bonuses";
  presentation: PresentationResolution;
  programme: Readonly<{ path: string; localizePublicLinks: boolean }>;
}) {
  const shell = publicShellMessages(presentation.locale);
  const editorialProfile = marketProfileByLocale(presentation.locale) ?? DEFAULT_MARKET_PROFILE;
  const localizedHref = (href: string) => presentation.source === "EXPLICIT_ROUTE"
    && programme.localizePublicLinks
    && isLocalizedPublicDestination(href, editorialProfile)
    ? localizePublicPath(editorialProfile, presentation.locale, href)
    : finalPublicHref(href, presentation.neutralRouteLocale);

  const label = destination === "/best-offers" ? shell.bestOffers : shell.bonuses;
  return <Link data-footer-navigation-href={destination} href={localizedHref(destination)} prefetch={false}>{label}</Link>;
}
