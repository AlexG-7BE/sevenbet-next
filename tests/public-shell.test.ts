import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  PUBLIC_NAVIGATION,
  accountNavigationFor,
  classifyShellRoute,
} from "../lib/public-shell";

test("public navigation follows the approved Figma information architecture", () => {
  assert.deepEqual(PUBLIC_NAVIGATION, [
    { label: "Best Offers", href: "/best-offers", commercial: true },
    { label: "Casinos", href: "/casinos", commercial: true },
    { label: "Bonuses", href: "/bonuses", commercial: true },
    { label: "Learn", href: "/learn" },
  ]);
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
  assert.match(navigation, /aria-label=\{messages\.openNavigation\}/);
  assert.match(navigation, /aria-label=\{messages\.closeNavigation\}/);
  assert.match(navigation, /<MenuIcon \/>/);
  assert.match(navigation, /<CloseIcon \/>/);
  assert.match(navigation, /<MarketLanguageSelector/);
});

test("the presentation selector applies one-tap choices with an accessible selected state", () => {
  const selector = readFileSync("components/public-shell/MarketLanguageSelector.tsx", "utf8");

  assert.match(selector, /aria-expanded=\{open\}/);
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

  assert.doesNotMatch(rootLayout, /<Header|<Footer|<main id="main-content"/);
  assert.match(publicLayout, /hasBetterAuthSessionCookie\(requestHeaders\)/);
  assert.doesNotMatch(publicLayout, /getServerSession/);
  assert.match(publicLayout, /<main id="main-content"/);
  assert.match(navigation, /showModal\(\)/);
  assert.match(navigation, /event\.key === "Escape"/);
  assert.doesNotMatch(navigation, /location\.href|window\.open/);
});

test("availability states are generic presentation and do not claim live GEO authority", () => {
  const notice = readFileSync("components/public-shell/PublicAvailabilityNotice.tsx", "utf8");
  assert.match(notice, /Availability not confirmed/);
  assert.match(notice, /Commercial listings unavailable/);
  assert.match(notice, /commercial links remain hidden/);
  assert.doesNotMatch(notice, /country|location detected|your market is/iu);
});
