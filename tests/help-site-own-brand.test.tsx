// RFC-057 and the Founder's decision of 17 October 2026: «убери B4GAMBLE из текстов и перенеси
// картинки». The help site is a second domain so that a help organisation or a blocker does not
// read it as a property of the affiliate site. A wordmark left in a title, a tooltip, a piece of
// JSON-LD or a downloaded calendar file undoes that on its own, so this file is the guard.
//
// It checks the two halves of the decision:
//
//  1. **the name.** No help-host response says B4GAMBLE, in any published language, in rendered
//     text or in the inline data Next serialises into `self.__next_f` and into the `?_rsc=`
//     responses a client navigation fetches. The copy tables, the captured pages and the
//     components are all checked, because each is a different way for the word to arrive.
//  2. **the pictures.** Every image, icon and font a help page asks the browser for resolves to
//     a path the phase-2 Firewall rule allows, and that rule is still a default deny.
//
// The main host is checked too, in the other direction: it must still say B4GAMBLE exactly where
// it says it today, so that phase 1 changes nothing a visitor to b4gamble.com can see.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { markHandoffReadability } from "../lib/final-handoff/readability";
import {
  transformCommonHandoff,
  transformCommonHandoffCss,
  transformHelpHomeHandoff,
  transformHomeHandoff,
  transformHomeHandoffCss,
} from "../lib/final-handoff/transforms";
import generatedPages from "../lib/final-handoff/generated-pages.json";
import { besideMessages } from "../lib/i18n/static-pages/beside";
import { contactMessages } from "../lib/i18n/static-pages/contact";
import { controlToolsMessages } from "../lib/i18n/static-pages/gambling-control-tools";
import { controlSharedMessages, gamblingControlHubMessages } from "../lib/i18n/static-pages/gambling-control";
import { innanMessages } from "../lib/i18n/static-pages/innan";
import { HOME_SOURCE_COPY, homeTranslation } from "../lib/i18n/home-catalog";
import { learningMessages } from "../lib/i18n/learning-center";
import { pausePlanMessages } from "../lib/i18n/static-pages/pause-plan";
import { forumStudyMessages } from "../lib/i18n/static-pages/forum-study";
import { pauseStatisticsMessages } from "../lib/i18n/static-pages/pause-statistics";
import { PROGRAMME_MESSAGE_KEYS, programmeText } from "../lib/i18n/programme-catalog";
import { tenStepsTranslation } from "../lib/i18n/static-pages/ten-steps";
import { withoutQuittingMessages } from "../lib/i18n/static-pages/control-without-quitting";
import {
  HELP_HOST_SERVED_UNGATED_PATH_PATTERN,
  HELP_HOST_UNGATED_PATH_PATTERN,
} from "../lib/security/help-host-firewall-rule";
import {
  HELP_LOCALES,
  HELP_OWNER_PATH,
  MAIN_SITE_NAME,
  helpHomeCopy,
  helpOwnerLinkLabel,
  helpRoutePath,
  siteFileSlug,
  siteName,
  withSiteName,
  withSiteNameDeep,
} from "../lib/site/help-copy";
import { HELP_SITE_NAME } from "../lib/site/host-gate";

const require = createRequire(import.meta.url);
require.extensions[".css"] = (module) => { module.exports = {}; };
/**
 * A static image import is the bundler's job: it copies the file to `/_next/static/media/` under
 * a content hash and hands the module `{ src }`. `node --test` has no bundler, so the hook below
 * stands in for one — with the same shape and the same prefix, which is the part that matters
 * here, because the prefix is what the Firewall rule allows.
 */
for (const extension of [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]) {
  require.extensions[extension] = (module, filename) => {
    const name = filename.split("/").pop() ?? "asset";
    module.exports = { src: `/_next/static/media/${name.replace(/\.(\w+)$/, ".1a2b3c4d.$1")}`, height: 2336, width: 3500 };
  };
}
(globalThis as typeof globalThis & { React: typeof React }).React = React;

/**
 * The word, however it is spelled. The test is deliberately case-insensitive and deliberately
 * matches inside a longer token: `b4gamble.com`, `b4gamble-logo-512.png` and `B4GAMBLEs` are all
 * the thing the Founder took off this host.
 */
const WORDMARK = /b4gamble/i;

function assertUnbranded(text: string, where: string) {
  const hit = text.match(new RegExp(`.{0,70}${WORDMARK.source}.{0,70}`, "i"));
  assert.equal(hit, null, `${where} says B4GAMBLE: …${hit?.[0]}…`);
}

