import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import generatedPages from "@/lib/final-handoff/generated-pages.json";
import { stripHandoffGlobalChrome } from "@/lib/final-handoff/transforms";

const read = (path: string) => readFileSync(path, "utf8");

const contentOnlyHandoffPages = [
  "home",
  "tenSteps",
  "article",
  "learn",
  "responsibleGambling",
  "help",
  "methodology",
  "about",
  "affiliateDisclosure",
  "privacy",
  "terms",
  "notFound",
] as const;

test("generated handoff pages surrender captured global chrome before rendering", () => {
  for (const name of contentOnlyHandoffPages) {
    const source = generatedPages[name].html;
    const content = stripHandoffGlobalChrome(source);
    assert.ok(content.length < source.length, `${name} must remove captured chrome`);
    assert.doesNotMatch(content, /<[^>]+\sdata-nav(?:=|\s|>)/, `${name} internal navigation`);
    assert.doesNotMatch(content, /Independent reviews\. Real tests\.<br>Player first\./, `${name} internal footer`);
  }
});

test("normal public and Programme routes have one production shell owner", () => {
  const publicLayout = read("app/(public)/layout.tsx");
  const programmeLayout = read("app/program/layout.tsx");
  assert.equal((programmeLayout.match(/<PublicHeader\b/g) ?? []).length, 1);
  assert.equal((programmeLayout.match(/<PublicFooter\b/g) ?? []).length, 1);
  assert.equal((publicLayout.match(/<PublicHeader\b/g) ?? []).length, 1);
  assert.equal((publicLayout.match(/<PublicFooter\b/g) ?? []).length, 1);
  assert.doesNotMatch(publicLayout, /fallback=\{<Public(?:Header|Footer)\b/);
  assert.match(publicLayout, /const COMMERCIAL_NAVIGATION_WAIT_MS = 1_500/);
  assert.match(publicLayout, /boundedCommercialProductState\(resolveServerCommercialProductState\(\)\)/);
  assert.match(publicLayout, /resolution\.kind === "timed-out"[\s\S]*variant === "mobile" && destination === "\/best-offers" \? <PublicCommercialNavigationRetry \/> : null/);
  assert.match(publicLayout, /commercialDesktopBestOffersNavigation=\{\([\s\S]*data-commercial-navigation-pending="desktop"[\s\S]*destination="\/best-offers"/);
  assert.match(publicLayout, /commercialDesktopBonusesNavigation=\{\([\s\S]*data-commercial-navigation-pending="desktop-bonuses"[\s\S]*destination="\/bonuses"/);
  assert.match(publicLayout, /commercialMobileBestOffersNavigation=\{\([\s\S]*data-commercial-navigation-pending="mobile"[\s\S]*destination="\/best-offers"/);
  assert.match(publicLayout, /commercialMobileBonusesNavigation=\{\([\s\S]*data-commercial-navigation-pending="mobile-bonuses"[\s\S]*destination="\/bonuses"/);
  assert.match(publicLayout, /<main id="main-content">\{children\}<\/main>[\s\S]*commercialBestOffersNavigation=\{\([\s\S]*data-commercial-navigation-pending="footer"/);

  const navigation = read("components/public-shell/PublicNavigation.tsx");
  const enhancement = read("components/public-shell/PublicNavigationClient.tsx");
  assert.doesNotMatch(navigation, /^"use client";/);
  assert.match(navigation, /<details[^>]+data-public-mobile-disclosure/);
  assert.match(navigation, /<PublicMobileNavigationEnhancement/);
  assert.match(enhancement, /disclosure\.dataset\.navigationEnhanced = "true"/);
  assert.match(enhancement, /createCommercialNavigationRetryRegistry\(\)/);
  assert.match(enhancement, /commercialNavigationRefreshes\.claim\(pathname\)/);
  assert.match(enhancement, /commercialNavigationRefreshes\.clear\(pathname\)/);
  assert.equal((enhancement.match(/router\.refresh\(\)/g) ?? []).length, 1);
  assert.match(enhancement, /disclosure\.setAttribute\("role", "dialog"\)/);
  assert.match(enhancement, /disclosure\.setAttribute\("aria-modal", "true"\)/);
  assert.match(enhancement, /sibling\.inert = true/);
  assert.match(enhancement, /event\.key !== "Tab"/);

  const shell = read("components/public-shell/PublicShell.module.css");
  assert.doesNotMatch(shell, /\[data-navigation-href=[^\]]+\]\s*\{\s*order:/);
  assert.doesNotMatch(shell, /\[data-footer-navigation-href=[^\]]+\]\s*\{\s*order:/);

  const interactions = read("components/final-handoff/HandoffInteractions.tsx");
  assert.doesNotMatch(interactions, /\[data-nav\]|data\.navtheme|syncNavigation/);
  assert.equal(existsSync("components/final-handoff/HandoffPublicChrome.tsx"), false);
  assert.doesNotMatch(read("app/(public)/faq/page.tsx") + read("app/(public)/contact/page.tsx"), /HandoffPublicNav|HandoffFooterStrip/);
  assert.doesNotMatch(read("app/globals.css"), /body:has\(\[data-handoff-page\]\)\s*>\s*\[data-public-shell/);
});

test("the measured Home and Learn grid owns the public geometry tokens", () => {
  const tokens = read("app/design-system.css");
  assert.match(tokens, /--public-outer-gutter: clamp\(24px, 5vw, 72px\);/);
  assert.match(tokens, /--public-content-max: 1440px;/);
  assert.match(tokens, /--public-wide-max: 1440px;/);
  assert.match(tokens, /--public-reading-max: 760px;/);
  assert.match(tokens, /--site-content-width: var\(--public-content-width\);/);

  const shell = read("components/public-shell/PublicShell.module.css");
  assert.match(shell, /\.headerInner\s*\{[^}]*width: var\(--public-frame-width\)/s);
  assert.match(shell, /\.footerInner\s*\{[^}]*width: var\(--public-wide-width\)/s);

  const globals = read("app/globals.css");
  assert.match(globals, /html:has\(body > \[data-public-shell="header"\]\)[\s\S]*height:\s*100%/);
  assert.doesNotMatch(globals, /scrollbar-width:\s*none/);
  assert.doesNotMatch(globals, /\[data-public-shell="header"\][^\n]*::\-webkit-scrollbar/);
  assert.doesNotMatch(globals, /\[data-protected-help-shell\][^\n]*::\-webkit-scrollbar/);
});

test("Programme-specific UI is contextual content rather than a second global nav", () => {
  const contextualHeader = read("components/programme/ProgramAiAuthenticatedHeader.tsx");
  const presentation = read("components/programme/ProgramAiFinalPresentation.tsx");
  assert.match(contextualHeader, /data-programme-context-header/);
  assert.doesNotMatch(contextualHeader, /Programme navigation|href="\/best-offers"|className=\{styles\.wordmark\}/);
  assert.doesNotMatch(presentation, /ProgrammeChrome|ProgrammeFootnote/);
});
