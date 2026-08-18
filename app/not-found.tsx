import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import { transformNotFoundHandoff } from "@/lib/final-handoff/transforms";
import { accountNavigationFor } from "@/lib/public-shell";

export default function NotFound() {
  return <>
    <a className="skipLink" href="#main-content">Skip to main content</a>
    <PublicHeader account={accountNavigationFor({ authenticated: false })} authenticated={false} />
    <main id="main-content"><HandoffPage name="notFound" transform={transformNotFoundHandoff} /></main>
    <PublicFooter />
  </>;
}
