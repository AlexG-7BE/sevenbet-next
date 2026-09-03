import type { ReactNode } from "react";

import { PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import { getServerSession } from "@/lib/auth/session";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { marketEditorialPublicationApproved } from "@/lib/market/registry";
import { accountNavigationFor } from "@/lib/public-shell";
import { isProgrammeLocale, programmePath } from "@/lib/programme/presentation";

export default async function ProgrammeLayout({ children }: { children: ReactNode }) {
  const [session, presentation] = await Promise.all([
    getServerSession(),
    resolveServerPresentationContext(),
  ]);
  const authenticated = Boolean(session?.user);
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
