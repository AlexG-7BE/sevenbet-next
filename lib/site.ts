export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://sevenbet-next.vercel.app").replace(/\/$/, "");

export const coreRoutes = [
  "",
  "/self-check",
  "/program",
  "/bonuses",
  "/catalog",
  "/bonus-guide",
  "/tools/budget-calculator",
  "/responsible-gaming",
];

export function absoluteUrl(path: string) {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
