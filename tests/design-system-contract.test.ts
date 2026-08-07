import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("the Tilt-Locked semantic token contract is global and loaded before legacy styles", () => {
  const layout = read("app/layout.tsx");
  const tokens = read("app/design-system.css");
  assert.ok(layout.indexOf('import "./design-system.css"') < layout.indexOf('import "./globals.css"'));
  for (const contract of [
    "--sb-surface-night: var(--sb-night)",
    "--sb-surface-paper: var(--sb-paper)",
    "--sb-text-ink: var(--sb-night)",
    "--sb-action-primary: var(--sb-acid)",
    "--sb-safety-verified: var(--sb-teal)",
    "--sb-radius-full: 999px",
    "--sb-space-16: 64px",
    "--sb-motion-fast: 160ms",
  ]) assert.match(tokens, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(tokens, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(tokens, /gradient|backdrop-filter|box-shadow/);
});

test("the shared Action primitive is server-safe, internal-only and exposes the approved variants", () => {
  const action = read("components/design-system/Action.tsx");
  const css = read("components/design-system/Action.module.css");
  assert.doesNotMatch(action, /["']use client["']/);
  assert.doesNotMatch(action, /target=|rel=|window\.|location\.|@prisma\/client/);
  for (const variant of ["primary", "ghost-night", "ghost-paper"]) assert.match(action, new RegExp(`"${variant}"`));
  for (const size of ["medium", "large"]) assert.match(action, new RegExp(`"${size}"`));
  assert.match(css, /min-height: var\(--sb-action-height, 52px\)/);
  assert.match(css, /min-height: var\(--sb-action-height, 64px\)/);
  assert.match(css, /\.action:focus-visible/);
  assert.match(css, /\.action\[aria-disabled="true"\]/);
});

test("production consumers reuse Action without moving protected or commercial decisions into it", () => {
  for (const path of [
    "components/home/TiltHome.tsx",
    "app/(public)/10-steps/TenStepsLanding.tsx",
    "app/(public)/tools/budget-calculator/PersonalLimitTracker.tsx",
  ]) assert.match(read(path), /@\/components\/design-system\/Action/);
  const action = read("components/design-system/Action.tsx");
  assert.doesNotMatch(action, /affiliate|outbound|casino|bonus|responsible-gambling|programmeDashboardService/iu);
});

test("retired unreachable presentation wrappers stay deleted while active safety fixtures remain", () => {
  for (const path of [
    "components/CasinoCards.tsx",
    "components/KnowledgeCenter.tsx",
    "components/PageTemplates.tsx",
    "components/ResponsibleGamblingHub.tsx",
    "components/Section.tsx",
  ]) assert.equal(existsSync(path), false, path);
  assert.equal(existsSync("components/public-offers/PublicOffers.tsx"), true);
  assert.equal(existsSync("components/CasinoReviewSections.tsx"), true);
});

test("public and protected shells retain separate landmark ownership", () => {
  const publicLayout = read("app/(public)/layout.tsx");
  const protectedLayout = read("app/responsible-gambling/layout.tsx");
  assert.match(publicLayout, /<PublicHeader[\s\S]*<main id="main-content">[\s\S]*<PublicFooter/);
  assert.doesNotMatch(publicLayout, /ProtectedHelpHeader|ProtectedHelpFooter/);
  assert.match(protectedLayout, /<ProtectedHelpHeader[\s\S]*<main id="main-content">[\s\S]*<ProtectedHelpFooter/);
  assert.doesNotMatch(protectedLayout, /PublicHeader|PublicFooter/);
});
