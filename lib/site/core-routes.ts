import { coreRoutes, originForSite } from "@/lib/site";
import { helpSiteSwitchesFromProcessEnv, type SiteClass } from "@/lib/site/host-gate";
import { classifyRoutePath, type SiteRouteClass } from "@/lib/site/host-routes";

/**
 * RFC-057 §12. The sitemap is built from `coreRoutes` in `lib/site.ts`, one list that mixes
 * `HELP` paths (`/10-steps`, `/program`, `/pause-plan`, …) with `COMMERCIAL` ones (`/about`,
 * `/faq`, `/methodology`, …). This is the one place the list is split, and the route-manifest
 * test of §4.1 is what keeps the split and the classes in step: a core route with no class
 * fails the test rather than quietly leaving both sitemaps.
 *
 * The help site lists what it serves. The main site lists everything until
 * `HELP_SITE_REDIRECTS` is on; from that deployment its help routes answer 301 and leave its
 * sitemap in the same breath, so no page is ever listed by two hosts at once (§7.3).
 */
const HELP_HOST_SITEMAP_CLASSES: readonly SiteRouteClass[] = ["HELP", "SHARED"];

/** `/privacy` and `/terms` are noindex and were never in `coreRoutes`; `/contact` is. */
export function coreRoutesForSite(site: SiteClass, redirectsOn: boolean): readonly string[] {
  return coreRoutes.filter((route) => {
    const siteClass = classifyRoutePath(route || "/");
    if (site === "help") return siteClass !== null && HELP_HOST_SITEMAP_CLASSES.includes(siteClass);
    return !(redirectsOn && siteClass === "HELP");
  });
}

/**
 * The Learn category whose guides live on the help site (§14). Before `HELP_SITE_REDIRECTS`
 * they are on the main host like every other category, which is what the second argument says.
 */
export const HELP_LEARN_CATEGORY = "responsible-gambling";

export function learnCategoryBelongsToSite(category: string, site: SiteClass, redirectsOn: boolean) {
  const helpCategory = category === HELP_LEARN_CATEGORY;
  if (site === "help") return helpCategory;
  return !(redirectsOn && helpCategory);
}

/**
 * RFC-057 §14, the one function that decides a guide's public site by its category. The help
 * guides live on the help site from the deployment that turns `HELP_SITE_REDIRECTS` on, and
 * on the main site before it; every other category is the main site's either way. The
 * verifier, the result URL, IndexNow, the sitemap, `learn_source` and `learn_context` all
 * read this, so a guide can never be checked on one host and published on the other.
 */
export function learnArticleSite(
  category: string,
  redirectsOn: boolean = helpSiteSwitchesFromProcessEnv().redirects,
): SiteClass {
  return redirectsOn && category === HELP_LEARN_CATEGORY ? "help" : "main";
}

export function learnArticleOrigin(category: string, redirectsOn?: boolean) {
  return originForSite(learnArticleSite(category, redirectsOn));
}

/**
 * The two origins a public Learn URL may have. A stored canonical, a `learn_source` URL or a
 * `learn_context` URL is accepted on either and on nothing else; which of the two a given
 * guide must use is `learnArticleSite` above.
 */
export function publicLearnOrigins(): readonly string[] {
  return [originForSite("main"), originForSite("help")];
}
