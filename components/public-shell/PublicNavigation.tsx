import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import {
  PUBLIC_NAVIGATION,
  publicNavigationForCommercialState,
  type PublicAccountNavigation,
} from "@/lib/public-shell";
import { ProgrammeLanguageSelector } from "@/components/programme/ProgrammeLanguageSelector";
import type { PublicShellMessages } from "@/lib/i18n/public-shell-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { DEFAULT_MARKET_PROFILE, marketProfileByLocale, publicMarketPath, type LanguageRouteProfile } from "@/lib/market/registry";
import { MarketLanguageSelector } from "./MarketLanguageSelector";
import { PublicLinkPendingSignal } from "./PublicNavigationFeedback";
import {
  PublicMobileNavigationEnhancement,
  PublicNavigationRouteLink,
  PublicProgrammeActionLink,
} from "./PublicNavigationClient";
import type { ProgrammeLocale } from "@/lib/programme/presentation";
import styles from "./PublicShell.module.css";

const editorialNavigationHrefs = new Set(
  publicNavigationForCommercialState(false).map((item) => item.href),
);
const deferredCommercialNavigation = PUBLIC_NAVIGATION.filter(
  (item) => !editorialNavigationHrefs.has(item.href),
);

function navigationLabel(messages: PublicShellMessages, href: string) {
  if (href === "/best-offers") return messages.bestOffers;
  if (href === "/casinos") return messages.casinos;
  if (href === "/bonuses") return messages.bonuses;
  if (href === "/learn") return messages.learn;
  return href;
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" className={styles.navigationIcon} focusable="false" viewBox="0 0 24 24">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className={styles.navigationIcon} focusable="false" viewBox="0 0 24 24">
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function PublicNavigation({
  account,
  authenticated,
  messages,
  presentation,
  programme,
  selectableLanguages,
  commercialProductsAvailable,
  commercialDesktopBestOffersNavigation,
  commercialDesktopBonusesNavigation,
  commercialMobileBestOffersNavigation,
  commercialMobileBonusesNavigation,
  deferCommercialNavigation = false,
}: {
  account: PublicAccountNavigation;
  authenticated: boolean;
  messages: PublicShellMessages;
  presentation: PresentationResolution;
  programme?: Readonly<{ locale: ProgrammeLocale; localizePublicLinks: boolean }>;
  selectableLanguages: readonly LanguageRouteProfile[];
  commercialProductsAvailable: boolean;
  commercialDesktopBestOffersNavigation?: ReactNode;
  commercialDesktopBonusesNavigation?: ReactNode;
  commercialMobileBestOffersNavigation?: ReactNode;
  commercialMobileBonusesNavigation?: ReactNode;
  deferCommercialNavigation?: boolean;
}) {
  const editorialProfile = marketProfileByLocale(presentation.locale) ?? DEFAULT_MARKET_PROFILE;
  const homeHref = presentation.source === "EXPLICIT_ROUTE" && (!programme || programme.localizePublicLinks)
    ? publicMarketPath(editorialProfile, presentation.locale)
    : "/";
  const accountLabel = authenticated ? messages.myProgramme : messages.logIn;
  const primaryLabel = authenticated ? messages.myProgramme : messages.startProgramme;
  const publicNavigation = publicNavigationForCommercialState(
    deferCommercialNavigation ? false : commercialProductsAvailable,
  );
  const visibleNavigationHrefs = new Set(publicNavigation.map((item) => item.href));
  const deferredDesktopNavigation = {
    "/best-offers": commercialDesktopBestOffersNavigation,
    "/bonuses": commercialDesktopBonusesNavigation,
  } as const;
  const deferredMobileNavigation = {
    "/best-offers": commercialMobileBestOffersNavigation,
    "/bonuses": commercialMobileBonusesNavigation,
  } as const;
  return (
    <>
      <div className={styles.desktopNavigation}>
        <nav className={styles.primaryNavigation} aria-label={messages.primaryNavigation}>
          {PUBLIC_NAVIGATION.map((item) => {
            const commercialNavigation = deferredDesktopNavigation[item.href as keyof typeof deferredDesktopNavigation];
            if (deferCommercialNavigation && commercialNavigation !== undefined) {
              return <Fragment key={item.href}>{commercialNavigation}</Fragment>;
            }
            if (!visibleNavigationHrefs.has(item.href)) return null;
            return (
              <PublicNavigationRouteLink
                baseHref={item.href}
                className={"safety" in item && item.safety ? styles.helpLink : undefined}
                key={item.href}
                label={navigationLabel(messages, item.href)}
                presentation={presentation}
                programme={programme}
              >
                {navigationLabel(messages, item.href)}
              </PublicNavigationRouteLink>
            );
          })}
        </nav>
        <div className={styles.accountNavigation}>
          {programme ? (
            <ProgrammeLanguageSelector locale={programme.locale} messages={messages} variant="desktop" />
          ) : (
            <MarketLanguageSelector
              messages={messages}
              presentation={presentation}
              selectableLanguages={selectableLanguages}
              surface="public"
              variant="desktop"
            />
          )}
          {account.xpLabel ? <span className={styles.xpPill}>{account.xpLabel}</span> : null}
          {!authenticated ? <Link className={styles.accountLink} href={account.accountHref}>{accountLabel}</Link> : null}
          <PublicProgrammeActionLink authenticated={authenticated} className={styles.primaryAction} href={account.primaryHref}>{primaryLabel}</PublicProgrammeActionLink>
        </div>
      </div>

      <div className={styles.mobileNavigation}>
        {account.xpLabel ? <span className={styles.xpPill}>{account.xpLabel}</span> : null}
        <PublicProgrammeActionLink authenticated={authenticated} className={styles.mobilePrimaryAction} href={account.primaryHref}>{primaryLabel}</PublicProgrammeActionLink>
        <details aria-label={messages.siteNavigation} className={styles.mobileDisclosure} data-public-mobile-disclosure>
          <summary
            aria-controls="public-mobile-navigation"
            className={`${styles.menuButton} ${styles.menuSummary}`}
            role="button"
          >
            <span className={`${styles.menuClosedLabel} srOnly`}>{messages.openNavigation}</span>
            <span className={`${styles.menuOpenLabel} srOnly`}>{messages.closeNavigation}</span>
            <span className={styles.menuClosedIcon}><MenuIcon /></span>
            <span className={styles.menuOpenIcon}><CloseIcon /></span>
          </summary>
          <div
            aria-label={messages.siteNavigation}
            className={styles.mobileMenuPanel}
            data-public-mobile-navigation
            id="public-mobile-navigation"
          >
            <PublicMobileNavigationEnhancement />
            <div className={styles.dialogTopbar}>
              <Link className={styles.dialogBrand} href={homeHref} prefetch={false} translate="no">B4GAMBLE<PublicLinkPendingSignal label={messages.homeLabel} /></Link>
              <span aria-hidden="true" className={styles.dialogCloseSpace} />
            </div>
            <nav className={styles.mobileRouteList} aria-label={messages.mobilePrimaryNavigation}>
              {PUBLIC_NAVIGATION.map((item) => {
                const commercialNavigation = deferredMobileNavigation[item.href as keyof typeof deferredMobileNavigation];
                if (deferCommercialNavigation && commercialNavigation !== undefined) {
                  return <Fragment key={item.href}>{commercialNavigation}</Fragment>;
                }
                if (!visibleNavigationHrefs.has(item.href) || ("safety" in item && item.safety)) return null;
                return (
                  <PublicNavigationRouteLink
                    baseHref={item.href}
                    key={item.href}
                    label={navigationLabel(messages, item.href)}
                    presentation={presentation}
                    programme={programme}
                  >
                    <span>{navigationLabel(messages, item.href)}</span><small>{messages.view}</small>
                  </PublicNavigationRouteLink>
                );
              })}
            </nav>
            {/* The Programme is the drawer's one primary action, directly under the routes;
                Help and the language choice follow it (Founder, 25 September 2026). */}
            <div className={styles.mobileAccount} data-mobile-menu-account="">
              <PublicProgrammeActionLink authenticated={authenticated} className={styles.mobileMenuPrimary} href={account.primaryHref}>
                {authenticated ? messages.openProgramme : primaryLabel}
              </PublicProgrammeActionLink>
              {!authenticated ? <Link className={styles.mobileMenuLogin} href={account.accountHref}>{accountLabel}</Link> : null}
            </div>
            <div className={styles.mobileHelp}>
              <span>{messages.controlAndSupport}</span>
              <PublicNavigationRouteLink baseHref="/help" label={messages.openHelp} presentation={presentation} programme={programme}>{messages.openHelp}</PublicNavigationRouteLink>
            </div>
            {programme ? (
              <ProgrammeLanguageSelector locale={programme.locale} messages={messages} variant="mobile" />
            ) : (
              <MarketLanguageSelector
                messages={messages}
                presentation={presentation}
                selectableLanguages={selectableLanguages}
                surface="public"
                variant="mobile"
              />
            )}
            <p className={styles.dialogLegal}>{messages.adultServiceNotice}</p>
          </div>
        </details>
      </div>
    </>
  );
}

export function PublicCommercialNavigationItem({
  destination,
  messages,
  presentation,
  programme,
  variant,
}: {
  destination: "/best-offers" | "/bonuses";
  messages: PublicShellMessages;
  presentation: PresentationResolution;
  programme?: Readonly<{ locale: ProgrammeLocale; localizePublicLinks: boolean }>;
  variant: "desktop" | "mobile";
}) {
  const item = deferredCommercialNavigation.find(({ href }) => href === destination);
  if (!item) return null;
  return (
    <PublicNavigationRouteLink
      baseHref={item.href}
      label={navigationLabel(messages, item.href)}
      presentation={presentation}
      programme={programme}
    >
      {variant === "mobile" ? (
        <><span>{navigationLabel(messages, item.href)}</span><small>{messages.view}</small></>
      ) : navigationLabel(messages, item.href)}
    </PublicNavigationRouteLink>
  );
}
