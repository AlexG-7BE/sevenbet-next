import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  PUBLIC_NAVIGATION,
  accountNavigationFor,
  classifyShellRoute,
  commercialDestinationsNavigable,
  publicCommercialDestinationVisible,
  publicNavigationForCommercialState,
} from "../lib/public-shell";

test("public navigation follows the approved Figma information architecture", () => {
  assert.deepEqual(PUBLIC_NAVIGATION, [
    { label: "Best Offers", href: "/best-offers", commercial: true },
    { label: "Casinos", href: "/casinos", commercial: true },
    { label: "Bonuses", href: "/bonuses", commercial: true },
    { label: "Learn", href: "/learn" },
  ]);
});

test("public navigation and footer destinations follow the canonical commercial product state", () => {
  assert.deepEqual(
    publicNavigationForCommercialState(true).map((item) => item.href),
    ["/best-offers", "/casinos", "/bonuses", "/learn"],
  );
  assert.deepEqual(
    publicNavigationForCommercialState(false).map((item) => item.href),
    ["/casinos", "/learn"],
  );
  assert.equal(publicCommercialDestinationVisible("/best-offers", false), false);
  assert.equal(publicCommercialDestinationVisible("/bonuses", false), false);
  for (const href of ["/casinos", "/learn", "/methodology", "/help", "/responsible-gambling", "/affiliate-disclosure"]) {
    assert.equal(publicCommercialDestinationVisible(href, false), true, href);
  }
});

test("commercial destinations are navigable wherever their offers may be presented", () => {
  // A partner route is not the test. Gating the links on one hid Best Offers
  // and Bonuses in every country we had not activated, while the pages
  // themselves had started presenting published offers there.
  assert.equal(commercialDestinationsNavigable(true, "NO"), true, "a route is always enough");
  assert.equal(commercialDestinationsNavigable(false, "KZ"), true, "permitted without a route still links");
  assert.equal(commercialDestinationsNavigable(false, "GB"), true);
  assert.equal(commercialDestinationsNavigable(false, null), true, "an unresolved country is not a prohibition");
  assert.equal(commercialDestinationsNavigable(false, undefined), true);
  for (const prohibited of ["NO", "IT", "NL", "TR", "GR"]) {
    assert.equal(commercialDestinationsNavigable(false, prohibited), false, `${prohibited} stays withheld`);
  }
});

test("ordinary public, Programme, protected Help and internal routes stay separated", () => {
  for (const path of [
    "/",
    "/10-steps",
    "/casinos",
    "/casino/example",
    "/bonuses",
    "/best-offers",
    "/learn/control/article",
    "/affiliate-disclosure",
    "/privacy",
    "/terms",
    "/self-check",
    "/tools/budget-calculator",
    "/responsible-gambling",
    "/responsible-gambling/cooling-off",
    "/responsible-gaming",
  ]) {
    assert.equal(classifyShellRoute(path), "public", path);
  }

  assert.equal(classifyShellRoute("/program"), "programme");
  assert.equal(classifyShellRoute("/program/definitely-missing"), "programme");
  assert.equal(classifyShellRoute("/help"), "protected-help");
  assert.equal(classifyShellRoute("/help/cooling-off"), "protected-help");
  assert.equal(classifyShellRoute("/help/definitely-missing"), "protected-help");
  assert.equal(classifyShellRoute("/admin"), "internal");
  assert.equal(classifyShellRoute("/editorial-preview/token"), "internal");
});

test("account navigation is server-state-derived and never invents XP", () => {
  assert.deepEqual(accountNavigationFor({ authenticated: false }), {
    accountLabel: "Log in",
    accountHref: "/login",
    primaryLabel: "Start Programme",
    primaryHref: "/program",
    xpLabel: null,
  });
  assert.deepEqual(accountNavigationFor({ authenticated: true }), {
    accountLabel: "My Programme",
    accountHref: "/program",
    primaryLabel: "My Programme",
    primaryHref: "/program",
    xpLabel: null,
  });
  assert.equal(accountNavigationFor({ authenticated: true, authoritativeXp: 330 }).xpLabel, "330 XP");
  assert.deepEqual(accountNavigationFor({ authenticated: false, programmePath: "/es/program" }), {
    accountLabel: "Log in",
    accountHref: "/login?returnTo=%2Fes%2Fprogram",
    primaryLabel: "Start Programme",
    primaryHref: "/es/program",
    xpLabel: null,
  });
  assert.deepEqual(accountNavigationFor({ authenticated: true, programmePath: "/fi/program" }), {
    accountLabel: "My Programme",
    accountHref: "/fi/program",
    primaryLabel: "My Programme",
    primaryHref: "/fi/program",
    xpLabel: null,
  });
});

