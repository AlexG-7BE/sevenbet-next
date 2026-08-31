import type { ReactNode } from "react";

import { PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import { getServerSession } from "@/lib/auth/session";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { accountNavigationFor } from "@/lib/public-shell";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [session, presentation] = await Promise.all([
    getServerSession(),
    resolveServerPresentationContext(),
  ]);
  const authenticated = Boolean(session?.user);
  const account = accountNavigationFor({ authenticated });
  const messages = publicShellMessages(presentation.locale);

  return (
    <>
      <a className="skipLink" href="#main-content">{messages.skipToMain}</a>
      <PublicHeader account={account} authenticated={authenticated} presentation={presentation} />
      <main id="main-content">{children}</main>
      <PublicFooter presentation={presentation} />
    </>
  );
}
