import Link from "next/link";
import { PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import { getServerSession } from "@/lib/auth/session";
import { accountNavigationFor } from "@/lib/public-shell";

export default async function NotFound() {
  const session = await getServerSession();
  const authenticated = Boolean(session?.user);
  return (
    <>
      <a className="skipLink" href="#main-content">Skip to main content</a>
      <PublicHeader account={accountNavigationFor({ authenticated })} authenticated={authenticated} />
      <main id="main-content">
        <section className="pageShell">
          <div className="container">
            <div className="card discoveryEmpty">
              <p className="eyebrow">Page not found</p>
              <h1>This page is unavailable.</h1>
              <p>The link may be outdated, or the content may no longer be published. You can return to educational resources or casino reviews.</p>
              <div className="heroActions">
                <Link className="button gold" href="/">Go home</Link>
                <Link className="button ghost" href="/responsible-gambling">Responsible gambling resources</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
