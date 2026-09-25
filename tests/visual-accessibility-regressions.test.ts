import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { PublicArticle } from "../lib/articles/article-types";
import generatedPages from "../lib/final-handoff/generated-pages.json";
import { handoffReadabilityTokens, markHandoffReadability } from "../lib/final-handoff/readability";
import { transformCommonHandoff, transformHomeHandoff, transformHomeHandoffCss, transformLearnHandoff, transformMethodologyHandoff } from "../lib/final-handoff/transforms";
import { methodologyMessages } from "../lib/i18n/static-pages/methodology";

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

/* Readability pass (Founder, 25 Sep 2026): four site-wide rules.
   1. Text below WCAG AA takes the approved stronger colour (faint paper .4–.5 → .68, grey → #5e5d57, olive → #5a5900, danger → #a72e2a).
   2. Uppercase text at 13px or less tracked at .15em or wider reads at 13px with .08em tracking.
   3. Italic serif paragraphs of 40+ characters at 20px or less read in the upright sans at 16px/1.5.
   4. Sentence-case text under 14px that runs 60+ characters reads at 14px with at least 1.45 line height. */
const READABLE_CAPS = /font-size:\s*13px;[\s\S]*letter-spacing:\s*\.08em;|letter-spacing:\s*\.08em;[\s\S]*font-size:\s*13px;/;
const READABLE_PROSE = /font-family:\s*var\(--font-seven-sans\),\s*Arial,\s*sans-serif;[\s\S]*font-size:\s*16px;[\s\S]*font-style:\s*normal;[\s\S]*line-height:\s*1\.5;/;

function assertCaps(source: string, selector: string, color?: RegExp) {
  const rule = cssRule(source, selector);
  assert.match(rule, READABLE_CAPS, `${selector} reads at 13px with .08em tracking`);
  assert.doesNotMatch(rule, /letter-spacing:\s*\.(?:1[5-9]|[2-9])/, `${selector} drops wide tracking`);
  if (color) assert.match(rule, color, `${selector} colour`);
}

function assertLineHeightAtLeast(rule: string, minimum: number, label: string) {
  const lineHeight = /line-height:\s*([\d.]+)(px)?/.exec(rule);
  assert.ok(lineHeight, `${label} declares a line height`);
  const ratio = lineHeight[2] ? Number(lineHeight[1]) / 14 : Number(lineHeight[1]);
  assert.ok(ratio >= minimum, `${label} line height ${ratio} >= ${minimum}`);
}

test("readability pass: the shared footer and language notices read at the approved sizes and contrast", () => {
  const shell = read("components/public-shell/PublicShell.module.css");
  assertCaps(shell, ".footerGroup h2", /color: rgba\(250, 250, 247, \.68\)/);
  assert.match(cssRule(shell, ".footerGroup h2"), /text-transform: uppercase/);
  const commission = cssRule(shell, ".footerCommission");
  assert.match(commission, /font-size: 14px/);
  assertLineHeightAtLeast(commission, 1.45, ".footerCommission");
  for (const selector of [".selectorStatus", ".mobilePresentationSelector p"]) {
    const rule = cssRule(shell, selector);
    assert.match(rule, /font-size: 14px/, selector);
    assertLineHeightAtLeast(rule, 1.45, selector);
  }
  const legal = cssRule(shell, ".dialogLegal");
  assert.match(legal, /font-size: 14px/);
  assertLineHeightAtLeast(legal, 1.45, ".dialogLegal");
});

