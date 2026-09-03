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

test("home and contact keep text contrast, focus, and touch contracts", () => {
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
  assert.match(contact, /\.eyebrow\s*\{[^}]*color: var\(--sb-action-primary\);/);
  assert.match(contact, /\.field input,[\s\S]*?min-height: 44px;/);
  assert.match(contact, /\.field input:focus-visible,[\s\S]*?outline: 3px solid var\(--sb-action-primary\);/);
  assert.match(contact, /\.emailLink\s*\{[^}]*min-height: 44px;/);
});

test("Best Offers keeps native cards, material terms, and reachable controls", () => {
  const styles = read("components/best-offers/BestOffers.module.css");
  const experience = read("components/best-offers/BestOffersExperience.tsx");

  assert.match(experience, /<article className=\{styles\.featuredCard\} data-testid="best-offer-product-card">/);
  assert.match(experience, /<dl className=\{styles\.mobileMaterialTerms\} aria-label=\{`\$\{offer\.casino\.name\} · \$\{messages\.common\.materialOfferTerms\}`\}>/);
  assert.match(experience, /<details><summary>\{messages\.bestOffers\.faqWageringQuestion\}<\/summary>/);
  assert.match(experience, /if \(offer\.dataClassification === "DEMO_FIXTURE"\) return null;/);
  assert.match(cssRule(styles, ".commercialCta"), /min-height:50px/);
  assert.match(cssRule(styles, ".actions > button"), /min-height:44px/);
  assert.match(styles, /\.commercialCta,\.unavailableAction,\.actions > a,\.actions > button\s*\{[^}]*min-height:44px;/);
  assert.match(styles, /@media \(prefers-reduced-motion:reduce\)[\s\S]*?animation:none;/);
});

test("bonus comparison uses native article semantics and readable state labels", () => {
  const styles = read("components/bonus-directory/BonusDirectory.module.css");
  const directory = read("components/bonus-directory/BonusDirectory.tsx");

  assert.doesNotMatch(directory, /role="listitem"/);
  assert.doesNotMatch(directory, /role="list"/);
  assert.match(directory, /offers\.map\(\(offer, index\) => <article className=\{styles\.comparisonRow\}/);
  assert.match(styles, /\.unavailableBadge\s*\{\s*background: #dedcd2; color: #4f4e49;\s*\}/);
  assert.match(styles, /\.reviewSeparationNote strong\s*\{\s*color: var\(--acid\); font-size: 13px; line-height: 18px;/);
});

test("casino discovery and profile preserve touch, scroll, and document semantics", () => {
  const discovery = read("components/casino-discovery/CasinoDiscovery.module.css");
  const discoveryCard = read("components/casino-discovery/CasinoDiscoveryCard.tsx");
  const bonusDirectory = read("components/bonus-directory/BonusDirectory.tsx");
  const curated = read("components/casino-discovery/CuratedCasinoShortlist.tsx");
  const offerMedia = read("components/commercial-media/CommercialOfferMedia.tsx");
  const profile = read("components/casino-profile/CasinoProfile.tsx");
  const profileStyles = read("components/casino-profile/CasinoProfile.module.css");

  const searchButton = cssRule(discovery, ".heroSearch button");
  assert.match(searchButton, /width: 48px/);
  assert.match(searchButton, /height: 48px/);
  const filterDialog = cssRule(discovery, ".filterDialog");
  assert.match(filterDialog, /overflow-y: auto/);
  assert.match(filterDialog, /overscroll-behavior: contain/);
  assert.match(discovery, /\.readingGuide \.sectionIntro > p, \.compare p\s*\{\s*color: #4f4e48;\s*\}/);

  assert.match(profile, /<article className=\{styles\.page\} data-runtime-renderer="casino-review">/);
  assert.match(offerMedia, /export function OperatorLogo[\s\S]*?offer\.casino\.logo \? <img\s+alt=""/);
  assert.match(discoveryCard, /casino\.logo \? <img alt=""/);
  assert.match(bonusDirectory, /return offer\.casino\.logo \? <img\s+alt=""/);
  assert.match(curated, /casino\.logo \? <img alt=""/);
  assert.match(profile, /casino\.media\.logo \? <img alt=""/);
  assert.match(profile, /<nav aria-label=\{messages\.profile\.currentReview\}/);
  assert.match(profile, /aria-label=\{hasEditorScore \? `\$\{messages\.common\.editorScore\} \$\{formattedEditorScore\} \/ 10` : `\$\{messages\.common\.editorScore\} \$\{messages\.common\.notListed\}`\}/);
  assert.match(profile, /\{hasEditorScore \? <span aria-hidden="true">★★★★★<\/span> : null\}/);
  assert.match(profile, /<details className=\{styles\.evidenceDisclosure\}>\s*<summary>\{messages\.profile\.evidencePaymentsTools\}<\/summary>/);
  assert.match(profile, /<dl className=\{`\$\{styles\.facts\} \$\{styles\.checkCard\}`\}>/);
  assert.match(profileStyles, /\.decisionBar > div a\s*\{[^}]*min-height: 44px;/);
  assert.match(profileStyles, /\.faqGrid summary\s*\{[^}]*min-height: 66px;/);
  assert.match(cssRule(profileStyles, ".page"), /overflow-x: clip/);
  assert.match(profileStyles, /:global\(html\):has\(\.page\),\s*:global\(body\):has\(\.page\)\s*\{\s*overflow-x: clip;/);
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
