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
