import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { NextRequest } from "next/server";

import {
  PRODUCTION_CANONICAL_ORIGIN,
  PRODUCTION_CRON_PATHS,
} from "../lib/auth/runtime-canonical-host";
import { buildContentSecurityPolicy } from "../lib/security/content-security-policy";
import {
  languageRouteByPublicSlug,
  LANGUAGE_ROUTE_PROFILES,
  MARKET_PROFILES,
  marketProfileByRouteMarket,
} from "../lib/market/registry";
import {
  HELP_HOST_SERVED_UNGATED_PATH_PATTERN,
  HELP_HOST_UNGATED_PATH_PATTERN,
  helpHostFirewallRule,
} from "../lib/security/help-host-firewall-rule";
import { geoBlockPageHtml } from "../lib/security/geo-block-page";
import { hostVaryingCacheControl } from "../lib/site/host-cache";
import {
  HELP_CANONICAL_HOST,
  HELP_CANONICAL_ORIGIN,
  HELP_SITE_NAME,
  helpSiteSwitches,
  resolveSiteHost,
  SITE_CLASS_HEADER,
  siteClassFromHeaderValue,
  type HelpSiteSwitches,
} from "../lib/site/host-gate";
import {
  classifyPublicAsset,
  classifyRoutePath,
  classifySitePath,
  HELP_SHELL_READY,
  helpHostServes,
  helpHostServesRequest,
  METADATA_ROUTE_MANIFEST,
  PUBLIC_ASSET_MANIFEST,
  SITE_ROUTE_MANIFEST,
  stripSiteRoutePrefixes,
} from "../lib/site/host-routes";
import { robotsForSite } from "../app/robots";
import { middleware } from "../middleware";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const production = { VERCEL_ENV: "production" } as const;
const preview = {
  VERCEL_BRANCH_URL: "sevenbet-next-git-help-alexg-7bes-projects.vercel.app",
  VERCEL_ENV: "preview",
  VERCEL_URL: "sevenbet-next-9f3de2a1-alexg-7bes-projects.vercel.app",
} as const;

const OFF: HelpSiteSwitches = { serving: false, redirects: false, devHost: null };
const SERVING: HelpSiteSwitches = { serving: true, redirects: false, devHost: null };
const LIVE: HelpSiteSwitches = { serving: true, redirects: true, devHost: null };

const scheduledCronPaths = (
  JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")) as {
    crons?: { path: string; schedule: string }[];
  }
).crons?.map((cron) => cron.path) ?? [];

/** The middleware matcher as Next compiles it (see tests/middleware-matcher.test.ts). */
function middlewareMatcher() {
  const source = readFileSync(join(repositoryRoot, "middleware.ts"), "utf8");
  const literal = source.match(/matcher: \["(.+)"\]/)?.[1];
  assert.ok(literal, "the matcher is a literal Next can read statically");
  return new RegExp(`^${JSON.parse(`"${literal}"`) as string}$`);
}

