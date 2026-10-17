import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import {
  GUIDE_NAVIGATION,
  HELP_NAVIGATION,
  PUBLIC_NAVIGATION,
  publicNavigationForCommercialState,
  type PublicAccountNavigation,
} from "@/lib/public-shell";
import { HELP_OWNER_PATH, helpShellCopy } from "@/lib/site/help-copy";
import { HELP_SITE_NAME, type SiteClass } from "@/lib/site/host-gate";
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

function helpNavigationLabel(help: ReturnType<typeof helpShellCopy>, href: string) {
  if (href === "/10-steps") return help.navigation.tenSteps;
  if (href === "/pause-plan") return help.navigation.pausePlan;
  if (href === "/learn") return help.navigation.guides;
  if (href === "/help") return help.navigation.help;
  return href;
}

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
  site = "main",
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
   * False in the Programme's shell (Founder, 16 October 2026): the commercial links are not built
   * at all there, so no Programme document carries their addresses. Every public page builds them
   * (Founder, 17 October 2026).
   */
  researchNavigation?: boolean;
  /** `help` builds the help host's own four links and nothing else (RFC-057 §6, rule 3). */
  site?: SiteClass;
}) {
  const help = site === "help" ? helpShellCopy(presentation.locale) : null;
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
  // One menu for every visitor (Founder, 17 October 2026): the guide links keep the places they
  // have had since 10 October and the commercial destinations are simply shown to everyone, so the
  // desktop list reads 10 Steps · Best Offers · Casinos · Bonuses · Learn · Help. Help keeps its
  // own block in the drawer, so only 10 Steps joins the drawer's route list.
  const guideLink = (item: (typeof GUIDE_NAVIGATION)[number], variant: "desktop" | "mobile") => (
    <PublicNavigationRouteLink
      baseHref={item.href}
      className={variant === "desktop" && "safety" in item ? styles.helpLink : undefined}
      key={item.href}
      label={navigationLabel(messages, item.href)}
      presentation={presentation}
      programme={programme}
    >
      {variant === "mobile"
        ? <><span>{navigationLabel(messages, item.href)}</span><small>{messages.view}</small></>
        : navigationLabel(messages, item.href)}
    </PublicNavigationRouteLink>
  );
  const helpLink = (item: (typeof HELP_NAVIGATION)[number], variant: "desktop" | "mobile") => (
    <PublicNavigationRouteLink
      baseHref={item.href}
      className={variant === "desktop" && "safety" in item ? styles.helpLink : undefined}
      key={item.href}
      label={helpNavigationLabel(help!, item.href)}
      presentation={presentation}
      programme={programme}
    >
      {variant === "mobile"
        ? <><span>{helpNavigationLabel(help!, item.href)}</span><small>{messages.view}</small></>
        : helpNavigationLabel(help!, item.href)}
    </PublicNavigationRouteLink>
  );
  const navigationSource = help ? HELP_NAVIGATION : GUIDE_NAVIGATION;
  const routeLink = help
    ? (item: (typeof HELP_NAVIGATION)[number] | (typeof GUIDE_NAVIGATION)[number], variant: "desktop" | "mobile") => helpLink(item as (typeof HELP_NAVIGATION)[number], variant)
    : (item: (typeof HELP_NAVIGATION)[number] | (typeof GUIDE_NAVIGATION)[number], variant: "desktop" | "mobile") => guideLink(item as (typeof GUIDE_NAVIGATION)[number], variant);
  const leadingGuideNavigation = navigationSource.filter((item) => !("safety" in item));
  const trailingGuideNavigation = navigationSource.filter((item) => "safety" in item);
  return (
    <>
      <div className={styles.desktopNavigation}>
        <nav className={styles.primaryNavigation} aria-label={messages.primaryNavigation}>
          {leadingGuideNavigation.map((item) => routeLink(item, "desktop"))}
          {(help ? [] : PUBLIC_NAVIGATION).map((item) => {
            if (!researchNavigation && "commercial" in item) return null;
            const commercialNavigation = deferredDesktopNavigation[item.href as keyof typeof deferredDesktopNavigation];
            if (deferCommercialNavigation && commercialNavigation !== undefined) {
              return <Fragment key={item.href}>{commercialNavigation}</Fragment>;
            }
            if (!visibleNavigationHrefs.has(item.href)) return null;
            return (
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
          })}
          {trailingGuideNavigation.map((item) => routeLink(item, "desktop"))}
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
              <Link className={styles.dialogBrand} href={homeHref} prefetch={false} translate="no">{help ? HELP_SITE_NAME : "B4GAMBLE"}<PublicLinkPendingSignal label={help ? help.homeLabel : messages.homeLabel} /></Link>
              <span aria-hidden="true" className={styles.dialogCloseSpace} />
            </div>
            <nav className={styles.mobileRouteList} aria-label={messages.mobilePrimaryNavigation}>
              {leadingGuideNavigation.map((item) => routeLink(item, "mobile"))}
              {(help ? [] : PUBLIC_NAVIGATION).map((item) => {
                if (!researchNavigation && "commercial" in item) return null;
                const commercialNavigation = deferredMobileNavigation[item.href as keyof typeof deferredMobileNavigation];
                if (deferCommercialNavigation && commercialNavigation !== undefined) {
                  return <Fragment key={item.href}>{commercialNavigation}</Fragment>;
                }
                if (!visibleNavigationHrefs.has(item.href)) return null;
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
              {/* Log in for a visitor; Log out, in the same place, for a signed-in person. */}
              <PublicMobileAccountLine
                authenticated={authenticated}
                className={styles.mobileMenuLogout}
                labels={{ logOut: messages.logOut, loggingOut: messages.loggingOut, logOutRetry: messages.logOutRetry }}
                login={<Link className={styles.mobileMenuLogin} href={account.accountHref}>{accountLabel}</Link>}
                programmeHref={account.primaryHref}
              />
            </div>
            {/* On the help host /help is already the last route in the list above, so the
                drawer's closing block names the owner page instead — the one thing a visitor
                of a help site most often wants to check (RFC-057 §17). */}
            <div className={styles.mobileHelp}>
              <span>{help ? help.footer.aboutThisSite : messages.controlAndSupport}</span>
              {help ? (
                <PublicNavigationRouteLink baseHref={HELP_OWNER_PATH} label={help.footer.owner} presentation={presentation} programme={programme}>{help.footer.owner}</PublicNavigationRouteLink>
              ) : (
                <PublicNavigationRouteLink baseHref="/help" label={messages.openHelp} presentation={presentation} programme={programme}>{messages.openHelp}</PublicNavigationRouteLink>
              )}
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
            <p className={styles.dialogLegal}>{help ? help.footer.noTracking : messages.adultServiceNotice}</p>
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
