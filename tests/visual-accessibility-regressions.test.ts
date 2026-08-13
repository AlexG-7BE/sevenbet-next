import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

function cssRule(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Expected CSS rule for ${selector}`);
  return match[1];
}

test("home and contact keep text contrast without fading whole cards", () => {
  const home = read("components/home/TiltHome.module.css");
  const contact = read("app/(public)/contact/ContactPage.module.css");

  assert.match(home, /\.home \.primaryButton\s*\{\s*color: var\(--ink\);\s*\}/);
  assert.match(home, /\.miniScreen small\s*\{\s*color: var\(--night-muted\);\s*\}/);
  for (const selector of [".programmeCardPrevious", ".programmeCardNext"]) {
    const rule = cssRule(home, selector);
    assert.doesNotMatch(rule, /\bopacity\s*:/);
    assert.match(rule, /scale\(\.94\)/);
    assert.match(rule, /color: var\(--night-muted\)/);
  }
  assert.match(contact, /\.sectionLabel\s*\{\s*color: var\(--sb-focus-acid-contrast\);\s*\}/);
});

test("Best Offers exposes reachable controls and announces carousel changes", () => {
  const styles = read("components/best-offers/BestOffers.module.css");
  const experience = read("components/best-offers/BestOffersExperience.tsx");

  const dotRule = cssRule(styles, ".stageDots button");
  assert.match(dotRule, /width: 44px/);
  assert.match(dotRule, /height: 44px/);
  assert.match(styles, /\.stageDots button::before\s*\{/);
  assert.match(styles, /\.decisionStrip:focus-visible\s*\{/);
  assert.match(styles, /\.editorialDesk \.kicker\s*\{\s*color: var\(--ink\);\s*\}/);
  assert.match(styles, /\.editorialDesk > div > p:last-child\s*\{[^}]*color: #4f4e48;/);

  assert.match(experience, /aria-atomic="true" aria-live="polite"/);
  assert.match(experience, /Shortlist slide \{activeSlide \+ 1\} of \{slides\.length\}/);
  assert.match(experience, /aria-label="Best fit explanation cards"[^>]*role="region"[^>]*tabIndex=\{0\}/);
});

test("bonus comparison uses native article semantics and readable state labels", () => {
  const styles = read("components/bonus-directory/BonusDirectory.module.css");
  const directory = read("components/bonus-directory/BonusDirectory.tsx");

  assert.doesNotMatch(directory, /role="listitem"/);
  assert.doesNotMatch(directory, /role="list"/);
  assert.match(directory, /offers\.map\(\(offer, index\) => <article className=\{styles\.comparisonRow\}/);
  assert.match(styles, /\.unavailableBadge\s*\{\s*background: #dedcd2; color: #4f4e49;\s*\}/);
  assert.match(styles, /\.reviewSeparationNote strong\s*\{\s*color: var\(--acid\); font-size: 11px; line-height: 14px;/);
});

test("casino discovery and profile preserve touch, scroll, and document semantics", () => {
  const discovery = read("components/casino-discovery/CasinoDiscovery.module.css");
  const profile = read("components/casino-profile/CasinoProfile.tsx");
  const profileStyles = read("components/casino-profile/CasinoProfile.module.css");

  const searchButton = cssRule(discovery, ".heroSearch button");
  assert.match(searchButton, /width: 48px/);
  assert.match(searchButton, /height: 48px/);
  const filterDialog = cssRule(discovery, ".filterDialog");
  assert.match(filterDialog, /overflow-y: auto/);
  assert.match(filterDialog, /overscroll-behavior: contain/);
  assert.match(discovery, /\.readingGuide \.sectionIntro > p, \.compare p\s*\{\s*color: #4f4e48;\s*\}/);

  assert.match(profile, /<dd className=\{`\$\{styles\.supportingText\} \$\{fact\.verified \? styles\.verifiedText : ""\}`\}>\{fact\.supportingText\}<\/dd>/);
  assert.match(profile, /<div className=\{styles\.detailTabs\}><strong>Published detail coverage<\/strong><ul aria-label="Published detail groups">/);
  assert.doesNotMatch(profile, /className=\{styles\.detailTabs\}[^\n]*aria-current/);
  assert.match(profileStyles, /\.detailLabel\s*\{\s*color: var\(--teal\);/);
  assert.match(profileStyles, /\.facts \.supportingText\s*\{/);
});

test("static mission cards, global motion, denial landmarks, and login fields keep their contracts", () => {
  const tenSteps = read("app/(public)/10-steps/TenStepsLanding.module.css");
  const globals = read("app/globals.css");
  const accessDenied = read("components/admin/AdminAccessDenied.tsx");
  const permissionDenied = read("components/admin/AdminPermissionDenied.tsx");
  const login = read("components/auth/LoginExperience.tsx");

  const futureMission = cssRule(tenSteps, ".missionList .futureMission");
  assert.doesNotMatch(futureMission, /\bopacity\s*:/);
  assert.match(futureMission, /background: var\(--paper\)/);
  assert.match(globals, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*html\s*\{\s*scroll-behavior: auto;\s*\}/);
  assert.match(accessDenied, /<main className="pageShell">/);
  assert.match(permissionDenied, /<main className="pageShell">/);
  assert.match(login, /autoComplete="email" inputMode="email" name="email"/);
  assert.match(login, /autoComplete="current-password" minLength=\{8\} name="password"/);
});
