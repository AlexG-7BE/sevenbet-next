import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const privacy = read("app/(public)/privacy/page.tsx");
const terms = read("app/(public)/terms/page.tsx");
const generated = JSON.parse(read("lib/final-handoff/generated-pages.json")) as Record<string, { html: string }>;
const privacyDocument = privacy + generated.privacy.html.replaceAll("&amp;", "&");
const termsDocument = terms + generated.terms.html.replaceAll("&amp;", "&");
const handoffLegalPage = read("app/(public)/_legal/HandoffLegalPage.tsx");
const selfPage = read("app/(public)/self-check/page.tsx");
const selfFlow = read("app/(public)/self-check/SelfCheckFlow.tsx");
const trackerPage = read("app/(public)/tools/budget-calculator/page.tsx");
const tracker = read("app/(public)/tools/budget-calculator/PersonalLimitTracker.tsx");
const trackerLayout = read("app/(public)/tools/budget-calculator/layout.tsx");
const about = read("app/(public)/about/AboutDocument.tsx");
const aboutCss = read("app/(public)/about/AboutPage.module.css");
const aboutCatalog = read("lib/i18n/static-pages/about.ts");

const placeholders = /\[(?:LEGAL ENTITY|CONTROLLER LEGAL NAME|PRIVACY EMAIL|CONTACT EMAIL|SERVICE ADDRESS)\]|OWNER DECISION REQUIRED|placeholder|coming soon/iu;

