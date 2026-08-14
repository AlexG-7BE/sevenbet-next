import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const privacy = read("app/(public)/privacy/page.tsx");
const terms = read("app/(public)/terms/page.tsx");
const legalDocument = read("app/(public)/_legal/LegalDocument.tsx");
const selfPage = read("app/(public)/self-check/page.tsx");
const selfFlow = read("app/(public)/self-check/SelfCheckFlow.tsx");
const trackerPage = read("app/(public)/tools/budget-calculator/page.tsx");
const tracker = read("app/(public)/tools/budget-calculator/PersonalLimitTracker.tsx");
const trackerLayout = read("app/(public)/tools/budget-calculator/layout.tsx");
const about = read("app/(public)/about/AboutDocument.tsx");
const aboutCss = read("app/(public)/about/AboutPage.module.css");

const placeholders = /\[(?:LEGAL ENTITY|CONTROLLER LEGAL NAME|PRIVACY EMAIL|CONTACT EMAIL|SERVICE ADDRESS)\]|OWNER DECISION REQUIRED|placeholder|coming soon|\bdraft\b/iu;

test("Privacy is substantive, server rendered, noindex/follow, and uses the approved Figma authority", () => {
  assert.doesNotMatch(privacy, /["']use client["']/);
  assert.match(privacy, /family="924:2798"/);
  assert.match(privacy, /desktopNode="924:2799"/);
  assert.match(privacy, /mobileNode="924:2926"/);
  assert.match(privacy, /title: "Privacy Policy \| B4GAMBLE"/);
  assert.match(privacy, /canonical: absoluteUrl\("\/privacy"\)/);
  assert.match(privacy, /robots: \{ index: false, follow: true \}/);
  assert.match(privacy, /7BE Inc\., trading as B4GAMBLE/);
  assert.match(privacy, /447 Broadway, 2nd Floor, 1663/);
  assert.match(privacy, /New York, NY 10013/);
  assert.match(privacy, /privacy@7be\.io/);
  assert.match(privacy, /Self-Check works locally in your browser/);
  assert.match(privacy, /Personal Gambling Limit Tracker processes the amounts you enter locally/);
  assert.match(privacy, /Protected Help is separated from B4GAMBLE/);
  assert.match(privacy, /Private control data does not become commercial targeting/);
  assert.doesNotMatch(privacy, placeholders);
  assert.doesNotMatch(privacy + legalDocument, /Accept Privacy Policy|cookie banner|consent checkbox/iu);
});

test("Terms is substantive, server rendered, noindex/follow, and preserves consumer boundaries", () => {
  assert.doesNotMatch(terms, /["']use client["']/);
  assert.match(terms, /family="924:3020"/);
  assert.match(terms, /desktopNode="924:3021"/);
  assert.match(terms, /mobileNode="924:3144"/);
  assert.match(terms, /canonical: absoluteUrl\("\/terms"\)/);
  assert.match(terms, /robots: \{ index: false, follow: true \}/);
  assert.match(terms, /7BE Inc\., trading as B4GAMBLE/);
  assert.match(terms, /447 Broadway, 2nd Floor, 1663/);
  assert.match(terms, /info@7be\.io/);
  assert.match(terms, /B4GAMBLE is not a gambling operator/i);
  assert.match(terms, /Future eligible governed B4GAMBLE links may be affiliate links/);
  assert.match(terms, /Affiliate compensation does not determine B4GAMBLE&apos;s Editor Score or natural editorial ranking/);
  assert.match(terms, /Self-Check is a non-clinical reflection tool/);
  assert.match(terms, /does not use it to determine how much gambling is safe or affordable/);
  assert.match(terms, /Nothing in these Terms excludes or limits liability where doing so would be unlawful/);
  assert.match(terms, /mandatory consumer protections/);
  assert.match(terms, /effective="7 August 2026" updated="9 August 2026"/);
  assert.doesNotMatch(terms, placeholders);
  assert.doesNotMatch(terms + legalDocument, /accept terms checkbox|I accept|Agree to Terms/iu);
});

test("Self-Check uses exactly eight semantic questions and deterministic non-score routing", () => {
  const questionBlock = selfFlow.match(/const questions = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
  assert.equal((questionBlock.match(/^\s{2}"/gm) ?? []).length, 8);
  for (const answer of ['"no"', '"once"', '"repeated"', '"skip"']) assert.match(selfFlow, new RegExp(answer));
  assert.match(selfFlow, /concern\(answers\[4\]\)/);
  assert.match(selfFlow, /concern\(answers\[6\]\)/);
  assert.match(selfFlow, /answers\[2\] === "repeated"/);
  assert.match(selfFlow, /answers\[3\] === "repeated"/);
  assert.match(selfFlow, /ordinaryConcernCount >= 3/);
  assert.match(selfFlow, /Array\(questions\.length\)\.fill\(undefined\)/);
  assert.match(selfFlow, /No current concerns flagged/);
  assert.match(selfFlow, /Some areas worth reviewing/);
  assert.match(selfFlow, /Help-first/);
  assert.match(selfPage, /Answers stay in this browser session/);
  assert.match(selfPage, /data-self-check-nojs/);
  assert.match(selfFlow, /href: "\/program"/);
  assert.match(selfFlow, /href: "\/help"/);
  assert.doesNotMatch(selfFlow, /getProfile|Planning-Oriented Player|Confident but Continue Reviewing|Building Healthy Habits|localStorage|sessionStorage|fetch\(|axios|use server|score|totalScore/);
  assert.doesNotMatch(selfFlow + selfPage, /href=["'{]\/+(?:casinos|bonuses|best-offers|compare|r|go)(?:\/|["'}])/);
});

test("Personal Limit Tracker is a server route with exact user-defined calculations", () => {
  assert.doesNotMatch(trackerPage + trackerLayout, /["']use client["']/);
  assert.match(trackerPage, /<PersonalLimitTracker \/>/);
  assert.match(tracker, /remaining = Math\.max\(cap\.value - used\.value, 0\)/);
  assert.match(tracker, /usedPercentage = cap\.value > 0 \? \(used\.value \/ cap\.value\) \* 100 : 0/);
  assert.match(tracker, /projectedTotal = used\.value \+ planned\.value/);
  assert.match(tracker, /projectedRemaining = cap\.value - projectedTotal/);
  assert.match(tracker, /overBy = Math\.max\(projectedTotal - cap\.value, 0\)/);
  assert.match(tracker, /Enter a limit greater than £0/);
  assert.match(trackerPage, /data-limit-tracker-nojs/);
  assert.match(trackerPage, /Values stay in this browser session/);
  assert.match(tracker, /href="\/help"/);
  assert.doesNotMatch(tracker, /ratio|0\.1|0\.2|0\.3|Recommended|stopLoss|45 min|localStorage|sessionStorage|fetch\(|axios|use server/);
  assert.doesNotMatch(tracker + trackerPage, /href=["'{]\/+(?:casinos|bonuses|best-offers|compare|r|go)(?:\/|["'}])/);
});

test("About uses the compact desktop amendment while retaining the established content", () => {
  assert.match(about, /data-figma-compact-hero="923:2694"/);
  assert.match(about, /data-figma-desktop="923:2694"/);
  assert.match(about, /data-figma-mobile="835:5436"/);
  assert.match(aboutCss, /\.hero \{ min-height: 1180px/);
  assert.match(aboutCss, /\.heroInner \{[^}]*min-height: 1180px/);
  assert.doesNotMatch(aboutCss, /min-height:\s*1530px/);
  for (const text of ["Learn", "Reflect", "Understand", "Compare", "Decide", "Review", "The operating model is a sequence", "No financial advice", "Visible affiliate disclosure", "Protected Help"]) assert.ok(about.includes(text));
  for (const section of ["hero", "operating-model", "clear-boundaries", "editorial-principles", "six-step-flow", "what-sevenbet-builds"]) assert.match(about, new RegExp(`data-about-section="${section}"`));
});

test("FE-GAP-01 product boundaries survive the authorized legal remediation", () => {
  const changed = execFileSync("git", ["diff", "--name-only", "origin/main"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  const forbidden = changed.filter((path) => /^(?:prisma\/|package-lock\.json$)/.test(path));
  assert.deepEqual(forbidden, []);
  assert.equal(changed.includes("app/(public)/layout.tsx"), false);
  assert.equal(changed.includes("app/design-system.css"), false);
});
