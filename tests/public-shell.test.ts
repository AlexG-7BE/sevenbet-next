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
});

test("desktop and mobile header actions render the shared account label with icon-only navigation controls", () => {
  const navigation = readFileSync("components/public-shell/PublicNavigation.tsx", "utf8");

  assert.doesNotMatch(navigation, /authenticated\s*\?\s*["']My Programme["']\s*:\s*account\.primaryLabel/);
  assert.equal(navigation.match(/\{account\.primaryLabel\}/g)?.length, 2);
  assert.doesNotMatch(navigation, />\s*Menu\s*</);
  assert.doesNotMatch(navigation, />\s*Close\s*</);
  assert.match(navigation, /aria-label="Open navigation"/);
  assert.match(navigation, /aria-label="Close navigation"/);
  assert.match(navigation, /<MenuIcon \/>/);
  assert.match(navigation, /<CloseIcon \/>/);
});

test("the public layout owns one landmark and reads auth on the server", () => {
  const rootLayout = readFileSync("app/layout.tsx", "utf8");
  const publicLayout = readFileSync("app/(public)/layout.tsx", "utf8");
  const navigation = readFileSync("components/public-shell/PublicNavigation.tsx", "utf8");

  assert.doesNotMatch(rootLayout, /<Header|<Footer|<main id="main-content"/);
  assert.match(publicLayout, /getServerSession/);
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
