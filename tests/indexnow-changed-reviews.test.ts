import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { changedInDepthSlugs, changedReviewUrls, inDepthEntries, IN_DEPTH_FILES } from "../scripts/indexnow-changed-reviews.mjs";

const file = (entries: Record<string, string>) => [
  'import type { CasinoInDepthReview } from "./types";',
  "",
  "export const SV_IN_DEPTH: Readonly<Record<string, CasinoInDepthReview>> = {",
  ...Object.entries(entries).flatMap(([slug, text]) => [`  ${/-/.test(slug) ? `"${slug}"` : slug}: {`, `    checked: "2026-10-15",`, `    parts: [{ title: "T", paragraphs: ["${text}"] }],`, "  },"]),
  "};",
  "",
].join("\n");

test("the parser reads every top-level review of the real in-depth files", () => {
  for (const path of Object.values(IN_DEPTH_FILES)) {
    const source = readFileSync(path, "utf8");
    const entries = inDepthEntries(source);
    assert.ok(entries.size >= 9, `${path}: ${entries.size}`);
    for (const [slug, text] of entries) assert.match(text, /checked: "\d{4}-\d{2}-\d{2}"/, `${path} ${slug}`);
  }
});

test("only added or changed reviews are announced", () => {
  const before = file({ betsson: "a", "ahti-games": "b", nordicbet: "c" });
  const after = file({ betsson: "a", "ahti-games": "B", nordicbet: "c", playojo: "d" });
  assert.deepEqual(changedInDepthSlugs(before, after), ["ahti-games", "playojo"]);
  assert.deepEqual(changedInDepthSlugs(after, after), []);
  assert.deepEqual(changedInDepthSlugs("", file({ betsson: "a" })), ["betsson"], "a new file announces its reviews");
});

test("changed reviews map to their language's review URLs", () => {
  const sources: Record<string, Record<string, string>> = {
    "old:lib/casino-profile/in-depth/sv.ts": { betsson: "a" },
    "new:lib/casino-profile/in-depth/sv.ts": { betsson: "a2" },
    "old:lib/casino-profile/in-depth/da.ts": { spilnu: "x" },
    "new:lib/casino-profile/in-depth/da.ts": { spilnu: "x" },
  };
  const readAt = (revision: string, path: string) => file(sources[`${revision}:${path}`] ?? {});
  assert.deepEqual(changedReviewUrls(readAt, "old", "new"), ["https://b4gamble.com/sv/casino/betsson"]);
});

test("the workflow runs after a successful Production deployment and keeps the manual full resubmit", () => {
  const workflow = readFileSync(".github/workflows/indexnow-resubmit.yml", "utf8");
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /deployment_status:/);
  assert.match(workflow, /github\.event\.deployment_status\.state == 'success'/);
  assert.match(workflow, /github\.event\.deployment\.environment == 'Production'/);
  assert.match(workflow, /node scripts\/indexnow-submit\.mjs --submit/);
  assert.match(workflow, /node scripts\/indexnow-changed-reviews\.mjs --base/);
});
