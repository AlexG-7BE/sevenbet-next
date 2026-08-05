import type { ReactNode } from "react";

import { PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import { getServerSession } from "@/lib/auth/session";
import { accountNavigationFor } from "@/lib/public-shell";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  const authenticated = Boolean(session?.user);
  const account = accountNavigationFor({ authenticated });

  return (
    <>
      <a className="skipLink" href="#main-content">Skip to main content</a>
      <PublicHeader account={account} authenticated={authenticated} />
      <main id="main-content">{children}</main>
      <PublicFooter />
    </>
  );
}
