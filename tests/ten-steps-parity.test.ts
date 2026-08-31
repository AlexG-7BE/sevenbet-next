import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import generatedPages from "../lib/final-handoff/generated-pages.json";
import { transformCommonHandoff, transformTenStepsHandoff } from "../lib/final-handoff/transforms";
import { tenStepsTranslation } from "../lib/i18n/static-pages/ten-steps";
import { programmeMissionTitles } from "../lib/programme/program-ai/mission-registry";
import { resolveTenStepsLandingState } from "../lib/ten-steps-landing";

const read = (path: string) => readFileSync(path, "utf8");
const page = read("app/(public)/10-steps/page.tsx");
const layout = read("app/(public)/layout.tsx");
const handoffPage = read("components/final-handoff/HandoffPage.tsx");
const runtime = transformTenStepsHandoff(transformCommonHandoff(generatedPages.tenSteps.html), "en-GB");
const runtimeCss = generatedPages.tenSteps.css;
const messages = tenStepsTranslation("en-GB");

// TenStepsLanding is no longer mounted by the public route. Keep these sources
// only for explicitly labelled legacy unit coverage while the old component and
// state resolver remain in the repository.
const legacyLanding = read("app/(public)/10-steps/TenStepsLanding.tsx");
const legacyStyles = read("app/(public)/10-steps/TenStepsLanding.module.css");
const legacyActionStyles = read("components/design-system/Action.module.css");

function textContent(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&apos;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replace(/\s+/g, " ")
    .trim();
}

const runtimeText = textContent(runtime);