test("desktop and mobile header actions render the shared account label with icon-only navigation controls", () => {
  const navigation = readFileSync("components/public-shell/PublicNavigation.tsx", "utf8");

  assert.match(navigation, /const primaryLabel = authenticated \? messages\.myProgramme : messages\.startProgramme/);
  assert.equal(navigation.match(/\{primaryLabel\}/g)?.length, 2);
  assert.doesNotMatch(navigation, />\s*Menu\s*</);
  assert.doesNotMatch(navigation, />\s*Close\s*</);
  assert.match(navigation, /\{messages\.openNavigation\}<\/span>/);
  assert.match(navigation, /\{messages\.closeNavigation\}<\/span>/);
  assert.match(navigation, /<details[^>]+data-public-mobile-disclosure/);
  assert.match(navigation, /<summary/);
  assert.match(navigation, /<MenuIcon \/>/);
  assert.match(navigation, /<CloseIcon \/>/);
  assert.match(navigation, /<MarketLanguageSelector/);
});

test("the mobile drawer leads with the acid Start Programme action, then Log in, Help and language (Founder, 25 September 2026)", () => {
  const navigation = readFileSync("components/public-shell/PublicNavigation.tsx", "utf8");
  const shell = readFileSync("components/public-shell/PublicShell.module.css", "utf8");
  const drawer = navigation.slice(navigation.indexOf('id="public-mobile-navigation"'), navigation.indexOf("</details>"));
  const order = [
    "className={styles.mobileRouteList}",
    "className={styles.mobileMenuPrimary}",
    "className={styles.mobileMenuLogin}",
    "className={styles.mobileHelp}",
    "<ProgrammeLanguageSelector",
    "<MarketLanguageSelector",
    "className={styles.dialogLegal}",
  ].map((marker) => {
    const position = drawer.indexOf(marker);
    assert.ok(position >= 0, `drawer is missing ${marker}`);
    return position;
  });
  assert.deepEqual([...order].sort((left, right) => left - right), order, "routes → Start Programme → Log in → Help → language → legal");
  // The account block stays outside the route <nav>, whose links are the canonical navigation order.
  assert.ok(drawer.indexOf("</nav>") < drawer.indexOf("className={styles.mobileMenuPrimary}"));
  // Labels and Programme-context behaviour are unchanged: Log in only for anonymous readers.
  assert.match(drawer, /\{authenticated \? messages\.openProgramme : primaryLabel\}/);
  assert.match(drawer, /\{!authenticated \? <Link className=\{styles\.mobileMenuLogin\} href=\{account\.accountHref\}>\{accountLabel\}<\/Link> : null\}/);
  assert.doesNotMatch(drawer, /className=\{styles\.primaryAction\}/, "the drawer no longer borrows the desktop outline button");

  // Every block whose selector list ends with this exact selector, joined.
  const rule = (selector: string) => [...shell.matchAll(new RegExp(`\\n${selector.replace(".", "\\.")} \\{([^}]*)\\}`, "g"))].map((match) => match[1]).join("\n");
  const primary = rule(".mobileMenuPrimary");
  for (const declaration of ["min-height: 52px", "width: 100%", "border-radius: var(--sb-radius-button)", "background: var(--shell-acid)", "color: var(--shell-night)", "font-size: 16px", "font-weight: 700", "text-transform: none"]) {
    assert.ok(primary.includes(declaration), `.mobileMenuPrimary needs ${declaration}`);
  }
  assert.match(shell, /\.mobileMenuPrimary:hover \{[^}]*background: var\(--shell-acid-hover\)/);
  const login = rule(".mobileMenuLogin");
  assert.ok(login.includes("font-size: 16px") && login.includes("min-height: 44px"), "Log in reads at 16px with a 44px target");
  assert.doesNotMatch(rule(".mobileAccount"), /margin: auto/, "the account block no longer sinks to the bottom of the drawer");
  // The language picker now ends the drawer: the focus loop must skip content of a closed <details>
  // (laid out under content-visibility but not focusable), or Tab from its summary leaves the dialog.
  const client = readFileSync("components/public-shell/PublicNavigationClient.tsx", "utf8");
  assert.match(client, /function insideClosedDetails\(element: HTMLElement\) \{\s*const closed = element\.closest\("details:not\(\[open\]\)"\);/);
  assert.match(client, /!element\.closest\("\[inert\]"\) && !insideClosedDetails\(element\)/);
  // The desktop header action keeps its outline look.
  assert.match(rule(".primaryAction"), /background: transparent;[\s\S]*border-radius: var\(--sb-radius-full\)|border-radius: var\(--sb-radius-full\);[\s\S]*background: transparent/);
});

test("the presentation selector applies one-tap choices with an accessible selected state", () => {
  const selector = readFileSync("components/public-shell/MarketLanguageSelector.tsx", "utf8");

  assert.match(selector, /<details[^>]+presentationDisclosure/);
  assert.match(selector, /<summary/);
  assert.match(selector, /aria-haspopup="menu"/);
  assert.match(selector, /role="menuitemradio"/);
  assert.match(selector, /aria-checked=\{selected\}/);
  assert.match(selector, /name="choice"/);
  assert.match(selector, /type="submit"/);
  assert.match(selector, /value="automatic"/);
  assert.doesNotMatch(selector, /<select|applyPreference/);
});

test("the public layout owns one landmark and reads only session-cookie presence", () => {
  const rootLayout = readFileSync("app/layout.tsx", "utf8");
  const publicLayout = readFileSync("app/(public)/layout.tsx", "utf8");
  const navigation = readFileSync("components/public-shell/PublicNavigation.tsx", "utf8");
  const navigationClient = readFileSync("components/public-shell/PublicNavigationClient.tsx", "utf8");

  assert.doesNotMatch(rootLayout, /<Header|<Footer|<main id="main-content"/);
  assert.match(publicLayout, /hasBetterAuthSessionCookie\(requestHeaders\)/);
  assert.doesNotMatch(publicLayout, /getServerSession/);
  assert.match(publicLayout, /<main id="main-content"/);
  assert.match(publicLayout, /kind: "rejected"/);
  assert.match(publicLayout, /kind: "timed-out"/);
  assert.match(navigationClient, /data-commercial-navigation-timed-out/);
  assert.doesNotMatch(navigationClient, /setInterval/);
  assert.doesNotMatch(navigation, /showModal\(\)/);
  assert.match(navigationClient, /event\.key === "Escape"/);
  assert.doesNotMatch(navigation + navigationClient, /location\.href|window\.open/);
});

test("the stable Footer does not reintroduce automatic speculative navigation", () => {
  const footer = readFileSync("components/public-shell/PublicFooter.tsx", "utf8");
  assert.equal((footer.match(/<Link\b/g) ?? []).length, (footer.match(/prefetch=\{false\}/g) ?? []).length);
});

test("availability states are generic presentation and do not claim live GEO authority", () => {
  const notice = readFileSync("components/public-shell/PublicAvailabilityNotice.tsx", "utf8");
  assert.match(notice, /Availability not confirmed/);
  assert.match(notice, /Commercial listings unavailable/);
  assert.match(notice, /commercial links remain hidden/);
  assert.doesNotMatch(notice, /country|location detected|your market is/iu);
});

test("About, FAQ and Methodology end with one next step; Help stays free of it", async () => {
  const { nextStepMessages } = await import("../lib/i18n/next-step-catalog");
  const block = readFileSync("components/next-step/TrustNextStep.tsx", "utf8");
  for (const [page, file] of [["about", "app/(public)/about/page.tsx"], ["faq", "app/(public)/faq/page.tsx"], ["methodology", "app/(public)/methodology/page.tsx"]] as const) {
    assert.match(readFileSync(file, "utf8"), new RegExp(`<TrustNextStep page="${page}" presentation=\\{presentation\\} />`), page);
  }
  for (const help of ["app/help/page.tsx", "app/help/[slug]/page.tsx"]) assert.doesNotMatch(readFileSync(help, "utf8"), /TrustNextStep/);
  // The Programme leads with the canonical entry; Best Offers follows only where offers may be presented.
  assert.match(block, /const programmeHref = `\$\{programmePathForPresentationLocale\(presentation\.locale\)\}\?entry=start`;/);
  assert.match(block, /data-trust-next-step-action="programme"[\s\S]*data-trust-next-step-action="best-offers"/);
  assert.match(block, /\{offers \? <Link[\s\S]*?href=\{productHref\(presentation, "\/best-offers"\)\}/);
  assert.match(block, /const offers = offersMayBePresented\(presentation\.marketCountryCode\);/);
  assert.doesNotMatch(block, /href="\/(?:r|go)\//);
  for (const locale of ["en-GB", "de-DE", "it-IT", "es-ES", "es-PE", "pt-PT", "el-GR", "nl-NL", "sv-SE", "da-DK", "fi-FI", "nb-NO", "en-CA", "fr-CA"] as const) {
    const messages = nextStepMessages(locale);
    for (const [key, value] of Object.entries(messages)) assert.ok(value.trim(), `${locale} ${key}`);
    assert.doesNotMatch(messages.body, /XP|private/i, `${locale} states no XP or privacy claim`);
  }
});

test("the transition pill and route frame reveal only on a slow transition; guide links raise no pill", () => {
  // Founder decision 25 Sep 2026: a quick transition shows no flash of the page name.
  const shell = readFileSync("components/public-shell/PublicShell.module.css", "utf8");
  const frame = readFileSync("components/public-shell/PublicRouteLoading.module.css", "utf8");
  assert.match(shell, /\.navigationFeedback \{[^}]*opacity: 0;[^}]*animation: navigationFeedbackReveal 160ms var\(--sb-ease-standard\) 700ms forwards;/);
  assert.match(frame, /\.heroInner,\s*\.contentInner \{[^}]*opacity: 0;[^}]*animation: routeFrameReveal 160ms var\(--sb-ease-standard\) 700ms forwards;/);
  // Long guide titles made long pills: "Read next" guide links report no pending label.
  assert.doesNotMatch(readFileSync("app/(public)/learn/[category]/[slug]/LearningArticleView.tsx", "utf8"), /PublicLinkPendingSignal/);
});

test("every link that leaves the page starts the top progress bar at once and holds it until the page is in place", async () => {
  // 4 Oct 2026: a tap that changed nothing for seconds (a slow Learn page, a cold server) read as a dead link.
  const { navigationClickTarget } = await import("../components/public-shell/navigation-progress");
  const here = "https://b4gamble.com/en/learn?category=payments#top";
  assert.equal(navigationClickTarget("/en/casinos", here), "/en/casinos");
  assert.equal(navigationClickTarget("https://b4gamble.com/en/learn?category=bonuses", here), "/en/learn?category=bonuses");
  assert.equal(navigationClickTarget("/r/example-casino", here), "/r/example-casino", "an outbound redirect still leaves this page");
  assert.equal(navigationClickTarget("#faq", here), null, "a same-page anchor moves nothing");
  assert.equal(navigationClickTarget("/en/learn?category=payments", here), null, "the current page is not a transition");
  assert.equal(navigationClickTarget("https://partner.example/offer", here), null, "another site gets the browser's own loading state");

  const feedback = readFileSync("components/public-shell/PublicNavigationFeedback.tsx", "utf8");
  assert.match(feedback, /window\.addEventListener\("click", onClick, true\)/, "capture: the bar starts before a Link or handoff page takes the click");
  assert.match(feedback, /event\.button !== 0 \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.shiftKey \|\| event\.altKey/);
  assert.match(feedback, /anchor\.hasAttribute\("download"\) \|\| \(anchor\.target && anchor\.target !== "_self"\)/);
  assert.match(feedback, /!document\.querySelector\("\[data-route-loading\]"\)/, "the bar outlasts the loading frame");
  assert.match(feedback, /const PROGRESS_GIVE_UP_MS = 30_000;/);
  assert.match(feedback, /<div aria-hidden="true" className=\{progressClassName\} data-navigation-progress=\{progress\} \/>/);
  assert.match(readFileSync("app/(public)/layout.tsx", "utf8"), /progressClassName=\{styles\.navigationProgress\}/);

  const shell = readFileSync("components/public-shell/PublicShell.module.css", "utf8");
  const bar = /\.navigationProgress \{([^}]*)\}/.exec(shell)?.[1] ?? "";
  assert.match(bar, /position: fixed;[\s\S]*top: 0;[\s\S]*pointer-events: none;/);
  assert.match(bar, /animation: navigationProgressRun 12s [^;]*forwards;/);
  assert.doesNotMatch(bar, /opacity: 0|\d+ms forwards/, "unlike the named pill, the bar has no reveal delay");
  // A handoff page's pill no longer gives up at 8 s while the next page is still on its way.
  assert.match(readFileSync("components/final-handoff/HandoffInteractions.tsx", "utf8"), /pendingNavigationLabel = "";\n\s*\}, 30_000\);/);
});

