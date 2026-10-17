import Link from "next/link";
import type { ReactNode } from "react";

import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { resolvePresentationContext, type PresentationResolution } from "@/lib/market/presentation-resolver";
import { DEFAULT_MARKET_PROFILE, PUBLISHED_LANGUAGE_ROUTE_PROFILES, marketProfileByLocale, publicMarketPath } from "@/lib/market/registry";
import { finalPublicHref } from "@/lib/market/routing";
import { commercialDestinationsNavigable, type PublicAccountNavigation } from "@/lib/public-shell";
import { helpShellCopy } from "@/lib/site/help-copy";
import { HELP_SITE_NAME, type SiteClass } from "@/lib/site/host-gate";
import type { CommercialProductState } from "@/lib/market/commercial-product-state";
import { commercialProductsAvailable } from "@/lib/market/commercial-product-state";
import type { ProgrammeLocale } from "@/lib/programme/presentation";
import { PublicHeaderAutoHide } from "./PublicHeaderAutoHide";
import { PublicHeaderThemeController } from "./PublicHeaderThemeController";
import { PublicNavigation } from "./PublicNavigation";
import { PublicLinkPendingSignal } from "./PublicNavigationFeedback";
import styles from "./PublicShell.module.css";

export function PublicHeader({
  account,
  authenticated,
  presentation = resolvePresentationContext({}),
  programme,
  commercialProductState = "SUPPORTED_COMMERCIAL",
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
  presentation?: PresentationResolution;
  programme?: Readonly<{ locale: ProgrammeLocale; localizePublicLinks: boolean }>;
  commercialProductState?: CommercialProductState;
  commercialDesktopBestOffersNavigation?: ReactNode;
  commercialDesktopBonusesNavigation?: ReactNode;
  commercialMobileBestOffersNavigation?: ReactNode;
  commercialMobileBonusesNavigation?: ReactNode;
  deferCommercialNavigation?: boolean;
  /**
   * False in the Programme's shell: its menu is built without Best Offers, Casinos and Bonuses.
   * The name is historical — there is no research gate left to look for, and nothing reads the
   * path. True everywhere else, because every public page shows the commercial links (Founder,
   * 17 October 2026). It is renamed to `commercialNavigation` in the RFC-057 phase, kept for now
   * so the Programme's shell stays byte-identical to PR #530.
   */
  researchNavigation?: boolean;
  /**
   * Which of the two Production hosts is answering (RFC-057 §7.2). On `help` the same header
   * renders the help site's own name and its own four links; the commercial destinations and
   * the deferred commercial slots are not built at all. `main` is every other caller and is
   * byte-identical to what it renders today.
   */
  site?: SiteClass;
}) {
  const messages = publicShellMessages(presentation.locale);
  const help = site === "help" ? helpShellCopy(presentation.locale) : null;
  const editorialProfile = marketProfileByLocale(presentation.locale) ?? DEFAULT_MARKET_PROFILE;
  const homeHref = presentation.source === "EXPLICIT_ROUTE" && (!programme || programme.localizePublicLinks)
    ? publicMarketPath(editorialProfile, presentation.locale)
    : finalPublicHref("/", presentation.neutralRouteLocale);
  return (
    <header className={styles.header} data-public-shell="header" data-shell-theme="dark">
      <div className={styles.headerInner}>
        <Link className={styles.brand} href={homeHref} aria-label={help ? help.homeLabel : messages.homeLabel} prefetch={false} translate="no">
          {help ? HELP_SITE_NAME : "B4GAMBLE"}
          <PublicLinkPendingSignal label={help ? help.homeLabel : messages.homeLabel} />
        </Link>
        <PublicNavigation
          account={account}
          authenticated={authenticated}
          commercialDesktopBestOffersNavigation={commercialDesktopBestOffersNavigation}
          commercialDesktopBonusesNavigation={commercialDesktopBonusesNavigation}
          commercialMobileBestOffersNavigation={commercialMobileBestOffersNavigation}
          commercialMobileBonusesNavigation={commercialMobileBonusesNavigation}
          commercialProductsAvailable={commercialDestinationsNavigable(commercialProductsAvailable(commercialProductState), presentation.marketCountryCode)}
          deferCommercialNavigation={deferCommercialNavigation}
          messages={messages}
          presentation={presentation}
          programme={programme}
          researchNavigation={researchNavigation}
          selectableLanguages={PUBLISHED_LANGUAGE_ROUTE_PROFILES}
          site={site}
        />
      </div>
      <PublicHeaderThemeController />
      <PublicHeaderAutoHide />
    </header>
  );
}
