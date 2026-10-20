// RFC-057 phase 1, the help shell and the one-way link rule (§6, §6.5, §6.6, §8, §16.3, §17,
// §17.1). The help site is a second domain served by the same code, and the single thing that
// makes it worth having is that nothing on it leads to a casino catalogue. This file is the
// guard for that.
//
// It checks three layers, because the rule is about the whole response and not about what a
// screen shows (§6, rule 1):
//
//  1. **the rendered HTML** of every help-host shell and page component;
//  2. **the element tree**, walked prop by prop — which is what Next serialises into
//     `self.__next_f` and into the `?_rsc=` responses a client navigation fetches. A link that
//     is built and then hidden (the research door before PR #533) never appears in the HTML
//     and still travels in the inline data, so the HTML alone is not enough;
//  3. **the source** of every module that can render on the help host, for a literal
//     commercial route written outside a `site === "help"` branch.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { markHandoffReadability } from "../lib/final-handoff/readability";
import { transformCommonHandoff, transformHelpHomeHandoff, transformHomeHandoff } from "../lib/final-handoff/transforms";
import generatedPages from "../lib/final-handoff/generated-pages.json";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import { accountNavigationFor, HELP_NAVIGATION } from "../lib/public-shell";
import { editorialAuthor, organizationReference, organizationSchema, websiteSchema } from "../lib/seo/structured-data";
import { absoluteUrl, originForSite, PUBLIC_CANONICAL_ORIGIN } from "../lib/site";
import {
  HELP_LOCALES,
  HELP_ORGANISATIONS_PATH,
  HELP_OWNER,
  HELP_OWNER_PATH,
  HELP_SHARE_IMAGE_PATH,
  helpControlFaqEntry,
  helpLearnHubDescription,
  helpOrganisationsPage,
  helpOwnerPage,
  helpRevenueLine,
  helpRoutePath,
  helpShellCopy,
  needHelpLine,
  withHelpOrigin,
} from "../lib/site/help-copy";
import { helpHomeCopy, helpOwnerLinkLabel, withSiteName } from "../lib/site/help-copy";
import { helpMediaPath, helpMediaStorageKey, helpMediaUrl } from "../lib/site/help-media";
import { HELP_CANONICAL_ORIGIN, HELP_SITE_NAME } from "../lib/site/host-gate";
import { classifySitePath, HELP_SHELL_READY, helpHostServesRequest } from "../lib/site/host-routes";

const require = createRequire(import.meta.url);
require.extensions[".css"] = (module) => { module.exports = {}; };
/** A static image import, as the bundler resolves one; `node --test` has no bundler. */
for (const extension of [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]) {
  require.extensions[extension] = (module, filename) => {
    const name = filename.split("/").pop() ?? "asset";
    module.exports = { src: `/_next/static/media/${name.replace(/\.(\w+)$/, ".1a2b3c4d.$1")}`, height: 2336, width: 3500 };
  };
}
(globalThis as typeof globalThis & { React: typeof React }).React = React;

/**
 * The shell and the help pages import CSS modules, so they are loaded after the `.css` hook
 * above is in place — the same pattern every other render test in this repository uses.
 */
async function shellModules() {
  const [{ PathnameContext, SearchParamsContext }, { PublicHeader }, { PublicFooter }, { HelpTextPageBody }] = await Promise.all([
    import("next/dist/shared/lib/hooks-client-context.shared-runtime"),
    import("../components/public-shell/PublicHeader"),
    import("../components/public-shell/PublicFooter"),
    import("../app/(public)/_help-pages/HelpTextPageView"),
  ]);
  return { PathnameContext, SearchParamsContext, PublicHeader, PublicFooter, HelpTextPageBody };
}

type ShellModules = Awaited<ReturnType<typeof shellModules>>;

