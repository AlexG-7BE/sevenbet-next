import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
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
  const tokens = read("app/design-system.css");
  assert.doesNotMatch(action, /["']use client["']/);
  assert.doesNotMatch(action, /target=|rel=|window\.|location\.|@prisma\/client/);
  for (const variant of ["primary", "ghost-night", "ghost-paper"]) assert.match(action, new RegExp(`"${variant}"`));
  for (const size of ["medium", "large"]) assert.match(action, new RegExp(`"${size}"`));
  assert.match(css, /min-height: var\(--sb-action-height, 52px\)/);
  assert.match(css, /min-height: var\(--sb-action-height, 64px\)/);
  assert.match(css, /\.primary:hover\s*\{[^}]*background: var\(--sb-action-background-hover, var\(--sb-action-primary-hover\)\);[^}]*transform: translateY\(-1px\);/s);
  assert.match(css, /\.ghostNight:hover\s*\{[^}]*background: var\(--sb-text-on-night\);[^}]*color: var\(--sb-text-ink\);/s);
  assert.match(css, /\.ghostPaper:hover\s*\{[^}]*background: var\(--sb-text-ink\);[^}]*color: var\(--sb-text-on-night\);/s);
  assert.match(css, /\.action:focus-visible\s*\{[^}]*outline: var\(--sb-focus-width\) solid var\(--sb-focus-color\);[^}]*outline-offset: var\(--sb-focus-offset\);/s);
  assert.match(tokens, /--sb-focus-color: var\(--sb-safety-verified\);/);
  assert.match(tokens, /--sb-focus-width: 3px;/);
  assert.match(tokens, /--sb-focus-offset: 3px;/);
  assert.match(css, /\.action:disabled/);
  assert.doesNotMatch(css, /\.action\[aria-disabled="true"\]/);
  assert.doesNotMatch(action, /aria-disabled/);
});

test("route focus scopes preserve shared Action ownership", () => {
  const homeCss = read("components/home/TiltHome.module.css");
  const tenStepsCss = read("app/(public)/10-steps/TenStepsLanding.module.css");
  const limitTrackerCss = read("app/(public)/tools/budget-calculator/PersonalLimitTracker.module.css");
  assert.match(homeCss, /\.home :focus-visible:not\(\.primaryButton\)/);
  assert.match(tenStepsCss, /\.page :focus-visible:not\(\.primaryButton\)/);
  assert.match(limitTrackerCss, /\.page :focus-visible:not\(\.primaryAction\)/);
  for (const routeCss of [homeCss, tenStepsCss, limitTrackerCss]) {
    assert.doesNotMatch(routeCss, /\.(?:home|page) :focus-visible\s*\{/);
  }
});

test("production consumers reuse Action directly or through the analytics-only Programme composite", () => {
  for (const path of [
    "app/(public)/10-steps/TenStepsLanding.tsx",
    "app/(public)/tools/budget-calculator/PersonalLimitTracker.tsx",
  ]) assert.match(read(path), /@\/components\/design-system\/Action/);

  const home = read("components/home/TiltHome.tsx");
  const programmeStartAction = read("components/analytics/ProgrammeStartActionLink.tsx");
  assert.match(home, /@\/components\/analytics\/ProgrammeStartActionLink/);
  assert.match(programmeStartAction, /@\/components\/design-system\/Action/);
  assert.doesNotMatch(programmeStartAction, /affiliate|outbound|casino|bonus|responsible-gambling|programmeDashboardService/iu);

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

test("commercial actions remain confirmation-first and managed outside shared Action", () => {
  const outbound = read("components/casino-profile/CasinoOutboundAction.tsx");
  const confirmation = read("components/commercial-handoff/CommercialHandoffPage.tsx");
  assert.match(outbound, /confirmationHref = slug \? `\/outbound\/\$\{slug\}` : "\/outbound\/unavailable"/);
  assert.match(outbound, /href=\{confirmationHref\}/);
  assert.match(confirmation, /href=\{`\/r\/\$\{slug\}`\}/);
  assert.doesNotMatch(read("components/design-system/Action.tsx"), /\/outbound\/|\/r\/|target=|sponsored/);
});

test("protected Help and private control-tool results cannot import commercial action paths", () => {
  const protectedHelp = [
    "components/protected-help/ProtectedHelpArticle.tsx",
    "components/protected-help/ProtectedHelpHub.tsx",
    "components/protected-help/ProtectedHelpShell.tsx",
  ].map(read).join("\n");
  const controlTools = [
    "app/(public)/self-check/SelfCheckFlow.tsx",
    "app/(public)/tools/budget-calculator/PersonalLimitTracker.tsx",
  ].map(read).join("\n");
  for (const source of [protectedHelp, controlTools]) {
    assert.doesNotMatch(source, /CasinoOutboundAction|CommercialHandoff|href=[{]?['"`]\/r\//);
  }
});

test("the visual snapshot manifest is present, bounded and cross-domain", () => {
  const manifest = read("tests/design-system-visual.spec.ts");
  const snapshots = readdirSync("tests/design-system-visual.spec.ts-snapshots").filter((name) => name.endsWith(".png"));
  assert.equal(snapshots.length, 10);
  assert.match(manifest, /\/responsible-gambling/);
  assert.match(manifest, /\/privacy/);
  assert.match(manifest, /\/self-check/);
  assert.match(manifest, /\/tools\/budget-calculator/);
  assert.match(manifest, /toHaveScreenshot/);
});
