import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(path, "utf8");
}

function filesBelow(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

test("public copy excludes bounded high-risk positive claims while preserving disclaimers", () => {
  const publicCopy = [
    ...filesBelow("app/(public)"),
    ...filesBelow("components/home"),
    ...filesBelow("components/programme"),
    ...filesBelow("components/casino-discovery"),
    ...filesBelow("components/casino-profile"),
  ].filter((path) => /\.(ts|tsx)$/.test(path)).map(source).join("\n");

  const prohibited = [
    /\b(?:a|the|this) safe casino\b/i,
    /\bready to gamble\b/i,
    /\bcontrol (?:is )?verified\b/i,
    /\b(?:b4gamble|sevenbet|the programme|the program) (?:can |will )?treats? gambling addiction\b/i,
    /\brecover from gambling addiction (?:so you can|and) (?:gamble|play)\b/i,
    /\brisk-free gambling (?:experience|product|offer)\b/i,
  ];
  for (const phrase of prohibited) assert.doesNotMatch(publicCopy, phrase);
  assert.match(publicCopy, /does not diagnose or treat gambling addiction/);
  assert.match(publicCopy, /Completion does not mean gambling is safe or suitable/);
});

test("commercial surfaces state the enforced compensation boundary without aspirational wording", () => {
  const files = [
    "app/(public)/affiliate-disclosure/AffiliateDisclosureDocument.tsx",
    "app/(public)/methodology/MethodologyDocument.tsx",
    "app/(public)/casinos/page.tsx",
    "components/best-offers/BestOffersExperience.tsx",
    "app/(public)/bonuses/page.tsx",
  ];
  for (const file of files) {
    const text = source(file);
    assert.match(text, /Affiliate compensation does not determine (?:B4GAMBLE(?:&apos;|')s )?Editor Score or natural editorial\s+ranking/);
    assert.doesNotMatch(text, /should not automatically determine|independent casino discovery/i);
  }
});

test("local control tools remain client-local, non-commercial and free of tracking SDKs", () => {
  const selfCheck = source("app/(public)/self-check/SelfCheckFlow.tsx");
  const limitTracker = source("app/(public)/tools/budget-calculator/PersonalLimitTracker.tsx");
  for (const text of [selfCheck, limitTracker]) {
    assert.doesNotMatch(text, /fetch\(|axios|localStorage|\/api\/|href=["'{]\/(?:casinos|bonuses|best-offers|compare|r|go)(?:\/|["'}])/i);
    assert.doesNotMatch(text, /@vercel\/analytics|@\/lib\/analytics|@\/components\/analytics|google-analytics|googletagmanager|\bgtag\(|\bfbq\(|clarity\.ms|segment\.com/i);
  }
});
