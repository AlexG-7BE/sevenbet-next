import type { ReactNode } from "react";

import { PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import { getServerSession } from "@/lib/auth/session";
import { isCpoCommercialPreviewEnabled } from "@/lib/cpo-commercial-preview";
import { accountNavigationFor } from "@/lib/public-shell";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  const authenticated = Boolean(session?.user);
  const account = accountNavigationFor({ authenticated });
  const commercialPreview = isCpoCommercialPreviewEnabled();

  return (
    <>
      <a className="skipLink" href="#main-content">Skip to main content</a>
      <PublicHeader account={account} authenticated={authenticated} />
      {commercialPreview ? <aside className="cpoPreviewBanner" role="note"><strong>PREVIEW ONLY</strong><span>Commercial actions are simulated and never leave B4GAMBLE. No partner or offer availability is implied.</span></aside> : null}
      <main id="main-content">{children}</main>
      <PublicFooter />
    </>
  );
}
