import {
  languageRouteByPublicSlug,
  localeForLanguageSegment,
  localeMarketRouteByPublicSlug,
  marketProfileByRouteMarket,
} from "@/lib/market/registry";

/**
 * RFC-057 §4: one manifest gives every route root exactly one class, and the class decides
 * which of the two Production hosts serves it. A class is about the host that serves a route,
 * never about who may read it: every COMMERCIAL page stays public, indexable and ungated on
 * the main host.
 *
 *  - `HELP`       the help site serves it; the main site serves it until phase 3.
 *  - `SHARED`     both hosts serve it, each with its own content.
 *  - `COMMERCIAL` only the main site serves it; the help host answers 404.
 *  - `INTERNAL`   only the main site serves it; the help host answers 404.
 *
 * A path with no entry is unknown and the help host answers 404 for it, so a new route can
 * never appear on the help host by accident. tests/help-site-host.test.ts walks every
 * `app/**` page and route handler, every metadata route and every top-level entry of
 * `public/` and fails when one has no class.
 *
 * This manifest extends the public-prefix allowlist of `lib/market/routing.ts` rather than
 * replacing it: that one decides which paths may carry a language prefix, this one decides
 * which host serves them.
 */
export type SiteRouteClass = "COMMERCIAL" | "HELP" | "INTERNAL" | "SHARED";

export type SiteRouteMatch = "EXACT" | "SUBTREE";

export type SiteRouteManifestEntry = Readonly<{
  /** A full path, not only a first segment: `/learn` and `/learn/responsible-gambling` differ. */
  path: string;
  match: SiteRouteMatch;
  siteClass: SiteRouteClass;
}>;

/** The classes the help host serves. Everything else, and everything unknown, answers 404 there. */
export const HELP_HOST_SERVED_CLASSES: readonly SiteRouteClass[] = ["HELP", "SHARED"];

/**
 * The interlock between the route classes and the pages behind them (RFC-057 §18, phase 1).
 *
 * A class says which host *may* serve a route; it does not say that the help site's own page
 * exists yet. While this is `false` the help site has no shell, no home and no metadata of its
 * own, so every route it would serve would answer with the commercial shell, the full casino
 * menu and `b4gamble.com` addresses — the one thing the second domain exists to prevent.
 *
 * `HELP_SITE_SERVING` is an environment variable that phase 2 turns on in the Vercel
 * dashboard; this is a source constant, so no dashboard change and no order of operations can
 * publish the commercial site on the help host. While it is `false` the help host answers the
 * gate's 404 for every path, which is a correct dark state.
 *
 * **Flipped to `true` on 17 October 2026**, in the pull request that landed the help shell, the
 * help home (the pause plan, Q5 (b)), the host-aware root metadata and the help share image.
 * `HELP_SITE_SERVING` is still off in every Vercel environment, so the help host is still
 * redirected away before it reaches this gate; this constant only says the page it would
 * reach now exists.
 */
export const HELP_SHELL_READY = true;

