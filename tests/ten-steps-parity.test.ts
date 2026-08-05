import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { resolveTenStepsLandingState } from "../lib/ten-steps-landing";

const page = readFileSync("app/(public)/10-steps/page.tsx", "utf8");
const landing = readFileSync("app/(public)/10-steps/TenStepsLanding.tsx", "utf8");
const layout = readFileSync("app/(public)/layout.tsx", "utf8");
const styles = readFileSync("app/(public)/10-steps/TenStepsLanding.module.css", "utf8");

test("10 Steps keeps the approved section contract inside the Public Shell", () => {
  const approvedOrder = [
    "hero",
    "programme-builds",
    "editorial-contract",
    "mission-map",
    "account-boundary",
    "evidence",
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
  assert.equal((landing.match(/<h1\b/g) ?? []).length, 2, "the mutually exclusive hero states each own one H1");
  assert.match(landing, /aria-labelledby="ten-steps-title"/);
  assert.match(landing, /<ol className=\{styles\.missionList\}>/);
});

test("10 Steps uses the canonical Programme entry and no commercial body CTA", () => {
  assert.equal((landing.match(/href="\/program"/g) ?? []).length, 3);
  assert.doesNotMatch(landing, /href="\/(?:casinos|bonuses|best-offers|r\/|go\/)/);
  assert.doesNotMatch(landing, /\?mission=|missionIndex|localStorage|sessionStorage/);
  assert.match(page, /alternates:\s*\{ canonical: absoluteUrl\("\/10-steps"\) \}/);
});

test("10 Steps removes legacy reward and unsupported market claims", () => {
  const combined = `${page}\n${landing}\n${styles}`;
  assert.doesNotMatch(combined, /\+\s*20\s*XP/i);
  assert.doesNotMatch(combined, /UK PREVIEW|UK-ready discovery/i);
  assert.match(landing, /SAVE TO EARN/);
  assert.match(landing, /Awarded after account creation\./);
  assert.match(landing, /Programme, pause and Help data are not used for affiliate targeting or commercial personalisation\./);
});

test("anonymous, unclaimed and unavailable states never invent Programme truth", async () => {
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

  const signedInWithoutClaim = await resolveTenStepsLandingState({
    getSession: async () => ({ user: { id: "user-1" } }),
    getDashboard: async () => {
      throw new Error("Program enrollment not found");
    },
  });
  assert.deepEqual(signedInWithoutClaim, { kind: "signed-in-fallback" });
});

test("returning state exposes only server-owned XP, progress and next Mission", async () => {
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
          ...Array.from({ length: 8 }, (_, index) => ({ missionNumber: index + 3, status: "not_started" })),
        ],
      };
    },
  });

  assert.deepEqual(state, {
    kind: "returning",
    totalXp: 60,
    completedMissions: 1,
    currentMission: 2,
  });
  assert.match(landing, /state\.totalXp/);
  assert.match(landing, /state\.completedMissions/);
  assert.match(landing, /state\.currentMission/);
  assert.doesNotMatch(landing, /330 XP|3 rules active|1 of 10 complete/);
});

test("10 Steps remains server rendered with visible-by-default responsive content", () => {
  assert.doesNotMatch(page, /["']use client["']/);
  assert.doesNotMatch(landing, /["']use client["']|useEffect|IntersectionObserver|fetch\(/);
  assert.doesNotMatch(styles, /opacity:\s*0|visibility:\s*hidden/);
  assert.match(styles, /@media \(max-width: 900px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