test("mounted 10 Steps handoff keeps the approved hierarchy inside the Public Shell", () => {
  assert.match(page, /import \{ HandoffPage \}/);
  assert.match(page, /<HandoffPage name="tenSteps" transform=\{\(html\) => transformTenStepsHandoff\(html, presentation\.locale\)\} \/>/);
  assert.doesNotMatch(page, /TenStepsLanding|resolveTenStepsLandingState/);
  assert.match(handoffPage, /const commonHtml = transformCommonHandoff\(page\.html\)/);
  assert.match(handoffPage, /const html = transform \? transform\(commonHtml\) : commonHtml/);

  assert.deepEqual(
    [...runtime.matchAll(/data-ten-steps-section="([^"]+)"/g)].map((match) => match[1]),
    ["hero", "programme-builds", "mission-map", "account-boundary", "final-action"],
  );
  assert.match(layout, /<PublicHeader[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<PublicFooter/);
  assert.doesNotMatch(runtime, /<header\b|<footer\b|Need support now|standalone help/iu);
  assert.equal((runtime.match(/<h1\b/g) ?? []).length, 1);
  assert.match(runtime, /<section[^>]*data-ten-steps-section="hero"[^>]*aria-labelledby="ten-steps-title"/);
  assert.match(runtime, /<h1 id="ten-steps-title"/);
  assert.match(runtime, /role="list" aria-labelledby="ten-steps-path-title" data-ten-steps-mission-list/);
});

test("mounted Mission path is registry-owned and renders all ten current titles and purposes", () => {
  assert.deepEqual(programmeMissionTitles, [
    "Map the moment",
    "Set a 7-day goal",
    "Understand the urge",
    "Build one boundary",
    "Check before deciding",
    "Add friction",
    "Prepare support",
    "Research responsibly",
    "Rehearse the decision",
    "Make the plan reviewable",
  ]);

  const localizedTitles = Array.from({ length: 10 }, (_, index) => messages.text[20 + index * 2]);
  const localizedPurposes = Array.from({ length: 10 }, (_, index) => messages.text[21 + index * 2]);
  assert.deepEqual(localizedTitles, programmeMissionTitles);
  assert.equal((runtime.match(/role="listitem" data-ten-steps-mission/g) ?? []).length, 10);

  const missionMap = runtime.slice(
    runtime.indexOf('data-ten-steps-section="mission-map"'),
    runtime.indexOf('data-ten-steps-section="account-boundary"'),
  );
  const missionMapText = textContent(missionMap);
  let cursor = -1;
  for (const [index, title] of localizedTitles.entries()) {
    const titleIndex = missionMapText.indexOf(title, cursor + 1);
    assert.ok(titleIndex > cursor, `Mission ${String(index + 1).padStart(2, "0")} title must render in order`);
    assert.ok(missionMapText.includes(localizedPurposes[index]), `${title} must render its current purpose`);
    cursor = titleIndex;
  }

  assert.doesNotMatch(runtimeText, /Set your limits|Reality check|Decision framework|Play plan|Reduce friction|Long-term control/i);
  assert.doesNotMatch(runtimeText, /PLANNED · NOT YET AVAILABLE|future mission about|environmental friction|support option ready/i);
});

test("mounted 10 Steps handoff uses only the canonical Programme entry destination", () => {
  const bodyHrefs = [...runtime.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(bodyHrefs, ["/program?entry=start", "/program?entry=start"]);
  assert.doesNotMatch(runtime, /href="\/(?:casinos|bonuses|best-offers|catalog|compare|r\/|go\/)/);
  assert.doesNotMatch(runtime, /\?mission=|missionIndex|localStorage|sessionStorage/);
});

test("mounted Mission 01 copy reflects the Starting Point, timing and reward boundary", () => {
  for (const index of [4, 43, 44, 45, 46, 47, 48]) {
    assert.ok(runtimeText.includes(messages.text[index]), `mounted runtime must include catalog text ${index}`);
  }
  assert.match(runtimeText, /Most Missions take (?:about )?5–8 minutes/i);
  assert.match(runtimeText, /Mission 01 starts with your Starting Point\./i);
  assert.match(runtimeText, /Starting Point(?:'s|’s) two actions[^.]*40 XP/i);
  assert.match(runtimeText, /Registration[^.]*only[^.]*ready/i);
  assert.doesNotMatch(runtimeText, /Mission 01 takes about one minute|5–15 minutes|\+60 XP/i);
  assert.doesNotMatch(runtimeText, /cash value|money value|bonus eligibility|winnings|deposit reward/i);
});

test("mounted account boundary remains non-commercial and avoids unsupported outcome claims", () => {
  assert.match(runtimeText, /Your situation and plan are never used for offers, rankings or ads\./);
  assert.match(runtimeText, /Request export or deletion through account support; legal and backup retention may apply\./);
  assert.match(runtimeText, /No mission ever asks you to deposit, claim or play\./);
  assert.doesNotMatch(runtime, /href="\/r\/|https?:\/\/(?!images\.pexels\.com)/i);
  assert.doesNotMatch(runtimeText, /guaranteed control|improve your odds|(?:diagnoses|treats) gambling addiction|clinical(?:ly)? effective|treatment programme/i);
});

test("mounted route metadata is canonical, indexable and uses only truthful WebPage schemas", () => {
  const productMetadata = read("lib/market/product-context.ts");
  assert.match(page, /productMetadata\(\{ presentation, pathname: "\/10-steps"/);
  assert.match(productMetadata, /const canonical = absoluteUrl\(productCanonicalPath/);
  assert.match(productMetadata, /openGraph:/);
  assert.match(productMetadata, /twitter:/);
  assert.match(page, /"@type": "BreadcrumbList"/);
  assert.match(page, /"@type": "WebPage"/);
  assert.doesNotMatch(page, /"@type": "(?:Product|Offer|Course|MedicalWebPage|FAQPage)"/);
});

test("mounted handoff remains server-first and carries its generated responsive rules", () => {
  assert.doesNotMatch(page + handoffPage, /["']use client["']|useEffect|useState/);
  assert.match(handoffPage, /dangerouslySetInnerHTML=\{\{ __html: html \}\}/);
  assert.match(runtimeCss, /@media \(max-width: 760px\)/);
  assert.match(runtimeCss, /@media \(max-width: 900px\)/);
});

test("unmounted legacy resolver fails closed for anonymous and unavailable sessions", async () => {
  let dashboardReads = 0;
  const anonymous = await resolveTenStepsLandingState({
    getSession: async () => null,
    getDashboard: async () => {
      dashboardReads += 1;
      throw new Error("must not run");
    },
  });
  assert.deepEqual(anonymous, { kind: "anonymous" });
  assert.equal(dashboardReads, 0);

  const signedInWithoutDashboard = await resolveTenStepsLandingState({
    getSession: async () => ({ user: { id: "user-1" } }),
    getDashboard: async () => { throw new Error("Programme unavailable"); },
  });
  assert.deepEqual(signedInWithoutDashboard, { kind: "signed-in-fallback" });
});

test("unmounted legacy resolver derives only supplied server-owned progress", async () => {
  const state = await resolveTenStepsLandingState({
    getSession: async () => ({ user: { id: "user-1" } }),
    getDashboard: async (userId) => {
      assert.equal(userId, "user-1");
      return {
        totalXp: 190,
        currentMission: 4,
        missions: [
          ...Array.from({ length: 3 }, (_, index) => ({ missionNumber: index + 1, status: "completed" })),
          { missionNumber: 4, status: "current" },
          ...Array.from({ length: 6 }, (_, index) => ({ missionNumber: index + 5, status: "locked" })),
        ],
      };
    },
  });

  assert.deepEqual(state, { kind: "returning", totalXp: 190, completedMissions: 3, currentMission: 4 });
});

test("unmounted legacy component retains isolated accessibility safeguards", () => {
  assert.match(legacyLanding, /import \{ programmeMissionTitles \}/);
  assert.match(legacyLanding, /The B4GAMBLE Programme does not diagnose or treat gambling addiction\./);
  assert.match(legacyLanding, /Completion does not mean gambling is safe or suitable\./);
  assert.match(legacyLanding, /<ol className=\{styles\.missionList\}>/);
  assert.match(legacyLanding, /<ActionLink/);
  assert.doesNotMatch(legacyLanding, /["']use client["']|useEffect|IntersectionObserver|fetch\(/);
  assert.doesNotMatch(legacyStyles, /opacity:\s*0|visibility:\s*hidden/);
  assert.match(legacyStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(legacyActionStyles, /\.action:focus-visible/);
  assert.match(legacyActionStyles, /min-height: var\(--sb-action-height, 64px\)/);
});
