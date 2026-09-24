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
  const primitives = read("components/commercial/CommercialPrimitives.tsx");

  assert.match(experience, /<article[\s\S]*?data-commercial-best-offer-card/);
  assert.match(experience, /BEST_OFFER_CATEGORIES\.map[\s\S]*?role="tab"/);
  assert.match(experience, /<CommercialFacts facts=\{card\.facts\}/);
  assert.match(primitives, /facts\.slice\(0, 3\)\.map/);
  assert.match(cssRule(styles, ".categoryRail button"), /min-height:44px/);
  assert.match(cssRule(styles, ".rankActions > a:not(:first-child)"), /min-height:44px/);
  assert.match(styles, /@media \(prefers-reduced-motion:reduce\)[\s\S]*?animation:none;/);
});

test("bonus directory uses native article semantics, announced results and full-size touch targets", () => {
  // /bonuses renders BonusOfferDirectory. The faceted BonusDirectory these checks
  // used to read was imported by no route and has been deleted, together with
  // its availability badges and review-separation note, which no reader could see.
  const styles = read("components/bonus-directory/BonusOfferDirectory.module.css");
  const directory = read("components/bonus-directory/BonusOfferDirectory.tsx");

  assert.doesNotMatch(directory, /role="listitem"/);
  assert.doesNotMatch(directory, /role="list"/);
  assert.match(directory, /return <article\s+className=\{styles\.card\}/);
  // Switching views changes the results without a navigation, so the count announces itself.
  assert.match(directory, /aria-atomic="true" aria-live="polite"[^>]*role="status"/);
  assert.match(directory, /role="tablist"/);
  assert.match(directory, /aria-controls="bonus-directory-results" aria-selected=\{view === key\}/);
  assert.match(directory, /card\.logo \? <ResponsivePlacementImage alt=""/);
  assert.match(cssRule(styles, ".viewRail button"), /min-height: 44px/);
  assert.match(cssRule(styles, ".card .offerAction"), /min-height: 48px/);
  assert.match(cssRule(styles, ".reviewOnly"), /min-height: 48px/);
  assert.match(cssRule(styles, ".researchLinks a"), /min-height: 44px/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?transition: none;/);
});

test("casino discovery and profile preserve touch, scroll, and document semantics", () => {
  const collection = read("components/casino-discovery/CasinoCollection.tsx");
  const collectionStyles = read("components/casino-discovery/CasinoCollection.module.css");
  const offerMedia = read("components/commercial-media/CommercialOfferMedia.tsx");
  const profile = read("components/casino-profile/CasinoProfile.tsx");
  const profileStyles = read("components/casino-profile/CasinoProfile.module.css");
  const primitives = read("components/commercial/CommercialPrimitives.tsx");

  // Touch targets moved from the retired CasinoDiscovery surface to the live
  // collection controls. The faceted filter drawer went with the components that
  // opened it: /casinos filters by name in place, so there is no drawer to contain.
  assert.match(cssRule(collectionStyles, ".viewRail button"), /min-height: 44px/);
  assert.match(cssRule(collectionStyles, ".card .offerAction"), /min-height: 48px/);
  assert.match(cssRule(collectionStyles, ".reviewOnly"), /min-height: 48px/);
  assert.match(collectionStyles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?transition: none;/);
  // The result count has to announce itself, because filtering happens without a navigation.
  assert.match(collection, /aria-atomic="true" aria-live="polite"[^>]*role="status"/);
  assert.match(collection, /role="tablist"/);
  assert.match(collection, /aria-controls="casino-collection-results" aria-selected=\{view === key\}/);

  assert.match(profile, /<article className=\{styles\.page\} data-runtime-renderer="casino-review">/);
  assert.match(offerMedia, /export function OperatorLogo[\s\S]*?offer\.casino\.logo \? <ResponsivePlacementImage\s+alt=""/);
  assert.match(collection, /card\.logo \? <ResponsivePlacementImage alt=""/);
  assert.match(profile, /casino\.media\.logo \? <ResponsivePlacementImage alt=""/);
  assert.match(profile, /<nav aria-label=\{messages\.common\.breadcrumb\}/);
  assert.match(profile, /<CommercialScore label=\{messages\.common\.editorScore\} locale=\{presentation\.locale\} score=\{score\}/);
  assert.match(primitives, /aria-label=\{`\$\{label\} \$\{value\} \/ 10`\}/);
  assert.match(profile, /id="casino-faq"[\s\S]*?id="our-verdict"/);
  assert.doesNotMatch(profile, /copy\.methodologyAndSources/);
  // Unknown rows are filtered out and an emptied section explains itself once,
  // rather than printing "Not verified" into every row.
  assert.match(profile, /<SectionFacts empty=\{[^}]*\} facts=\{knownFacts\(paymentFacts, copy\.notVerified\)\} \/>/);
  assert.match(profileStyles, /\.stickyAction :global\(\.commercialOutboundPrimary\)\s*\{[^}]*min-height:44px;/);
  assert.match(profileStyles, /\.profileFaq summary\s*\{[^}]*min-height:\s*68px;/);
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