test("pages open instantly: destinations prefetch ahead of the click, never an outbound or tracked route", async () => {
  // Founder decision 4 Oct 2026: a page change takes 0.1–0.3 s; only a page already in the browser opens that fast.
  const { currentPageSettled, INTENT_PREFETCH_SELECTOR, prefetchTarget, PRIMARY_PREFETCH_SELECTOR } = await import("../components/public-shell/navigation-prefetch");
  const here = "https://b4gamble.com/en/learn/casino-safety/choosing-an-online-casino";
  assert.equal(prefetchTarget("/en/casinos", here), "/en/casinos");
  assert.equal(prefetchTarget("/en/learn?category=payments", here), "/en/learn?category=payments");
  for (const tracked of ["/r/example", "/go/example", "/t/abc", "/x/abc", "/ig/abc", "/fb/abc", "/threads/abc", "/lana/abc", "/api/public/bonuses", "/admin", "/outbound/example", "/en/outbound/example", "/unsubscribe/token", "/partner-preview/x"]) {
    assert.equal(prefetchTarget(tracked, here), null, tracked);
  }
  assert.equal(prefetchTarget(here, here), null, "the current page");
  assert.equal(prefetchTarget("https://partner.example/offer", here), null, "another site");
  assert.equal(PRIMARY_PREFETCH_SELECTOR, "a[data-navigation-href]");
  for (const selector of ["a[data-navigation-href]", "a[data-footer-navigation-href]", "a[data-learn-offer-bridge-link]", "a[data-learn-category]", "a[data-intent-prefetch]"]) {
    assert.ok(INTENT_PREFETCH_SELECTOR.includes(selector), selector);
  }
  const documentWith = (readyState: string, busy: boolean) => ({ readyState, querySelector: () => (busy ? {} : null) }) as unknown as Document;
  assert.equal(currentPageSettled(documentWith("complete", false)), true);
  assert.equal(currentPageSettled(documentWith("interactive", false)), false, "the current page is still loading");
  assert.equal(currentPageSettled(documentWith("complete", true)), false, "a frame or pending commercial navigation is still on the page");

  const feedback = readFileSync("components/public-shell/PublicNavigationFeedback.tsx", "utf8");
  assert.match(feedback, /prefetchAll\(document, PRIMARY_PREFETCH_SELECTOR\)/, "primary destinations load once the page settles");
  assert.match(feedback, /window\.requestIdleCallback\(run, \{ timeout: 1_000 \}\)/);
  assert.match(feedback, /if \(!currentPageSettled\(document\)\) return;/, "no prefetch competes with the current page");
  assert.match(feedback, /event\.pointerType !== "mouse"/, "a finger scrolling across links is not hover intent");
  assert.match(feedback, /document\.addEventListener\("touchstart", onTouchStart, \{ passive: true \}\)/);
  assert.match(feedback, /disclosure\.matches\("\[data-public-mobile-disclosure\]"\)/, "the drawer loads its links as it opens");
  assert.match(readFileSync("components/analytics/TrackedReviewLink.tsx", "utf8"), /data-intent-prefetch=""/);
  // Links themselves keep prefetch={false}: no viewport fan-out across lists of casinos.
  assert.match(readFileSync("components/analytics/TrackedReviewLink.tsx", "utf8"), /prefetch=\{false\}/);
});

