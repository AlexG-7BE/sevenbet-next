import { OWNER_BYPASS_COOKIE } from "@/lib/security/geo-block";

// Static assets skip middleware (see the matcher in middleware.ts): hashed build output, the
// image optimizer, raster images and fonts. Vercel Firewall refuses them for blocked countries
// before the CDN cache, at no cost to other visitors (Founder choice, 28 Sep 2026).
// The Firewall reads no environment variables: keep `countries` equal to BLOCKED_COUNTRIES and
// toggle the rule together with GEO_BLOCK_ENABLED. It checks only that the owner cookie exists;
// pages and APIs verify its signature in middleware.

export const GEO_BLOCK_STATIC_ASSET_PATH_PATTERN =
  String.raw`^/_next/|\.(?:png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf)$`;

export const GEO_BLOCK_FIREWALL_RULE_NAME = "Geo-block: static assets";

/** Request body for the Vercel Firewall API action `rules.insert` (Production only). */
export function geoBlockFirewallRule(countries: readonly string[]) {
  return {
    name: GEO_BLOCK_FIREWALL_RULE_NAME,
    description: "Deny static assets to blocked countries unless the b4g_owner cookie exists. Pages and APIs get HTTP 451 from middleware.",
    active: true,
    conditionGroup: [
      {
        conditions: [
          { type: "environment", op: "eq", value: "production" },
          { type: "geo_country", op: "inc", value: [...countries] },
          { type: "path", op: "re", value: GEO_BLOCK_STATIC_ASSET_PATH_PATTERN },
          { type: "cookie", op: "nex", key: OWNER_BYPASS_COOKIE },
        ],
      },
    ],
    action: {
      mitigate: { action: "deny", rateLimit: null, redirect: null, actionDuration: null },
    },
  } as const;
}