/**
 * Every string in an element tree, props of unrendered elements included — the layer that
 * travels in `self.__next_f` and in a `?_rsc=` response, where a word that is never painted
 * still reaches the browser.
 */
function treeStrings(node: unknown, found: string[] = [], depth = 0): string[] {
  if (depth > 40 || node == null) return found;
  if (typeof node === "string") { found.push(node); return found; }
  if (typeof node === "number" || typeof node === "boolean") return found;
  if (Array.isArray(node)) { for (const child of node) treeStrings(child, found, depth + 1); return found; }
  if (typeof node !== "object") return found;
  const element = node as { props?: Record<string, unknown> };
  const source = element.props ?? (node as Record<string, unknown>);
  for (const [key, value] of Object.entries(source)) {
    if (key === "key" || key === "ref") continue;
    treeStrings(value, found, depth + 1);
  }
  return found;
}

/** Both layers of one element: what is painted, and what is serialised behind it. */
function assertElementUnbranded(element: React.ReactElement, where: string) {
  assertUnbranded(renderToStaticMarkup(element), where);
  for (const value of treeStrings(element)) assertUnbranded(value, `${where} (inline page data)`);
}

/**
 * A copy value that is a route the help host rewrites rather than prints. `helpRoutePath`
 * sends `/about`, `/affiliate-disclosure` and `/can-you-trust-b4gamble` to the owner page and
 * drops `/methodology` and `/faq`; the components that print those links call it, and
 * tests/help-site-shell.test.tsx checks the table. A route is not a sentence.
 */
function isRewrittenRoute(value: string) {
  return value.startsWith("/") && helpRoutePath(value, "help") !== value;
}

/** Every string in a copy object, however deep. */
function copyStrings(value: unknown, found: string[] = [], depth = 0): string[] {
  if (depth > 20 || value == null) return found;
  if (typeof value === "string") { found.push(value); return found; }
  if (Array.isArray(value)) { for (const item of value) copyStrings(item, found, depth + 1); return found; }
  if (typeof value === "object") { for (const item of Object.values(value)) copyStrings(item, found, depth + 1); }
  return found;
}

// ---------------------------------------------------------------------------
// the two helpers everything else is built on
// ---------------------------------------------------------------------------

test("the site's own name is decided by the class, and the main host keeps its wordmark", () => {
  assert.equal(siteName("help"), HELP_SITE_NAME);
  assert.equal(siteName("main"), MAIN_SITE_NAME);
  assert.equal(siteName(), MAIN_SITE_NAME, "a component that knows no better is the main site");
});

test("a translated sentence that names the site reads the serving site's name", () => {
  // The grammar glued to the wordmark travels with it, which is what the three published
  // languages need.
  for (const [before, after] of [
    ["Log in | B4GAMBLE", "Log in | Pause Plan"],
    ["B4GAMBLEs 10-stegsprogram", "Pause Plans 10-stegsprogram"],
    ["B4GAMBLE-nyheder", "Pause Plan-nyheder"],
    ["Email me B4GAMBLE updates", "Email me Pause Plan updates"],
  ] as const) {
    assert.equal(withSiteName(before, "help"), after);
    assert.equal(withSiteName(before, "main"), before, "the main host is untouched");
  }
  // An address is not a name: `withHelpOrigin` moves those, and it would be wrong to turn
  // `b4gamble.com` into `Pause Plan.com`.
  assert.equal(withSiteName("Write to support@b4gamble.com", "help"), "Write to support@b4gamble.com");
});

test("the deep rewrite skips machine identifiers and returns the main host's object by reference", () => {
  const copy = { title: "About B4GAMBLE", href: "/can-you-trust-b4gamble", rows: [{ id: "b4gamble", label: "B4GAMBLE" }] };
  const help = withSiteNameDeep(copy, "help");
  assert.equal(help.title, "About Pause Plan");
  assert.equal(help.rows[0].label, "Pause Plan");
  // A renamed `id` or `href` would break a stylesheet hook or a link.
  assert.equal(help.href, "/can-you-trust-b4gamble");
  assert.equal(help.rows[0].id, "b4gamble");
  assert.equal(withSiteNameDeep(copy, "main"), copy, "the main host gets the same object back");
});

// ---------------------------------------------------------------------------
// the copy a help route renders, in all three published languages
// ---------------------------------------------------------------------------

/**
 * Every copy table a help page reads, as the help host says it. The getters are listed by the
 * route that reads them, so a new help route with a new table is a visible omission.
 */
