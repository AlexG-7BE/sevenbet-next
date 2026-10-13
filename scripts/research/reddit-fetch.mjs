// Collect public Reddit posts and comments for the "before it goes wrong" research corpus
// (strategy of 13 October 2026). Reads Reddit's public JSON listings only — no login, no API
// key — from a GitHub-hosted runner, because reddit.com and the archive APIs refuse the
// Founder's machine. Output: research/reddit/<subreddit>-<query>.jsonl, one post or comment per
// line with id, created_utc, subreddit, title/body and score; never a username.
//
//   node scripts/research/reddit-fetch.mjs "sweden:spelpaus,casino,spelberoende" "Denmark:rofus,ludoman,casino"
//
import { mkdirSync, writeFileSync } from "node:fs";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const headers = { "user-agent": "b4gamble-research/1.0 (contact: support@b4gamble.com)", accept: "application/json" };
const specs = process.argv.slice(2).map((arg) => {
  const [subreddit, queries] = arg.split(":");
  return { subreddit, queries: (queries ?? "").split(",").map((q) => q.trim()).filter(Boolean) };
});
if (!specs.length) {
  console.error('usage: node scripts/research/reddit-fetch.mjs "subreddit:query1,query2" ...');
  process.exit(2);
}
mkdirSync("research/reddit", { recursive: true });

async function listing(url) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, { headers });
    if (response.ok) return response.json();
    if (response.status === 429 || response.status >= 500) {
      await sleep(5000 * attempt);
      continue;
    }
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  throw new Error(`gave up on ${url}`);
}

function strip(item) {
  const data = item.data ?? {};
  return {
    id: data.id ?? null,
    kind: item.kind ?? null,
    subreddit: data.subreddit ?? null,
    created_utc: data.created_utc ?? null,
    score: data.score ?? null,
    title: data.title ?? null,
    text: data.selftext ?? data.body ?? null,
    permalink: data.permalink ?? null,
  };
}

for (const { subreddit, queries } of specs) {
  for (const query of queries) {
    const rows = [];
    let after = null;
    for (let page = 0; page < 4; page += 1) {
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&t=all&limit=100${after ? `&after=${after}` : ""}`;
      const json = await listing(url);
      const children = json?.data?.children ?? [];
      rows.push(...children.map(strip));
      after = json?.data?.after ?? null;
      if (!after) break;
      await sleep(2500);
    }
    // Comments of the top posts: the language lives in the replies.
    const top = rows.filter((row) => row.permalink).slice(0, 25);
    for (const post of top) {
      const json = await listing(`https://www.reddit.com${post.permalink}.json?limit=200`);
      const comments = json?.[1]?.data?.children ?? [];
      rows.push(...comments.filter((c) => c.kind === "t1").map(strip));
      await sleep(2500);
    }
    const file = `research/reddit/${subreddit}-${query.replace(/[^a-z0-9]+/gi, "_")}.jsonl`;
    writeFileSync(file, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
    console.log(`${file}: ${rows.length} rows`);
  }
}