test("readability pass: catalogue chips, counts and card lines follow the four rules", () => {
  const collection = read("components/casino-discovery/CasinoCollection.module.css");
  const bonuses = read("components/bonus-directory/BonusOfferDirectory.module.css");
  const bestOffers = read("components/best-offers/BestOffers.module.css");
  const profile = read("components/casino-profile/CasinoProfile.module.css");

  assertCaps(collection, ".viewRail button");
  assertCaps(collection, ".count", /color: rgba\(250, 250, 247, \.68\)/);
  assertCaps(collection, ".controls label span", /color: rgba\(250, 250, 247, \.68\)/);
  assertCaps(collection, ".card .badges span");
  assert.match(cssRule(collection, ".cardLine h3"), READABLE_PROSE, "the casino card 'for whom' line is upright sans");
  const reason = cssRule(collection, ".card .reason");
  assert.match(reason, /font-size: 14px/);
  assertLineHeightAtLeast(reason, 1.45, ".card .reason");
  assert.match(cssRule(collection, ".card .score small"), /color: rgba\(250, 250, 247, \.68\)/);

  assertCaps(bonuses, ".viewRail button");
  assertCaps(bonuses, ".count", /color: rgba\(250, 250, 247, \.68\)/);
  assertCaps(bonuses, ".type", /color: rgba\(250, 250, 247, \.68\)/);

  assertCaps(bestOffers, ".categoryRail button");
  assertCaps(bestOffers, ".rankMeta .rankBadges span");
  assertCaps(bestOffers, ".rankMeta", /color:rgba\(250,250,247,\.68\)/);
  assert.match(cssRule(bestOffers, ".whyPicked li p"), /font-family:var\(--font-seven-sans\),Arial,sans-serif;[^}]*font-size:16px;[^}]*font-style:normal;[^}]*line-height:1\.5;/);
  assert.match(cssRule(bestOffers, ".compactCommission"), /font-size:14px;[^}]*line-height:1\.7;/);

  assertCaps(profile, ".sectionNav a");
  assertCaps(profile, ".heroOffer dl.heroFacts dt", /color:rgba\(250,250,247,\.68\)/);
  assert.match(cssRule(profile, ".verdict"), /font-family:var\(--font-seven-sans\),Arial,sans-serif;[^}]*font-size:16px;[^}]*font-style:normal;[^}]*line-height:1\.5;/);
  assert.match(cssRule(profile, ".finalVerdictFacts dd"), /font-family:var\(--font-seven-sans\),Arial,sans-serif;[^}]*font-size:16px;/);
});

