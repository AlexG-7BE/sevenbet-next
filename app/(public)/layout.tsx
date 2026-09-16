import { Suspense, type ReactNode } from "react";
import { headers } from "next/headers";

import { PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import { PublicNavigationFeedback } from "@/components/public-shell/PublicNavigationFeedback";
import { hasBetterAuthSessionCookie } from "@/lib/auth/session-cookie";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { resolveServerCommercialProductState } from "@/lib/market/commercial-product-state.server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { accountNavigationFor } from "@/lib/public-shell";
import styles from "@/components/public-shell/PublicShell.module.css";

type AccountNavigation = ReturnType<typeof accountNavigationFor>;
type Presentation = Awaited<ReturnType<typeof resolveServerPresentationContext>>;
type CommercialStatePromise = ReturnType<typeof resolveServerCommercialProductState>;

async function CommercialHeader({
  account,
  authenticated,
  presentation,
  state,
}: {
  account: AccountNavigation;
  authenticated: boolean;
  presentation: Presentation;
  state: CommercialStatePromise;
}) {
  return <PublicHeader account={account} authenticated={authenticated} commercialProductState={await state} presentation={presentation} />;
}

async function CommercialFooter({
  presentation,
  programmePath,
  state,
}: {
  presentation: Presentation;
  programmePath: string;
  state: CommercialStatePromise;
}) {
  return <PublicFooter commercialProductState={await state} presentation={presentation} programme={{ path: programmePath, localizePublicLinks: true }} />;
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const commercialProductState = resolveServerCommercialProductState();
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
      <Suspense fallback={<PublicHeader account={account} authenticated={authenticated} commercialProductState="EDITORIAL_ONLY" presentation={presentation} />}>
        <CommercialHeader account={account} authenticated={authenticated} presentation={presentation} state={commercialProductState} />
      </Suspense>
      <main id="main-content">{children}</main>
      <Suspense fallback={<PublicFooter commercialProductState="EDITORIAL_ONLY" presentation={presentation} programme={{ path: programmePath, localizePublicLinks: true }} />}>
        <CommercialFooter presentation={presentation} programmePath={programmePath} state={commercialProductState} />
      </Suspense>
    </PublicNavigationFeedback>
  );
}
