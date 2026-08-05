export type ShellRouteKind = "public" | "programme" | "protected-help" | "internal";

export const PUBLIC_NAVIGATION = [
  { label: "10 Steps", href: "/10-steps" },
  { label: "Casinos", href: "/casinos", commercial: true },
  { label: "Bonuses", href: "/bonuses", commercial: true },
  { label: "Best offers", href: "/best-offers", commercial: true },
  { label: "Learn", href: "/learn" },
  { label: "Help", href: "/responsible-gambling", safety: true },
] as const;

const protectedHelpPrefixes = ["/responsible-gambling", "/responsible-gaming"];
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
}: {
  authenticated: boolean;
  authoritativeXp?: number | null;
}) {
  return authenticated
    ? {
        accountLabel: "My Programme",
        accountHref: "/program",
        primaryLabel: "My Programme",
        primaryHref: "/program",
        xpLabel: Number.isFinite(authoritativeXp) ? `${authoritativeXp} XP` : null,
      }
    : {
        accountLabel: "Log in",
        accountHref: "/program?auth=sign-in",
        primaryLabel: "Start 10 Steps",
        primaryHref: "/program",
        xpLabel: null,
      };
}

export type PublicAccountNavigation = ReturnType<typeof accountNavigationFor>;
