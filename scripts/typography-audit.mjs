import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import postcss from "postcss";

const allowedDecorativeMicrotype = new Map([
  ["components/casino-profile/CasinoProfile.module.css::.prosCons section:first-child li::before, .controlTools li::before::8px", "DECORATIVE glyph marker; adjacent list copy carries the meaning"],
  ["components/casino-profile/CasinoProfile.module.css::.prosCons section:last-child li::before, .conditions li::before::8px", "DECORATIVE glyph marker; adjacent list copy carries the meaning"],
  ["components/home/TiltHome.module.css::.cardEyebrow::11px", "DECORATIVE carousel chapter eyebrow; the card title repeats the meaning"],
  ["components/home/TiltHome.module.css::.miniScreen b, .miniScreen small::11px", "DECORATIVE product-theatre screen embedded inside a labelled Programme card"],
  ["components/home/TiltHome.module.css::.heroKicker::9px", "DECORATIVE hero eyebrow; the H1 and body carry the message"],
  ["components/bonus-directory/BonusDirectory.module.css::.heroCopy .eyebrow::11px", "DECORATIVE legacy composition eyebrow; the hero heading carries the message"],
  ["components/bonus-directory/BonusDirectory.module.css::.sectionHeading .eyebrow::10px", "DECORATIVE section notation; the section heading carries the message"],
  ["components/bonus-directory/BonusDirectory.module.css::.controlsIntro .eyebrow::10px", "DECORATIVE section notation; the controls heading carries the message"],
  ["components/bonus-directory/BonusDirectory.module.css::.ledgerIntro span::10px", "DECORATIVE ledger notation; the following heading carries the message"],
]);

const finalPublicPrefixes = [
  "app/(public)/",
  "components/best-offers/",
  "components/bonus-directory/",
  "components/casino-discovery/",
  "components/casino-profile/",
  "components/comparison-context/",
  "components/comparison/",
  "components/home/",
  "components/learning/",
  "components/programme/",
  "components/protected-help/",
  "components/public-shell/",
];
async function sourceFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const location = path.posix.join(root, entry.name);
    return entry.isDirectory() ? sourceFiles(location) : [location];
  }));
  return nested.flat();
}

const files = (await Promise.all([sourceFiles("app"), sourceFiles("components")]))
  .flat()
  .filter((file) => file.endsWith(".css") && (finalPublicPrefixes.some((prefix) => file.startsWith(prefix)) || file === "app/globals.css"));
const violations = [];
const observedExceptions = new Set();
const directCounts = new Map([["9px", 0], ["10px", 0], ["11px", 0]]);

for (const file of files) {
  const ast = postcss.parse(await readFile(file, "utf8"), { from: file });
  ast.walkDecls((declaration) => {
    const selector = declaration.parent?.selector ?? "";
    if (file === "app/globals.css" && !selector.includes("commercialOutbound")) return;
    if (declaration.prop !== "font-size" && declaration.prop !== "font") return;
    const measurements = [...declaration.value.matchAll(/(^|\s|\/)([0-9]+(?:\.[0-9]+)?)(px|rem)(?=\s|\/|$)/g)];
    for (const measurement of measurements) {
      const literal = `${measurement[2]}${measurement[3]}`;
      const size = Number(measurement[2]) * (measurement[3] === "rem" ? 16 : 1);
      if (directCounts.has(literal)) directCounts.set(literal, directCounts.get(literal) + 1);
      if (size <= 0 || size >= 12) continue;
      const key = `${file}::${selector}::${literal}`;
      if (declaration.prop === "font-size" && allowedDecorativeMicrotype.has(key)) observedExceptions.add(key);
      else violations.push({ file, selector, property: declaration.prop, value: declaration.value, computedPixels: size });
    }
  });
}

const staleExceptions = [...allowedDecorativeMicrotype.keys()].filter((key) => !observedExceptions.has(key));
if (violations.length || staleExceptions.length) {
  if (violations.length) console.error("Unclassified sub-12px declarations:", violations);
  if (staleExceptions.length) console.error("Stale decorative allowlist entries:", staleExceptions);
  process.exit(1);
}

console.log(`Typography audit PASS: ${files.length} final-public CSS files; direct 9px=${directCounts.get("9px")}, 10px=${directCounts.get("10px")}, 11px=${directCounts.get("11px")}; ${observedExceptions.size} explicitly classified DECORATIVE exceptions; 0 FUNCTIONAL/DECISION/BODY/CONTROL violations.`);
for (const [key, reason] of allowedDecorativeMicrotype) console.log(`ALLOW ${key} — ${reason}`);
