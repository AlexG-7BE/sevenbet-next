import { offersMayBePresented } from "@/lib/public-offer/offer-visibility";

export type ShellRouteKind = "public" | "programme" | "protected-help" | "internal";

export const PUBLIC_NAVIGATION = [
  { label: "Best Offers", href: "/best-offers", commercial: true },
  { label: "Casinos", href: "/casinos", commercial: true },
  { label: "Bonuses", href: "/bonuses", commercial: true },
  { label: "Learn", href: "/learn" },
] as const;

/**
 * What the menu offers a reader who has come through neither research door (see
 * `lib/research-access.ts`): the Programme's own pages take the place of the research links.
 */
export const GUIDE_NAVIGATION = [
  { label: "10 Steps", href: "/10-steps" },
  { label: "Help", href: "/help", safety: true },
] as const;

const commercialMarketOnlyRoutes = new Set(["/best-offers", "/bonuses"]);

export function publicNavigationForCommercialState(commercialProductsAvailable: boolean) {
  return PUBLIC_NAVIGATION.filter((item) => commercialProductsAvailable || !commercialMarketOnlyRoutes.has(item.href));
}

export function publicCommercialDestinationVisible(href: string, commercialProductsAvailable: boolean) {
  return commercialProductsAvailable || !commercialMarketOnlyRoutes.has(href);
}

/**
 * Whether Best Offers and Bonuses belong in navigation for this reader.
 *
 * A partner route is not the test. `commercialProductsAvailable` reports only
 * that a canonical action exists, and RFC-039 separates publication from route
 * eligibility: those pages now present published offers wherever advertising is
 * not prohibited. Gating the links on a route left the pages populated and
 * unreachable in every country we had not activated. The link follows the page,
 * and the missing route still means no button once the reader arrives.
 */
export function commercialDestinationsNavigable(commercialProductsAvailable: boolean, countryCode?: string | null) {
  return commercialProductsAvailable || offersMayBePresented(countryCode);
}

const protectedHelpPrefixes = ["/help"];
const internalPrefixes = ["/admin", "/editorial-preview"];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function classifyShellRoute(pathname: string): ShellRouteKind {
  const cleanPath = pathname.split(/[?#]/, 1)[0] || "/";
  if (matchesPrefix(cleanPath, "/program")) return "programme";
  if (protectedHelpPrefixes.some((prefix) => matchesPrefix(cleanPath, prefix))) return "protected-help";
  if (internalPrefixes.some((prefix) => matchesPrefix(cleanPath, prefix))) return "internal";
  return "public";
}

export function isCurrentPublicRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/casinos" && matchesPrefix(pathname, "/casino")) return true;
  return matchesPrefix(pathname, href);
}

/**
 * Whether a link to the Programme's start leads to the page being rendered. The browser sees the
 * address itself (`/sv/program`); the server renders a localized Programme page under the path
 * it is rewritten to (`/program`), so both name it and the first HTML agrees with the browser.
 * Another Programme address (`/sv/program/anything`, the not-found screen) is another page.
 */
export function leadsToCurrentProgrammePage(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname === "/program" && /^\/[a-z]{2}\/program$/.test(href);
}

export function accountNavigationFor({
  authenticated,
  authoritativeXp,
  programmePath = "/program",
}: {
  authenticated: boolean;
  authoritativeXp?: number | null;
  programmePath?: string;
}) {
  return authenticated
    ? {
        accountLabel: "My Programme",
        accountHref: programmePath,
        primaryLabel: "My Programme",
        primaryHref: programmePath,
        xpLabel: Number.isFinite(authoritativeXp) ? `${authoritativeXp} XP` : null,
      }
    : {
        accountLabel: "Log in",
        accountHref: programmePath === "/program" ? "/login" : `/login?returnTo=${encodeURIComponent(programmePath)}`,
        primaryLabel: "Start Programme",
        primaryHref: programmePath,
        xpLabel: null,
      };
}

export type PublicAccountNavigation = ReturnType<typeof accountNavigationFor>;