async function withEnvironment<T>(
  values: Record<string, string | undefined>,
  run: () => Promise<T> | T,
): Promise<T> {
  const previous = new Map(Object.keys(values).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return await run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

// ---------------------------------------------------------------------------
// §7.3 switches
// ---------------------------------------------------------------------------

test("both help-site switches are off unless the environment literally says true", () => {
  assert.deepEqual(helpSiteSwitches({}), { serving: false, redirects: false, devHost: null });
  for (const value of ["", " ", "false", "0", "1", "yes", "TRUE ", "true "]) {
    const switches = helpSiteSwitches({ HELP_SITE_SERVING: value, HELP_SITE_REDIRECTS: value });
    assert.equal(switches.serving, value.trim().toLowerCase() === "true", value);
    assert.equal(switches.redirects, value.trim().toLowerCase() === "true", value);
  }
  assert.deepEqual(helpSiteSwitches({ HELP_SITE_SERVING: "true", HELP_SITE_REDIRECTS: "true" }), {
    serving: true,
    redirects: true,
    devHost: null,
  });
});

test("the development host accepts only a plain host and port", () => {
  assert.equal(helpSiteSwitches({ HELP_SITE_DEV_HOST: "help.localhost" }).devHost, "help.localhost");
  assert.equal(helpSiteSwitches({ HELP_SITE_DEV_HOST: "HELP.LOCALHOST:4174" }).devHost, "help.localhost:4174");
  for (const value of ["", "https://help.localhost", "help.localhost/x", "a@b", "help localhost"]) {
    assert.equal(helpSiteSwitches({ HELP_SITE_DEV_HOST: value }).devHost, null, value);
  }
});

test("the edge bundle reads every help-site variable by its literal name", () => {
  // Vercel's edge runtime exposes a custom variable only when the code reads it as a literal
  // process.env.NAME (vercel-edge-env-named-reads). A dynamic read compiles, deploys and then
  // silently answers undefined in Production.
  const source = readFileSync(join(repositoryRoot, "lib/site/host-gate.ts"), "utf8");
  for (const name of ["HELP_SITE_SERVING", "HELP_SITE_REDIRECTS", "HELP_SITE_DEV_HOST"]) {
    assert.match(source, new RegExp(`process\\.env\\.${name}\\b`), name);
  }
});

// ---------------------------------------------------------------------------
// §3 and §7.1 host decision
// ---------------------------------------------------------------------------

test("with HELP_SITE_SERVING off the help host is any other host and 308s to b4gamble.com", () => {
  for (const url of [
    `${HELP_CANONICAL_ORIGIN}/`,
    `${HELP_CANONICAL_ORIGIN}/pause-plan`,
    `${HELP_CANONICAL_ORIGIN}/sv/program?step=1`,
    `https://www.${HELP_CANONICAL_HOST}/pause-plan`,
  ]) {
    const requested = new URL(url);
    assert.deepEqual(resolveSiteHost(url, production, OFF), {
      kind: "redirect",
      location: `${PRODUCTION_CANONICAL_ORIGIN}${requested.pathname}${requested.search}`,
      status: 308,
      // A 308 naming the help host on either end is never cached: between attaching the
      // domain in phase 2 and the redeploy that turns the switch on, a sticky copy of this
      // redirect is what shows a crawler or a blocker the help domain pointing at a
      // gambling-affiliate site.
      noStore: true,
    }, url);
  }
});

test("with the switch on the exact help host is the help site and the main host is unchanged", () => {
  assert.deepEqual(resolveSiteHost(`${HELP_CANONICAL_ORIGIN}/`, production, SERVING), {
    kind: "next",
    site: "help",
  });
  assert.deepEqual(resolveSiteHost(`${HELP_CANONICAL_ORIGIN}/pause-plan?x=1`, production, SERVING), {
    kind: "next",
    site: "help",
  });
  for (const path of ["/", "/best-offers", "/program", "/login", "/admin/login"]) {
    assert.deepEqual(resolveSiteHost(`${PRODUCTION_CANONICAL_ORIGIN}${path}`, production, SERVING), {
      kind: "next",
      site: "main",
    }, path);
  }
});

test("a host that is not exactly the help host never becomes the help site", () => {
  // Case is normalised by the URL parser, as it is for the main host: a host name is
  // case-insensitive, so https://PAUSEPLAN.HELP is the same origin and not a look-alike.
  assert.deepEqual(resolveSiteHost(`https://PAUSEPLAN.HELP/pause-plan`, production, SERVING), {
    kind: "next",
    site: "help",
  });

  for (const origin of [
    `https://${HELP_CANONICAL_HOST}.`,
    `https://${HELP_CANONICAL_HOST}:8443`,
    `https://${HELP_CANONICAL_HOST}.evil.test`,
    `https://evil${HELP_CANONICAL_HOST}`,
    `https://${HELP_CANONICAL_HOST}.b4gamble.com`,
    "https://pauseplan.help.example",
    "https://pauseplanhelp.com",
    "https://xn--pauseplan-help.test",
  ]) {
    const decision = resolveSiteHost(`${origin}/pause-plan`, production, SERVING);
    assert.equal(decision.kind, "redirect", origin);
    assert.equal(
      decision.kind === "redirect" ? decision.location : "",
      `${PRODUCTION_CANONICAL_ORIGIN}/pause-plan`,
      origin,
    );
  }
});

test("www on the help host and an http request both land on the help origin, not the commercial site", () => {
  assert.deepEqual(resolveSiteHost(`https://www.${HELP_CANONICAL_HOST}/sv/pause-plan?x=1`, production, SERVING), {
    kind: "redirect",
    location: `${HELP_CANONICAL_ORIGIN}/sv/pause-plan?x=1`,
    status: 308,
    noStore: true,
  });
  assert.deepEqual(resolveSiteHost(`http://${HELP_CANONICAL_HOST}/10-steps`, production, SERVING), {
    kind: "redirect",
    location: `${HELP_CANONICAL_ORIGIN}/10-steps`,
    status: 308,
    noStore: true,
  });
});

test("every RFC-030 case still holds with the help host in the resolver", () => {
  for (const switches of [OFF, SERVING, LIVE]) {
    for (const origin of [
      "http://b4gamble.com",
      "https://www.b4gamble.com",
      "https://sevenbet-next.vercel.app",
      "https://sevenbet-next-alexg-7bes-projects.vercel.app",
      "https://sevenbet-next-git-main-alexg-7bes-projects.vercel.app",
      "https://sevenbet-next-hvvjqn3nd-alexg-7bes-projects.vercel.app",
      "https://attacker.example",
    ]) {
      assert.deepEqual(
        resolveSiteHost(
          `${origin}/best-offers?x=1&x=2&return=%2Fprogram%3Fstep%3D1`,
          production,
          switches,
        ),
        {
          kind: "redirect",
          location: `${PRODUCTION_CANONICAL_ORIGIN}/best-offers?x=1&x=2&return=%2Fprogram%3Fstep%3D1`,
          status: 308,
        },
        origin,
      );
    }

    // Preview keeps its exact branch host and never answers as the help site.
    assert.deepEqual(
      resolveSiteHost(`https://${preview.VERCEL_URL}/program`, preview, switches),
      { kind: "redirect", location: `https://${preview.VERCEL_BRANCH_URL}/program`, status: 307 },
    );
    assert.deepEqual(
      resolveSiteHost(`https://${preview.VERCEL_BRANCH_URL}/program`, preview, switches),
      { kind: "next", site: "main" },
    );
    // Preview allows one exact branch host and rejects every other, the help host included.
    assert.deepEqual(
      resolveSiteHost(`${HELP_CANONICAL_ORIGIN}/program`, preview, switches),
      { kind: "reject", reason: "host" },
    );

    // Local development and ordinary CI never activate either guard.
    for (const environment of [{}, { CI: "true" }, { VERCEL_ENV: "development" }]) {
      assert.deepEqual(
        resolveSiteHost("http://127.0.0.1:4173/program?step=1", environment, switches),
        { kind: "next", site: "main" },
      );
    }
  }
});

test("every vercel.json cron path still continues on the generated Production hosts", () => {
  assert.ok(scheduledCronPaths.length >= 4);
  assert.deepEqual(
    scheduledCronPaths.filter((path) => !PRODUCTION_CRON_PATHS.includes(path)),
    [],
    "add the new vercel.json cron path to PRODUCTION_CRON_PATHS",
  );
  for (const switches of [OFF, SERVING, LIVE]) {
    for (const origin of [
      "https://sevenbet-next.vercel.app",
      "https://sevenbet-next-hvvjqn3nd-alexg-7bes-projects.vercel.app",
    ]) {
      for (const path of scheduledCronPaths) {
        assert.deepEqual(
          resolveSiteHost(`${origin}${path}`, production, switches),
          { kind: "next", site: "main" },
          `${origin}${path}`,
        );
      }
    }
    // The cron exemption is host-independent by design and stays so: Vercel calls the
    // generated Production host, and an authenticated handler must not be redirected away
    // from itself. On the help host the request is classified `help` and the help gate
    // answers 404 for it, because every cron path is INTERNAL.
    for (const path of scheduledCronPaths) {
      assert.deepEqual(
        resolveSiteHost(`${HELP_CANONICAL_ORIGIN}${path}`, production, switches),
        { kind: "next", site: switches.serving ? "help" : "main" },
        path,
      );
      assert.equal(helpHostServes(path), false, path);
    }
  }
});

test("the development host works locally and is ignored in Preview and Production", () => {
  const dev: HelpSiteSwitches = { serving: false, redirects: false, devHost: "help.localhost" };
  assert.deepEqual(resolveSiteHost("http://help.localhost:4174/pause-plan", {}, dev), {
    kind: "next",
    site: "help",
  });
  assert.deepEqual(resolveSiteHost("http://localhost:4174/pause-plan", {}, dev), {
    kind: "next",
    site: "main",
  });
  assert.deepEqual(resolveSiteHost("https://help.localhost/pause-plan", production, dev), {
    kind: "redirect",
    location: `${PRODUCTION_CANONICAL_ORIGIN}/pause-plan`,
    status: 308,
  });
  assert.deepEqual(resolveSiteHost("https://help.localhost/pause-plan", preview, dev), {
    kind: "reject",
    reason: "host",
  });
});

// ---------------------------------------------------------------------------
// §4 route-class manifest
// ---------------------------------------------------------------------------

function routePathForFile(file: string) {
  const segments = file
    .replace(/^app\//, "")
    .replace(/\/(?:page|route)\.(?:tsx|ts|jsx|js)$/, "")
    .split("/")
    .filter((segment) => segment.length > 0 && !/^\(.*\)$/.test(segment))
    .map((segment) => (/^\[.*\]$/.test(segment) ? "sample-segment" : segment));
  return `/${segments.join("/")}`;
}

function walk(directory: string, found: string[] = []) {
  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);
    if (statSync(absolute).isDirectory()) {
      walk(absolute, found);
    } else if (/^(?:page|route)\.(?:tsx|ts|jsx|js)$/.test(entry)) {
      found.push(relative(repositoryRoot, absolute));
    }
  }
  return found;
}

const applicationRouteFiles = walk(join(repositoryRoot, "app")).sort();

test("every page and route handler under app/ has a route class", () => {
  assert.ok(applicationRouteFiles.length > 200, "the app/ walk found the routes");
  const unclassified = applicationRouteFiles
    .map((file) => ({ file, path: routePathForFile(file) }))
    .filter((route) => classifyRoutePath(route.path) === null);
  assert.deepEqual(
    unclassified,
    [],
    "give the new route a class in lib/site/host-routes.ts (RFC-057 §4) before it ships",
  );
});

test("every metadata route and every top-level entry of public/ has a route class", () => {
  for (const [file, path] of Object.entries(METADATA_ROUTE_MANIFEST)) {
    assert.ok(statSync(join(repositoryRoot, file)).isFile(), `${file} exists`);
    assert.notEqual(classifyRoutePath(path), null, path);
  }
  const metadataFiles = readdirSync(join(repositoryRoot, "app"))
    .filter((entry) => /^(favicon\.|icon\.|apple-icon\.|opengraph-image\.|twitter-image\.|manifest\.|robots\.|sitemap\.)/.test(entry));
  assert.deepEqual(
    metadataFiles.map((entry) => `app/${entry}`).sort(),
    Object.keys(METADATA_ROUTE_MANIFEST).sort(),
    "a new metadata route needs an entry in METADATA_ROUTE_MANIFEST",
  );

  const publicEntries = readdirSync(join(repositoryRoot, "public")).sort();
  assert.deepEqual(
    publicEntries,
    Object.keys(PUBLIC_ASSET_MANIFEST).sort(),
    "a new top-level entry of public/ needs a class, and the help-host Firewall rule of §4.2 needs the same verdict",
  );
  for (const entry of publicEntries) assert.notEqual(classifyPublicAsset(entry), null, entry);
});

test("the two manifests agree about every public/ folder the middleware matcher does see", () => {
  // A .svg or .csv under public/ is a document the matcher covers, so the route manifest, not
  // only the phase-2 Firewall rule, decides it. The regulator tables /pause-statistics links
  // must stay reachable on the help host; every commercial folder must not.
  for (const [entry, siteClass] of Object.entries(PUBLIC_ASSET_MANIFEST)) {
    assert.equal(
      helpHostServes(`/${entry}/a-file.svg`),
      siteClass === "HELP",
      `${entry} is ${siteClass} in PUBLIC_ASSET_MANIFEST but the route manifest disagrees`,
    );
  }
  assert.equal(helpHostServes("/data/spelpaus-registrations.csv"), true);
  assert.equal(helpHostServes("/data/rofus-registrations.csv"), true);
  assert.equal(helpHostServes("/home/tool-pause-rule.svg"), false);
  assert.equal(helpHostServes("/brand/b4gamble-logo-512.png"), false);
});

test("no route root can be mistaken for a language or market prefix", () => {
  const prefixes = new Set<string>([
    ...LANGUAGE_ROUTE_PROFILES.map((profile) => profile.publicSlug as string),
    ...MARKET_PROFILES.map((profile) => profile.routeMarket as string),
  ]);
  for (const entry of SITE_ROUTE_MANIFEST) {
    const root = entry.path.split("/").filter(Boolean)[0];
    if (!root) continue;
    assert.equal(
      prefixes.has(root.toLowerCase()),
      false,
      `${entry.path} collides with a language or market prefix, so stripSiteRoutePrefixes would eat it`,
    );
  }
});

test("language and legacy market prefixes are removed before a path is classified", () => {
  assert.equal(stripSiteRoutePrefixes("/casinos"), "/casinos");
  assert.equal(stripSiteRoutePrefixes("/sv/casinos"), "/casinos");
  assert.equal(stripSiteRoutePrefixes("/se/sv/casinos/"), "/casinos");
  assert.equal(stripSiteRoutePrefixes("/se/casinos"), "/casinos");
  assert.equal(stripSiteRoutePrefixes("/sv-se/casinos"), "/casinos");
  assert.equal(stripSiteRoutePrefixes("/sv"), "/");
  assert.equal(stripSiteRoutePrefixes("/"), "/");
  // A Programme or protected-Help path keeps no prefix either, although the public
  // localisation allowlist refuses to localise it.
  assert.equal(stripSiteRoutePrefixes("/sv/program"), "/program");
  assert.equal(stripSiteRoutePrefixes("/da/help/topic"), "/help/topic");
  // Every published language, for the routes the help site lives on.
  for (const profile of LANGUAGE_ROUTE_PROFILES) {
    assert.ok(languageRouteByPublicSlug(profile.publicSlug));
    assert.equal(stripSiteRoutePrefixes(`/${profile.publicSlug}/pause-plan`), "/pause-plan");
  }
  for (const profile of MARKET_PROFILES) {
    assert.ok(marketProfileByRouteMarket(profile.routeMarket));
    assert.equal(stripSiteRoutePrefixes(`/${profile.routeMarket}/pause-plan`), "/pause-plan");
  }
});

test("the help host serves the help and shared routes", () => {
  for (const path of [
    "/",
    "/program",
    "/program/mission/01",
    "/sv/program",
    "/10-steps",
    "/start",
    "/pause-plan",
    "/innan",
    "/beside",
    "/pause-statistics",
    "/gambling-control",
    "/control-without-quitting",
    "/gambling-control-tools",
    "/help",
    "/help/a-topic",
    "/responsible-gambling",
    "/responsible-gambling/a-topic",
    "/responsible-gaming",
    "/self-check",
    "/tools/budget-calculator",
    "/learn",
    "/learn/responsible-gambling",
    "/learn/responsible-gambling/a-guide",
    "/privacy",
    "/terms",
    "/contact",
    "/login",
    "/reset-password",
    "/unsubscribe",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/api/auth/session",
    "/api/program/dashboard",
    "/api/programme-access/authority",
    "/api/contact",
    "/api/presentation",
    "/api/public/pause-reminder",
    "/sv/pause-plan",
    "/da/learn/responsible-gambling/a-guide",
    "/se/sv/10-steps",
  ]) {
    assert.equal(helpHostServes(path), true, path);
  }
});

test("COMMERCIAL and INTERNAL routes answer 404 on the help host, under every prefix shape", () => {
  const refused = [
    "/best-offers",
    "/casinos",
    "/casino/betsson",
    "/bonuses",
    "/compare",
    "/catalog",
    "/bonus-guide",
    "/wagering-calculator",
    "/faq",
    "/methodology",
    "/about",
    "/affiliate-disclosure",
    "/can-you-trust-b4gamble",
    "/for-creators",
    "/for-creators/someone",
    "/outbound/x",
    "/outbound/unavailable",
    "/r/x",
    "/go/x",
    "/partner-creatives/x/frame",
    "/partner-preview",
    "/learn/casino-bonuses",
    "/learn/casino-bonuses/x",
    "/llms-full.txt",
    "/opengraph-image",
    "/219017cffaba5177842beab195a2564c.txt",
    "/api/public/bonuses",
    "/api/public/comparison",
    "/api/media/x",
    "/api/media/local/a/b",
    "/api/consent/analytics",
    "/api/analytics/events",
    "/admin",
    "/admin/casinos",
    "/api/admin/x",
    "/api/mcp/learn",
    "/api/internal/cron/pause-letters",
    "/api/email/webhooks/resend",
    "/editorial-preview/token",
    "/launch-polish-error-harness",
    "/.well-known/anything",
  ];
  for (const path of refused) {
    for (const candidate of [
      path,
      `${path}/`,
      `/sv${path}`,
      `/se/sv${path}`,
      `/de${path}/`,
      `${path}?utm_source=x&country=GB`,
      encodeURI(path),
      path.replace(/\//g, "%2F"),
      `${path}%2e`,
      `${path}/../${path.slice(1)}`,
    ]) {
      assert.equal(helpHostServes(candidate), false, candidate);
    }
  }
});

test("a path that escapes a served prefix is refused, by this code and not by Next's parser", () => {
  // Measured: NextRequest resolves `.` and `..` through the URL parser before middleware sees
  // a path, and leaves `%2f` inside one segment, so none of these reaches a route today. The
  // gate must not depend on that: a change in how the path is obtained would otherwise let
  // /program/../casinos inherit the help host from /program. Each of these starts on a prefix
  // the help host serves and points at one it does not.
  for (const path of [
    "/program/../casinos",
    "/program/%2e%2e/casinos",
    "/program/%2E%2E/casinos",
    "/_next/../casinos",
    "/data/../best-offers",
    "/learn/responsible-gambling/..%2fcasino-bonuses",
    "/program%2f..%2fcasinos",
    "/help/./../admin",
    "/pause-plan/%zz",
  ]) {
    assert.equal(helpHostServes(path), false, path);
    assert.equal(classifySitePath(path), null, path);
  }
  // The shapes that are not an escape still classify normally.
  assert.equal(classifySitePath("/learn/responsible-gambling/a-guide"), "HELP");
  assert.equal(classifySitePath("/robots.txt"), "SHARED");
  assert.equal(classifySitePath("/.well-known/x"), "INTERNAL");
});

test("an unknown path answers 404 on the help host", () => {
  for (const path of [
    "/not-a-real-route",
    "/sv/not-a-real-route",
    "/program-extra",
    "/helpdesk",
    "/pause-plan-extra",
    "/learn-more",
    "/zz/casinos",
    "/%2e%2e/admin",
  ]) {
    assert.equal(helpHostServes(path), false, path);
  }
});

test("the manifest keeps every class to the four names and no duplicate exact entry", () => {
  const seen = new Set<string>();
  for (const entry of SITE_ROUTE_MANIFEST) {
    assert.match(entry.siteClass, /^(COMMERCIAL|HELP|INTERNAL|SHARED)$/);
    assert.match(entry.path, /^\/(?:[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._[\]-]+)*)?$/, entry.path);
    const key = `${entry.match} ${entry.path}`;
    assert.equal(seen.has(key), false, `duplicate manifest entry ${key}`);
    seen.add(key);
  }
  assert.equal(classifySitePath("/learn"), "SHARED");
  assert.equal(classifySitePath("/learn/casino-bonuses"), "COMMERCIAL");
  assert.equal(classifySitePath("/learn/responsible-gambling"), "HELP");
  assert.equal(classifySitePath("/api/public/pause-reminder"), "SHARED");
  assert.equal(classifySitePath("/api/public/bonuses"), "COMMERCIAL");
  assert.equal(classifySitePath("/api/anything-new"), "INTERNAL");
});

// ---------------------------------------------------------------------------
// §18 the shell interlock
// ---------------------------------------------------------------------------

test("the help host serves nothing at all until the help shell exists", () => {
  // HELP_SITE_SERVING is a dashboard variable that phase 2 turns on; HELP_SHELL_READY is a
  // source constant. While it is false, no order of operations and no environment change can
  // publish the commercial shell, the casino menu and b4gamble.com addresses on the help
  // domain, because the gate answers 404 for every path.
  // Flipped on 17 October 2026 by the pull request that landed the help shell, the help home
  // and the host-aware root metadata, which is the commit §18 names. The dark state it
  // protected is still tested below, through the explicit `shellReady` argument.
  assert.equal(HELP_SHELL_READY, true, "the help shell, the help home and the root metadata have shipped");
  for (const path of ["/", "/pause-plan", "/program", "/learn", "/privacy", "/robots.txt", "/sitemap.xml"]) {
    assert.equal(helpHostServes(path), true, `${path} is a help-host route class`);
    assert.equal(helpHostServesRequest(path, false), false, `${path} waits for the shell`);
    assert.equal(helpHostServesRequest(path, true), true, `${path} is served once the shell lands`);
  }
  // The route classes still decide once the shell is ready: readiness never widens them.
  for (const path of ["/casinos", "/admin", "/api/public/bonuses", "/not-a-real-route"]) {
    assert.equal(helpHostServesRequest(path, true), false, path);
    assert.equal(helpHostServesRequest(path, false), false, path);
  }
});

// ---------------------------------------------------------------------------
// §7.2 the trusted site header
// ---------------------------------------------------------------------------

test("the site class header is read as a site only when it says help", () => {
  assert.equal(siteClassFromHeaderValue("help"), "help");
  for (const value of [null, undefined, "", "main", "HELP", " help", "help ", "other"]) {
    assert.equal(siteClassFromHeaderValue(value), "main", String(value));
  }
});

test("middleware strips an incoming site header and sets its own", async () => {
  await withEnvironment(
    { VERCEL_ENV: undefined, HELP_SITE_SERVING: undefined, HELP_SITE_DEV_HOST: undefined },
    async () => {
      const response = await middleware(new NextRequest("http://127.0.0.1:4173/privacy", {
        headers: { [SITE_CLASS_HEADER]: "help" },
      }));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get(`x-middleware-request-${SITE_CLASS_HEADER}`), "main");
    },
  );
});