test("readability pass: no live small-caps rule keeps wide tracking or faint paper text", () => {
  const live = [
    "components/public-shell/PublicShell.module.css",
    "components/casino-discovery/CasinoCollection.module.css",
    "components/casino-discovery/CasinosPage.module.css",
    "components/bonus-directory/BonusOfferDirectory.module.css",
    "app/(public)/bonuses/BonusesPage.module.css",
    "components/best-offers/BestOffers.module.css",
    "components/casino-profile/CasinoProfile.module.css",
    "app/(public)/10-steps/TenStepsPage.module.css",
    "app/(public)/about/AboutPage.module.css",
    "app/(public)/faq/FAQPage.module.css",
    "app/(public)/contact/ContactPage.module.css",
    "app/(public)/affiliate-disclosure/AffiliateDisclosurePage.module.css",
    "app/(public)/learn/[category]/[slug]/article.module.css",
    "app/(public)/learn/[category]/[slug]/article-handoff.module.css",
    "components/next-step/TrustNextStep.module.css",
    "components/commercial-handoff/CommercialHandoffPage.module.css",
    "components/auth/LoginExperience.module.css",
    "components/programme/ProgramAiFinalPresentation.module.css",
  ];
  for (const file of live) {
    const source = read(file).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const [, selector, body] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const size = /font-size:\s*(\d+(?:\.\d+)?)px/.exec(body);
      const tracking = /letter-spacing:\s*(\d*\.\d+)em/.exec(body);
      if (/text-transform:\s*uppercase/.test(body) && size && Number(size[1]) <= 13 && tracking) {
        assert.ok(Number(tracking[1]) < 0.15, `${file} ${selector.trim()} keeps wide small caps`);
      }
      assert.doesNotMatch(body, /(?:^|[;\s])color:\s*rgba\(250,\s*250,\s*247,\s*(?:0)?\.(?:4|45|5)\)/, `${file} ${selector.trim()} keeps faint paper text`);
      assert.doesNotMatch(body, /(?:^|[;\s])color:\s*#(?:8b8a82|777500)\b/i, `${file} ${selector.trim()} keeps a failing grey or olive`);
    }
  }
  assert.match(read("app/design-system.css"), /--sb-acid-contrast: #5a5900;/);
  assert.match(read("app/design-system.css"), /--sb-danger-text: #a72e2a;/);
});

const readableFixture = (id: string, category: string): PublicArticle => ({
  id: `00000000-0000-4000-8000-00000000000${id}`,
  slug: `guide-${id}`,
  locale: "en-GB",
  title: `Guide ${id}`,
  excerpt: "A sufficiently complete excerpt for a published Learning Center guide.",
  category,
  tags: [],
  status: "PUBLISHED",
  bodyBlocks: [{ id: "intro", type: "paragraph", text: "Visible body." }],
  heroImageUrl: null,
  heroImageAlt: null,
  seoTitle: null,
  seoDescription: null,
  canonicalUrl: null,
  readingTime: "4 min read",
  difficulty: "Beginner",
  publishedAt: "2026-09-15T00:00:00.000Z",
  lastReviewedAt: "2026-09-15T00:00:00.000Z",
  archivedAt: null,
  createdAt: "2026-09-15T00:00:00.000Z",
  updatedAt: `2026-09-1${id}T00:00:00.000Z`,
  createdBy: "00000000-0000-4000-8000-000000000002",
  updatedBy: "00000000-0000-4000-8000-000000000002",
});

test("readability pass: Learn cards print 13px deep-olive categories and AA meta lines", () => {
  const articles = [readableFixture("1", "payments"), readableFixture("2", "casino-bonuses"), readableFixture("3", "payments"), readableFixture("4", "casino-safety")];
  const hub = transformLearnHandoff(transformCommonHandoff(generatedPages.learn.html), "en-GB", (href) => href, articles);
  const categories = [...hub.matchAll(/<div style="([^"]*text-transform: uppercase[^"]*)">(?:<span class="sc-interp">)?(Payments|Casino Bonuses|Casino Safety)/g)];
  assert.ok(categories.length >= 4, "start and guide cards print their category labels");
  for (const [, style] of categories) {
    assert.match(style, /font-size: 13px; letter-spacing: 0\.08em; text-transform: uppercase; color: rgb\(90, 89, 0\)/);
  }
  const meta = [...hub.matchAll(/<div style="font-size: 13px; color: (rgb\([^)]*\))[^"]*">(?:<span class="sc-interp">)?4 min read/g)];
  assert.ok(meta.length >= 4, "start and guide cards print their reading-time meta");
  for (const [, color] of meta) assert.equal(color, "rgb(94, 93, 87)");
  assert.doesNotMatch(hub, /rgb\(119, 117, 0\)|letter-spacing: 0\.(?:1[5-9]|2)\d*em; text-transform: uppercase; color: rgb\(228, 226, 78\); margin-bottom: 10px/);
});

test("readability pass: handoff tokens mark each rule and Home applies them on phones only", () => {
  const tokenAt = (html: string, marker: string) => {
    const tokens = handoffReadabilityTokens(html);
    const index = html.indexOf(marker);
    assert.ok(index >= 0, `fixture contains ${marker}`);
    const offset = [...tokens.keys()].filter((key) => key <= index).sort((left, right) => right - left)[0];
    return offset === undefined || html.slice(offset, index).includes("<") ? [] : tokens.get(offset) ?? [];
  };
  const light = (inner: string) => `<div style="background: rgb(244, 241, 235);">${inner}</div>`;
  const dark = (inner: string) => `<div style="background: rgb(16, 15, 15);">${inner}</div>`;
  const sentence = "Commercial disclosure: B4GAMBLE may receive compensation from some links.";

  assert.deepEqual(tokenAt(dark('<div style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: rgb(228, 226, 78);">Top rated</div>'), "Top rated"), ["caps"]);
  assert.deepEqual(tokenAt(dark('<div style="font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase;">Fourteen</div>'), "Fourteen"), []);
  assert.deepEqual(tokenAt(dark('<div style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;">Tight</div>'), "Tight"), []);
  assert.deepEqual(tokenAt(dark('<span style="color: rgba(250, 250, 247, 0.45);">Scroll</span>'), "Scroll"), ["paper"]);
  assert.deepEqual(tokenAt(dark('<span style="color: rgba(250, 250, 247, 0.55);">Readable</span>'), "Readable"), []);
  assert.deepEqual(tokenAt(light('<span style="font-size: 13px; color: rgb(139, 138, 130);">missions</span>'), "missions"), ["grey"]);
  assert.deepEqual(tokenAt(dark('<span style="font-size: 13px; color: rgb(139, 138, 130);">on night</span>'), "on night"), []);
  assert.deepEqual(tokenAt(light('<span style="color: rgb(119, 117, 0);">olive</span>'), "olive"), ["olive"]);
  assert.deepEqual(tokenAt(light('<a style="color: rgb(185, 75, 71);">How we are funded</a>'), "How we are funded"), ["danger"]);
  assert.deepEqual(tokenAt(dark(`<p style="font-family: 'Instrument Serif', serif; font-style: italic; font-size: 19px;">Players who want one of the oldest operators in the industry.</p>`), "Players who"), ["prose"]);
  assert.deepEqual(tokenAt(dark(`<p style="font-family: 'Instrument Serif', serif; font-style: italic; font-size: 19px;">Short accent.</p>`), "Short accent"), []);
  assert.deepEqual(tokenAt(dark(`<h2 style="font-family: 'Instrument Serif', serif; font-style: italic; font-size: 19px;">A heading keeps its italic serif even when it is long enough.</h2>`), "A heading"), []);
  assert.deepEqual(tokenAt(light(`<p style="font-size: 12px; color: rgb(100, 99, 92);">${sentence}</p>`), "Commercial disclosure"), ["small", "leading"]);
  assert.deepEqual(tokenAt(light(`<p style="font-size: 13px; line-height: 1.6;">${sentence}</p>`), "Commercial disclosure"), ["small"]);
  assert.deepEqual(tokenAt(dark('<div style="font-size: 13px;"><span>Missions 02–10 · 5–8 minutes</span><span>Current Programme: free, without a paywall</span></div>'), "Missions 02"), []);

  const home = markHandoffReadability(transformHomeHandoff(transformCommonHandoff(generatedPages.home.html), "en-GB"));
  assert.match(home, /data-home-hero-kicker="" data-readable="caps">A self-directed 10-step programme</);
  assert.match(home, /data-readable="danger">How we're funded</);
  assert.match(home, /data-readable="paper">No registration until your starting point is ready\.</);
  assert.equal(markHandoffReadability(home), markHandoffReadability(home), "marking is deterministic");
  assert.doesNotMatch(transformHomeHandoffCss(generatedPages.home.css), /data-readable/, "Home's own CSS is untouched");

  const methodology = markHandoffReadability(transformMethodologyHandoff(transformCommonHandoff(generatedPages.methodology.html), methodologyMessages("en-GB")));
  assert.match(methodology, /data-readable="caps grey">01 · How we evaluate casinos</);
  assert.match(methodology, /data-readable="danger">Tell us</);

  const globals = read("app/globals.css");
  const phone = /@media \(max-width: 760px\) \{\s*(\[data-handoff-page="home"\] \[data-readable~="caps"\][\s\S]*?)\n\}/.exec(globals)?.[1] ?? "";
  for (const token of ["caps", "paper", "grey", "olive", "danger", "prose", "small", "leading"]) {
    assert.match(globals, new RegExp(`\\[data-handoff-page\\]:not\\(\\[data-handoff-page="home"\\]\\) \\[data-readable~="${token}"\\] \\{[^}]*!important`), `${token} applies on every other handoff page`);
    assert.match(phone, new RegExp(`\\[data-handoff-page="home"\\] \\[data-readable~="${token}"\\] \\{[^}]*!important`), `${token} applies on Home phones`);
  }
  assert.equal(globals.match(/\[data-handoff-page="home"\] \[data-readable~=/g)?.length, 8, "Home readability rules exist only inside the phone query");
  assert.match(globals, /\[data-readable~="caps"\] \{ font-size: 13px !important; letter-spacing: \.08em !important; \}/);
  assert.match(globals, /\[data-readable~="prose"\] \{ font-family: var\(--font-seven-sans\), Arial, sans-serif !important; font-size: 16px !important; font-style: normal !important; line-height: 1\.5 !important; \}/);
  assert.match(globals, /\[data-readable~="small"\] \{ font-size: 14px !important; \}/);
  assert.match(read("components/final-handoff/HandoffPage.tsx"), /markHandoffReadability\(transform \? transform\(commonHtml\) : commonHtml\)/);
});