export const SITE_ROUTE_MANIFEST = [
  // ---------------------------------------------------------------- SHARED
  // The help home is the pause plan (Founder, Q5 (b), 17 October 2026); the main home is unchanged.
  { path: "/", match: "EXACT", siteClass: "SHARED" },
  // The Learn hub itself: on the help host it lists only `responsible-gambling` guides (§4.1).
  { path: "/learn", match: "EXACT", siteClass: "SHARED" },
  { path: "/contact", match: "EXACT", siteClass: "SHARED" },
  { path: "/privacy", match: "EXACT", siteClass: "SHARED" },
  { path: "/terms", match: "EXACT", siteClass: "SHARED" },
  { path: "/login", match: "EXACT", siteClass: "SHARED" },
  { path: "/reset-password", match: "EXACT", siteClass: "SHARED" },
  { path: "/unsubscribe", match: "EXACT", siteClass: "SHARED" },
  // Search and icon files: one route, per-host content (§12).
  { path: "/robots.txt", match: "EXACT", siteClass: "SHARED" },
  { path: "/sitemap.xml", match: "EXACT", siteClass: "SHARED" },
  { path: "/llms.txt", match: "EXACT", siteClass: "SHARED" },
  { path: "/favicon.ico", match: "EXACT", siteClass: "SHARED" },
  { path: "/icon.svg", match: "EXACT", siteClass: "SHARED" },
  // Hashed build files are served on both hosts (Founder, 25 September 2026): they are not
  // linked from help pages, carry no address in a sitemap and are not indexed (§4.2).
  { path: "/_next", match: "SUBTREE", siteClass: "SHARED" },
  // Short links land on help pages (§15).
  { path: "/ig", match: "SUBTREE", siteClass: "SHARED" },
  { path: "/fb", match: "SUBTREE", siteClass: "SHARED" },
  { path: "/x", match: "SUBTREE", siteClass: "SHARED" },
  { path: "/t", match: "SUBTREE", siteClass: "SHARED" },
  { path: "/threads", match: "EXACT", siteClass: "SHARED" },
  { path: "/lana", match: "EXACT", siteClass: "SHARED" },
  // The APIs help pages call. Never redirected (§5).
  { path: "/api/auth", match: "SUBTREE", siteClass: "SHARED" },
  { path: "/api/program", match: "SUBTREE", siteClass: "SHARED" },
  { path: "/api/programme-access", match: "SUBTREE", siteClass: "SHARED" },
  { path: "/api/contact", match: "EXACT", siteClass: "SHARED" },
  { path: "/api/email/unsubscribe", match: "EXACT", siteClass: "SHARED" },
  { path: "/api/customer/email-preference", match: "EXACT", siteClass: "SHARED" },
  { path: "/api/public/pause-reminder", match: "EXACT", siteClass: "SHARED" },
  { path: "/api/presentation", match: "EXACT", siteClass: "SHARED" },

  // ------------------------------------------------------------------ HELP
  { path: "/program", match: "SUBTREE", siteClass: "HELP" },
  { path: "/10-steps", match: "EXACT", siteClass: "HELP" },
  // The UK help-ad landing (noindex).
  { path: "/start", match: "EXACT", siteClass: "HELP" },
  { path: "/pause-plan", match: "EXACT", siteClass: "HELP" },
  { path: "/innan", match: "EXACT", siteClass: "HELP" },
  { path: "/beside", match: "EXACT", siteClass: "HELP" },
  { path: "/pause-statistics", match: "EXACT", siteClass: "HELP" },
  // The control answer pages (en/sv/da).
  { path: "/gambling-control", match: "EXACT", siteClass: "HELP" },
  { path: "/control-without-quitting", match: "EXACT", siteClass: "HELP" },
  { path: "/gambling-control-tools", match: "EXACT", siteClass: "HELP" },
  // Protected Help.
  { path: "/help", match: "SUBTREE", siteClass: "HELP" },
  { path: "/responsible-gambling", match: "SUBTREE", siteClass: "HELP" },
  // Legacy addresses that redirect into /responsible-gambling.
  { path: "/responsible-gaming", match: "EXACT", siteClass: "HELP" },
  { path: "/self-check", match: "EXACT", siteClass: "HELP" },
  // §4.1 names this one path, not the folder: a future /tools/<anything> must be classified
  // deliberately rather than inherit the help host from its parent.
  { path: "/tools/budget-calculator", match: "EXACT", siteClass: "HELP" },
  // The owner disclosure (§17) and the data statement (§16.3), written under the help site's
  // own name. They are HELP, so the main host serves them until phase 3 and then 301s them;
  // both are `noindex` until the help host is the only host that serves them (§7.3).
  { path: "/who-runs-this", match: "EXACT", siteClass: "HELP" },
  { path: "/for-organisations", match: "EXACT", siteClass: "HELP" },
  // The help host's default social image (§8). SUBTREE for the same reason /opengraph-image is:
  // a dynamic image route registers a sibling path for its generated id.
  { path: "/help-share-image", match: "SUBTREE", siteClass: "HELP" },
  // The first-party help-guide image route (§13). It serves only content-addressed Learn keys,
  // so no help page asks the browser for an image from media.b4gamble.com. /api/media stays
  // COMMERCIAL and answers 404 here.
  { path: "/api/help-media", match: "SUBTREE", siteClass: "HELP" },
  // The protected help guides: the one Learn category that carries no offer bridge
  // (lib/articles/article-bridges.ts) and whose related reading stays inside the category.
  { path: "/learn/responsible-gambling", match: "SUBTREE", siteClass: "HELP" },
  // The help host's own IndexNow key file (§12). The main host answers 404 for it, as the
  // help host does for the main key file below: a key file shared by two domains is a public
  // marker joining them.
  { path: "/fd78a34615b74c4e9db7fd7eb03f7659.txt", match: "EXACT", siteClass: "HELP" },
  // public/data: the regulator tables /pause-statistics links for download
  // (lib/i18n/static-pages/pause-statistics.ts). A .csv is not an excluded file ending, so
  // middleware does see it and it needs a class of its own; §4.2 allows the folder.
  { path: "/data", match: "SUBTREE", siteClass: "HELP" },

  // ------------------------------------------------------------ COMMERCIAL
  { path: "/best-offers", match: "EXACT", siteClass: "COMMERCIAL" },
  { path: "/casinos", match: "EXACT", siteClass: "COMMERCIAL" },
  { path: "/casino", match: "SUBTREE", siteClass: "COMMERCIAL" },
  { path: "/bonuses", match: "EXACT", siteClass: "COMMERCIAL" },
  { path: "/compare", match: "EXACT", siteClass: "COMMERCIAL" },
  { path: "/catalog", match: "EXACT", siteClass: "COMMERCIAL" },
  { path: "/bonus-guide", match: "EXACT", siteClass: "COMMERCIAL" },
  { path: "/wagering-calculator", match: "EXACT", siteClass: "COMMERCIAL" },
  { path: "/outbound", match: "SUBTREE", siteClass: "COMMERCIAL" },
  { path: "/r", match: "SUBTREE", siteClass: "COMMERCIAL" },
  { path: "/go", match: "SUBTREE", siteClass: "COMMERCIAL" },
  { path: "/partner-creatives", match: "SUBTREE", siteClass: "COMMERCIAL" },
  { path: "/partner-preview", match: "SUBTREE", siteClass: "COMMERCIAL" },
  // Every Learn category other than the help one, and its guides.
  { path: "/learn", match: "SUBTREE", siteClass: "COMMERCIAL" },
  { path: "/faq", match: "EXACT", siteClass: "COMMERCIAL" },
  { path: "/methodology", match: "EXACT", siteClass: "COMMERCIAL" },
  { path: "/about", match: "EXACT", siteClass: "COMMERCIAL" },
  { path: "/affiliate-disclosure", match: "EXACT", siteClass: "COMMERCIAL" },
  // The commercial site's own trust page. It stays here and is never redirected (§5); the
  // help site has its own /who-runs-this for a different reader.
  { path: "/can-you-trust-b4gamble", match: "EXACT", siteClass: "COMMERCIAL" },
  { path: "/for-creators", match: "SUBTREE", siteClass: "COMMERCIAL" },
  { path: "/llms-full.txt", match: "EXACT", siteClass: "COMMERCIAL" },
  // Its text reads "Reviews, bonus terms side by side…"; the help host has its own image (§8).
  // SUBTREE, not EXACT: Next registers a second matcher for a dynamic metadata file,
  // `/opengraph-image/[__metadata_id__]`, and the generated handler ignores an unknown id.
  // The sibling path is COMMERCIAL by the same decision as the bare one. A request for
  // `/opengraph-image/x.png` ends in an excluded file ending and never reaches this gate at
  // all; the help-host Firewall rule of §4.2 is what refuses that shape.
  { path: "/opengraph-image", match: "SUBTREE", siteClass: "COMMERCIAL" },
  { path: "/api/public", match: "SUBTREE", siteClass: "COMMERCIAL" },
  { path: "/api/media", match: "SUBTREE", siteClass: "COMMERCIAL" },
  // Q3 is answered G3: the help host carries no Google tag, no cookie banner and no optional
  // cookies, so neither endpoint is served there (§10). b4gamble.com keeps its 4 October
  // 2026 analytics decision unchanged.
  { path: "/api/consent/analytics", match: "EXACT", siteClass: "COMMERCIAL" },
  { path: "/api/analytics/events", match: "EXACT", siteClass: "COMMERCIAL" },
  // The main host's IndexNow key file. §12 gives each host its own key, so this exact path is
  // the main site's and answers 404 on the help host; the help key file is its own path.
  { path: "/219017cffaba5177842beab195a2564c.txt", match: "EXACT", siteClass: "COMMERCIAL" },

  // -------------------------------------------------------------- INTERNAL
  { path: "/admin", match: "SUBTREE", siteClass: "INTERNAL" },
  // Everything under /api that no entry above claims: admin, MCP, internal crons and the
  // Resend webhooks all fail closed into INTERNAL.
  { path: "/api", match: "SUBTREE", siteClass: "INTERNAL" },
  { path: "/editorial-preview", match: "SUBTREE", siteClass: "INTERNAL" },
  { path: "/launch-polish-error-harness", match: "EXACT", siteClass: "INTERNAL" },
  { path: "/.well-known", match: "SUBTREE", siteClass: "INTERNAL" },
] as const satisfies readonly SiteRouteManifestEntry[];

