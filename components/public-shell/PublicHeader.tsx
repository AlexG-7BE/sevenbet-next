import Link from "next/link";
import type { ReactNode } from "react";

import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { resolvePresentationContext, type PresentationResolution } from "@/lib/market/presentation-resolver";
import { DEFAULT_MARKET_PROFILE, PUBLISHED_LANGUAGE_ROUTE_PROFILES, marketProfileByLocale, publicMarketPath } from "@/lib/market/registry";
import { commercialDestinationsNavigable, type PublicAccountNavigation } from "@/lib/public-shell";
import type { CommercialProductState } from "@/lib/market/commercial-product-state";
import { commercialProductsAvailable } from "@/lib/market/commercial-product-state";
import type { ProgrammeLocale } from "@/lib/programme/presentation";
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
}) {
  const messages = publicShellMessages(presentation.locale);
  const editorialProfile = marketProfileByLocale(presentation.locale) ?? DEFAULT_MARKET_PROFILE;
  const homeHref = presentation.source === "EXPLICIT_ROUTE" && (!programme || programme.localizePublicLinks)
    ? publicMarketPath(editorialProfile, presentation.locale)
    : "/";
  return (
    <header className={styles.header} data-public-shell="header" data-shell-theme="dark">
      <div className={styles.headerInner}>
        <Link className={styles.brand} href={homeHref} aria-label={messages.homeLabel} prefetch={false} translate="no">
          B4GAMBLE
          <PublicLinkPendingSignal label={messages.homeLabel} />
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
          selectableLanguages={PUBLISHED_LANGUAGE_ROUTE_PROFILES}
        />
      </div>
      <PublicHeaderThemeController />
    </header>
  );
}
