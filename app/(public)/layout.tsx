import { Suspense, type ReactNode } from "react";
import { headers } from "next/headers";

import { PublicCommercialFooterLink, PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import { PublicCommercialNavigationItem } from "@/components/public-shell/PublicNavigation";
import { PublicCommercialNavigationRetry, PublicCommercialNavigationSettled } from "@/components/public-shell/PublicNavigationClient";
import { PublicNavigationFeedback } from "@/components/public-shell/PublicNavigationFeedback";
import { hasBetterAuthSessionCookie } from "@/lib/auth/session-cookie";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { resolveServerCommercialProductState } from "@/lib/market/commercial-product-state.server";
import { commercialProductsAvailable } from "@/lib/market/commercial-product-state";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { accountNavigationFor, commercialDestinationsNavigable } from "@/lib/public-shell";
import styles from "@/components/public-shell/PublicShell.module.css";

type Presentation = Awaited<ReturnType<typeof resolveServerPresentationContext>>;
const COMMERCIAL_NAVIGATION_WAIT_MS = 1_500;

type CommercialStateResolution =
  | Readonly<{ kind: "resolved"; state: Awaited<ReturnType<typeof resolveServerCommercialProductState>> }>
  | Readonly<{ kind: "rejected" }>
  | Readonly<{ kind: "timed-out" }>;

function boundedCommercialProductState(
  state: ReturnType<typeof resolveServerCommercialProductState>,
): Promise<CommercialStateResolution> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ kind: "timed-out" }), COMMERCIAL_NAVIGATION_WAIT_MS);
    void state.then(
      (value) => {
        clearTimeout(timer);
        resolve({ kind: "resolved", state: value });
      },
      () => {
        clearTimeout(timer);
        resolve({ kind: "rejected" });
      },
    );
  });
}

type CommercialStatePromise = ReturnType<typeof boundedCommercialProductState>;

async function CommercialHeaderNavigation({
  destination,
  messages,
  presentation,
  state,
  variant,
}: {
  destination: "/best-offers" | "/bonuses";
  messages: ReturnType<typeof publicShellMessages>;
  presentation: Presentation;
  state: CommercialStatePromise;
  variant: "desktop" | "mobile";
}) {
  const resolution = await state;
  if (resolution.kind === "timed-out") {
    return variant === "mobile" && destination === "/best-offers" ? <PublicCommercialNavigationRetry /> : null;
  }
  const settled = variant === "mobile" && destination === "/best-offers"
    ? <PublicCommercialNavigationSettled />
    : null;
  if (resolution.kind !== "resolved"
    || !commercialDestinationsNavigable(commercialProductsAvailable(resolution.state), presentation.marketCountryCode)) return settled;
  return <>{settled}<PublicCommercialNavigationItem destination={destination} messages={messages} presentation={presentation} variant={variant} /></>;
}

async function CommercialFooterNavigation({
  destination,
  presentation,
  programmePath,
  state,
}: {
  destination: "/best-offers" | "/bonuses";
  presentation: Presentation;
  programmePath: string;
  state: CommercialStatePromise;
}) {
  const resolution = await state;
  if (resolution.kind !== "resolved"
    || !commercialDestinationsNavigable(commercialProductsAvailable(resolution.state), presentation.marketCountryCode)) return null;
  return <PublicCommercialFooterLink destination={destination} presentation={presentation} programme={{ path: programmePath, localizePublicLinks: true }} />;
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const commercialProductState = boundedCommercialProductState(resolveServerCommercialProductState());
  const [requestHeaders, presentation] = await Promise.all([
    headers(),
    resolveServerPresentationContext(),
  ]);
  // The shell reads only session-cookie presence for account chrome. Protected
  // pages and APIs remain the authority for identity and Programme state.
  const authenticated = hasBetterAuthSessionCookie(requestHeaders);
  const programmePath = programmePathForPresentationLocale(presentation.locale);
  const account = accountNavigationFor({ authenticated, programmePath });
  const messages = publicShellMessages(presentation.locale);

  return (
    <PublicNavigationFeedback className={styles.navigationFeedback}>
      <a className="skipLink" href="#main-content">{messages.skipToMain}</a>
      <PublicHeader
        account={account}
        authenticated={authenticated}
        commercialDesktopBestOffersNavigation={(
          <Suspense fallback={<span data-commercial-navigation-pending="desktop" hidden />}>
            <CommercialHeaderNavigation destination="/best-offers" messages={messages} presentation={presentation} state={commercialProductState} variant="desktop" />
          </Suspense>
        )}
        commercialDesktopBonusesNavigation={(
          <Suspense fallback={<span data-commercial-navigation-pending="desktop-bonuses" hidden />}>
            <CommercialHeaderNavigation destination="/bonuses" messages={messages} presentation={presentation} state={commercialProductState} variant="desktop" />
          </Suspense>
        )}
        commercialMobileBestOffersNavigation={(
          <Suspense fallback={<span data-commercial-navigation-pending="mobile" hidden />}>
            <CommercialHeaderNavigation destination="/best-offers" messages={messages} presentation={presentation} state={commercialProductState} variant="mobile" />
          </Suspense>
        )}
        commercialMobileBonusesNavigation={(
          <Suspense fallback={<span data-commercial-navigation-pending="mobile-bonuses" hidden />}>
            <CommercialHeaderNavigation destination="/bonuses" messages={messages} presentation={presentation} state={commercialProductState} variant="mobile" />
          </Suspense>
        )}
        commercialProductState="EDITORIAL_ONLY"
        deferCommercialNavigation
        presentation={presentation}
      />
      <main id="main-content">{children}</main>
      <PublicFooter
        commercialBestOffersNavigation={(
          <Suspense fallback={<span data-commercial-navigation-pending="footer" hidden />}>
            <CommercialFooterNavigation destination="/best-offers" presentation={presentation} programmePath={programmePath} state={commercialProductState} />
          </Suspense>
        )}
        commercialBonusesNavigation={(
          <Suspense fallback={<span data-commercial-navigation-pending="footer-bonuses" hidden />}>
            <CommercialFooterNavigation destination="/bonuses" presentation={presentation} programmePath={programmePath} state={commercialProductState} />
          </Suspense>
        )}
        commercialProductState="EDITORIAL_ONLY"
        deferCommercialNavigation
        presentation={presentation}
        programme={{ path: programmePath, localizePublicLinks: true }}
      />
    </PublicNavigationFeedback>
  );
}