/**
 * Top-level entries of `public/`, which the middleware matcher never sees (§4.2). The Vercel
 * Firewall rule that refuses the COMMERCIAL ones on the help host is phase 2 and is written
 * from this list; the test keeps the two in step.
 */
export const PUBLIC_ASSET_MANIFEST = {
  about: "COMMERCIAL",
  "best-offers": "COMMERCIAL",
  "bonus-directory": "COMMERCIAL",
  // The B4GAMBLE mark. The help site carries no B4GAMBLE wordmark or logo at all (Q2).
  brand: "COMMERCIAL",
  "casino-brands": "COMMERCIAL",
  "casino-directory": "COMMERCIAL",
  // The pause statistics the help pages print.
  data: "HELP",
  "demo-casinos": "COMMERCIAL",
  // The handoff home's images. The pause plan is the help home (Q5 (b)), so they are never
  // requested there.
  home: "COMMERCIAL",
  // Covers of commercial guides; help-guide images are served first-party (§13).
  learn: "COMMERCIAL",
  "partner-preview": "COMMERCIAL",
} as const satisfies Readonly<Record<string, SiteRouteClass>>;

/** The file-convention metadata routes and the path each one answers on. */
export const METADATA_ROUTE_MANIFEST = {
  // Route handlers, not file conventions, since 17 October 2026: a `favicon.ico` or `icon.svg`
  // *file* in app/ makes Next write its <link rel="icon"> into every document on both hosts,
  // and both files are the B4GAMBLE mark. The handlers keep the same two addresses and decide
  // per host (RFC-057 §12, Founder Q2).
  "app/favicon.ico/route.ts": "/favicon.ico",
  "app/icon.svg/route.ts": "/icon.svg",
  "app/opengraph-image.tsx": "/opengraph-image",
  "app/robots.ts": "/robots.txt",
  "app/sitemap.ts": "/sitemap.xml",
} as const;