const helpRouteCopy = [
  ["/contact", contactMessages],
  ["/gambling-control", gamblingControlHubMessages],
  ["/gambling-control (shared)", controlSharedMessages],
  ["/control-without-quitting", withoutQuittingMessages],
  ["/gambling-control-tools", controlToolsMessages],
  ["/learn", learningMessages],
] as const;

/**
 * The one value a copy table holds that is a machine identifier rather than a sentence: the
 * row id of the control-tools table, which is a stylesheet hook. The help host never prints
 * it — the page writes `data-control-tool="this-site"` there instead — and the assertion below
 * holds that page to it.
 */
const CONTROL_TOOL_ROW_ID = "b4gamble";

test("every copy table a help page renders is unbranded in all three published languages", () => {
  for (const locale of HELP_LOCALES) {
    for (const [route, messages] of helpRouteCopy) {
      for (const value of copyStrings(withSiteNameDeep(messages(locale), "help"))) {
        if (isRewrittenRoute(value) || value === CONTROL_TOOL_ROW_ID) continue;
        assertUnbranded(value, `${route} ${locale}`);
      }
    }
  }
  // …and the row id never reaches the help host's HTML.
  const page = readFileSync("app/(public)/gambling-control-tools/page.tsx", "utf8");
  assert.match(page, /site === "help" && row\.id === "b4gamble" \? "this-site" : row\.id/, "the control-tools row is renamed on the help host");
  const css = readFileSync("app/(public)/gambling-control/GamblingControl.module.css", "utf8");
  assert.match(css, /data-control-tool="this-site"/, "and the stylesheet hooks on the new name as well");
});

test("the main host's copy tables still name B4GAMBLE exactly as they do today", () => {
  // The other half of the decision: nothing on b4gamble.com moves. If a table stops naming the
  // brand on the main host, the change was a rewrite rather than a host-aware reading.
  const branded = helpRouteCopy.filter(([, messages]) =>
    copyStrings(messages("en-GB")).some((value) => WORDMARK.test(value)));
  assert.ok(branded.length >= 3, "the main host's tables still carry the wordmark");
});

test("the pause plan, the pause pages and the ten steps say nothing of the other brand", () => {
  // The five pages' `revenueLine` is the one string that is replaced rather than rewritten:
  // CleanRouteRevenueLine prints helpRevenueLine() instead, and tests/help-site-shell.test.tsx
  // guards that. Everything else in those tables is rendered as it stands.
  const withoutRevenueLine = (messages: Record<string, unknown>) => {
    const { revenueLine: _unused, ...rest } = messages;
    return rest;
  };
  for (const locale of HELP_LOCALES) {
    for (const [route, messages] of [
      ["/pause-plan", pausePlanMessages],
      ["/beside", besideMessages],
      ["/innan", innanMessages],
      ["/pause-statistics", pauseStatisticsMessages],
      ["/forum-study", forumStudyMessages],
    ] as const) {
      for (const value of copyStrings(withoutRevenueLine(withSiteNameDeep(messages(locale), "help") as Record<string, unknown>))) {
        if (isRewrittenRoute(value)) continue;
        assertUnbranded(value, `${route} ${locale}`);
      }
    }
    // /10-steps: the hero's "Why B4GAMBLE →" is not rewritten but replaced, because on this
    // host the link goes to the owner page and the label should ask what that page answers.
    const tenSteps = tenStepsTranslation(locale);
    assertUnbranded(withSiteName(tenSteps.metadataTitle, "help"), `/10-steps ${locale} title`);
    assertUnbranded(withSiteName(tenSteps.metadataDescription, "help"), `/10-steps ${locale} description`);
    assertUnbranded(helpOwnerLinkLabel(locale), `/10-steps ${locale} owner link`);
    for (const [index, value] of tenSteps.text.entries()) {
      if (value === "Why B4GAMBLE →") continue;
      assertUnbranded(withSiteName(value, "help"), `/10-steps ${locale} text[${index}]`);
    }
  }
});

test("every Programme string reads the serving site's name", () => {
  // The Programme is the largest surface on the help host and the one the Founder named twice:
  // the consent line and the "Email me B4GAMBLE updates" checkbox are both in this catalogue.
  let branded = 0;
  for (const locale of HELP_LOCALES) {
    for (const key of PROGRAMME_MESSAGE_KEYS) {
      let value: string;
      try { value = programmeText(locale, key); } catch { continue; }
      if (WORDMARK.test(value)) branded += 1;
      assertUnbranded(withSiteName(value, "help"), `the Programme string ${JSON.stringify(key)} in ${locale}`);
    }
  }
  assert.ok(branded >= 30, "the catalogue still names B4GAMBLE for the main host");
});

