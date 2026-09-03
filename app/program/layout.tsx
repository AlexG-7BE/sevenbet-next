import type { ReactNode } from "react";
import { headers } from "next/headers";

import { PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import { hasBetterAuthSessionCookie } from "@/lib/auth/session-cookie";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { marketEditorialPublicationApproved } from "@/lib/market/registry";
import { accountNavigationFor } from "@/lib/public-shell";
import { isProgrammeLocale, programmePath } from "@/lib/programme/presentation";

export default async function ProgrammeLayout({ children }: { children: ReactNode }) {
  const [requestHeaders, presentation] = await Promise.all([
    headers(),
    resolveServerPresentationContext(),
  ]);
  // Header navigation is presentational. Mission pages and APIs continue to
  // resolve the authoritative session before granting access or writing data.
  const authenticated = hasBetterAuthSessionCookie(requestHeaders);
  const locale = isProgrammeLocale(presentation.locale) ? presentation.locale : "en-GB";
  const path = programmePath(locale);
  const localizePublicLinks = presentation.market ? marketEditorialPublicationApproved(presentation.market) : false;
  const account = accountNavigationFor({ authenticated, programmePath: path });
  const messages = publicShellMessages(locale);

  return (
    <>
      <a className="skipLink" href="#main-content">{messages.skipToMain}</a>
      <PublicHeader account={account} authenticated={authenticated} presentation={presentation} programme={{ locale, localizePublicLinks }} />
      <div id="main-content" data-public-programme-shell>{children}</div>
      <PublicFooter presentation={presentation} programme={{ path, localizePublicLinks }} />
    </>
  );
}