test("Privacy is the substantive final handoff document and stays noindex/follow", () => {
  assert.doesNotMatch(privacy, /["']use client["']/);
  assert.match(privacy, /title:\s*"Privacy Policy \| B4GAMBLE"/);
  assert.match(privacy, /canonical:\s*absoluteUrl\("\/privacy"\)/);
  assert.match(privacy, /robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);
  for (const content of ["Information we use", "Why we use it and our legal bases", "Cookies and similar technology", "Your UK data-protection rights", "How long we keep information", "We do not sell personal data", "updated=\"24 August 2026\""]) assert.ok(privacyDocument.includes(content), content);
  assert.match(handoffLegalPage, /Privacy[\s\S]*by default/);
  assert.doesNotMatch(privacyDocument, placeholders);
  assert.doesNotMatch(privacyDocument + handoffLegalPage, /Accept Privacy Policy|cookie banner|consent checkbox/iu);
});

test("Terms is the substantive final handoff document and preserves consumer boundaries", () => {
  assert.doesNotMatch(terms, /["']use client["']/);
  assert.match(terms, /canonical:\s*absoluteUrl\("\/terms"\)/);
  assert.match(terms, /robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);
  assert.match(termsDocument, /We are not a casino/i);
  for (const content of ["What this service is", "Eligibility — 18+", "Your account", "Accuracy & liability", "Content & changes", "Nothing here is financial, legal or medical advice", "we are not liable for losses arising from gambling decisions", "compensation never changes a score"]) assert.ok(termsDocument.includes(content), content);
  assert.doesNotMatch(termsDocument, placeholders);
  assert.doesNotMatch(termsDocument + handoffLegalPage, /accept terms checkbox|I accept|Agree to Terms/iu);
});

test("Self-Check compatibility route consolidates into Responsible Gambling", () => {
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
  assert.match(selfPage, /permanentRedirect\("\/responsible-gambling"\)/);
  assert.match(selfFlow, /href: "\/program"/);
  assert.match(selfFlow, /href: "\/help"/);
  assert.doesNotMatch(selfFlow, /getProfile|Planning-Oriented Player|Confident but Continue Reviewing|Building Healthy Habits|localStorage|sessionStorage|fetch\(|axios|use server|score|totalScore/);
  assert.doesNotMatch(selfFlow + selfPage, /href=["'{]\/+(?:casinos|bonuses|best-offers|compare|r|go)(?:\/|["'}])/);
});

test("Personal Limit Tracker compatibility route consolidates into Responsible Gambling", () => {
  assert.doesNotMatch(trackerPage + trackerLayout, /["']use client["']/);
  assert.match(trackerPage, /permanentRedirect\("\/responsible-gambling"\)/);
  assert.match(tracker, /remaining = Math\.max\(cap\.value - used\.value, 0\)/);
  assert.match(tracker, /usedPercentage = cap\.value > 0 \? \(used\.value \/ cap\.value\) \* 100 : 0/);
  assert.match(tracker, /projectedTotal = used\.value \+ planned\.value/);
  assert.match(tracker, /projectedRemaining = cap\.value - projectedTotal/);
  assert.match(tracker, /overBy = Math\.max\(projectedTotal - cap\.value, 0\)/);
  assert.match(tracker, /Enter a limit greater than £0/);
  assert.match(tracker, /href="\/help"/);
  assert.doesNotMatch(tracker, /ratio|0\.1|0\.2|0\.3|Recommended|stopLoss|45 min|localStorage|sessionStorage|fetch\(|axios|use server/);
  assert.doesNotMatch(tracker + trackerPage, /href=["'{]\/+(?:casinos|bonuses|best-offers|compare|r|go)(?:\/|["'}])/);
});

test("About uses the final handoff visual family and three-part product model", () => {
  assert.match(aboutCss, /min-height:88svh/);
  assert.match(aboutCss, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(aboutCss, /hero-outcome\.jpg/);
  for (const text of ["Built to be", "on your side", "The Programme", "Research & education", "Commercial discovery", "How we make money", "What stays separate", "What B4GAMBLE is not", "Protected Help"]) assert.ok((about + aboutCatalog).includes(text), text);
  for (const section of ["hero", "three-parts", "commercial-separation", "clear-lines"]) assert.match(about, new RegExp(`data-about-section="${section}"`));
});

test("FE-GAP-01 product boundaries survive the authorized legal remediation", () => {
  const changed = [...new Set([
    ...execFileSync("git", ["diff", "--name-only", "origin/main"], { encoding: "utf8" }).trim().split("\n").filter(Boolean),
    ...execFileSync("git", ["status", "--short", "--untracked-files=all"], { encoding: "utf8" }).trim().split("\n").filter(Boolean).map((line) => line.slice(3)),
  ])];
  const prismaChanges = changed.filter((path) => /^prisma\//.test(path)).sort();
  if (prismaChanges.length > 0) {
    const approvedExactPrismaChangeSets = [
      ["prisma/migrations/0020_commercial_ops_01/migration.sql", "prisma/schema.prisma"],
      ["prisma/migrations/0021_partner_ops_work_bridge_01/migration.sql", "prisma/schema.prisma"],
      [
        "prisma/fixtures/0022_post_0020_accounts.sql",
        "prisma/fixtures/0022_post_0021_oauth.sql",
        "prisma/fixtures/0022_unsupported_account.sql",
        "prisma/migrations/0022_better_auth_17_schema_upgrade/migration.sql",
        "prisma/schema.prisma",
      ],
      ["prisma/migrations/0023_mcp_dcr_runtime_compat_fix/migration.sql"],
      [
        "prisma/fixtures/0024_pre_programme_access_acceptance.sql",
        "prisma/migrations/0024_programme_access_acceptance/migration.sql",
        "prisma/preflight/0024_programme_access_acceptance.sql",
        "prisma/schema.prisma",
      ],
      [
        "prisma/fixtures/0025_pre_casino_market_profile.sql",
        "prisma/migrations/0025_casino_market_profile_architecture/migration.sql",
      ],
    ];
    assert.ok(approvedExactPrismaChangeSets.some(
      (approved) => JSON.stringify(prismaChanges) === JSON.stringify(approved),
    ));
  }
  if (changed.includes("app/(public)/layout.tsx")) {
    const publicLayout = read("app/(public)/layout.tsx");
    assert.match(publicLayout, /resolveServerPresentationContext/);
    assert.match(publicLayout, /publicShellMessages\(presentation\.locale\)/);
    assert.match(publicLayout, /<PublicHeader[^>]+presentation=\{presentation\}/s);
    assert.match(publicLayout, /<PublicFooter presentation=\{presentation\}/);
    assert.doesNotMatch(publicLayout, /@prisma|commercialAllowed|referralAllowed|affiliate/i);
  }
});
