import type { ReactNode } from "react";
import { headers } from "next/headers";

import { PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import { hasBetterAuthSessionCookie } from "@/lib/auth/session-cookie";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { accountNavigationFor } from "@/lib/public-shell";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [requestHeaders, presentation] = await Promise.all([
    headers(),
    resolveServerPresentationContext(),
  ]);
  // The shell only chooses navigation copy. Authoritative identity is resolved
  // by protected pages and APIs; keeping that database read out of the shared
  // layout prevents it competing with public projections on small pools.
  const authenticated = hasBetterAuthSessionCookie(requestHeaders);
  const programmePath = programmePathForPresentationLocale(presentation.locale);
  const account = accountNavigationFor({ authenticated, programmePath });
  const messages = publicShellMessages(presentation.locale);

  return (
    <>
      <a className="skipLink" href="#main-content">{messages.skipToMain}</a>
      <PublicHeader account={account} authenticated={authenticated} presentation={presentation} />
      <main id="main-content">{children}</main>
      <PublicFooter presentation={presentation} programme={{ path: programmePath, localizePublicLinks: true }} />
    </>
  );
}