test("a metadata route that can answer at an excluded file ending never reads the site header", () => {
  // The site class reaches the page only through a header middleware sets, and the matcher
  // skips every raster file ending. Next registers /opengraph-image/[__metadata_id__] beside
  // /opengraph-image, and that sibling can end in .png — a path middleware never sees, where
  // the header would silently be absent. Such a file must not depend on it.
  const imageMetadataRoutes = Object.keys(METADATA_ROUTE_MANIFEST)
    .filter((file) => /^app\/(?:opengraph-image|twitter-image|icon|apple-icon)\.[jt]sx?$/.test(file));
  assert.ok(imageMetadataRoutes.length > 0, "the walk found the image metadata routes");
  for (const file of imageMetadataRoutes) {
    const source = readFileSync(join(repositoryRoot, file), "utf8");
    assert.equal(
      source.includes("resolveServerSite"),
      false,
      `${file} can answer at a path the matcher skips, so it cannot read the site header`,
    );
  }
});

test("middleware source never reads Host to decide the site", () => {
  const source = readFileSync(join(repositoryRoot, "middleware.ts"), "utf8");
  assert.match(source, /resolveSiteHost\(request\.url/);
  assert.match(source, new RegExp(`requestHeaders\\.delete\\(SITE_CLASS_HEADER\\)`));
  assert.match(source, new RegExp(`requestHeaders\\.set\\(SITE_CLASS_HEADER, site\\)`));
});

// ---------------------------------------------------------------------------
// §7.4 caching
// ---------------------------------------------------------------------------

test("a response whose body differs by host loses its shared cache entry once the help host is served", () => {
  assert.equal(hostVaryingCacheControl("public, max-age=3600", false), "public, max-age=3600");
  assert.equal(hostVaryingCacheControl("public, max-age=86400", false), "public, max-age=86400");
  assert.equal(hostVaryingCacheControl("public, max-age=3600", true), "private, no-store");
  assert.equal(hostVaryingCacheControl("public, max-age=86400", true), "private, no-store");
});

test("llms.txt and the IndexNow key file take the host-varying cache rule and robots is per request", () => {
  const llms = readFileSync(join(repositoryRoot, "app/llms.txt/route.ts"), "utf8");
  assert.match(llms, /hostVaryingCacheControl\("public, max-age=3600"\)/);
  assert.doesNotMatch(llms, /"cache-control":\s*"public/);

  const keyFile = readFileSync(
    join(repositoryRoot, "app/219017cffaba5177842beab195a2564c.txt/route.ts"),
    "utf8",
  );
  assert.match(keyFile, /hostVaryingCacheControl\("public, max-age=86400"\)/);
  assert.doesNotMatch(keyFile, /"cache-control":\s*"public/);

  // robots.txt is the one body this pull request makes differ by host. It is a file-convention
  // metadata route, so Next writes `public, max-age=0, must-revalidate` into the generated
  // handler and the route cannot send a header of its own; middleware sets it instead.
  const robotsSource = readFileSync(join(repositoryRoot, "app/robots.ts"), "utf8");
  assert.match(robotsSource, /export const dynamic = "force-dynamic"/);
  const middlewareSource = readFileSync(join(repositoryRoot, "middleware.ts"), "utf8");
  assert.match(
    middlewareSource,
    /hostVaryingCacheControl\("public, max-age=0, must-revalidate", helpSite\.serving\)/,
  );
});

test("robots.txt keeps today's cache header while the help host is redirected away", async () => {
  await withEnvironment(
    { HELP_SITE_SERVING: undefined, HELP_SITE_REDIRECTS: undefined, VERCEL_ENV: "production" },
    async () => {
      const response = await middleware(new NextRequest(`${PRODUCTION_CANONICAL_ORIGIN}/robots.txt`));
      assert.equal(response.headers.get("Cache-Control"), "public, max-age=0, must-revalidate");
    },
  );
  await withEnvironment(
    { HELP_SITE_SERVING: "true", HELP_SITE_REDIRECTS: undefined, VERCEL_ENV: "production" },
    async () => {
      const response = await middleware(new NextRequest(`${PRODUCTION_CANONICAL_ORIGIN}/robots.txt`));
      assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    },
  );
});

test("robots differs by host in the same process and each host names only its own sitemap", () => {
  const main = robotsForSite("main", false);
  const mainLive = robotsForSite("main", true);
  const help = robotsForSite("help", true);
  assert.equal(main.sitemap, `${PRODUCTION_CANONICAL_ORIGIN}/sitemap.xml`);
  assert.deepEqual(mainLive, main, "the main host's robots never depends on the help switches");
  assert.equal(help.sitemap, `${HELP_CANONICAL_ORIGIN}/sitemap.xml`);
  assert.deepEqual(main.rules, help.rules);
  assert.equal(JSON.stringify(help).includes("b4gamble.com"), false);
});

test("until the help host may be indexed its robots.txt refuses every crawler and names no sitemap", () => {
  // Phase 2 is "help host live, not indexed, not linked". An allow-all robots.txt naming a
  // sitemap on the help domain would invite a crawler into /sitemap.xml and /llms.txt, which
  // are SHARED and built from the main origin — a file on the help domain listing
  // b4gamble.com addresses is the one association the second domain exists to prevent.
  const dark = robotsForSite("help", false);
  assert.deepEqual(dark, { rules: [{ userAgent: "*", disallow: "/" }] });
  assert.equal(JSON.stringify(dark).includes("sitemap"), false);
  assert.equal(JSON.stringify(dark).includes("b4gamble.com"), false);
});

// ---------------------------------------------------------------------------
// §13 country block and CSP
// ---------------------------------------------------------------------------

test("the owner bypass cookie is host-only on any host but b4gamble.com", () => {
  // The 451 decision does not depend on the host, so the block runs on the help host too;
  // the cookie domain is the one host-dependent part, and it is set only on b4gamble.com.
  const source = readFileSync(join(repositoryRoot, "lib/security/geo-block.ts"), "utf8");
  assert.match(source, /function ownerCookieDomain\(hostname: string\)/);
  assert.match(source, /hostname === CANONICAL_HOSTNAME \|\| hostname\.endsWith\(`\.\$\{CANONICAL_HOSTNAME\}`\)/);
  assert.match(source, /const CANONICAL_HOSTNAME = new URL\(PRODUCTION_CANONICAL_ORIGIN\)\.hostname/);
  assert.doesNotMatch(source, /HELP_CANONICAL/);
});

test("the help host narrows img-src and sends nothing to Google; the main policy is unchanged", () => {
  const nonce = "11111111-1111-4111-8111-111111111111";
  const main = buildContentSecurityPolicy(nonce, { upgradeInsecureRequests: true });
  const mainExplicit = buildContentSecurityPolicy(nonce, { site: "main", upgradeInsecureRequests: true });
  const help = buildContentSecurityPolicy(nonce, { site: "help", upgradeInsecureRequests: true });

  assert.equal(mainExplicit, main, "naming the main site changes nothing");
  assert.match(main, /img-src 'self' data: blob: https:/);
  assert.match(main, /connect-src 'self' https:\/\//);

  assert.match(help, /img-src 'self' data: blob:;/);
  assert.match(help, /connect-src 'self';/);
  assert.equal(help.includes("google"), false);
  assert.equal(help.includes("googletagmanager"), false);
  assert.match(help, /frame-ancestors 'none'/);
  assert.match(help, /upgrade-insecure-requests/);
  assert.match(help, new RegExp(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`));
});

test("the 451 page carries the help site's own name on the help host, never the B4GAMBLE mark", () => {
  // The country block runs before the help gate (§7.1 step 2), so this page is the first thing
  // a blocked visitor of the help host sees — and the Founder's own machine sits behind a
  // blocked IP, with a KZ-exit check in the phase-2 gate.
  const nonce = "11111111-1111-4111-8111-111111111111";
  const main = geoBlockPageHtml(nonce);
  const help = geoBlockPageHtml(nonce, "help");
  assert.equal(geoBlockPageHtml(nonce, "main"), main, "naming the main site changes nothing");
  assert.match(main, /<title>451 · B4GAMBLE<\/title>/);
  assert.match(main, />B4GAMBLE</);
  assert.equal(help.includes("B4GAMBLE"), false, "the help site carries no B4GAMBLE wordmark");
  assert.match(help, new RegExp(`<title>451 · ${HELP_SITE_NAME}</title>`));
  assert.match(help, new RegExp(`>${HELP_SITE_NAME}<`));
  // Still a page that requests nothing, on either host.
  for (const forbidden of [/<a\b/i, /<script\b/i, /<img\b/i, /https?:\/\//i]) {
    assert.doesNotMatch(help, forbidden, String(forbidden));
  }
  assert.match(
    readFileSync(join(repositoryRoot, "middleware.ts"), "utf8"),
    /geoBlockGate\(request, undefined, undefined, site\)/,
    "middleware tells the block which site is answering",
  );
});

test("the phase-2 Firewall rule denies everything on the help host that middleware cannot see", () => {
  const matcher = middlewareMatcher();
  const denied = new RegExp(HELP_HOST_UNGATED_PATH_PATTERN);
  const served = new RegExp(HELP_HOST_SERVED_UNGATED_PATH_PATTERN);
  const refusedOnTheHelpHost = (path: string) => denied.test(path) && !served.test(path);

  for (const path of [
    "/favicon.ico",
    "/brand/b4gamble-logo-512.png",
    "/casino-brands/playojo.png",
    "/best-offers/hero.avif",
    "/about/team.jpg",
    "/home/responsive/chapter-1.webp",
    "/learn/magazine-shelf.jpg",
    "/demo-casinos/x.png",
    "/partner-preview/x.png",
    "/bonus-directory/x.png",
    "/casino-directory/x.png",
    "/_next/image",
    // The sibling path Next registers for a dynamic metadata file. It ends in an excluded
    // file ending, so the route manifest never sees it; this rule is what refuses it.
    "/opengraph-image/1a2b3c.png",
    "/icon/1a2b3c.png",
  ]) {
    assert.ok(!matcher.test(path), `${path} skips middleware`);
    assert.ok(refusedOnTheHelpHost(path), `${path} must be refused on the help host`);
  }

  // Hashed build files are served on both hosts (Founder, 25 September 2026), fonts included.
  for (const path of [
    "/_next/static/chunks/1255-8b646a1ae88725c1.js",
    "/_next/static/css/84a81a068b129809.css",
    "/_next/static/media/c214ffb7f5362987-s.p.woff2",
  ]) {
    assert.ok(refusedOnTheHelpHost(path) === false, `${path} is served on both hosts`);
  }

  // Everything middleware does see is left to the gate, the regulator tables included.
  for (const path of ["/", "/sv/pause-plan", "/icon.svg", "/robots.txt", "/data/spelpaus-registrations.csv"]) {
    assert.ok(matcher.test(path), `${path} runs through middleware`);
    assert.ok(!refusedOnTheHelpHost(path), `${path} is the gate's decision, not the Firewall's`);
  }

  const rule = helpHostFirewallRule();
  const conditions = rule.conditionGroup[0].conditions;
  assert.deepEqual(conditions.find((condition) => condition.type === "host"), {
    type: "host",
    op: "eq",
    value: HELP_CANONICAL_HOST,
  });
  assert.equal(rule.action.mitigate.action, "deny");
});

test("lib/site.ts and lib/site/ stay unambiguous", () => {
  // `lib/site.ts` is the absolute-URL authority and `lib/site/` holds the host gate. Node and
  // the bundler resolve "@/lib/site" to the file today, but one accidental lib/site/index.ts
  // would shadow the whole module — and §8 adds `helpUrl` to that file next.
  for (const shadow of ["index.ts", "index.tsx", "index.js", "index.mjs"]) {
    assert.throws(
      () => statSync(join(repositoryRoot, "lib/site", shadow)),
      `lib/site/${shadow} would shadow lib/site.ts`,
    );
  }
});

// ---------------------------------------------------------------------------
// Everything dark
// ---------------------------------------------------------------------------

test("with the switches off the main site answers exactly as it does today", async () => {
  await withEnvironment(
    {
      HELP_SITE_SERVING: undefined,
      HELP_SITE_REDIRECTS: undefined,
      HELP_SITE_DEV_HOST: undefined,
      VERCEL_ENV: "production",
    },
    async () => {
      const help = await middleware(new NextRequest(`${HELP_CANONICAL_ORIGIN}/pause-plan`));
      assert.equal(help.status, 308);
      assert.equal(help.headers.get("location"), `${PRODUCTION_CANONICAL_ORIGIN}/pause-plan`);
      assert.equal(help.headers.get("X-Robots-Tag"), null);

      const main = await middleware(new NextRequest(`${PRODUCTION_CANONICAL_ORIGIN}/privacy`));
      assert.equal(main.status, 200);
      assert.equal(main.headers.get("X-Robots-Tag"), null);
      assert.equal(main.headers.get(`x-middleware-request-${SITE_CLASS_HEADER}`), "main");
      assert.match(
        main.headers.get("Content-Security-Policy") ?? "",
        /img-src 'self' data: blob: https:/,
      );
    },
  );
});

test("the help gate answers 404 with no link of any kind", async () => {
  await withEnvironment(
    { HELP_SITE_SERVING: "true", HELP_SITE_REDIRECTS: undefined, VERCEL_ENV: "production" },
    async () => {
      for (const path of [
        "/sv/casinos",
        "/best-offers",
        "/admin",
        // Next's URL parser resolves the dot segments before middleware sees the path, and
        // the gate refuses the shape as well; either way this is a 404, never /casinos
        // inheriting the help host from /program.
        "/help/../casinos",
        "/program/%2e%2e/casinos",
        // The help host serves its own routes now that HELP_SHELL_READY is true (the shell,
        // the home and the root metadata shipped together, §18 refinement 2). What it still
        // refuses is every COMMERCIAL, INTERNAL and unknown path, which is this list.
        "/opengraph-image",
        "/api/media/x",
        "/sv/not-a-real-route",
      ]) {
        const refused = await middleware(new NextRequest(`${HELP_CANONICAL_ORIGIN}${path}`));
        assert.equal(refused.status, 404, path);
        assert.equal(refused.headers.get("Cache-Control"), "private, no-store", path);
        assert.equal(refused.headers.get("X-Robots-Tag"), "noindex, nofollow, noarchive", path);
        const body = await refused.text();
        assert.equal(
          /href=|src=|b4gamble/i.test(body),
          false,
          `the help 404 for ${path} carries no address at all`,
        );
        assert.match(
          refused.headers.get("Content-Security-Policy") ?? "",
          /img-src 'self' data: blob:;/,
          path,
        );
      }
      // The other half of the interlock: with the shell in place the help host serves its own
      // routes, and tests/help-site-shell.test.tsx is what proves those pages carry no
      // commercial address.
      // A bare `/` redirects to a language, on this host exactly as on the main one.
      for (const path of ["/en", "/sv/pause-plan", "/privacy", "/en/who-runs-this", "/da/for-organisations"]) {
        const served = await middleware(new NextRequest(`${HELP_CANONICAL_ORIGIN}${path}`));
        assert.equal(served.status, 200, path);
        assert.equal(served.headers.get(`x-middleware-request-${SITE_CLASS_HEADER}`), "help", path);
        // Phase 2 is "live, not indexed": every help response is noindex until the 301s ship.
        assert.equal(served.headers.get("X-Robots-Tag"), "noindex, nofollow", path);
      }
    },
  );
});
