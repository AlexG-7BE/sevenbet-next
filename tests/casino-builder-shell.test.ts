import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { casinoBuilderSections, isCasinoBuilderSection } from "../lib/casino-builder/sections";

const routes = [
  "app/admin/(protected)/casinos/page.tsx",
  "app/admin/(protected)/casinos/new/page.tsx",
  "app/admin/(protected)/casinos/[casinoId]/page.tsx",
  "app/admin/(protected)/casinos/[casinoId]/builder/page.tsx",
  "app/admin/(protected)/casinos/[casinoId]/preview/page.tsx",
  "app/admin/(protected)/casinos/[casinoId]/revisions/page.tsx",
];

test("all Phase 3.2 Casino Builder routes exist", () => {
  for (const route of routes) assert.equal(existsSync(route), true, route);
});

test("builder exposes the complete ordered section navigation", () => {
  assert.deepEqual(
    casinoBuilderSections.map((section) => section.id),
    [
      "general",
      "seo",
      "licenses",
      "countries",
      "payments",
      "game-providers",
      "game-categories",
      "bonuses",
      "affiliate-links",
      "media",
      "publishing",
      "history",
    ],
  );
  assert.equal(isCasinoBuilderSection("payments"), true);
  assert.equal(isCasinoBuilderSection("unknown"), false);
});

test("shared Casino Builder components are exported", () => {
  const source = readFileSync("components/admin/CasinoBuilder.tsx", "utf8");
  for (const name of [
    "CasinoBuilderLayout",
    "CasinoSidebar",
    "CasinoHeader",
    "CasinoStatusBar",
    "CasinoSectionLayout",
    "CasinoSaveBar",
  ]) {
    assert.match(source, new RegExp(`export function ${name}\\(`));
  }
});

test("builder UI uses the admin API and never imports Prisma", () => {
  const builder = readFileSync("components/admin/CasinoBuilder.tsx", "utf8");
  const pages = routes.map((route) => readFileSync(route, "utf8")).join("\n");

  assert.doesNotMatch(`${builder}\n${pages}`, /@prisma\/client|prisma\./);
  assert.match(builder, /\/api\/admin\/casinos\/\$\{casino\.id\}/);
  assert.match(builder, /expectedUpdatedAt: casino\.updatedAt/);
  assert.match(builder, /beforeunload/);
});

test("archived casinos can be restored to draft through the guarded workflow API", () => {
  const builder = readFileSync("components/admin/CasinoBuilder.tsx", "utf8");
  const actionRoute = readFileSync("app/api/admin/casinos/[casinoId]/action/route.ts", "utf8");
  const service = readFileSync("lib/services/casino.service.ts", "utf8");

  assert.match(builder, /onAction\("restore"\)/);
  assert.match(builder, /Restore to draft/);
  assert.match(actionRoute, /body\.action === "restore"/);
  assert.match(actionRoute, /EditorialStatus\.DRAFT/);
  assert.match(actionRoute, /revalidatePublicCasino\(casino\.slug\)/);
  assert.match(service, /ARCHIVED: \[EditorialStatus\.DRAFT\]/);
});