/** A document, as Next renders one: the client contexts the shell's links read. */
function inDocument(modules: ShellModules, children: React.ReactNode, pathname = "/") {
  return (
    <modules.PathnameContext.Provider value={pathname}>
      <modules.SearchParamsContext.Provider value={new URLSearchParams() as never}>
        {children}
      </modules.SearchParamsContext.Provider>
    </modules.PathnameContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// what a help-host response may never contain
// ---------------------------------------------------------------------------

/** Every COMMERCIAL and INTERNAL root of the manifest, as an address with or without a prefix. */
const FORBIDDEN_HREF = /(?:^|["'\s(])(?:https?:\/\/[a-z0-9.-]*b4gamble\.com)?(?:\/[a-z]{2}(?:-[a-z]{2})?)?\/(?:best-offers|casinos|casino|catalog|bonuses|compare|bonus-guide|wagering-calculator|outbound|r|go|partner-creatives|partner-preview|faq|methodology|about|affiliate-disclosure|can-you-trust-b4gamble|for-creators|admin|editorial-preview|opengraph-image|llms-full\.txt)(?:[/?#"'\s)]|$)/i;

/** Any address on the commercial host, however it is written. */
const B4GAMBLE_HOST = /https?:\/\/(?:[a-z0-9-]+\.)*b4gamble\.com/i;

/** The only `b4gamble.com` address allowed anywhere on the help host, and only on /contact. */
const SUPPORT_MAILBOX = "support@b4gamble.com";

function assertNoCommercialAddress(text: string, where: string) {
  assert.doesNotMatch(text, FORBIDDEN_HREF, `${where} carries a commercial address`);
  assert.doesNotMatch(text, B4GAMBLE_HOST, `${where} carries a b4gamble.com URL`);
}

/**
 * Every string in an element tree, including the props of elements that are never rendered.
 * This is the layer `self.__next_f` and a `?_rsc=` response carry: Next serialises the props a
 * server component passes, whether or not the browser paints them.
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

function assertTreeIsClean(element: React.ReactElement, where: string) {
  for (const value of treeStrings(element)) assertNoCommercialAddress(value, `${where} (inline page data)`);
}

const routeLanguageByLocale = { "en-GB": "en", "sv-SE": "sv", "da-DK": "da" } as const;

const presentations = HELP_LOCALES.map((locale) => ({
  locale,
  presentation: resolvePresentationContext({ routeLanguage: routeLanguageByLocale[locale] }),
}));

// ---------------------------------------------------------------------------
// §18 the interlock
// ---------------------------------------------------------------------------

test("the shell interlock is open now that the help shell, the help home and the metadata exist", () => {
  // The inverse of the assertion PR #536 left behind: while HELP_SHELL_READY was false the gate
  // answered 404 for every path, because serving a route with no help page of its own would have
  // rendered the commercial shell on the help domain. This pull request is the one that lands
  // those pages, so it is the one commit allowed to flip it (§18, refinement 2).
  assert.equal(HELP_SHELL_READY, true, "the help shell, home and root metadata ship in this PR");
  for (const path of ["/", "/pause-plan", "/program", "/learn", "/privacy", "/who-runs-this", "/for-organisations", "/help-share-image"]) {
    assert.equal(helpHostServesRequest(path), true, path);
  }
  // Readiness never widens the route classes.
  for (const path of ["/casinos", "/about", "/methodology", "/opengraph-image", "/api/media/x", "/admin"]) {
    assert.equal(helpHostServesRequest(path), false, path);
  }
});

test("every route this pull request adds has a class", () => {
  assert.equal(classifySitePath("/who-runs-this"), "HELP");
  assert.equal(classifySitePath("/for-organisations"), "HELP");
  assert.equal(classifySitePath("/help-share-image"), "HELP");
  // Next registers a sibling path for a dynamic image route; it inherits the same class.
  assert.equal(classifySitePath("/help-share-image/anything"), "HELP");
  assert.equal(classifySitePath("/api/help-media/content/learn/abc.png"), "HELP");
  // The commercial image route and the commercial share image are unchanged.
  assert.equal(classifySitePath("/api/media/x"), "COMMERCIAL");
  assert.equal(classifySitePath("/opengraph-image"), "COMMERCIAL");
  // Language prefixes do not change any of it.
  assert.equal(classifySitePath("/sv/who-runs-this"), "HELP");
  assert.equal(classifySitePath("/da/for-organisations"), "HELP");
});

// ---------------------------------------------------------------------------
// §6.5 the shell
// ---------------------------------------------------------------------------

function helpHeader(modules: ShellModules, presentation: ReturnType<typeof resolvePresentationContext>, programme = false) {
  return (
    <modules.PublicHeader
      account={accountNavigationFor({ authenticated: false, programmePath: "/program" })}
      authenticated={false}
      commercialProductState="EDITORIAL_ONLY"
      presentation={presentation}
      researchNavigation={!programme}
      site="help"
    />
  );
}

function helpFooter(modules: ShellModules, presentation: ReturnType<typeof resolvePresentationContext>, programme = false) {
  return (
    <modules.PublicFooter
      commercialProductState="EDITORIAL_ONLY"
      presentation={presentation}
      researchNavigation={!programme}
      site="help"
    />
  );
}

function renderShell(modules: ShellModules, element: React.ReactElement) {
  return renderToStaticMarkup(inDocument(modules, element));
}

test("the help shell carries the help site's own name and no B4GAMBLE wordmark", async () => {
  const modules = await shellModules();
  for (const { locale, presentation } of presentations) {
    for (const [name, element] of [["header", helpHeader(modules, presentation)], ["footer", helpFooter(modules, presentation)]] as const) {
      const html = renderShell(modules, element);
      assert.match(html, new RegExp(HELP_SITE_NAME), `${name} ${locale} names the help site`);
      // Founder, Q2: no B4GAMBLE wordmark and no B4GAMBLE logo anywhere on this host.
      assert.doesNotMatch(html, /B4GAMBLE/i, `${name} ${locale} prints the B4GAMBLE wordmark`);
      assert.doesNotMatch(html, /b4gamble-logo/i, `${name} ${locale} prints the B4GAMBLE logo`);
      assertNoCommercialAddress(html, `${name} ${locale}`);
      assertTreeIsClean(element, `${name} ${locale}`);
      // …and the layer the browser receives but never paints. `PublicNavigation` is a client
      // component, so the whole `PublicShellMessages` object is serialised into `self.__next_f`
      // and into every `?_rsc=` response: until 18 October 2026 that carried "B4GAMBLE home"
      // on every help page, including this one.
      for (const value of treeStrings(element)) {
        assert.doesNotMatch(value, /B4GAMBLE/i, `${name} ${locale} serialises the B4GAMBLE wordmark: ${value}`);
      }
    }
  }
});

test("the help menu is 10 Steps, Pause plan, Guides and Help, and nothing else", async () => {
  const modules = await shellModules();
  const { presentation } = presentations[0];
  const html = renderShell(modules, helpHeader(modules, presentation));
  for (const item of HELP_NAVIGATION) {
    assert.ok(html.includes(`href="${item.href}"`), `the help header links ${item.href}`);
  }
  // The commercial destinations are not built at all, hidden or shown.
  for (const href of ["/best-offers", "/casinos", "/bonuses"]) {
    assert.equal(html.includes(href), false, `the help header must not build ${href}`);
  }
});

/**
 * The help host's home page exactly as `app/(public)/page.tsx` builds it. The page is a server
 * component that hands `HandoffPage` a string, and the string is what lands in the document, in
 * `self.__next_f` and in the `?_rsc=` response a client navigation fetches — so reading it is
 * reading all three layers at once.
 */
async function helpHome(locale: (typeof HELP_LOCALES)[number]) {
  const { helpHostHomePhotoRewrites } = await import("../lib/media/help-host-photos");
  const copy = helpHomeCopy(locale);
  const design = transformHomeHandoff(transformCommonHandoff(generatedPages.home.html, "/program"), locale);
  return withSiteName(markHandoffReadability(transformHelpHomeHandoff(design, {
    owner: { ...copy.owner, href: HELP_OWNER_PATH, linkLabel: helpOwnerLinkLabel(locale) },
    pausePlan: { ...copy.pausePlan, heroLink: copy.heroPausePlanLink, href: "/pause-plan" },
    photos: helpHostHomePhotoRewrites(),
  })), "help");
}

test("the help home carries three links and no commercial address of any kind", async () => {
  // Founder, 18 October 2026: the help site gets the designed home page. The captured design
  // ships `/best-offers`, `/casinos`, `/bonuses` and `/affiliate-disclosure` in its raw HTML,
  // which is why `/` served the pause plan until now. The chrome is stripped by
  // `stripHandoffGlobalChrome` and the one surviving commercial link, "How we're funded" in
  // the trust screen, goes with the screen that carried it.
  for (const locale of HELP_LOCALES) {
    const html = await helpHome(locale);
    assertNoCommercialAddress(html, `the help home ${locale}`);
    const hrefs = [...new Set([...html.matchAll(/href="([^"]*)"/g)].map((match) => match[1]))].sort();
    assert.deepEqual(hrefs, ["/pause-plan", "/program", HELP_OWNER_PATH].sort(), `the help home ${locale} links something else`);
    // The two destinations the Founder asked for, by their own hooks.
    assert.match(html, /data-help-home-pause-plan-cta="" href="\/pause-plan"/, `the help home ${locale} opens the pause plan`);
    assert.match(html, new RegExp(`data-help-home-owner="" href="${HELP_OWNER_PATH}"`), `the help home ${locale} opens the owner page`);
  }
});

test("the help footer has the owner page, the data statement and the legal links, and no commission line", async () => {
  const modules = await shellModules();
  for (const { locale, presentation } of presentations) {
    const copy = helpShellCopy(locale);
    const html = renderShell(modules, helpFooter(modules, presentation));
    for (const href of [HELP_OWNER_PATH, HELP_ORGANISATIONS_PATH, "/privacy", "/terms", "/contact", "/10-steps", "/pause-plan", "/learn", "/help"]) {
      assert.ok(html.includes(`href="${href}"`), `the help footer ${locale} links ${href}`);
    }
    assert.ok(html.includes(copy.footer.noTracking), `the help footer ${locale} says it sets no tracking cookies`);
    // The main footer's commission disclosure and operator disclaimer are not rendered here,
    // and neither are the brand's social profiles (§6.5, §17.1).
    assert.doesNotMatch(html, /commission|provision/i, `the help footer ${locale} prints a commission line`);
    assert.doesNotMatch(html, /instagram|facebook|youtube|threads\.(?:net|com)|x\.com/i, `the help footer ${locale} links a brand profile`);
  }
});

test("the Programme's shell on the help host is the same components with the same props", async () => {
  const modules = await shellModules();
  // §6.5: the help shell is not a different component for the Programme. The guard of
  // tests/programme-no-casino-links.test.tsx counts `researchNavigation={false}` twice in
  // app/program/layout.tsx; this is the other half — the prop still does what it says on the
  // help host, and a Programme document there carries no research address either.
  const layout = readFileSync("app/program/layout.tsx", "utf8");
  assert.equal(layout.match(/researchNavigation=\{false\}/g)?.length, 2, "the Programme layout still passes the prop twice");
  assert.match(layout, /site=\{site\}/, "the Programme layout passes the resolved site to both shells");
  for (const { locale, presentation } of presentations) {
    for (const element of [helpHeader(modules, presentation, true), helpFooter(modules, presentation, true)]) {
      assertNoCommercialAddress(renderShell(modules, element), `the Programme shell ${locale}`);
      assertTreeIsClean(element, `the Programme shell ${locale}`);
    }
  }
});

// ---------------------------------------------------------------------------
// §17 and §16.3 the two new pages
// ---------------------------------------------------------------------------

test("the owner page names the owner and the other site in plain text, and links to neither", async () => {
  const modules = await shellModules();
  for (const { locale, presentation } of presentations) {
    const copy = helpOwnerPage(locale);
    const element = <modules.HelpTextPageBody contentLocale={locale} copy={copy} presentation={presentation} site="help" />;
    const html = renderShell(modules, element);
    // The exception of §6, rule 2, checked to be exactly what it says: the name is text.
    assert.ok(html.includes(HELP_OWNER.otherSite), `the owner page ${locale} names the other site`);
    assert.ok(html.includes(HELP_OWNER.legalName), `the owner page ${locale} names the company`);
    assert.doesNotMatch(html, new RegExp(`href="[^"]*${HELP_OWNER.otherSite}`), `the owner page ${locale} links the other site`);
    assert.doesNotMatch(html, B4GAMBLE_HOST, `the owner page ${locale} prints a b4gamble.com URL`);
    assert.doesNotMatch(html, FORBIDDEN_HREF, `the owner page ${locale} carries a commercial address`);
    assertTreeIsClean(element, `the owner page ${locale}`);
    // §17 as amended on 20 October 2026: five short answers, then the way to the long version.
    const text = copy.sections.flatMap((section) => section.paragraphs).join(" ");
    assert.ok(text.includes(HELP_OWNER.legalName), "who runs it");
    assert.match(text, /New York/, "where the company is");
    assert.match(text, /United States|USA/, "that it is a United States company");
    assert.ok(text.includes(HELP_OWNER.otherSite), "how the company earns");
    assert.equal(copy.sections.length, 5, `the owner page ${locale} gives five answers`);
    // The page offers exactly two routes: the data statement, with the rest of the answers,
    // and the contact page. Both in the reader's own language.
    const prefix = `/${routeLanguageByLocale[locale]}`;
    assert.equal(copy.more?.href, HELP_ORGANISATIONS_PATH, `the owner page ${locale} points at the data statement`);
    assert.equal(copy.more?.label, `${helpShellCopy(locale).footer.organisations} →`, "with the footer's own name for it");
    const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((match) => match[1]);
    assert.deepEqual(hrefs, [`${prefix}${HELP_ORGANISATIONS_PATH}`, `${prefix}/contact`], `the owner page ${locale} links only the data statement and the contact page`);
  }
});

test("the owner page is short, and what it stopped saying is still said on the data statement", () => {
  // Founder, 20 October 2026: «слишком много текста и он плохо читаемый». The long answer was
  // not deleted; it moved one tap away, and this holds every piece of it there.
  const words = (value: string) => value.split(/\s+/).filter(Boolean).length;
  for (const locale of HELP_LOCALES) {
    const owner = helpOwnerPage(locale);
    const ownerText = [owner.intro, ...owner.sections.flatMap((section) => [section.heading, ...section.paragraphs])].join(" ");
    assert.ok(words(ownerText) <= 230, `the owner page ${locale} is ${words(ownerText)} words long`);
    for (const section of owner.sections) {
      assert.ok(section.paragraphs.join(" ").length <= 330, `"${section.heading}" (${locale}) is a short answer`);
    }
    assert.doesNotMatch(ownerText, /447 Broadway/, `the owner page ${locale} no longer prints the street address`);
    assert.doesNotMatch(ownerText, /\b17\.? (?:October|oktober)\b/, `the owner page ${locale} no longer carries the partner-press qualification`);

    const organisations = helpOrganisationsPage(locale);
    const text = organisations.sections.flatMap((section) => section.paragraphs).join(" ");
    assert.match(text, /447 Broadway, 2nd Floor, 1663, New York, NY 10013/, `the data statement ${locale} prints the street address`);
    assert.match(text, /\b17\.? (?:October|oktober) 2026\b/, `the data statement ${locale} carries the dated partner-press qualification`);
    assert.ok(text.includes(HELP_OWNER.otherSite), `the data statement ${locale} names the other site`);
    assert.match(text, /\b16\.? (?:October|oktober) 2026\b/, `the data statement ${locale} dates the programme's clean state`);
    assert.match(text, /automatic test|automatiskt test|automatisk test/, `the data statement ${locale} says a test keeps it so`);
    assert.match(text, /gambling licence|spellicens|spillicens/, `the data statement ${locale} says the company holds no gambling licence`);
    assert.match(text, /public body|myndighet|myndighed/, `the data statement ${locale} says the company is not a public body`);
    assert.match(text, /start the programme|börjar programmet|starter programmet/, `the data statement ${locale} says what is counted`);
    assert.match(text, /Privacy Notice|integritetspolicyn|privatlivspolitikken/, `the data statement ${locale} points at the Privacy Notice`);
  }
});

test("the data statement answers every row, including the ones we cannot answer yet", async () => {
  const modules = await shellModules();
  for (const { locale, presentation } of presentations) {
    const copy = helpOrganisationsPage(locale);
    const element = <modules.HelpTextPageBody contentLocale={locale} copy={copy} presentation={presentation} site="help" />;
    const html = renderShell(modules, element);
    assert.doesNotMatch(html, B4GAMBLE_HOST, `the data statement ${locale} prints a b4gamble.com URL`);
    assert.doesNotMatch(html, FORBIDDEN_HREF, `the data statement ${locale} carries a commercial address`);
    assertTreeIsClean(element, `the data statement ${locale}`);
    const text = copy.sections.flatMap((section) => [section.heading, ...section.paragraphs]).join(" ");
    for (const subject of ["Prisma", "Vercel", "Resend", "Prighter", HELP_OWNER.legalName, HELP_OWNER.privacyMailbox, "18+"]) {
      assert.ok(text.includes(subject), `the data statement ${locale} names ${subject}`);
    }
    // §16.3's gate: the open questions are written down, not left out.
    assert.ok(copy.sections.some((section) => /yet|endnu|ännu/i.test(section.heading)), `the data statement ${locale} lists what is not answered`);
  }
});

test("every help page is written in all three published languages and in none of them is a sentence missing", () => {
  const pages = [helpOwnerPage, helpOrganisationsPage];
  for (const page of pages) {
    const byLocale = HELP_LOCALES.map((locale) => page(locale));
    const sectionCounts = new Set(byLocale.map((copy) => copy.sections.length));
    assert.equal(sectionCounts.size, 1, "the three languages say the same number of things");
    for (const copy of byLocale) {
      assert.ok(copy.metadataTitle.includes(HELP_SITE_NAME));
      assert.ok(copy.intro.length > 60);
      for (const section of copy.sections) {
        assert.ok(section.heading.length > 3, section.heading);
        assert.ok(section.paragraphs.every((paragraph) => paragraph.length > 20), section.heading);
      }
    }
  }
  // A locale the help site does not publish reads the English page, as /pause-plan already does.
  assert.equal(helpOwnerPage("de-DE").title, helpOwnerPage("en-GB").title);
});

// ---------------------------------------------------------------------------
// §8 origins, metadata and structured data
// ---------------------------------------------------------------------------

test("absolute URLs on the help host are the help origin, and the main host is unchanged", () => {
  assert.equal(originForSite("main"), absoluteUrl("/").replace(/\/$/, ""));
  assert.equal(absoluteUrl("/pause-plan", "help"), `${HELP_CANONICAL_ORIGIN}/pause-plan`);
  assert.equal(absoluteUrl("/pause-plan"), `${PUBLIC_CANONICAL_ORIGIN}/pause-plan`);
  assert.equal(absoluteUrl("/pause-plan", "main"), absoluteUrl("/pause-plan"));
});

test("the help host's structured data is its own, with no B4GAMBLE identity in it", () => {
  const organization = organizationSchema("help") as Record<string, unknown>;
  const website = websiteSchema("help") as Record<string, unknown>;
  for (const schema of [organization, website, organizationReference("help"), editorialAuthor("help")]) {
    const json = JSON.stringify(schema);
    assertNoCommercialAddress(json, "help JSON-LD");
    assert.doesNotMatch(json, /B4GAMBLE|Before Gamble/i, "help JSON-LD prints the other brand");
    assert.match(json, new RegExp(HELP_CANONICAL_ORIGIN.replace(/[/]/g, "\\/")), "help JSON-LD names the help origin");
  }
  assert.equal(organization.name, HELP_SITE_NAME);
  // No logo until a Pause Plan mark exists, and no sameAs: the profiles are the other brand's.
  assert.equal("logo" in organization, false, "the help Organization has no logo field");
  assert.equal("sameAs" in organization, false, "the help Organization has no sameAs");
  assert.equal(organization.legalName, HELP_OWNER.legalName);
  // The main host's identity is untouched.
  const main = organizationSchema() as Record<string, unknown>;
  assert.equal(main.name, "B4GAMBLE");
  assert.deepEqual(main, organizationSchema("main"));
});

test("the root metadata reads the site, and the help host has its own share image", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.match(layout, /export async function generateMetadata/, "the root metadata is resolved per request");
  assert.match(layout, /resolveServerSite/, "the root layout reads the site");
  assert.ok(layout.includes(HELP_SHARE_IMAGE_PATH.slice(1)) || layout.includes("HELP_SHARE_IMAGE_PATH"), "the help share image is named");
  // Read the words the image draws, not the file's own comments about them.
  const shareImage = readFileSync("app/help-share-image/route.tsx", "utf8").replace(/\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\}|\/\/.*$/gm, "");
  assert.doesNotMatch(shareImage, /B4GAMBLE/i, "the help share image prints the other wordmark");
  assert.doesNotMatch(shareImage, /review|bonus|casino/i, "the help share image uses commercial words");
  assert.match(shareImage, /HELP_SITE_NAME/, "the help share image names the help site");
  for (const locale of HELP_LOCALES) {
    const copy = helpShellCopy(locale);
    assert.doesNotMatch(copy.metadataTitle, /casino|B4GAMBLE/i, `the ${locale} title`);
    assert.doesNotMatch(copy.metadataDescription, /B4GAMBLE/i, `the ${locale} description`);
  }
});

// ---------------------------------------------------------------------------
// §10 no Google tag and no cookie banner (Q3)
// ---------------------------------------------------------------------------

test("the help host carries no Google tag and no cookie banner", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  // One expression decides all three: the tag in <head>, the page-view beacon and the banner.
  assert.match(layout, /const analyticsEnabled = site !== "help" && isProductAnalyticsEnabled\(\);/, "analytics is off on the help host");
  assert.match(layout, /googleAnalyticsId = analyticsEnabled \?/, "the Google tag follows that one switch");
  assert.match(layout, /analyticsEnabled \? <AnalyticsConsentBanner/, "the cookie banner follows that one switch");
  // And the endpoints are not served there either (§4.1).
  assert.equal(classifySitePath("/api/consent/analytics"), "COMMERCIAL");
  assert.equal(classifySitePath("/api/analytics/events"), "COMMERCIAL");
  // The footer's cookie-choices button cannot reach the help footer: it is in the main branch.
  const footer = readFileSync("components/public-shell/PublicFooter.tsx", "utf8");
  const helpBranch = footer.slice(footer.indexOf('if (site === "help")'), footer.indexOf("const showCommercialProducts"));
  assert.ok(helpBranch.length > 500, "the help footer branch was found");
  assert.doesNotMatch(helpBranch, /PrivacyChoicesButton|FooterCompliance|BrandSocialLinks/, "the help footer renders a main-site block");
});

// ---------------------------------------------------------------------------
// §17.1 the lines that cannot be true here
// ---------------------------------------------------------------------------

test("the commission line is replaced, not carried over", () => {
  for (const locale of HELP_LOCALES) {
    const line = helpRevenueLine(locale);
    assert.doesNotMatch(line, /B4GAMBLE/i, `the ${locale} line names the other brand`);
    assert.match(line, /gratis|free/i, `the ${locale} line says the site is free`);
    assert.ok(line.length > 80, `the ${locale} line explains, rather than hinting`);
  }
  // The five pages that print it all go through one component.
  const printers = [
    "app/(public)/beside/page.tsx",
    "app/(public)/innan/page.tsx",
    "app/(public)/pause-plan/page.tsx",
    "app/(public)/pause-statistics/page.tsx",
    "app/(public)/gambling-control/ControlPage.tsx",
  ];
  for (const path of printers) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /CleanRouteRevenueLine|helpRevenueLine/, `${path} still prints the main line unconditionally`);
  }
});

test("the control pages' FAQ and the Learn hub say what this host is", () => {
  for (const locale of HELP_LOCALES) {
    const [question, answer] = helpControlFaqEntry(locale);
    assert.ok(question.includes(HELP_SITE_NAME), `the ${locale} FAQ asks about the help site`);
    assert.doesNotMatch(question, /B4GAMBLE/i);
    assert.ok(answer.includes(HELP_OWNER.legalName), `the ${locale} FAQ names the owner`);
    const hub = helpLearnHubDescription(locale);
    assert.doesNotMatch(hub, /bonus|casino|bank/i, `the ${locale} Learn description names a commercial topic`);
  }
});

test("a help page's copy prints the help host, not b4gamble.com", () => {
  const sample = "The plan is here: b4gamble.com/en/pause-plan";
  assert.equal(withHelpOrigin(sample, "help"), "The plan is here: pauseplan.help/en/pause-plan");
  assert.equal(withHelpOrigin(sample, "main"), sample);
});

test("the links help pages carry today become the owner page, or nothing", () => {
  for (const href of ["/about", "/affiliate-disclosure", "/can-you-trust-b4gamble"]) {
    assert.equal(helpRoutePath(href, "help"), HELP_OWNER_PATH, href);
    assert.equal(helpRoutePath(href, "main"), href, `${href} is unchanged on the main host`);
  }
  for (const href of ["/methodology", "/faq"]) {
    assert.equal(helpRoutePath(href, "help"), null, href);
    assert.equal(helpRoutePath(href, "main"), href);
  }
  // A help route passes through untouched.
  assert.equal(helpRoutePath("/pause-plan", "help"), "/pause-plan");
});

// ---------------------------------------------------------------------------
// §13 first-party help images
// ---------------------------------------------------------------------------

test("the help image route accepts only content-addressed Learn keys", () => {
  const checksum = "a".repeat(64);
  assert.equal(helpMediaStorageKey(["content", "learn", `${checksum}.png`]), `content/learn/${checksum}.png`);
  for (const key of [
    ["content", "learn", `${checksum}.svg`],
    ["content", "learn", `${checksum}.html`],
    ["content", "learn", "not-a-checksum.png"],
    ["content", "casino", `${checksum}.png`],
    ["..", "content", "learn", `${checksum}.png`],
    ["content", "learn", `${checksum.toUpperCase()}.png`],
    [],
  ]) {
    assert.equal(helpMediaStorageKey(key), null, key.join("/"));
  }
});

test("a help guide's images are first-party or are not loaded at all", () => {
  const checksum = "b".repeat(64);
  assert.equal(
    helpMediaUrl(`https://media.b4gamble.com/content/learn/${checksum}.webp`),
    helpMediaPath(`content/learn/${checksum}.webp`),
  );
  assert.equal(helpMediaUrl(`/content/learn/${checksum}.webp`), helpMediaPath(`content/learn/${checksum}.webp`));
  // Anything the help host cannot serve first-party is refused, so no help page requests it.
  for (const url of ["https://media.b4gamble.com/casino-brands/x.png", "/learn/magazine-shelf.jpg", "", null, undefined]) {
    assert.equal(helpMediaUrl(url), null, String(url));
  }
  assertNoCommercialAddress(helpMediaPath(`content/learn/${checksum}.webp`), "the help image path");
});

// ---------------------------------------------------------------------------
// §6.6 the main host's one quiet line
// ---------------------------------------------------------------------------

test("the need-help line is translated, and is behind the phase-3 switch", () => {
  for (const locale of [...HELP_LOCALES, "de-DE"]) {
    const line = needHelpLine(locale);
    assert.ok(line.length > 20, locale);
    assert.doesNotMatch(line, /casino|bonus/i, locale);
  }
  // An unpublished language reads the English line rather than nothing.
  assert.equal(needHelpLine("el-GR"), needHelpLine("en-GB"));
  const footer = readFileSync("components/public-shell/PublicFooter.tsx", "utf8");
  assert.match(footer, /helpSiteLinked \? \(/, "the line is behind a prop");
  assert.match(footer, /rel="nofollow"/, "the one link is nofollow (§6.6)");
  const layout = readFileSync("app/(public)/layout.tsx", "utf8");
  assert.match(layout, /helpSiteLinked=\{helpSiteSwitchesFromProcessEnv\(\)\.redirects\}/, "and the prop is the phase-3 switch");
});

test("the main host's footer does not link the help site while the switch is off", async () => {
  const modules = await shellModules();
  const presentation = resolvePresentationContext({ routeLanguage: "en" });
  const html = renderShell(modules,
    <modules.PublicFooter commercialProductState="EDITORIAL_ONLY" presentation={presentation} />,
  );
  assert.equal(html.includes(HELP_CANONICAL_ORIGIN), false, "the main footer is unchanged until phase 3");
  const linked = renderShell(modules,
    <modules.PublicFooter commercialProductState="EDITORIAL_ONLY" helpSiteLinked presentation={presentation} />,
  );
  assert.equal(linked.match(new RegExp(HELP_CANONICAL_ORIGIN, "g"))?.length, 1, "exactly one help link, and only one");
  assert.match(linked, /rel="nofollow"/);
});

// ---------------------------------------------------------------------------
// the source guard: what a future change could reintroduce
// ---------------------------------------------------------------------------

function sources(root: string) {
  return (readdirSync(root, { recursive: true }) as string[])
    .filter((name) => /\.(?:tsx|ts)$/.test(name) && !/\.test\./.test(name))
    .map((name) => `${root}/${name}`);
}

test("no help-only module names a commercial route", () => {
  const helpOnly = [
    "lib/site/help-copy.ts",
    "lib/site/help-media.ts",
    "app/(public)/_help-pages/HelpTextPageView.tsx",
    "app/(public)/_help-pages/metadata.ts",
    "app/(public)/who-runs-this/page.tsx",
    "app/(public)/for-organisations/page.tsx",
    "app/help-share-image/route.tsx",
    "app/api/help-media/[...key]/route.ts",
    "components/clean-route/CleanRouteRevenueLine.tsx",
  ];
  for (const path of helpOnly) {
    const source = readFileSync(path, "utf8");
    // The rewrite table and the copy name the commercial routes on purpose; the test is that
    // nothing builds one as a link. `/affiliate-disclosure` etc. appear only as map keys.
    assert.doesNotMatch(source, /href=\{?["'`](?:\/[a-z]{2})?\/(?:best-offers|casinos|casino\/|bonuses|compare|about|methodology|faq|affiliate-disclosure|can-you-trust-b4gamble)/, path);
    assert.doesNotMatch(source, B4GAMBLE_HOST, `${path} names a b4gamble.com URL`);
  }
  assert.ok(sources("app/(public)/_help-pages").length >= 2, "the help page modules are scanned");
});

test("the support mailbox is the only b4gamble.com address left, and only on /contact", async () => {
  const modules = await shellModules();
  // §6, rule 2: the exception holds until the help-domain mailbox of Q6 exists. This records
  // where it is, so that the day the mailbox arrives the change is one file.
  const contact = readFileSync("lib/contact/contracts.ts", "utf8");
  assert.ok(contact.includes(SUPPORT_MAILBOX), "the support mailbox still lives in one constant");
  for (const { presentation } of presentations) {
    assert.equal(renderShell(modules, helpFooter(modules, presentation)).includes(SUPPORT_MAILBOX), false, "the help footer prints the mailbox");
  }
});