test("redesigned pages load behind a dark frame cut like them; Home keeps its frame", () => {
  // 4 Oct 2026: the 17 Sep frame (dark band over cream columns) flashed the old design before the dark pages.
  const frame = readFileSync("components/public-shell/PublicRouteLoadingFrame.tsx", "utf8");
  const css = readFileSync("components/public-shell/PublicRouteLoading.module.css", "utf8");
  assert.match(frame, /const dark = destination !== "home";/);
  assert.match(frame, /data-frame-theme=\{dark \? "dark" : "classic"\}/);
  assert.match(frame, /data-nav-theme=\{dark \? "dark" : "cream"\}/);
  assert.match(frame, /\{dark \? \(\s*<div className=\{styles\.cards\}>/);
  assert.doesNotMatch(frame, /<h1/);
  assert.match(css, /\.page\[data-frame-theme="dark"\] \{[^}]*background: var\(--sb-night\);/);
  assert.match(css, /\.page\[data-frame-theme="dark"\] \.content \{[^}]*background: var\(--sb-night\);/);
  assert.match(css, /\.page\[data-frame-theme="dark"\] \.hero \.title \{[^}]*font-size: clamp\(44px, 5\.6vw, 88px\);/);
  assert.match(css, /\.cards > span \{[^}]*background: var\(--sb-surface-card\);/);
});

test("language menus name languages from one fixed table, never from the browser's ICU", async () => {
  // Safari names languages differently from Node ("Engelska" vs "engelska"), so client-side
  // Intl.DisplayNames made React discard every Swedish and Danish page on iPhone (#418).
  for (const file of ["components/public-shell/MarketLanguageSelector.tsx", "components/programme/ProgrammeLanguageSelector.tsx"]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /Intl\.DisplayNames/, file);
    assert.match(source, /@\/lib\/i18n\/language-display-names/, file);
  }
  const { LANGUAGE_DISPLAY_NAMES, REGION_DISPLAY_NAMES, languageDisplayName, regionDisplayName } = await import("../lib/i18n/language-display-names");
  const languages = ["en", "de", "es", "el", "sv", "da", "it", "pt", "nl", "fi", "nb", "fr"];
  for (const display of languages) {
    const names: Record<string, string> = (LANGUAGE_DISPLAY_NAMES as Record<string, Record<string, string>>)[display] ?? {};
    for (const language of languages) assert.ok(names[language]?.trim(), `${display}:${language}`);
    assert.ok(Object.keys((REGION_DISPLAY_NAMES as Record<string, Record<string, string>>)[display] ?? {}).length >= 11, display);
  }
  assert.equal(languageDisplayName("en-GB", "sv-SE"), "Engelska");
  assert.equal(languageDisplayName("nb-NO", "da-DK"), "Norsk bokmål");
  assert.equal(languageDisplayName("sv-SE", "xx-YY"), "Swedish");
  assert.equal(regionDisplayName("SE", "de-DE"), "Schweden");
});

test("the privacy choice sits above a visible sticky partner or start bar instead of covering it", () => {
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /:root:has\(\[data-casino-decision-bar\]\[data-mobile-visible="true"\]\) \.analyticsConsent \{ bottom: calc\(80px \+ env\(safe-area-inset-bottom\)\); \}/);
  assert.match(css, /:root:has\(\[data-ten-steps-sticky-start\]\[data-mobile-visible="true"\]\) \.analyticsConsent \{ bottom: calc\(84px \+ env\(safe-area-inset-bottom\)\); \}/);
  assert.match(readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8"), /data-casino-decision-bar data-mobile-visible="false"/);
  assert.match(readFileSync("app/(public)/10-steps/TenStepsPage.tsx", "utf8"), /data-mobile-visible="false" data-ten-steps-sticky-start/);
});
