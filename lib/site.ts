export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://sevenbet-next.vercel.app").replace(/\/$/, "");

export const coreRoutes = [
  "",
  "/program",
  "/self-check",
  "/responsible-gambling",
  "/bonuses",
  "/casinos",
  "/catalog",
  "/methodology",
  "/affiliate-disclosure",
  "/about",
  "/faq",
  "/privacy",
  "/terms",
  "/bonus-guide",
  "/tools/budget-calculator",
  "/responsible-gaming",
];

export function absoluteUrl(path: string) {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
