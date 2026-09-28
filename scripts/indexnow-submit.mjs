// Announce every URL in the Production sitemap to IndexNow (Bing, Yandex, Seznam, Naver).
// Publishing in the admin already announces the pages it changes (lib/seo/indexnow.ts);
// this script is for a full resubmission, e.g. once after launch.
//
//   node scripts/indexnow-submit.mjs            # dry run: prints what would be sent
//   node scripts/indexnow-submit.mjs --submit   # sends it
//
// Dependency-free. The key file must already be live at https://b4gamble.com/<key>.txt.

import { readFileSync } from "node:fs";

const ORIGIN = "https://b4gamble.com";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const key = /INDEXNOW_KEY = "([0-9a-f]{32})"/.exec(readFileSync(new URL("../lib/seo/indexnow.ts", import.meta.url), "utf8"))?.[1];
if (!key) throw new Error("INDEXNOW_KEY not found in lib/seo/indexnow.ts");

const submit = process.argv.includes("--submit");
const keyResponse = await fetch(`${ORIGIN}/${key}.txt`);
const keyBody = (await keyResponse.text()).trim();
if (!keyResponse.ok || keyBody !== key) {
  console.error(`Key file ${ORIGIN}/${key}.txt is not live (HTTP ${keyResponse.status}); deploy first.`);
  process.exit(1);
}

const sitemap = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
const urls = [...new Set([...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((match) => match[1]))]
  .filter((url) => url.startsWith(`${ORIGIN}/`));
console.log(`${urls.length} sitemap URLs`);
if (!submit) {
  console.log(urls.slice(0, 10).join("\n"));
  console.log("Dry run. Add --submit to send them.");
  process.exit(0);
}

const response = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(ORIGIN).host, key, keyLocation: `${ORIGIN}/${key}.txt`, urlList: urls.slice(0, 10_000) }),
});
console.log(`IndexNow answered HTTP ${response.status}`);
process.exit(response.status === 200 || response.status === 202 ? 0 : 1);
