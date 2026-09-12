import type { ReactNode } from "react";
import { headers } from "next/headers";

import { PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import { hasBetterAuthSessionCookie } from "@/lib/auth/session-cookie";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { resolveServerCommercialProductState } from "@/lib/market/commercial-product-state.server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { accountNavigationFor } from "@/lib/public-shell";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [requestHeaders, presentation, commercialProductState] = await Promise.all([
    headers(),
    resolveServerPresentationContext(),
    resolveServerCommercialProductState(),
  ]);
  // The shell reads only session-cookie presence for account chrome. Protected
  // pages and APIs remain the authority for identity and Programme state.
  const authenticated = hasBetterAuthSessionCookie(requestHeaders);
  const programmePath = programmePathForPresentationLocale(presentation.locale);
  const account = accountNavigationFor({ authenticated, programmePath });
  const messages = publicShellMessages(presentation.locale);

  return (
    <>
      <a className="skipLink" href="#main-content">{messages.skipToMain}</a>
      <PublicHeader account={account} authenticated={authenticated} commercialProductState={commercialProductState} presentation={presentation} />
      <main id="main-content">{children}</main>
      <PublicFooter commercialProductState={commercialProductState} presentation={presentation} programme={{ path: programmePath, localizePublicLinks: true }} />
    </>
  );
}
