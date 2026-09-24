import Link from "next/link";
import type { ReactNode } from "react";

import { publicFooterMessages, publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { resolvePresentationContext } from "@/lib/market/presentation-resolver";
import { isLocalizedPublicDestination, localizePublicPath } from "@/lib/market/routing";
import { DEFAULT_MARKET_PROFILE, marketProfileByLocale } from "@/lib/market/registry";
import type { CommercialProductState } from "@/lib/market/commercial-product-state";
import { commercialProductsAvailable } from "@/lib/market/commercial-product-state";
import { commercialDestinationsNavigable, publicCommercialDestinationVisible } from "@/lib/public-shell";
import styles from "./PublicShell.module.css";

export function PublicFooter({
  presentation = resolvePresentationContext({}),
  programme,
  commercialProductState = "SUPPORTED_COMMERCIAL",
  commercialBestOffersNavigation,
  commercialBonusesNavigation,
  deferCommercialNavigation = false,
}: {
  presentation?: PresentationResolution;
  programme?: Readonly<{ path: string; localizePublicLinks: boolean }>;
  commercialProductState?: CommercialProductState;
  commercialBestOffersNavigation?: ReactNode;
  commercialBonusesNavigation?: ReactNode;
  deferCommercialNavigation?: boolean;
}) {
  const shell = publicShellMessages(presentation.locale);
  const footer = publicFooterMessages(presentation.locale);
  const editorialProfile = marketProfileByLocale(presentation.locale) ?? DEFAULT_MARKET_PROFILE;
  const showCommercialProducts = deferCommercialNavigation
    ? false
    : commercialDestinationsNavigable(commercialProductsAvailable(commercialProductState), presentation.marketCountryCode);
  const groups = [
    { title: footer.explore, links: [[shell.bestOffers, "/best-offers"], [shell.casinos, "/casinos"], [shell.bonuses, "/bonuses"], [shell.learn, "/learn"]] },
    { title: footer.programmeAndSupport, links: [[shell.startProgramme, "/program"], [footer.tenSteps, "/10-steps"], [footer.responsibleGambling, "/responsible-gambling"], [footer.protectedHelp, "/help"]] },
    { title: footer.trust, links: [[footer.about, "/about"], [footer.methodology, "/methodology"], [footer.faq, "/faq"], [footer.affiliateDisclosure, "/affiliate-disclosure"]] },
  ] as const;
  const deferredCommercialLinks = {
    "/best-offers": commercialBestOffersNavigation,
    "/bonuses": commercialBonusesNavigation,
  } as const;
  const localizedHref = (href: string) => {
    if (href === "/program" && programme) return programme.path;
    return presentation.source === "EXPLICIT_ROUTE"
      && (!programme || programme.localizePublicLinks)
      && isLocalizedPublicDestination(href, editorialProfile)
      ? localizePublicPath(editorialProfile, presentation.locale, href)
      : href;
  };
  return (
    <footer aria-label={footer.label} className={styles.footer} data-public-shell="footer">
      <div className={styles.footerInner}>
        <div className={styles.footerColumns}>
          <div className={styles.footerLead}>
            <Link className={styles.footerBrand} href={localizedHref("/")} prefetch={false} translate="no">B4GAMBLE</Link>
            <p>{footer.description}<br />{footer.operatorDisclaimer}</p>
          </div>
          {groups.map((group) => (
            <div className={styles.footerGroup} key={group.title}>
              <h2>{group.title}</h2>
              {group.links.map(([label, href]) => {
                const commercialNavigation = deferredCommercialLinks[href as keyof typeof deferredCommercialLinks];
                if (deferCommercialNavigation && commercialNavigation !== undefined) {
                  return <span className={styles.footerNavigationSlot} key={href}>{commercialNavigation}</span>;
                }
                if (!publicCommercialDestinationVisible(href, showCommercialProducts)) return null;
                return <Link data-footer-navigation-href={href} href={localizedHref(href)} key={href} prefetch={false}>{label}</Link>;
              })}
            </div>
          ))}
        </div>
        <div className={styles.footerBaseline}>
          <div><span className={styles.age}>18+</span><span>{footer.financialRisk}</span><Link href="/terms" prefetch={false}>{footer.terms}</Link><Link href="/privacy" prefetch={false}>{footer.privacy}</Link><Link href={localizedHref("/contact")} prefetch={false}>{footer.contact}</Link></div>
          <p className={styles.footerCommission}>{footer.commissionDisclosure}</p>
        </div>
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
    : href;

  const label = destination === "/best-offers" ? shell.bestOffers : shell.bonuses;
  return <Link data-footer-navigation-href={destination} href={localizedHref(destination)} prefetch={false}>{label}</Link>;
}
