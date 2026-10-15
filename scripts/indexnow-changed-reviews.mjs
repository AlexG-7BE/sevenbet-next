// Announce to IndexNow only the review pages a Production deploy changed (affiliate traffic
// audit, 15 October 2026). Run by .github/workflows/indexnow-resubmit.yml after Vercel reports a
// successful Production deployment; the manual full resubmit (scripts/indexnow-submit.mjs) stays.
//
//   node scripts/indexnow-changed-reviews.mjs --base <sha> --head <sha>            # dry run
//   node scripts/indexnow-changed-reviews.mjs --base <sha> --head <sha> --submit   # sends them
//
// A review changes on deploy through its long Swedish or Danish review
// (lib/casino-profile/in-depth/{sv,da}.ts); database edits are announced by the admin publish
// (lib/seo/indexnow.ts). Only URLs the live sitemap lists are sent, so a review kept out of the
// index is never announced. Dependency-free.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://b4gamble.com";
const ENDPOINT = "https://api.indexnow.org/indexnow";
export const IN_DEPTH_FILES = Object.freeze({
  sv: "lib/casino-profile/in-depth/sv.ts",
  da: "lib/casino-profile/in-depth/da.ts",
});

const ENTRY_START = /^ {2}"?([a-z0-9][a-z0-9-]*)"?: \{\s*$/;

/** The top-level review entries of an in-depth file: slug → its source text. */
export function inDepthEntries(source) {
  const entries = new Map();
  let slug = null;
  let lines = [];
  for (const line of String(source ?? "").split("\n")) {
    const start = ENTRY_START.exec(line);
    if (start || /^\};?\s*$/.test(line)) {
      if (slug) entries.set(slug, lines.join("\n"));
      slug = start ? start[1] : null;
      lines = [];
      continue;
    }
    if (slug) lines.push(line);
  }
  if (slug) entries.set(slug, lines.join("\n"));
  return entries;
}

/** Slugs whose review was added or changed between two versions of an in-depth file. */
export function changedInDepthSlugs(before, after) {
  const old = inDepthEntries(before);
  return [...inDepthEntries(after)].filter(([slug, text]) => old.get(slug) !== text).map(([slug]) => slug);
}

/** The review URLs a deploy from `base` to `head` changed, given a reader of files at a revision. */
export function changedReviewUrls(readAt, base, head) {
  return Object.entries(IN_DEPTH_FILES).flatMap(([language, path]) =>
    changedInDepthSlugs(readAt(base, path), readAt(head, path)).map((slug) => `${ORIGIN}/${language}/casino/${slug}`));
}

function gitShow(revision, path) {
  try {
    return execFileSync("git", ["show", `${revision}:${path}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

async function main() {
  const argument = (name) => {
    const index = process.argv.indexOf(name);
    return index > 0 ? process.argv[index + 1] : undefined;
  };
  const base = argument("--base");
  const head = argument("--head") ?? "HEAD";
  if (!base) {
    console.log("No previous Production deployment to compare with: nothing to announce.");
    return 0;
  }
  const changed = changedReviewUrls(gitShow, base, head);
  console.log(`${changed.length} changed review URL(s) between ${base.slice(0, 8)} and ${head.slice(0, 8)}`);
  if (!changed.length) return 0;

  const key = /INDEXNOW_KEY = "([0-9a-f]{32})"/.exec(readFileSync(new URL("../lib/seo/indexnow.ts", import.meta.url), "utf8"))?.[1];
  if (!key) throw new Error("INDEXNOW_KEY not found in lib/seo/indexnow.ts");
  const sitemap = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
  const listed = new Set([...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((match) => match[1]));
  const urls = changed.filter((url) => listed.has(url));
  console.log(urls.join("\n") || "None of them is in the sitemap.");
  if (!urls.length || !process.argv.includes("--submit")) return 0;

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(ORIGIN).host, key, keyLocation: `${ORIGIN}/${key}.txt`, urlList: urls }),
  });
  console.log(`IndexNow answered HTTP ${response.status}`);
  return response.status === 200 || response.status === 202 ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().then((code) => process.exit(code), (error) => {
    console.error(error);
    process.exit(1);
  });
}