// ---------------------------------------------------------------------------
// the captured pages
// ---------------------------------------------------------------------------

test("every captured page a help route serves is unbranded once the pipeline has run", () => {
  // The captures are photographs of the main site, so their body text names B4GAMBLE: "A
  // boundary worth stating: B4GAMBLE does not diagnose…" on /responsible-gambling and "a break
  // from all gambling content on B4GAMBLE" on /help. HandoffPage runs the same two steps this
  // test runs, and its `site` prop is what makes them say Pause Plan instead.
  for (const name of ["learn", "responsibleGambling", "help"] as const) {
    const page = generatedPages[name];
    const common = transformCommonHandoff(page.html);
    assertUnbranded(withSiteName(common, "help"), `the ${name} capture on the help host`);
  }
  // /responsible-gambling and /help carry the brand in the page's own words, not in the
  // captured chrome the transform strips, so on the main host they still say it.
  for (const name of ["responsibleGambling", "help"] as const) {
    assert.ok(WORDMARK.test(transformCommonHandoff(generatedPages[name].html)), `the ${name} capture still names B4GAMBLE on the main host`);
  }
  // And the component is what applies it, for every caller at once.
  const handoff = readFileSync("components/final-handoff/HandoffPage.tsx", "utf8");
  assert.match(handoff, /withSiteName\(revealHeadings/, "HandoffPage says the captured page in the serving site's name");
  for (const path of [
    "app/(public)/learn/page.tsx",
    "app/(public)/responsible-gambling/page.tsx",
    "app/help/page.tsx",
  ]) {
    assert.match(readFileSync(path, "utf8"), /<HandoffPage[^>]*site=\{site\}/, `${path} tells HandoffPage which site is answering`);
  }
  // The home capture IS rendered on the help host since 18 October 2026, and `HandoffPage`
  // is told which site is answering, so "B4GAMBLE uses public NHS and NICE guidance…" in the
  // evidence screen reads "Pause Plan uses…" there.
  const home = readFileSync("app/(public)/page.tsx", "utf8");
  assert.match(home, /<HandoffPage[\s\S]*?site="help"/, "the help home tells HandoffPage which site is answering");
  assert.match(home, /transformHelpHomeHandoff\(transformHomeHandoff\(/, "and runs the help host's own pass over the captured design");
});

// ---------------------------------------------------------------------------
// the components that print a name
// ---------------------------------------------------------------------------

async function componentModules() {
  const [{ PathnameContext, SearchParamsContext }, provider, learn, tenSteps] = await Promise.all([
    import("next/dist/shared/lib/hooks-client-context.shared-runtime"),
    import("../components/site/SiteNameProvider"),
    import("../app/(public)/learn/[category]/[slug]/LearningArticleView"),
    import("../app/(public)/10-steps/TenStepsPage"),
  ]);
  return { PathnameContext, SearchParamsContext, ...provider, ...learn, ...tenSteps };
}

type ComponentModules = Awaited<ReturnType<typeof componentModules>>;

function onHelpHost(modules: ComponentModules, children: React.ReactNode, pathname = "/") {
  return (
    <modules.PathnameContext.Provider value={pathname}>
      <modules.SearchParamsContext.Provider value={new URLSearchParams() as never}>
        <modules.SiteNameProvider site="help">{children}</modules.SiteNameProvider>
      </modules.SearchParamsContext.Provider>
    </modules.PathnameContext.Provider>
  );
}

/** A guide as the Learn orchestrator writes one: its toolkit link is labelled "B4GAMBLE Help". */
function brandedGuide() {
  return {
    id: "guide-1",
    slug: "a-guide",
    category: "responsible-gambling",
    locale: "en-GB",
    title: "Staying in control with B4GAMBLE",
    excerpt: "What B4GAMBLE publishes about control.",
    seoTitle: "",
    seoDescription: "",
    tags: ["control"],
    readingTime: "6 min",
    difficulty: "Beginner",
    heroImageUrl: null,
    heroImageAlt: "",
    canonicalUrl: null,
    publishedAt: "2026-10-01T00:00:00.000Z",
    lastReviewedAt: null,
    updatedAt: "2026-10-01T00:00:00.000Z",
    bodyBlocks: [
      { id: "b1", type: "paragraph", text: "B4GAMBLE does not diagnose or treat gambling addiction." },
      { id: "b2", type: "heading", level: 2, text: "What B4GAMBLE can do" },
      { id: "b3", type: "link", label: "B4GAMBLE Help", url: "/help", description: "Protected support routes." },
    ],
  };
}

test("a guide's own words are said in the serving site's name", async () => {
  const modules = await componentModules();
  const messages = learningMessages("en-GB");
  // The view is given a guide exactly as the database holds one: the page's own rewrite is
  // checked separately below, and the view's is what this proves.
  const raw = (
    <modules.LearningArticleView
      article={brandedGuide() as never}
      categoryTitle="Responsible gambling"
      hrefFor={(href: string) => href}
      messages={messages}
      programmePath="/program"
      site="help"
    />
  );
  assertUnbranded(renderToStaticMarkup(onHelpHost(modules, raw)), "a help-host guide");
  // The inline page data too, with the guide rewritten where the route rewrites it: the page
  // hands the view an article that has already been said in this site's name, so that the
  // props Next serialises carry no wordmark either.
  const element = (
    <modules.LearningArticleView
      article={withSiteNameDeep(brandedGuide(), "help") as never}
      categoryTitle="Responsible gambling"
      hrefFor={(href: string) => href}
      messages={withSiteNameDeep(messages, "help")}
      programmePath="/program"
      site="help"
    />
  );
  assertElementUnbranded(onHelpHost(modules, element) as React.ReactElement, "a help-host guide");
  for (const path of ["app/(public)/learn/[category]/[slug]/page.tsx"]) {
    const source = readFileSync(path, "utf8");
    assert.equal(source.match(/withSiteNameDeep\(await loadArticle\(/g)?.length, 2, `${path} rewrites the guide for both the metadata and the page`);
  }
  // The toolkit link the orchestrator writes is the one the phase-1 screens found.
  assert.ok(renderToStaticMarkup(onHelpHost(modules, element)).includes("Pause Plan Help"), "the toolkit link is renamed, not dropped");
  // On the main host the same guide reads exactly as the database wrote it.
  const main = renderToStaticMarkup(
    <modules.PathnameContext.Provider value="/">
      <modules.SearchParamsContext.Provider value={new URLSearchParams() as never}>
        <modules.LearningArticleView
          article={brandedGuide() as never}
          categoryTitle="Responsible gambling"
          hrefFor={(href: string) => href}
          messages={messages}
          programmePath="/program"
        />
      </modules.SearchParamsContext.Provider>
    </modules.PathnameContext.Provider>,
  );
  assert.ok(main.includes("B4GAMBLE Help"), "the main host still prints the guide as written");
});

test("the ten-steps hero on the help host carries the owner question and the hashed photograph", async () => {
  const modules = await componentModules();
  const art = { fallbackSrc: "/_next/static/media/hero-plan.1234abcd.jpg", avifSrcSet: "/_next/static/media/hero-plan-320.1234abcd.avif 320w", webpSrcSet: "/_next/static/media/hero-plan-320.1234abcd.webp 320w" };
  for (const locale of HELP_LOCALES) {
    const element = (
      <modules.TenStepsPage
        aboutHref="/who-runs-this"
        aboutLabel={helpOwnerLinkLabel(locale)}
        art={art}
        locale={locale}
        programmePath="/program"
      />
    );
    assertElementUnbranded(onHelpHost(modules, element, "/10-steps") as React.ReactElement, `/10-steps ${locale}`);
    const html = renderToStaticMarkup(onHelpHost(modules, element, "/10-steps"));
    assert.ok(html.includes(art.fallbackSrc), `/10-steps ${locale} serves the hashed photograph`);
    assert.equal(html.includes("/home/hero-plan.jpg"), false, `/10-steps ${locale} still asks for the denied path`);
  }
});

// ---------------------------------------------------------------------------
// the pictures (Founder: «перенеси картинки»)
// ---------------------------------------------------------------------------

const denied = new RegExp(HELP_HOST_UNGATED_PATH_PATTERN);
const served = new RegExp(HELP_HOST_SERVED_UNGATED_PATH_PATTERN);

/** The rule's verdict for one path, as the Firewall will apply it in Production. */
function refusedOnTheHelpHost(path: string) {
  return denied.test(path) && !served.test(path);
}

/** Every asset an HTML string asks the browser for: `src`, every `srcset` candidate, `url()`. */
function requestedAssets(html: string) {
  const assets = new Set<string>();
  for (const match of html.matchAll(/\ssrc="([^"]+)"/g)) assets.add(match[1]);
  for (const match of html.matchAll(/\ssrcSet="([^"]+)"|\ssrcset="([^"]+)"/g)) {
    for (const candidate of (match[1] ?? match[2]).split(",")) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url) assets.add(url);
    }
  }
  for (const match of html.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) assets.add(match[2]);
  return [...assets].filter((url) => !url.startsWith("data:"));
}

test("every photograph a help page shows is served from a path the Firewall rule allows", async () => {
  const modules = await componentModules();
  const { helpHostPhoto, helpHostPhotoUrls } = await import("../lib/media/help-host-photos");

  // The two photographs the phase-1 screens found, now imported so the bundler hashes them.
  for (const url of helpHostPhotoUrls()) {
    assert.match(url, /^\/_next\/static\//, `${url} is not a hashed build file`);
    assert.equal(refusedOnTheHelpHost(url), false, `${url} is refused on the help host`);
  }
  assert.equal(helpHostPhotoUrls().length, 45, "five photographs, a JPEG fallback and four widths in avif and webp each");

  // And nothing the hero renders is left on the denied path.
  const art = helpHostPhoto("hero-plan.jpg");
  const html = renderToStaticMarkup(onHelpHost(modules,
    <modules.TenStepsPage art={art} locale="en-GB" programmePath="/program" />, "/10-steps"));
  const assets = requestedAssets(html);
  assert.ok(assets.length >= 3, "the hero asks for its photograph");
  for (const url of assets) {
    assert.equal(refusedOnTheHelpHost(url), false, `/10-steps asks for ${url}, which the Firewall rule denies`);
  }
  // The originals stay where the main site serves them from.
  const mainHtml = renderToStaticMarkup(onHelpHost(modules,
    <modules.TenStepsPage locale="en-GB" programmePath="/program" />, "/10-steps"));
  assert.ok(mainHtml.includes("/home/hero-plan.jpg"), "the main host serves the photograph it serves today");
  assert.ok(refusedOnTheHelpHost("/home/hero-plan.jpg"), "which is exactly the path the help host may not ask for");
});

test("the tab icon is a route, so the help host has its own mark and asks for no .ico", () => {
  // `app/favicon.ico` and `app/icon.svg` were file conventions, and a file convention writes its
  // link into every document on both hosts. The help host cannot have either: both files are the
  // B4GAMBLE mark, and the rule denies every `.ico`.
  const icon = readFileSync("app/icon.svg/route.ts", "utf8");
  const favicon = readFileSync("app/favicon.ico/route.ts", "utf8");
  assert.match(icon, /resolveServerSite/, "the icon route reads the site");
  assert.match(favicon, /status: 404/, "the help host gets no .ico at all");
  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.match(layout, /icons: HELP_ICONS/, "the help metadata names its own icon");
  assert.match(layout, /icons: MAIN_ICONS/, "the main metadata names the icons it names today");
  // The help document asks for `/icon.svg` and nothing else; `.svg` is not an excluded ending,
  // so the gate decides it and the Firewall rule never sees it.
  assert.equal(refusedOnTheHelpHost("/icon.svg"), false, "/icon.svg is the gate's decision");
  assert.ok(refusedOnTheHelpHost("/favicon.ico"), "/favicon.ico stays denied, as the rule intends");
  // The help mark carries no wordmark of the other brand.
  assertUnbranded(icon.replace(/\/\*[\s\S]*?\*\//g, ""), "the icon route");
});

test("the phase-2 Firewall rule is still a default deny, with the one allowance it shipped with", () => {
  // Nothing in this pull request may widen it: the photographs moved to `/_next/static/`
  // precisely so that no second exception is needed.
  assert.equal(HELP_HOST_SERVED_UNGATED_PATH_PATTERN, String.raw`^/_next/static/`);
  assert.equal(
    HELP_HOST_UNGATED_PATH_PATTERN,
    String.raw`^/_next/|\.(?:png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf)$`,
  );
  // The fonts the help site uses are hashed build files, which is why no font allowance exists.
  for (const font of ["/_next/static/media/c214ffb7f5362987-s.p.woff2", "/_next/static/media/a1b2c3d4-s.p.woff"]) {
    assert.equal(refusedOnTheHelpHost(font), false, `${font} is served on both hosts`);
  }
  for (const image of ["/home/hero-plan.jpg", "/home/chapter-apply.jpg", "/favicon.ico", "/brand/b4gamble-logo-512.png"]) {
    assert.ok(refusedOnTheHelpHost(image), `${image} must stay denied`);
  }
});

// ---------------------------------------------------------------------------
// the files a visitor keeps
// ---------------------------------------------------------------------------

test("a file saved from the help site names the help site", () => {
  // The calendar entry and the keepsake outlive the visit: a person who opens one a month later
  // should see where it came from, and on this host that is not B4GAMBLE.
  const tool = readFileSync("app/(public)/pause-plan/PausePlanTool.tsx", "utf8");
  assert.match(tool, /PRODID:-\/\/\$\{brand\}\/\/pause-plan\/\/EN/, "the calendar file carries the serving site's name");
  assert.match(tool, /UID:\$\{day\}-pause-plan@\$\{host\}/, "and its own host");
  assert.match(tool, /link\.download = `\$\{siteFileSlug\(site\)\}-/, "the saved file is named after the site that produced it");
  assert.equal(siteFileSlug("help"), "pause-plan");
  assert.equal(siteFileSlug("main"), "b4gamble", "and on b4gamble.com the name it has always had");
  const mission = readFileSync("components/programme/ProgramAiMissionExperience.tsx", "utf8");
  assert.match(mission, /`\$\{siteFileSlug\(site\)\}-step-\$\{mission\.step\}\.png`/, "the keepsake image too");
  const keepsake = readFileSync("lib/programme/program-ai/keepsake-image.ts", "utf8");
  assert.match(keepsake, /model\.brand \?\? DEFAULT_KEEPSAKE_BRAND/, "the keepsake card draws the name it is given");
});

// ---------------------------------------------------------------------------
// the help home (Founder, 18 October 2026)
// ---------------------------------------------------------------------------

/**
 * The help host's home page exactly as `app/(public)/page.tsx` builds it: the captured design,
 * the help host's own pass over it, the readability pass and the name of the serving site.
 * Rendering it here rather than asserting on the source is the point — the Founder's two
 * instructions about this host are about what a response contains, not about how it is built.
 */
async function renderHelpHome(locale: (typeof HELP_LOCALES)[number]) {
  const { helpHostHomePhotoRewrites } = await import("../lib/media/help-host-photos");
  const copy = helpHomeCopy(locale);
  const design = transformHomeHandoff(transformCommonHandoff(generatedPages.home.html, "/program"), locale);
  return withSiteName(markHandoffReadability(transformHelpHomeHandoff(design, {
    owner: { ...copy.owner, href: HELP_OWNER_PATH, linkLabel: helpOwnerLinkLabel(locale) },
    pausePlan: { ...copy.pausePlan, heroLink: copy.heroPausePlanLink, href: "/pause-plan" },
    photos: helpHostHomePhotoRewrites(),
  })), "help");
}

test("the help home is the designed home page and it never says the other brand", async () => {
  // Founder, 18 October 2026, after opening the help site on his phone: «сделай главную как у
  // основного сайта». The captured design's own headings are already about control, so the
  // page arrives whole; only the screen that explained the affiliate business is replaced.
  for (const locale of HELP_LOCALES) {
    const html = await renderHelpHome(locale);
    assertUnbranded(html, `the help home ${locale}`);
    // The design, screen by screen: the capture's own labels are what proves it is the same page.
    assert.deepEqual(
      [...html.matchAll(/data-home-snap-label="([^"]+)"/g)].map((match) => match[1]),
      [
        "Hero",
        "Recognition",
        "Pause plan",
        "A plan you can see",
        "Missions 01-03",
        "Missions 04-07",
        "Missions 08-10",
        "Built from evidence",
        "Who runs this site",
        "Final CTA",
      ],
      `the help home ${locale} serves the captured design with the pause plan added`,
    );
    // "Two businesses. One wall between them." is gone, in this locale's own words: the two
    // heading lines and the whole reviews column of the captured screen, read from the
    // catalogue rather than retyped, so a reworded capture cannot slip past this.
    const trust = (homeTranslation(locale) ?? HOME_SOURCE_COPY).trust;
    for (const index of [1, 2, 7, 8, 9, 10, 11]) {
      assert.equal(html.includes(trust[index]), false, `the help home ${locale} still says ${JSON.stringify(trust[index])}`);
    }
    assert.doesNotMatch(html, /Editor Score/, `the help home ${locale} still names the editorial score`);
  }
});

test("the help home answers who runs the site, and offers the pause plan twice", async () => {
  for (const locale of HELP_LOCALES) {
    const html = await renderHelpHome(locale);
    const copy = helpHomeCopy(locale);
    // The subject is not deleted: the short true version, and one click to the long one.
    assert.ok(html.includes(copy.owner.body), `the help home ${locale} says how the site is paid for`);
    assert.match(html, new RegExp(`data-help-home-owner="" href="${HELP_OWNER_PATH}"`), `the help home ${locale} links the owner page`);
    assert.ok(html.includes(helpOwnerLinkLabel(locale)), `the help home ${locale} labels the owner link`);
    // The pause plan is what most people arrive for: a line under the hero action, above the
    // fold on a phone, and a screen of its own before the Programme is explained.
    assert.ok(html.includes(copy.heroPausePlanLink), `the help home ${locale} offers the pause plan in the hero`);
    assert.equal((html.match(/href="\/pause-plan"/g) ?? []).length, 2, `the help home ${locale} links the pause plan twice`);
    assert.ok(html.includes(copy.pausePlan.cta), `the help home ${locale} opens the pause plan from its own screen`);
    // Nothing below 12px (Founder's typography floor) in the two blocks this host adds.
    for (const block of [/data-help-home-pause-plan=""[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, /data-screen-label="Who runs this site"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/]) {
      const section = block.exec(html)?.[0] ?? "";
      assert.ok(section.length > 0, `the help home ${locale} renders the block ${block}`);
      for (const size of [...section.matchAll(/font(?:-size)?: (?:\d+ )?(\d+)px/g)].map((match) => Number(match[1]))) {
        assert.ok(size >= 12, `the help home ${locale} renders ${size}px text`);
      }
    }
  }
});

test("the help home asks for no picture the Firewall rule denies", async () => {
  // §4.2 again, now for five photographs instead of two: `public/home/` is COMMERCIAL and the
  // rule denies every raster image outside `/_next/static/`, so the capture's own `/home/…`
  // paths would have rendered an unstyled page of alt text on the help host.
  const html = await renderHelpHome("en-GB");
  assert.doesNotMatch(html, /\/home\//, "the help home still asks for public/home");
  const assets = requestedAssets(html);
  assert.ok(assets.length >= 45, `the help home asks for its photographs (${assets.length})`);
  for (const url of assets) {
    assert.equal(refusedOnTheHelpHost(url), false, `the help home asks for ${url}, which the Firewall rule denies`);
  }
  // The main host serves the same pictures from where it serves them today.
  const main = markHandoffReadability(transformHomeHandoff(transformCommonHandoff(generatedPages.home.html, "/program"), "en-GB"));
  assert.ok(requestedAssets(main).every((url) => url.startsWith("/home/")), "the main home still serves public/home");
});

test("the main host's home page is byte-identical to the design the Founder approved", async () => {
  // His standing rule: the desktop home page is finished work and is never changed. Everything
  // the help host needs is a second pass applied only when `site === "help"`, so the main
  // host's bytes are a fixed value. A legitimate home change has to update these digests
  // deliberately, in a pull request whose subject is the home page.
  const digest = (value: string) => createHash("sha256").update(value).digest("hex");
  const expected: Readonly<Record<string, string>> = {
    "en-GB": "1ea27a42f73ae8a00b178648325dc0fe29f6a535397bb40cd3064477e0fc4c85",
    "sv-SE": "30d6c3db2b3afef23ddda0e4ced66c0f754d378450a6b0a703830b75b22527ce",
    "da-DK": "ef97bd5c6a64cb2d257f6cc7ded5decddb3e3f777b21bbc751e5f68d93a7cc25",
    "de-DE": "66417e71f159c43730427ff790abbbc47519c95fbad4f49487bfb9ed0ab51995",
  };
  for (const [locale, hash] of Object.entries(expected)) {
    // Exactly what `HandoffPage` renders for the main host: no `site` prop, so `withSiteName`
    // returns the string it was given.
    const html = withSiteName(markHandoffReadability(transformHomeHandoff(transformCommonHandoff(generatedPages.home.html, "/program"), locale as never)));
    assert.equal(digest(html), hash, `the main host's home page changed in ${locale}`);
  }
  assert.equal(
    digest(transformHomeHandoffCss(transformCommonHandoffCss(generatedPages.home.css))),
    "be20074e7daa7e8aa0aa2ab71d231fd461589df5153fe2c88bfa183dd6f268e6",
    "the main host's home stylesheet changed",
  );
  // And the help pass is reachable only behind the site class.
  const page = readFileSync("app/(public)/page.tsx", "utf8");
  const helpBranch = page.indexOf('if (site === "help")');
  assert.ok(helpBranch > 0, "the help home is behind the site class");
  assert.ok(page.indexOf("transformHelpHomeHandoff(") > helpBranch, "and the help pass is inside that branch");
});
