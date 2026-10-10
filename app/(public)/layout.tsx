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
import { researchAccessOpen } from "@/lib/research-access";
import styles from "@/components/public-shell/PublicShell.module.css";

// Every public page under this layout inherits it (Next merges segment config
// from layout to page): a page whose database read hangs ends at 30 s instead
// of the platform's 300 s default.
export const maxDuration = 30;

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
  researchAccess,
  state,
  variant,
}: {
  destination: "/best-offers" | "/bonuses";
  messages: ReturnType<typeof publicShellMessages>;
  presentation: Presentation;
  researchAccess: boolean;
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
  return <>{settled}<PublicCommercialNavigationItem destination={destination} messages={messages} presentation={presentation} researchAccess={researchAccess} variant={variant} /></>;
}

async function CommercialFooterNavigation({
  destination,
  presentation,
  programmePath,
  researchAccess,
  state,
}: {
  destination: "/best-offers" | "/bonuses";
  presentation: Presentation;
  programmePath: string;
  researchAccess: boolean;
  state: CommercialStatePromise;
}) {
  const resolution = await state;
  if (resolution.kind !== "resolved"
    || !commercialDestinationsNavigable(commercialProductsAvailable(resolution.state), presentation.marketCountryCode)) return null;
  return <PublicCommercialFooterLink destination={destination} presentation={presentation} programme={{ path: programmePath, localizePublicLinks: true }} researchAccess={researchAccess} />;
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
  // The lesson flag is a plain cookie; no session or Programme state is read to draw the menu.
  const researchAccess = researchAccessOpen(requestHeaders.get("cookie"));
  const programmePath = programmePathForPresentationLocale(presentation.locale);
  const account = accountNavigationFor({ authenticated, programmePath });
  const messages = publicShellMessages(presentation.locale);

  return (
    <PublicNavigationFeedback className={styles.navigationFeedback} progressClassName={styles.navigationProgress}>
      <a className="skipLink" href="#main-content">{messages.skipToMain}</a>
      <PublicHeader
        account={account}
        authenticated={authenticated}
        commercialDesktopBestOffersNavigation={(
          <Suspense fallback={<span data-commercial-navigation-pending="desktop" hidden />}>
            <CommercialHeaderNavigation destination="/best-offers" messages={messages} presentation={presentation} researchAccess={researchAccess} state={commercialProductState} variant="desktop" />
          </Suspense>
        )}
        commercialDesktopBonusesNavigation={(
          <Suspense fallback={<span data-commercial-navigation-pending="desktop-bonuses" hidden />}>
            <CommercialHeaderNavigation destination="/bonuses" messages={messages} presentation={presentation} researchAccess={researchAccess} state={commercialProductState} variant="desktop" />
          </Suspense>
        )}
        commercialMobileBestOffersNavigation={(
          <Suspense fallback={<span data-commercial-navigation-pending="mobile" hidden />}>
            <CommercialHeaderNavigation destination="/best-offers" messages={messages} presentation={presentation} researchAccess={researchAccess} state={commercialProductState} variant="mobile" />
          </Suspense>
        )}
        commercialMobileBonusesNavigation={(
          <Suspense fallback={<span data-commercial-navigation-pending="mobile-bonuses" hidden />}>
            <CommercialHeaderNavigation destination="/bonuses" messages={messages} presentation={presentation} researchAccess={researchAccess} state={commercialProductState} variant="mobile" />
          </Suspense>
        )}
        commercialProductState="EDITORIAL_ONLY"
        deferCommercialNavigation
        presentation={presentation}
        researchAccess={researchAccess}
      />
      <main id="main-content">{children}</main>
      <PublicFooter
        commercialBestOffersNavigation={(
          <Suspense fallback={<span data-commercial-navigation-pending="footer" hidden />}>
            <CommercialFooterNavigation destination="/best-offers" presentation={presentation} programmePath={programmePath} researchAccess={researchAccess} state={commercialProductState} />
          </Suspense>
        )}
        commercialBonusesNavigation={(
          <Suspense fallback={<span data-commercial-navigation-pending="footer-bonuses" hidden />}>
            <CommercialFooterNavigation destination="/bonuses" presentation={presentation} programmePath={programmePath} researchAccess={researchAccess} state={commercialProductState} />
          </Suspense>
        )}
        commercialProductState="EDITORIAL_ONLY"
        deferCommercialNavigation
        presentation={presentation}
        programme={{ path: programmePath, localizePublicLinks: true }}
        researchAccess={researchAccess}
      />
    </PublicNavigationFeedback>
  );
}
