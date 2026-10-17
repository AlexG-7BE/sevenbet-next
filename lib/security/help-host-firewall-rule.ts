import { HELP_CANONICAL_HOST } from "@/lib/site/host-gate";

/**
 * RFC-057 §4.2, the runtime half of the route manifest. **PROPOSED, applied in phase 2 before
 * `HELP_SITE_SERVING` is turned on** — nothing reads this at runtime; it is the body of a
 * Vercel Firewall rule, kept in the repository and tested so it cannot drift from the matcher.
 *
 * The middleware matcher skips hashed build files, the image optimizer and every raster image
 * and font by file ending, so the help gate never sees them: on the help host
 * `public/casino-brands/*.png`, `public/brand/b4gamble-logo-512.png` and `/favicon.ico` would
 * all answer 200. "Every route not on the list answers 404 there" cannot hold through
 * middleware alone.
 *
 * It is written as a **default deny over everything middleware cannot see**, not as a list of
 * the `public/` folders that exist today. A deny list has to be remembered whenever a folder,
 * an app icon or a metadata image is added; this has to be remembered only when something new
 * must be *allowed*. It is also what covers the two cases a `public/` list misses: an app
 * route with an image ending (`/favicon.ico`, `/opengraph-image/<id>.png`) and a file added
 * to `public/` after the rule was written.
 *
 * One exception, and it is the Founder's decision of 25 September 2026: hashed build files
 * under `/_next/static/` are served on both hosts. They are not linked from help pages, carry
 * no address in a sitemap and are not indexed — and the help site's own fonts live there.
 *
 * The regulator tables the pause-statistics page links (`/data/*.csv`) are not matched by the
 * deny pattern at all: `.csv` is not an excluded file ending, so middleware does see them and
 * the route manifest already decides them (`/data` is `HELP`).
 */

/** Exactly what the middleware matcher in `middleware.ts` skips. */
export const HELP_HOST_UNGATED_PATH_PATTERN =
  String.raw`^/_next/|\.(?:png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf)$`;

/** The one ungated prefix both hosts keep serving. */
export const HELP_HOST_SERVED_UNGATED_PATH_PATTERN = String.raw`^/_next/static/`;

export const HELP_HOST_FIREWALL_RULE_NAME = "Help site: deny commercial static assets";

/**
 * Request body for the Vercel Firewall API action `rules.insert` (Production only).
 *
 * **UNKNOWN until it is applied:** the exact spelling of the `host` condition and of the
 * negated regex operator in the Firewall API. The two patterns above are the part this
 * repository can prove, and `tests/help-site-host.test.ts` proves them; confirm the field
 * names against the API when the rule is created in phase 2, as the runbook says.
 */
export function helpHostFirewallRule(helpHost: string = HELP_CANONICAL_HOST) {
  return {
    name: HELP_HOST_FIREWALL_RULE_NAME,
    description: "On the help host, deny every request the middleware matcher skips (raster images, fonts, the image optimizer), except hashed build files under /_next/static/. The help gate answers 404 for everything it can see.",
    active: true,
    conditionGroup: [
      {
        conditions: [
          { type: "environment", op: "eq", value: "production" },
          { type: "host", op: "eq", value: helpHost },
          { type: "path", op: "re", value: HELP_HOST_UNGATED_PATH_PATTERN },
          { type: "path", op: "nre", value: HELP_HOST_SERVED_UNGATED_PATH_PATTERN },
        ],
      },
    ],
    action: {
      mitigate: { action: "deny", rateLimit: null, redirect: null, actionDuration: null },
    },
  } as const;
}
