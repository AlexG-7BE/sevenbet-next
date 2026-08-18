import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import generatedPages from "@/lib/final-handoff/generated-pages.json";
import {
  transformBonusGuideHandoff,
  transformCommonHandoff,
  transformHelpHandoff,
  transformLearnHandoff,
} from "@/lib/final-handoff/transforms";
import { learningArticles } from "@/lib/learning-center";

function transformed(name: keyof typeof generatedPages, pageTransform?: (html: string) => string) {
  const common = transformCommonHandoff(generatedPages[name].html);
  return pageTransform ? pageTransform(common) : common;
}

test("public handoff-derived runtime copy removes unsupported absolute claims", () => {
  const runtime = Object.keys(generatedPages)
    .map((name) => transformed(name as keyof typeof generatedPages))
    .join("\n");
  const prohibited = [
    "Tested with real money — our own.",
    "Updated weekly",
    "No sponsored guides",
    "Corrections ship within 48 hours of verification.",
    "Raw test records are retained for 24 months",
    "Delete everything, any time, in one action.",
    "Deletion is immediate and irreversible.",
    "A human from our team, within 24 hours.",
  ];
  for (const claim of prohibited) assert.doesNotMatch(runtime, new RegExp(claim.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  assert.match(runtime, /Affiliate compensation does not determine Editor Score or natural editorial ranking/);
  assert.match(runtime, /legal and backup retention may apply/i);
});

test("Learn runtime is backed by the current manifest with unique real article routes", () => {
  const runtime = transformed("learn", transformLearnHandoff);
  const paths = [...runtime.matchAll(/<a href="([^"]+)" data-learn-category="[^"]+" class="scp3"/g)].map((match) => match[1]);
  assert.equal(paths.length, learningArticles.length);
  assert.equal(new Set(paths).size, learningArticles.length);
  assert.ok(paths.every((path) => path.startsWith("/learn/") && !path.includes("#")));
  assert.match(runtime, /type="search" aria-label="Search guides"/);
});

test("Bonus Guide keeps fictional examples separate from current GB primary sources", () => {
  const runtime = transformed("article", transformBonusGuideHandoff);
  assert.match(runtime, /Educational examples · not current offers/);
  assert.match(runtime, /Current GB rule/);
  assert.match(runtime, /prohibits wagering requirements over 10 times the incentive/);
  assert.match(runtime, /https:\/\/www\.gamblingcommission\.gov\.uk\/licensees-and-businesses\/lccp\/condition\/5-1-1-sr-code/);
  assert.match(runtime, /https:\/\/www\.asa\.org\.uk\/advice-online\/gambling-betting-and-gaming-free-bets-and-bonuses\.html/);
  assert.doesNotMatch(runtime, /from our current test set|real offer|real-money tested/i);
});

test("protected Help remains commercial-free after the runtime transform", () => {
  const runtime = transformed("help", transformHelpHandoff);
  assert.doesNotMatch(runtime, /href="\/(?:best-offers|casinos|bonuses|r\/|go\/)/);
  assert.match(runtime, /Protected Help activity is not used for offers, rankings or commercial personalisation/);
  assert.match(runtime, /rel="noopener noreferrer" target="_blank"/);
});

test("real dynamic release surfaces keep runtime renderers and fail-closed demo actions", () => {
  const bestOffersPage = readFileSync("app/(public)/best-offers/page.tsx", "utf8");
  const bestOffers = readFileSync("components/best-offers/BestOffersExperience.tsx", "utf8");
  const casinos = readFileSync("app/(public)/casinos/page.tsx", "utf8");
  const programme = readFileSync("app/program/page.tsx", "utf8");
  assert.match(bestOffersPage, /data-runtime-renderer="best-offers"/);
  assert.match(casinos, /data-runtime-renderer="casinos"/);
  assert.match(programme, /data-public-programme-renderer="program-ai"/);
  assert.match(bestOffers, /if \(offer\.dataClassification === "DEMO_FIXTURE"\) return null/);
  assert.match(bestOffers, /No commercial visit is available|Offer currently unavailable/);
  assert.doesNotMatch(bestOffersPage + bestOffers + casinos + programme, /<HandoffPage/);
});

test("Prisma tooling resolves the patched deepmerge implementation", () => {
  const packageManifest = JSON.parse(readFileSync("package.json", "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    overrides?: Record<string, string>;
  };
  const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8")) as {
    packages: Record<string, { version?: string }>;
  };
  assert.equal(packageManifest.dependencies?.prisma, undefined);
  assert.equal(packageManifest.devDependencies?.prisma, "^6.19.3");
  assert.equal(packageManifest.overrides?.["deepmerge-ts"], "8.0.0");
  assert.equal(packageLock.packages["node_modules/deepmerge-ts"]?.version, "8.0.0");
});