function cleanPathname(pathname: string) {
  const suffixIndex = pathname.search(/[?#]/);
  const clean = (suffixIndex >= 0 ? pathname.slice(0, suffixIndex) : pathname) || "/";
  return clean.startsWith("/") ? clean : `/${clean}`;
}

function routeSegments(pathname: string) {
  return cleanPathname(pathname).split("/").filter(Boolean);
}

/**
 * The language prefix and the legacy market prefixes, removed syntactically so that
 * `/casinos`, `/sv/casinos` and `/se/sv/casinos/` are one decision (§4). This is deliberately
 * not `stripPublicMarketPrefix`: that one answers "may this path carry a prefix", and a route
 * it refuses (a Programme or protected-Help path under a prefix) would keep its prefix and
 * fall through as an unknown root.
 */
export function stripSiteRoutePrefixes(pathname: string) {
  const segments = routeSegments(pathname);
  const first = segments[0]?.toLowerCase() ?? "";
  if (!first) return "/";

  if (languageRouteByPublicSlug(first) || localeMarketRouteByPublicSlug(first)) {
    return `/${segments.slice(1).join("/")}`;
  }

  const market = marketProfileByRouteMarket(first);
  if (market) {
    const innerLocale = localeForLanguageSegment(market, segments[1] ?? null);
    return `/${segments.slice(innerLocale ? 2 : 1).join("/")}`;
  }

  return `/${segments.join("/")}`;
}

/**
 * A path shape the gate refuses to classify: a dot segment, an encoded dot segment, an encoded
 * separator or a malformed escape.
 *
 * `NextRequest` resolves `.` and `..` through the URL parser before middleware sees a path, and
 * leaves `%2f` inside one segment, so none of these reaches a route today — measured, not
 * assumed. But that is another layer's normalisation, and the gate must not depend on it: a
 * change in how the path is obtained would otherwise let `/program/../casinos` inherit the
 * help host from `/program`. Anything of this shape is unknown here, and unknown means 404 on
 * the help host (§4, fail closed).
 */
function hasUnsafeSegment(pathname: string) {
  for (const segment of pathname.split("/")) {
    if (!segment) continue;
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      return true;
    }
    if (decoded === "." || decoded === "..") return true;
    if (decoded.includes("/") || decoded.includes("\\")) return true;
  }
  return false;
}

function matches(entry: SiteRouteManifestEntry, pathname: string) {
  if (entry.match === "EXACT") return entry.path === pathname;
  return pathname === entry.path || pathname.startsWith(`${entry.path}/`);
}

/** The class of an exact application path, with no language or market prefix on it. */
export function classifyRoutePath(pathname: string): SiteRouteClass | null {
  const clean = cleanPathname(pathname);
  if (hasUnsafeSegment(clean)) return null;
  const normalized = clean.length > 1 ? clean.replace(/\/+$/, "") || "/" : clean;
  let best: SiteRouteManifestEntry | null = null;
  for (const entry of SITE_ROUTE_MANIFEST) {
    if (!matches(entry, normalized)) continue;
    if (
      !best
      || entry.path.length > best.path.length
      || (entry.path.length === best.path.length && entry.match === "EXACT")
    ) {
      best = entry;
    }
  }
  return best?.siteClass ?? null;
}

/** The class of a request path, after its language and legacy market prefixes are removed. */
export function classifySitePath(pathname: string): SiteRouteClass | null {
  return classifyRoutePath(stripSiteRoutePrefixes(pathname));
}

/**
 * Whether the help host serves this request path. Fails closed: an unknown path, a
 * COMMERCIAL one and an INTERNAL one all answer 404 there.
 */
export function helpHostServes(pathname: string) {
  const siteClass = classifySitePath(pathname);
  return siteClass !== null && HELP_HOST_SERVED_CLASSES.includes(siteClass);
}

/**
 * What the help gate in middleware actually asks: the route class *and* the interlock above.
 * While `HELP_SHELL_READY` is false this is false for every path, so turning
 * `HELP_SITE_SERVING` on early gives a help host that answers 404 and nothing else — never
 * the commercial shell.
 */
export function helpHostServesRequest(pathname: string, shellReady: boolean = HELP_SHELL_READY) {
  return shellReady && helpHostServes(pathname);
}

/** The class of a top-level entry of `public/`. */
export function classifyPublicAsset(entry: string): SiteRouteClass | null {
  return (PUBLIC_ASSET_MANIFEST as Readonly<Record<string, SiteRouteClass>>)[entry] ?? null;
}
