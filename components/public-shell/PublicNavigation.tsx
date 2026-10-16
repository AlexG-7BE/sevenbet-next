import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import {
  GUIDE_NAVIGATION,
  PUBLIC_NAVIGATION,
  publicNavigationForCommercialState,
  type PublicAccountNavigation,
} from "@/lib/public-shell";
import { ProgrammeLanguageSelector } from "@/components/programme/ProgrammeLanguageSelector";
import type { PublicShellMessages } from "@/lib/i18n/public-shell-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { DEFAULT_MARKET_PROFILE, marketProfileByLocale, publicMarketPath, type LanguageRouteProfile } from "@/lib/market/registry";
import { finalPublicHref } from "@/lib/market/routing";
import { MarketLanguageSelector } from "./MarketLanguageSelector";
import { PublicLinkPendingSignal } from "./PublicNavigationFeedback";
import {
  PublicMobileAccountLine,
  PublicMobileNavigationEnhancement,
  PublicNavigationDoor,
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
  if (href === "/10-steps") return messages.tenSteps;
  if (href === "/help") return messages.help;
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
  researchNavigation = true,
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
  /**
   * False in the Programme's shell (Founder, 16 October 2026): the research links are not built at
   * all there, not even behind the door, so no Programme document carries their addresses.
   */
  researchNavigation?: boolean;
}) {
  const editorialProfile = marketProfileByLocale(presentation.locale) ?? DEFAULT_MARKET_PROFILE;
  const homeHref = presentation.source === "EXPLICIT_ROUTE" && (!programme || programme.localizePublicLinks)
    ? publicMarketPath(editorialProfile, presentation.locale)
    : finalPublicHref("/", presentation.neutralRouteLocale);
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
  // Research links for a reader inside the research section, the guide links for everyone else
  // (Founder, 10 and 16 October 2026). Help keeps its own block in the drawer.
  const guideLink = (item: (typeof GUIDE_NAVIGATION)[number], variant: "desktop" | "mobile") => (
    <PublicNavigationDoor door="guide" key={item.href}>
      <PublicNavigationRouteLink
        baseHref={item.href}
        className={variant === "desktop" && "safety" in item ? styles.helpLink : undefined}
        label={navigationLabel(messages, item.href)}
        presentation={presentation}
        programme={programme}
      >
        {variant === "mobile"
          ? <><span>{navigationLabel(messages, item.href)}</span><small>{messages.view}</small></>
          : navigationLabel(messages, item.href)}
      </PublicNavigationRouteLink>
    </PublicNavigationDoor>
  );
  const leadingGuideNavigation = GUIDE_NAVIGATION.filter((item) => !("safety" in item));
  const trailingGuideNavigation = GUIDE_NAVIGATION.filter((item) => "safety" in item);
  return (
    <>
      <div className={styles.desktopNavigation}>
        <nav className={styles.primaryNavigation} aria-label={messages.primaryNavigation}>
          {leadingGuideNavigation.map((item) => guideLink(item, "desktop"))}
          {PUBLIC_NAVIGATION.map((item) => {
            if (!researchNavigation && "commercial" in item) return null;
            const commercialNavigation = deferredDesktopNavigation[item.href as keyof typeof deferredDesktopNavigation];
            if (deferCommercialNavigation && commercialNavigation !== undefined) {
              return <Fragment key={item.href}>{commercialNavigation}</Fragment>;
            }
            if (!visibleNavigationHrefs.has(item.href)) return null;
            const link = (
              <PublicNavigationRouteLink
                baseHref={item.href}
                key={item.href}
                label={navigationLabel(messages, item.href)}
                presentation={presentation}
                programme={programme}
              >
                {navigationLabel(messages, item.href)}
              </PublicNavigationRouteLink>
            );
            return "commercial" in item
              ? <PublicNavigationDoor door="research" key={item.href}>{link}</PublicNavigationDoor>
              : link;
          })}
          {trailingGuideNavigation.map((item) => guideLink(item, "desktop"))}
        </nav>
        <div className={styles.accountNavigation}>
          {programme ? (
            <ProgrammeLanguageSelector locale={programme.locale} messages={messages} region={presentation.marketDisplayName} variant="desktop" />
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
          <PublicProgrammeActionLink authenticated={authenticated} className={styles.primaryAction} hiddenOnDestination={!authenticated} href={account.primaryHref}>{primaryLabel}</PublicProgrammeActionLink>
        </div>
      </div>

      <div className={styles.mobileNavigation}>
        {account.xpLabel ? <span className={styles.xpPill}>{account.xpLabel}</span> : null}
        {/* "Start Programme" is not offered on the Programme's own first screens, where it leads
            to the page the visitor is already on (Founder, 12 October 2026). */}
        <PublicProgrammeActionLink authenticated={authenticated} className={styles.mobilePrimaryAction} hiddenOnDestination={!authenticated} href={account.primaryHref}>{primaryLabel}</PublicProgrammeActionLink>
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
              {leadingGuideNavigation.map((item) => guideLink(item, "mobile"))}
              {PUBLIC_NAVIGATION.map((item) => {
                if (!researchNavigation && "commercial" in item) return null;
                const commercialNavigation = deferredMobileNavigation[item.href as keyof typeof deferredMobileNavigation];
                if (deferCommercialNavigation && commercialNavigation !== undefined) {
                  return <Fragment key={item.href}>{commercialNavigation}</Fragment>;
                }
                if (!visibleNavigationHrefs.has(item.href)) return null;
                const link = (
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
                return "commercial" in item
                  ? <PublicNavigationDoor door="research" key={item.href}>{link}</PublicNavigationDoor>
                  : link;
              })}
            </nav>
            {/* The Programme is the drawer's one primary action, directly under the routes;
                Help and the language choice follow it (Founder, 25 September 2026). */}
            <div className={styles.mobileAccount} data-mobile-menu-account="">
              <PublicProgrammeActionLink authenticated={authenticated} className={styles.mobileMenuPrimary} href={account.primaryHref}>
                {authenticated ? messages.openProgramme : primaryLabel}
              </PublicProgrammeActionLink>
              {/* Log in for a visitor; Log out, in the same place, for a signed-in person. */}
              <PublicMobileAccountLine
                authenticated={authenticated}
                className={styles.mobileMenuLogout}
                labels={{ logOut: messages.logOut, loggingOut: messages.loggingOut, logOutRetry: messages.logOutRetry }}
                login={<Link className={styles.mobileMenuLogin} href={account.accountHref}>{accountLabel}</Link>}
                programmeHref={account.primaryHref}
              />
            </div>
            <div className={styles.mobileHelp}>
              <span>{messages.controlAndSupport}</span>
              <PublicNavigationRouteLink baseHref="/help" label={messages.openHelp} presentation={presentation} programme={programme}>{messages.openHelp}</PublicNavigationRouteLink>
            </div>
            {programme ? (
              <ProgrammeLanguageSelector locale={programme.locale} messages={messages} region={presentation.marketDisplayName} variant="mobile" />
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
    <PublicNavigationDoor door="research">
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
    </PublicNavigationDoor>
  );
}
