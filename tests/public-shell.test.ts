import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  GUIDE_NAVIGATION,
  PUBLIC_NAVIGATION,
  accountNavigationFor,
  classifyShellRoute,
  commercialDestinationsNavigable,
  leadsToCurrentProgrammePage,
  publicCommercialDestinationVisible,
  publicNavigationForCommercialState,
} from "../lib/public-shell";
import { isResearchSectionRoute } from "../lib/research-access";
import { ORGANIZATION_PROFILES } from "../lib/seo/structured-data";
import { BRAND_SOCIAL_PROFILES } from "../lib/social/brand-profiles";

test("public navigation follows the approved Figma information architecture", () => {
  assert.deepEqual(PUBLIC_NAVIGATION, [
    { label: "Best Offers", href: "/best-offers", commercial: true },
    { label: "Casinos", href: "/casinos", commercial: true },
    { label: "Bonuses", href: "/bonuses", commercial: true },
    { label: "Learn", href: "/learn" },
  ]);
});

test("research links reach a reader only inside the research section (Founder, 10 and 16 October 2026)", () => {
  for (const path of ["/best-offers", "/casinos", "/casinos?page=2", "/casino/playojo", "/bonuses", "/compare", "/bonus-guide", "/wagering-calculator", "/outbound/unavailable"]) {
    assert.equal(isResearchSectionRoute(path), true, path);
  }
  // Everywhere else, the Programme's own pages included, every reader sees the guide links instead.
  for (const path of ["/", "/10-steps", "/learn", "/learn/casino-bonuses/wagering-requirements", "/help", "/about", "/faq", "/methodology", "/program", "/program/missing", "/responsible-gambling", "/tools/budget-calculator", "/casino-guide", "/bonuses-explained"]) {
    assert.equal(isResearchSectionRoute(path), false, path);
  }
  assert.deepEqual(GUIDE_NAVIGATION, [
    { label: "10 Steps", href: "/10-steps" },
    { label: "Help", href: "/help", safety: true },
  ]);
  // The Programme opens nothing: the contract has no lesson flag, cookie, event or browser note.
  const contract = readFileSync("lib/research-access.ts", "utf8");
  assert.doesNotMatch(contract, /^import /m, "the contract imports nothing");
  assert.deepEqual([...contract.matchAll(/^export (?:const|function) (\w+)/gm)].map((match) => match[1]), ["isResearchSectionRoute"]);
  assert.doesNotMatch(contract.replace(/\/\*[\s\S]*?\*\//g, ""), /cookie|localStorage|addEventListener|b4g_research/i);
});

test("the menu chooses its door in the browser, from the current path alone", () => {
  const client = readFileSync("components/public-shell/PublicNavigationClient.tsx", "utf8");
  const navigation = readFileSync("components/public-shell/PublicNavigation.tsx", "utf8");
  const footer = readFileSync("components/public-shell/PublicFooter.tsx", "utf8");
  const header = readFileSync("components/public-shell/PublicHeader.tsx", "utf8");
  const shell = readFileSync("components/public-shell/PublicShell.module.css", "utf8");
  const publicLayout = readFileSync("app/(public)/layout.tsx", "utf8");
  const programmeLayout = readFileSync("app/program/layout.tsx", "utf8");

  // A layout is not rendered again when the page changes, so the door cannot be a server decision.
  const door = client.slice(client.indexOf("export function PublicNavigationDoor("), client.indexOf("export function PublicNavigationRouteLink("));
  assert.ok(door.includes("const research = isResearchSectionRoute(stripPublicMarketPrefix(pathname));"));
  assert.ok(door.includes('return research === (door === "research") ? <>{children}</> : null;'));
  assert.doesNotMatch(client, /document\.cookie|researchAccess|b4g:research-access|b4g_research|PublicResearchNewMark/);

  // Desktop list and drawer: every commercial item sits behind the research door, 10 Steps and Help behind the guide door.
  assert.equal(navigation.match(/"commercial" in item\s*\? <PublicNavigationDoor door="research"/g)?.length, 2);
  assert.equal(navigation.match(/<PublicNavigationDoor door="research"/g)?.length, 3, "desktop, drawer and the streamed Best Offers/Bonuses item");
  assert.equal(navigation.match(/<PublicNavigationDoor door="guide"/g)?.length, 1);
  const desktop = navigation.slice(navigation.indexOf("className={styles.primaryNavigation}"), navigation.indexOf("className={styles.accountNavigation}"));
  assert.ok(desktop.indexOf('{leadingGuideNavigation.map((item) => guideLink(item, "desktop"))}') >= 0);
  assert.ok(desktop.indexOf('{leadingGuideNavigation.map((item) => guideLink(item, "desktop"))}') < desktop.indexOf("{PUBLIC_NAVIGATION.map("));
  assert.ok(desktop.indexOf("{PUBLIC_NAVIGATION.map(") < desktop.indexOf('{trailingGuideNavigation.map((item) => guideLink(item, "desktop"))}'), "10 Steps · Learn · Help");
  const drawer = navigation.slice(navigation.indexOf('id="public-mobile-navigation"'), navigation.indexOf("</details>"));
  assert.ok(drawer.includes('{leadingGuideNavigation.map((item) => guideLink(item, "mobile"))}'));
  assert.ok(!drawer.includes("trailingGuideNavigation"), "Help keeps its own block in the drawer");

  assert.ok(footer.includes('const researchLinks = new Set(["/best-offers", "/casinos", "/bonuses"]);'));
  assert.equal(footer.match(/<PublicNavigationDoor door="research"/g)?.length, 2);

  // Nothing reads or passes a lesson flag any more, and the week-long mark is gone.
  for (const source of [navigation, footer, header, publicLayout, programmeLayout]) {
    assert.doesNotMatch(source, /researchAccess|from "@\/lib\/research-access"|PublicResearchNewMark/);
  }
  assert.doesNotMatch(shell, /data-research-new/);
});

test("only the menu's door reads the research contract, and no Programme answer sets a menu cookie", () => {
  const sources = (root: string) => (readdirSync(root, { recursive: true }) as string[])
    .filter((name) => /\.(?:tsx|ts)$/.test(name))
    .map((name) => `${root}/${name}`);
  const readers = ["app", "components", "lib"].flatMap(sources)
    .filter((path) => readFileSync(path, "utf8").includes('from "@/lib/research-access"'))
    .sort();
  assert.deepEqual(readers, ["components/public-shell/PublicNavigationClient.tsx"]);

  assert.doesNotMatch(readFileSync("lib/programme/http.ts", "utf8"), /research|withResearchAccess|withoutResearchAccess/i);
  for (const route of [
    "app/api/program/program-ai/home/route.ts",
    "app/api/program/program-ai/claims/redeem/route.ts",
    "app/api/program/program-ai/missions/[missionNumber]/actions/route.ts",
    "app/api/program/program-ai/missions/[missionNumber]/complete/route.ts",
    "app/api/program/session/route.ts",
  ]) {
    assert.doesNotMatch(readFileSync(route, "utf8"), /ResearchAccess|research/i, route);
  }
  assert.doesNotMatch(readFileSync("lib/programme/application/programme-ai-missions.service.ts", "utf8"), /researchAccess|discoveryLinks|commercialDiscoveryLinks/);
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
  // A signed-in person gets Log out on the same line (Founder, 12 October 2026).
  assert.match(drawer, /\{authenticated \? messages\.openProgramme : primaryLabel\}/);
  assert.match(drawer, /<PublicMobileAccountLine\s+authenticated=\{authenticated\}\s+className=\{styles\.mobileMenuLogout\}\s+labels=\{\{ logOut: messages\.logOut, loggingOut: messages\.loggingOut, logOutRetry: messages\.logOutRetry \}\}\s+login=\{<Link className=\{styles\.mobileMenuLogin\} href=\{account\.accountHref\}>\{accountLabel\}<\/Link>\}\s+programmeHref=\{account\.primaryHref\}\s+\/>/);
  assert.equal(drawer.match(/mobileMenuLogin\b/g)?.length, 1, "Log in is offered once, through the account line");
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
  const logout = rule(".mobileMenuLogout");
  assert.ok(logout.includes("font-size: 16px") && logout.includes("min-height: 44px") && logout.includes("width: 100%"), "Log out reads at 16px with a full-width 44px target");
  assert.doesNotMatch(rule(".mobileAccount"), /margin: auto/, "the account block no longer sinks to the bottom of the drawer");
  // The language picker now ends the drawer: the focus loop must skip content of a closed <details>
  // (laid out under content-visibility but not focusable), or Tab from its summary leaves the dialog.
  const client = readFileSync("components/public-shell/PublicNavigationClient.tsx", "utf8");
  assert.match(client, /function insideClosedDetails\(element: HTMLElement\) \{\s*const closed = element\.closest\("details:not\(\[open\]\)"\);/);
  assert.match(client, /!element\.closest\("\[inert\]"\) && !insideClosedDetails\(element\)/);
  // The desktop header action keeps its outline look.
  assert.match(rule(".primaryAction"), /background: transparent;[\s\S]*border-radius: var\(--sb-radius-full\)|border-radius: var\(--sb-radius-full\);[\s\S]*background: transparent/);
});

// Founder walk on a phone, 12 October 2026: the Programme home hid its log-out button and the menu had none.
test("a signed-in person logs out from the menu: one place on a phone, the Programme's own sign-out steps", async () => {
  const client = readFileSync("components/public-shell/PublicNavigationClient.tsx", "utf8");
  const line = client.slice(client.indexOf("export function PublicMobileAccountLine("), client.indexOf("export function PublicMobileNavigationEnhancement("));
  // A visitor keeps Log in; the cookie the document was rendered with, or an account the Programme
  // has shown since, turns the line into Log out.
  assert.match(line, /const knownUserId = useSyncExternalStore\(subscribeSignedInUser, signedInUser, \(\) => null\);/);
  assert.match(line, /if \(!authenticated && !knownUserId\) return <>\{login\}<\/>;/);
  assert.match(line, /<button className=\{className\} data-public-log-out="" disabled=\{state === "busy"\} onClick=\{logOut\} type="button">/);
  assert.match(line, /state === "busy" \? labels\.loggingOut : state === "failed" \? labels\.logOutRetry : labels\.logOut/);
  // The sign-out code (and the account client behind it) loads on the press, not with every public page.
  assert.match(line, /const \{ signOutOfB4gamble \} = await import\("@\/lib\/auth\/sign-out-client"\);\s*await signOutOfB4gamble\(knownUserId\);/);
  assert.doesNotMatch(client, /from "@\/lib\/auth\/(?:client|sign-out-client)"/, "the public menu does not ship the account client");
  assert.match(line, /if \(window\.location\.pathname === programmeHref\) window\.location\.assign\(programmeHref\);\s*else window\.location\.reload\(\);/);

  // One sequence for the menu and the Programme's own button: the Programme session first, then the
  // account session, then this tab's access notes.
  const signOut = readFileSync("lib/auth/sign-out-client.ts", "utf8");
  const order = [
    'await fetch("/api/program/session", {',
    'if (!transition.ok) throw new Error("Subject transition failed");',
    "const result = await authClient.signOut();",
    'if (result.error) throw new Error("Sign out failed");',
    "clearProgrammeAccessAuthority(window.sessionStorage, userProgrammeSubject(userId));",
    "clearProgrammeAccessContinuation(window.sessionStorage);",
    "clearProgrammeOAuthClaimMarker(window.sessionStorage);",
    "rotateAnonymousProgrammeSubject(window.sessionStorage);",
  ].map((step) => {
    assert.ok(signOut.includes(step), step);
    return signOut.indexOf(step);
  });
  assert.deepEqual([...order].sort((left, right) => left - right), order);
  assert.match(signOut, /method: "DELETE"/);
  assert.match(signOut, /const userId = knownUserId \?\? \(await authClient\.getSession\(\)\)\.data\?\.user\.id \?\? null;/, "the menu asks whose session it is only when the page does not know");
  const programmeHeader = readFileSync("components/programme/ProgramAiAuthenticatedHeader.tsx", "utf8");
  assert.match(programmeHeader, /await signOutOfB4gamble\(userId\);\s*window\.location\.assign\(programmePath\);/);
  assert.match(programmeHeader, /useEffect\(\(\) => \{\s*noteSignedInUser\(userId\);\s*\}, \[userId\]\);/, "a sign-in without a new document still gives the menu its Log out line");

  const { noteSignedInUser, signedInUser, subscribeSignedInUser } = await import("../lib/auth/signed-in-signal");
  assert.equal(signedInUser(), null);
  let heard = 0;
  const unsubscribe = subscribeSignedInUser(() => { heard += 1; });
  noteSignedInUser("user-one");
  noteSignedInUser("user-one");
  assert.equal(signedInUser(), "user-one");
  assert.equal(heard, 1, "the same account is announced once");
  unsubscribe();
  noteSignedInUser("user-two");
  assert.equal(heard, 1);

  // On a phone the Programme home's own row is gone, so the menu is the one place to log out.
  const programmeCss = readFileSync("components/programme/ProgramAiAuthenticated.module.css", "utf8");
  const phone = programmeCss.slice(programmeCss.indexOf("@media (max-width: 600px) {"), programmeCss.indexOf("@media (prefers-reduced-motion: reduce) {\n  .shell *"));
  assert.match(phone, /\.dashboardShell \.header\[data-dashboard-header\] \{ display: none; \}/);
  assert.doesNotMatch(phone, /\.logout[^{]*\{ display: none; \}/, "no rule hides the button alone and leaves an empty row");

  // Every shell language names the action, in the Programme's own words where the Programme has them.
  const { publicShellMessages } = await import("../lib/i18n/public-shell-catalog");
  const { programmeText } = await import("../lib/i18n/programme-catalog");
  const { PROGRAMME_LOCALES } = await import("../lib/programme/presentation");
  for (const locale of [...PROGRAMME_LOCALES, "es-PE", "en-CA", "fr-CA"] as const) {
    const shellMessages = publicShellMessages(locale);
    for (const label of [shellMessages.logOut, shellMessages.loggingOut, shellMessages.logOutRetry]) assert.ok(label.trim(), locale);
    assert.notEqual(shellMessages.logOut, shellMessages.logIn, locale);
  }
  for (const locale of PROGRAMME_LOCALES) {
    const shellMessages = publicShellMessages(locale);
    assert.equal(shellMessages.logOut, programmeText(locale, "Log out"), locale);
    assert.equal(shellMessages.loggingOut, programmeText(locale, "Logging out…"), locale);
    assert.equal(shellMessages.logOutRetry, programmeText(locale, "Try log out"), locale);
  }
  assert.equal(publicShellMessages("sv-SE").logOut, "Logga ut");
  assert.notEqual(publicShellMessages("fr-CA").logOut, publicShellMessages("en-GB").logOut);
});

test("the header does not offer Start Programme on the page it leads to; a signed-in footer says My Programme", () => {
  const navigation = readFileSync("components/public-shell/PublicNavigation.tsx", "utf8");
  // Both header buttons (desktop and phone) step aside for a visitor who is already there. The
  // drawer keeps its primary action, and a signed-in person keeps "My Programme" in the header.
  assert.equal(navigation.match(/hiddenOnDestination=\{!authenticated\} href=\{account\.primaryHref\}>\{primaryLabel\}/g)?.length, 2);
  assert.equal(navigation.match(/hiddenOnDestination/g)?.length, 2);
  assert.match(navigation, /className=\{styles\.mobileMenuPrimary\} href=\{account\.primaryHref\}>/);
  const client = readFileSync("components/public-shell/PublicNavigationClient.tsx", "utf8");
  const action = client.slice(client.indexOf("export function PublicProgrammeActionLink("), client.indexOf("export function PublicMobileAccountLine("));
  assert.match(action, /hiddenOnDestination = false,/);
  assert.match(action, /const pathname = usePathname\(\);/);
  assert.match(action, /if \(hiddenOnDestination && leadsToCurrentProgrammePage\(pathname, href\)\) return null;/);
  // The browser sees the address itself; the server renders a localized Programme page under the
  // path it is rewritten to. Both must agree, or the first HTML would carry the button.
  assert.equal(leadsToCurrentProgrammePage("/sv/program", "/sv/program"), true, "in the browser");
  assert.equal(leadsToCurrentProgrammePage("/program", "/sv/program"), true, "on the server, under the rewritten path");
  assert.equal(leadsToCurrentProgrammePage("/program", "/program"), true, "the English Programme");
  for (const elsewhere of ["/sv", "/sv/10-steps", "/10-steps", "/sv/casinos", "/sv/program/missing", "/program/missing", "/login"]) {
    assert.equal(leadsToCurrentProgrammePage(elsewhere, "/sv/program"), false, elsewhere);
  }
  assert.equal(leadsToCurrentProgrammePage("/program", "/login?returnTo=%2Fsv%2Fprogram"), false);

  const footer = readFileSync("components/public-shell/PublicFooter.tsx", "utf8");
  assert.match(footer, /\[authenticated \? shell\.myProgramme : shell\.startProgramme, "\/program"\]/);
  assert.match(footer, /authenticated = false,/);
  assert.match(readFileSync("app/program/layout.tsx", "utf8"), /<PublicFooter authenticated=\{authenticated\}/);
  assert.match(readFileSync("app/(public)/layout.tsx", "utf8"), /<PublicFooter\s+authenticated=\{authenticated\}/);
});

test("the language notice ends with the visitor's region in the public menu and in the Programme's", async () => {
  // The sentence ends with a colon in every language, so each menu that prints it prints the region after it.
  // On Programme pages the drawer printed the sentence alone (Founder walk, 12 October 2026).
  const { publicShellMessages } = await import("../lib/i18n/public-shell-catalog");
  const { PROGRAMME_LOCALES } = await import("../lib/programme/presentation");
  for (const locale of [...PROGRAMME_LOCALES, "es-PE", "en-CA", "fr-CA"] as const) {
    assert.match(publicShellMessages(locale).presentationOnlyNotice, /\s?:$/, locale);
  }
  const publicSelector = readFileSync("components/public-shell/MarketLanguageSelector.tsx", "utf8");
  assert.match(publicSelector, /\{messages\.presentationOnlyNotice\} <strong>\{presentation\.marketDisplayName\}<\/strong>/);
  const programmeSelector = readFileSync("components/programme/ProgrammeLanguageSelector.tsx", "utf8");
  assert.match(programmeSelector, /\{variant === "mobile" \? <p>\{messages\.presentationOnlyNotice\} <strong>\{region\}<\/strong><\/p> : null\}/);
  assert.equal(programmeSelector.match(/presentationOnlyNotice/g)?.length, 1, "the sentence is never printed without the region");
  const navigation = readFileSync("components/public-shell/PublicNavigation.tsx", "utf8");
  assert.equal(navigation.match(/<ProgrammeLanguageSelector locale=\{programme\.locale\} messages=\{messages\} region=\{presentation\.marketDisplayName\} variant="(?:desktop|mobile)" \/>/g)?.length, 2);
  assert.match(readFileSync("components/public-shell/PublicShell.module.css", "utf8"), /\.mobilePresentationSelector p strong \{ color: var\(--shell-white\); font-weight: 600; \}/);
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

test("the footer notice block is hidden from every visitor and kept whole (Founder, 11 October 2026)", () => {
  const compliance = readFileSync("components/footer-compliance/FooterCompliance.tsx", "utf8");
  const footer = readFileSync("components/public-shell/PublicFooter.tsx", "utf8");
  const start = readFileSync("app/start/StartShell.tsx", "utf8");
  const catalog = readFileSync("lib/i18n/public-shell-catalog.ts", "utf8");

  // One switch, and the component renders nothing before it builds anything.
  assert.ok(compliance.includes("export const FOOTER_COMPLIANCE_VISIBLE: boolean = false;"));
  const body = compliance.slice(compliance.indexOf("export function FooterCompliance("));
  assert.ok(body.indexOf("if (!FOOTER_COMPLIANCE_VISIBLE) return null;") > 0);
  assert.ok(body.indexOf("if (!FOOTER_COMPLIANCE_VISIBLE) return null;") < body.indexOf("const external ="));

  // Nothing is deleted: both footers still mount it, the four lines are still written and translated.
  assert.ok(footer.includes('<FooterCompliance footer={footer} localHelpHref={localizedHref("/help")} />'));
  assert.ok(start.includes("<FooterCompliance footer={footer} showAge={false} />"));
  for (const marker of ["data-footer-age", "data-footer-licensed-links", "data-footer-support", "data-footer-entity"]) {
    assert.ok(compliance.includes(marker), marker);
  }
  for (const key of ["ageNotice", "licensedLinks", "supportLead", "entity"]) {
    assert.equal(catalog.match(new RegExp(`^    ${key}: "`, "gm"))?.length, 15, `${key} stays in every footer language`);
  }
  // The block carried the rule above the legal links; while it is hidden the baseline carries it.
  assert.ok(readFileSync("components/public-shell/PublicShell.module.css", "utf8")
    .includes(".footerColumns + .footerBaseline { padding: 24px 0; border-top: 1px solid rgba(250, 250, 247, .15); }"));
  // What the footer still tells every visitor.
  assert.ok(footer.includes("{footer.description}<br />{footer.operatorDisclaimer}"));
  assert.ok(footer.includes("<p className={styles.footerCommission}>{footer.commissionDisclosure}</p>"));
});

test("the footer links to the brand's five social profiles and the schema names the same accounts (Founder, 11 October 2026)", () => {
  const footer = readFileSync("components/public-shell/PublicFooter.tsx", "utf8");
  const links = readFileSync("components/public-shell/BrandSocialLinks.tsx", "utf8");
  const catalog = readFileSync("lib/i18n/public-shell-catalog.ts", "utf8");
  const styles = readFileSync("components/public-shell/PublicShell.module.css", "utf8");

  assert.deepEqual(BRAND_SOCIAL_PROFILES.map((profile) => [profile.network, profile.href]), [
    ["instagram", "https://www.instagram.com/b4gamble.c0m"],
    ["youtube", "https://www.youtube.com/@b4gamble"],
    ["x", "https://x.com/b4gamble"],
    ["facebook", "https://www.facebook.com/b4gamble"],
    ["threads", "https://www.threads.com/@b4gamble.c0m"],
  ]);
  // One list: the Organization schema opens with exactly the footer's accounts, and the retired handle is gone.
  assert.deepEqual(ORGANIZATION_PROFILES.slice(0, BRAND_SOCIAL_PROFILES.length), BRAND_SOCIAL_PROFILES.map((profile) => profile.href));
  assert.ok(!ORGANIZATION_PROFILES.some((profile) => profile.includes("b4gamble_com")));

  // The row sits under the brand description in the one shared footer.
  assert.ok(footer.includes("<p>{footer.description}<br />{footer.operatorDisclaimer}</p>\n            <BrandSocialLinks label={footer.social} opensInNewTab={footer.opensInNewTab} />"));
  // Each icon opens a new tab and has a name a screen reader can say.
  assert.ok(links.includes('rel="me noopener noreferrer" target="_blank"'));
  assert.ok(links.includes('<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">'));
  assert.ok(links.includes('<span className="srOnly">{profile.name} {opensInNewTab}</span>'));
  assert.equal(catalog.match(/^    social: "/gm)?.length, 15, "the row is labelled in every footer language");
  // 44px targets on phones.
  assert.ok(styles.includes("  .footerSocial a { width:44px; height:44px; }"));

  // /start has no way out of the landing and Help stays about help: neither carries the row.
  for (const file of ["app/start/StartShell.tsx", "components/protected-help/ProtectedHelpShell.tsx"]) {
    const source = readFileSync(file, "utf8");
    assert.ok(!source.includes("BrandSocialLinks") && !source.includes("brand-profiles"), file);
  }
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
  const { currentPageSettled, INTENT_PREFETCH_SELECTOR, leadsIntoProgramme, opensWithDocumentLoad, prefetchTarget, PRIMARY_PREFETCH_SELECTOR } = await import("../components/public-shell/navigation-prefetch");
  const here = "https://b4gamble.com/en/learn/casino-safety/choosing-an-online-casino";
  assert.equal(prefetchTarget("/en/casinos", here), "/en/casinos");
  assert.equal(prefetchTarget("/en/learn?category=payments", here), "/en/learn?category=payments");
  for (const tracked of ["/r/example", "/go/example", "/t/abc", "/x/abc", "/ig/abc", "/fb/abc", "/threads/abc", "/lana/abc", "/api/public/bonuses", "/admin", "/outbound/example", "/en/outbound/example", "/unsubscribe/token", "/partner-preview/x"]) {
    assert.equal(prefetchTarget(tracked, here), null, tracked);
  }
  assert.equal(prefetchTarget(here, here), null, "the current page");
  assert.equal(prefetchTarget("https://partner.example/offer", here), null, "another site");
  // Founder decision 11 Oct 2026: the Programme opens without a document load, so it loads ahead too.
  assert.equal(PRIMARY_PREFETCH_SELECTOR, "a[data-navigation-href], a[data-programme-entry]");
  for (const selector of ["a[data-navigation-href]", "a[data-programme-entry]", "a[data-footer-navigation-href]", "a[data-learn-offer-bridge-link]", "a[data-learn-category]", "a[data-intent-prefetch]"]) {
    assert.ok(INTENT_PREFETCH_SELECTOR.includes(selector), selector);
  }
  assert.equal(prefetchTarget("/program", here), "/program");
  assert.equal(prefetchTarget("/de/program?entry=start", here), "/de/program?entry=start");
  assert.equal(leadsIntoProgramme("/program?entry=start", here), true, "any link into the Programme loads on intent");
  assert.equal(leadsIntoProgramme("/sv/program", here), true);
  assert.equal(leadsIntoProgramme("/en/learn", here), false);
  assert.equal(leadsIntoProgramme("/en/learn", "https://b4gamble.com/program"), false, "the Programme itself prefetches nothing");
  assert.equal(leadsIntoProgramme("https://partner.example/program", here), false);
  assert.equal(opensWithDocumentLoad("/program", here, "en-GB"), false);
  assert.equal(opensWithDocumentLoad("/program", "https://b4gamble.com/de/learn", "de-DE"), true, "a link that loads a document is not prefetched");
  assert.equal(opensWithDocumentLoad("/en/casinos", here, "en-GB"), false);
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
  assert.match(feedback, /opensWithDocumentLoad\(anchor\.href, window\.location\.href, document\.documentElement\.lang\)/, "nothing is fetched for a link that loads a document");
  assert.match(feedback, /leadsIntoProgramme\(anchor\.href, window\.location\.href\)/);
  const programmeAction = readFileSync("components/public-shell/PublicNavigationClient.tsx", "utf8");
  assert.match(programmeAction, /data-programme-entry=\{isProgrammeHref \? "" : undefined\} href=\{href\} prefetch=\{false\}/, "the header and drawer Programme button is a primary destination");
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

test("the footer links the pages that had no internal link: pause plan, family and friends, statistics, creators (Founder, 15 October 2026)", () => {
  const footer = readFileSync("components/public-shell/PublicFooter.tsx", "utf8");
  const catalog = readFileSync("lib/i18n/public-shell-catalog.ts", "utf8");
  for (const [key, href] of [["pausePlan", "/pause-plan"], ["beside", "/beside"], ["pauseStatistics", "/pause-statistics"], ["gamblingControl", "/gambling-control"], ["forCreators", "/for-creators"]]) {
    assert.ok(footer.includes(`[footer.${key}, "${href}"]`), `${href} is a footer link`);
    assert.equal(catalog.match(new RegExp(`^    ${key}: "`, "gm"))?.length, 15, `${key} is labelled in every footer language`);
  }
  // The desktop Home footer keeps its height: its screen paging measures it.
  assert.ok(footer.includes('const extraLinks = new Set(["/pause-plan", "/beside", "/pause-statistics", "/gambling-control", "/for-creators"]);'));
  assert.ok(readFileSync("components/public-shell/PublicShell.module.css", "utf8").includes(":global(html:has([data-home-snap])) .footerExtra { display: none; }"));
});
