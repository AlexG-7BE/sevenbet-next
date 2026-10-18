import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { PublicRouteLoadingFrame } from "@/components/public-shell/PublicRouteLoadingFrame";
import { transformHelpHomeHandoff, transformHomeHandoff, transformHomeHandoffCss } from "@/lib/final-handoff/transforms";
import { homeMetadata } from "@/lib/i18n/home-catalog";
import { productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { programmePathForPresentationLocale } from "@/lib/programme/presentation";
import { shouldStreamRouteFrame } from "@/lib/seo/route-frame";
import { HELP_OWNER_PATH, HELP_SHARE_IMAGE_PATH, helpHomeCopy, helpOwnerLinkLabel, helpShellCopy } from "@/lib/site/help-copy";
import { HELP_SITE_NAME, helpSiteSwitchesFromProcessEnv, type SiteClass } from "@/lib/site/host-gate";
import { resolveServerSite } from "@/lib/site/server-site";

export async function generateMetadata(): Promise<Metadata> {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  if (site === "help") {
    // `/` is the help site's front door, so it carries the site's own title and description
    // rather than one page's (RFC-057 §8).
    const help = helpShellCopy(presentation.locale);
    const indexable = helpSiteSwitchesFromProcessEnv().redirects;
    return {
      title: help.metadataTitle,
      description: help.metadataDescription,
      robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
      openGraph: { type: "website", siteName: HELP_SITE_NAME, title: help.metadataTitle, description: help.metadataDescription, images: [{ url: HELP_SHARE_IMAGE_PATH, width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image", images: [HELP_SHARE_IMAGE_PATH] },
    };
  }
  const { title, description } = homeMetadata(presentation.locale);
  return productMetadata({ presentation, pathname: "/", title, description, robots: { index: true, follow: true }, site });
}

async function HomeContent({ site }: { site: SiteClass }) {
  const presentation = await resolveServerPresentationContext();
  const programmePath = programmePathForPresentationLocale(presentation.locale);
  if (site === "help") {
    // §4.2: the captured page asks for `public/home/…`, which the help-host Firewall rule
    // denies, so the help host takes the same five photographs hashed under `/_next/static/`.
    // The import is dynamic and behind the branch, as `/10-steps` does it, so the main host
    // and `node --test` never load a `.jpg`.
    const { helpHostHomePhotoRewrites } = await import("@/lib/media/help-host-photos");
    const photos = helpHostHomePhotoRewrites();
    const copy = helpHomeCopy(presentation.locale);
    return (
      <HandoffPage
        cssTransform={transformHomeHandoffCss}
        name="home"
        programmePath={programmePath}
        site="help"
        transform={(html) => transformHelpHomeHandoff(transformHomeHandoff(html, presentation.locale), {
          owner: {
            ...copy.owner,
            href: productHref(presentation, HELP_OWNER_PATH),
            linkLabel: helpOwnerLinkLabel(presentation.locale),
          },
          pausePlan: {
            ...copy.pausePlan,
            heroLink: copy.heroPausePlanLink,
            href: productHref(presentation, "/pause-plan"),
          },
          photos,
        })}
      />
    );
  }
  return (
    <HandoffPage
      cssTransform={transformHomeHandoffCss}
      name="home"
      programmePath={programmePath}
      transform={(html) => transformHomeHandoff(html, presentation.locale)}
    />
  );
}

/**
 * People get the instant frame while the home page loads; crawlers, agents and HTTP clients
 * get the complete page in the first response (audit 27 Sep 2026: GPTBot, ClaudeBot and
 * Googlebot read 176 words of navigation with the content hidden after the footer).
 *
 * Both hosts serve the same captured design (Founder, 18 October 2026). Until that day `/` on
 * the help host rendered the pause plan, which he opened on his phone and would not read: a
 * wall of text where the main site has a home page. The plan keeps its own address at
 * `/pause-plan` and is linked from the header, the footer, the hero and a screen of its own.
 */
export default async function HomePage() {
  const site = await resolveServerSite();
  if (!shouldStreamRouteFrame(await headers())) return <HomeContent site={site} />;
  return <Suspense fallback={<PublicRouteLoadingFrame destination="home" label={site === "help" ? HELP_SITE_NAME : "B4GAMBLE"} />}><HomeContent site={site} /></Suspense>;
}
