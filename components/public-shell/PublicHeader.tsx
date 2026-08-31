import Link from "next/link";

import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { publicCoreTranslationReady } from "@/lib/i18n/review-state";
import { resolvePresentationContext, type PresentationResolution } from "@/lib/market/presentation-resolver";
import { INITIAL_EUROPEAN_MARKET_PROFILES, PUBLICATION_APPROVED_MARKET_PROFILES, publicMarketPath } from "@/lib/market/registry";
import type { PublicAccountNavigation } from "@/lib/public-shell";
import type { ProgrammeLocale } from "@/lib/programme/presentation";
import { PublicHeaderThemeController } from "./PublicHeaderThemeController";
import { PublicNavigation } from "./PublicNavigation";
import styles from "./PublicShell.module.css";

export function PublicHeader({
  account,
  authenticated,
  presentation = resolvePresentationContext({}),
  programme,
}: {
  account: PublicAccountNavigation;
  authenticated: boolean;
  presentation?: PresentationResolution;
  programme?: Readonly<{ locale: ProgrammeLocale; localizePublicLinks: boolean }>;
}) {
  const messages = publicShellMessages(presentation.locale);
  const homeHref = presentation.source === "EXPLICIT_ROUTE" && (!programme || programme.localizePublicLinks)
    ? publicMarketPath(presentation.market, presentation.locale)
    : "/";
  const selectableMarkets = process.env.VERCEL_ENV === "production"
    ? PUBLICATION_APPROVED_MARKET_PROFILES
    : INITIAL_EUROPEAN_MARKET_PROFILES.filter((profile) => publicCoreTranslationReady(profile.defaultLocale));
  return (
    <header className={styles.header} data-public-shell="header" data-shell-theme="dark">
      <div className={styles.headerInner}>
        <Link className={styles.brand} href={homeHref} aria-label={messages.homeLabel} translate="no">
          B4GAMBLE
        </Link>
        <PublicNavigation account={account} authenticated={authenticated} messages={messages} presentation={presentation} programme={programme} selectableMarkets={selectableMarkets} />
      </div>
      <PublicHeaderThemeController />
    </header>
  );
}
