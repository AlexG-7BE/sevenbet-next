export type ShellRouteKind = "public" | "programme" | "protected-help" | "internal";

export const PUBLIC_NAVIGATION = [
  { label: "Best Offers", href: "/best-offers", commercial: true },
  { label: "Casinos", href: "/casinos", commercial: true },
  { label: "Bonuses", href: "/bonuses", commercial: true },
  { label: "Learn", href: "/learn" },
] as const;

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
