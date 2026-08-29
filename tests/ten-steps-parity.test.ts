import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { programmeMissionTitles } from "../lib/programme/program-ai/mission-registry";
import { resolveTenStepsLandingState } from "../lib/ten-steps-landing";

const page = readFileSync("app/(public)/10-steps/page.tsx", "utf8");
const landing = readFileSync("app/(public)/10-steps/TenStepsLanding.tsx", "utf8");
const layout = readFileSync("app/(public)/layout.tsx", "utf8");
const styles = readFileSync("app/(public)/10-steps/TenStepsLanding.module.css", "utf8");
const actionStyles = readFileSync("components/design-system/Action.module.css", "utf8");
const combined = `${page}\n${landing}\n${styles}`;

test("10 Steps keeps the final handoff hierarchy inside the Public Shell", () => {
  const approvedOrder = [
    "hero",
    "programme-builds",
    "mission-map",
    "account-boundary",
    "final-action",
  ];

  let cursor = -1;
  for (const section of approvedOrder) {
    const index = landing.indexOf(`data-ten-steps-section=\"${section}\"`);
    assert.ok(index > cursor, `${section} must follow the previous approved section`);
    cursor = index;
  }

  assert.match(layout, /<PublicHeader[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<PublicFooter/);
  assert.doesNotMatch(landing, /<header|<footer|Need support now|standalone help/iu);
  assert.equal((landing.match(/<h1\b/g) ?? []).length, 3, "anonymous, returning and fallback heroes each own one H1");
  assert.match(landing, /aria-labelledby="ten-steps-title"/);
  assert.match(landing, /<ol className=\{styles\.missionList\}>/);
});

test("Mission path is feature-on registry-owned and exposes ten exact MVP titles", () => {
  assert.equal(programmeMissionTitles.length, 10);
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
  assert.match(landing, /import \{ programmeMissionTitles \}/);
  assert.match(landing, /THE PROGRAMME, STEP BY STEP/);
  assert.doesNotMatch(landing, /PLANNED · NOT YET AVAILABLE/);
  assert.doesNotMatch(landing, /future mission about|fact-check exercise|environmental friction|support option ready/i);
});

test("10 Steps uses only the canonical Programme body destination", () => {
  assert.match(landing, /href="\/program"/);
  assert.match(landing, /href="\/program\?entry=start"/);
  assert.match(landing, /href="\/program"[^>]*>Open My Programme/);
  assert.doesNotMatch(landing, /href="\/(?:casinos|bonuses|best-offers|catalog|compare|r\/|go\/)/);
  assert.doesNotMatch(landing, /\?mission=|missionIndex|localStorage|sessionStorage/);
  assert.doesNotMatch(landing, /CasinoCard|BonusCard|BestOffers|Affiliate|Outbound/);
});

test("Mission 01 entry and post-mission account boundary remain truthful", () => {
  assert.match(landing, /Start Mission 01/);
  assert.doesNotMatch(landing, /\+60 XP/);
  assert.match(landing, /No registration until your starting point is ready\./);
  assert.match(landing, /No mission asks you to deposit, claim or play\./);
  assert.match(landing, /Export and deletion requests are handled under the Privacy policy\./);
  assert.doesNotMatch(combined, /cash value|money value|bonus eligibility|winnings|deposit reward/i);
});

test("commercial, clinical and outcome claims remain absent from the body", () => {
  assert.doesNotMatch(landing, /href="\/r\/|https?:\/\/(?!images\.pexels\.com)/i);
  assert.doesNotMatch(landing, /guaranteed control|improve your odds|(?:diagnoses|treats) gambling addiction|clinical(?:ly)? effective|treatment programme/i);
  assert.match(landing, /The B4GAMBLE Programme does not diagnose or treat gambling addiction\./);
  assert.match(landing, /Completion does not mean gambling is safe or suitable\./);
  assert.match(landing, /Your situation and plan are never used for offers, rankings or ads\./);
});

test("metadata is canonical, indexable and uses only truthful WebPage schemas", () => {
  const productMetadata = readFileSync("lib/market/product-context.ts", "utf8");
  assert.match(page, /productMetadata\(\{ presentation, pathname: "\/10-steps"/);
  assert.match(productMetadata, /const canonical = absoluteUrl\(productCanonicalPath/);
  assert.match(productMetadata, /openGraph:/);
  assert.match(productMetadata, /twitter:/);
  assert.match(page, /"@type": "BreadcrumbList"/);
  assert.match(page, /"@type": "WebPage"/);
  assert.doesNotMatch(page, /"@type": "(?:Product|Offer|Course|MedicalWebPage|FAQPage)"/);
});

test("anonymous and unavailable session states never invent Programme truth", async () => {
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
  assert.match(landing, /const fallback = state\.kind === "signed-in-fallback"/);
  assert.match(landing, /Programme status is unavailable here\./);
  assert.doesNotMatch(landing, /Programme state is unavailable here\. Open My Programme to retry\./);
});

test("returning state exposes server-owned current Mission, completion and XP", async () => {
  const state = await resolveTenStepsLandingState({
    getSession: async () => ({ user: { id: "user-1" } }),
    getDashboard: async (userId) => {
      assert.equal(userId, "user-1");
      return {
        totalXp: 60,
        currentMission: 2,
        missions: [
          { missionNumber: 1, status: "completed" },
          { missionNumber: 2, status: "current" },
          ...Array.from({ length: 8 }, (_, index) => ({ missionNumber: index + 3, status: "locked" })),
        ],
      };
    },
  });

  assert.deepEqual(state, { kind: "returning", totalXp: 60, completedMissions: 1, currentMission: 2 });
  assert.match(landing, /state\.totalXp/);
  assert.match(landing, /state\.completedMissions/);
  assert.match(landing, /state\.currentMission/);
  assert.doesNotMatch(landing, /330 XP|3 rules active|1 of 10 complete/);
});

test("Mission 04 and Mission 05 remain server-owned current states", async () => {
  const missionFour = await resolveTenStepsLandingState({
    getSession: async () => ({ user: { id: "user-1" } }),
    getDashboard: async () => ({
      totalXp: 230,
      currentMission: 4,
      missions: [
        ...Array.from({ length: 3 }, (_, index) => ({ missionNumber: index + 1, status: "completed" })),
        { missionNumber: 4, status: "current" },
        ...Array.from({ length: 6 }, (_, index) => ({ missionNumber: index + 5, status: "locked" })),
      ],
    }),
  });
  assert.deepEqual(missionFour, { kind: "returning", totalXp: 230, completedMissions: 3, currentMission: 4 });

  const missionFive = await resolveTenStepsLandingState({
    getSession: async () => ({ user: { id: "user-1" } }),
    getDashboard: async () => ({
      totalXp: 330,
      currentMission: 5,
      missions: [
        ...Array.from({ length: 4 }, (_, index) => ({ missionNumber: index + 1, status: "completed" })),
        { missionNumber: 5, status: "current" },
        ...Array.from({ length: 5 }, (_, index) => ({ missionNumber: index + 6, status: "locked" })),
      ],
    }),
  });
  assert.deepEqual(missionFive, { kind: "returning", totalXp: 330, completedMissions: 4, currentMission: 5 });
});

test("core content remains SSR-first, visible by default and responsive", () => {
  assert.doesNotMatch(page, /["']use client["']/);
  assert.doesNotMatch(landing, /["']use client["']|useEffect|IntersectionObserver|fetch\(/);
  assert.doesNotMatch(styles, /opacity:\s*0|visibility:\s*hidden/);
  assert.match(styles, /@media \(max-width: 900px\)/);
  assert.match(styles, /@media \(max-width: 380px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(landing, /<ActionLink/);
  assert.match(actionStyles, /\.action:focus-visible/);
  assert.match(actionStyles, /min-height: var\(--sb-action-height, 64px\)/);
});
