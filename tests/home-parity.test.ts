import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

const files = {
  page: read("app/(public)/page.tsx"),
  data: read("lib/final-handoff/home.ts"),
  media: read("lib/final-handoff/home-media.ts"),
  markup: read("lib/final-handoff/home-markup.ts"),
  css: read("components/final-handoff/FinalHandoffHome.module.css"),
  shell: read("components/shell/PublicShell.tsx"),
  shellCss: read("components/shell/PublicShell.module.css"),
  action: read("components/ui/Action.tsx"),
  layout: read("app/(public)/layout.tsx"),
};

test("Home route renders the final handoff with the approved metadata and canonical", () => {
  assert.match(files.page, /export const metadata: Metadata/);
  assert.match(files.page, /alternates:\s*\{\s*canonical:\s*"\/"/s);
  assert.match(files.page, /FinalHandoffHome/);
  assert.doesNotMatch(files.page, /home-v2/i);
});

test("Home records every approved canonical and responsive Figma authority", () => {
  const requiredAuthorities = [
    "9eMuI9V2Qeea6mSNQC2oW7:0:3368",
    "kaeqwTrHaFu2tRPB060FiI:181:797",
    "TJTbt1UWQaludMGJ93j8Mr:218:1151",
    "goQO9boRFrjY0DkoDhG7Oc:60:1175",
    "8LVu63MPsQXDdzKeL5oT3t:60:1879",
    "gt1boK7sr8S5KQNR4oTOxo:130:1645",
    "fyukJ5y0A7FQYGSCg5T9eF:148:2382",
    "0JlNK8xRrUK5fSFK9La2qD:152:2567",
    "OFvMXcCJYZjG1XWXyRDLCS:163:3213",
  ];
  for (const authority of requiredAuthorities) assert.match(files.data, new RegExp(authority.replaceAll(":", "\\:")));
});

test("Home keeps the final handoff body sections in order inside one Public Shell", () => {
  const positions = [
    "home-hero",
    "recognition",
    "programme",
    "missions-01-03",
    "missions-04-07",
    "missions-08-10",
    "evidence",
    "trust",
    "final-cta",
  ].map((token) => files.markup.indexOf(token));
  assert.ok(positions.every((position) => position >= 0), `missing sections: ${positions.join(",")}`);
  for (let index = 1; index < positions.length; index += 1) {
    assert.ok(positions[index] > positions[index - 1], `section order drift at index ${index}`);
  }
});

test("Home is server rendered with the carousel as its only client island", () => {
  assert.doesNotMatch(files.page, /^"use client"/m);
  assert.doesNotMatch(files.markup, /^"use client"/m);
  assert.match(files.markup, /HomeProofCarousel/);
  assert.match(read("components/final-handoff/HomeProofCarousel.tsx"), /^"use client"/m);
});

test("Home uses exact bounded local Figma assets and no remote production URL", () => {
  assert.match(files.media, /\/final-handoff\/home\//);
  assert.match(files.media, /sizes=/);
  assert.match(files.media, /loading="lazy"/);
  assert.doesNotMatch(files.media, /figma\.com|figmausercontent|pexels\.com/i);
});

test("Home Programme entry stays internal and commercial acquisition stays outside its narrative", () => {
  assert.match(files.markup, /href="\/program"/);
  assert.doesNotMatch(files.markup, /\/go\/|\/outbound\/|affiliate/i);
});

test("Home does not invent authenticated XP or client-side progress", () => {
  assert.doesNotMatch(files.markup, /XP|localStorage|sessionStorage|useState|useEffect/);
});

test("Home carousel has exactly three truthful previews and accessible 44px controls", () => {
  const carousel = read("components/final-handoff/HomeProofCarousel.tsx");
  assert.match(carousel, /aria-label="Previous example"/);
  assert.match(carousel, /aria-label="Next example"/);
  assert.match(files.css, /min-width:\s*44px/);
  assert.match(files.css, /min-height:\s*44px/);
  assert.equal((files.data.match(/image:\s*HOME_MEDIA\./g) ?? []).length, 3);
});

test("Self Recognition remains static language rather than a diagnostic form", () => {
  assert.match(files.markup, /Self Recognition/);
  assert.doesNotMatch(files.markup, /<form|<input|<textarea/);
});

test("Programme availability and evidence limitations remain truthful", () => {
  assert.match(files.markup, /not medical advice/i);
  assert.match(files.markup, /evidence/i);
});

test("Public Shell keeps its approved architecture while exposing the current brand", () => {
  assert.match(files.shell, /B4GAMBLE/);
  assert.match(files.shell, /Best Offers/);
  assert.match(files.shell, /Casinos/);
  assert.match(files.shell, /Bonuses/);
  assert.match(files.shell, /Learn/);
  assert.match(files.shell, /Start Programme/);
  assert.match(files.layout, /PublicShell/);
  assert.match(files.shellCss, /header/);
  assert.match(files.action, /export function Action/);

  const mergeBase = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { encoding: "utf8" }).trim();
  const changed = [...new Set([
    ...execFileSync("git", ["diff", "--name-only", mergeBase, "HEAD"], { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean),
    ...execFileSync("git", ["status", "--short", "--untracked-files=all"], { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => line.slice(3)),
  ])];
  const schemaChanges = changed
    .filter((file) => file === "prisma/schema.prisma" || /^prisma\/(?:migrations|preflight)\//.test(file))
    .sort();
  if (schemaChanges.length > 0) {
    const approvedExactSchemaChangeSets = [
      [
        "prisma/migrations/0019_programme_runtime_hardening/migration.sql",
        "prisma/preflight/0019_programme_runtime_hardening.sql",
        "prisma/schema.prisma",
      ],
      [
        "prisma/migrations/0020_commercial_ops_01/migration.sql",
        "prisma/schema.prisma",
      ],
      [
        "prisma/migrations/0021_partner_ops_work_bridge_01/migration.sql",
        "prisma/schema.prisma",
      ],
      [
        "prisma/migrations/0022_better_auth_17_schema_upgrade/migration.sql",
        "prisma/schema.prisma",
      ],
      [
        "prisma/migrations/0023_mcp_dcr_runtime_compat_fix/migration.sql",
      ],
    ];
    assert.ok(
      approvedExactSchemaChangeSets.some(
        (approved) => JSON.stringify(schemaChanges) === JSON.stringify(approved),
      ),
      `Unexpected schema changes: ${schemaChanges.join(", ")}`,
    );
  }
  if (changed.includes("package-lock.json")) {
    const packageLock = readFileSync("package-lock.json", "utf8");
    assert.doesNotMatch(packageLock, /"@vercel\/analytics"/);
  }
});

test("the production handoff retains explicit media assets and no placeholder routes", () => {
  assert.ok(existsSync("public/final-handoff/home"));
  assert.doesNotMatch(files.markup, /placeholder\.com|placehold\.co/i);
});
