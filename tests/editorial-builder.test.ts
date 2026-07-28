import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("Editorial Builder remains a native Casino Builder section", () => {
  const sections = readFileSync("lib/casino-builder/sections.ts", "utf8");
  const casinoBuilder = readFileSync("components/admin/CasinoBuilder.tsx", "utf8");
  assert.match(sections, /id: "editorial-review"/);
  assert.match(casinoBuilder, /EditorialReviewBuilder/);
  assert.doesNotMatch(casinoBuilder, /@prisma\/client|prisma\./);
});

test("editorial builder uses structured blocks and protected API contracts", () => {
  const source = readFileSync("components/admin/EditorialReviewBuilder.tsx", "utf8");
  for (const label of ["Heading", "Paragraph", "Bullet List", "Ordered List", "FAQ", "Image", "Video"]) assert.match(source, new RegExp(label));
  assert.match(source, /validateEditorialDocument/);
  assert.match(source, /beforeunload/);
  assert.match(source, /\/api\/admin\/editorial-reviews/);
  assert.match(source, /draggable/);
  assert.doesNotMatch(source, /JSON\.stringify\(document, null/);
});

test("preview page resolves existing short-lived editorial tokens", () => {
  const route = "app/editorial-preview/[token]/page.tsx";
  assert.equal(existsSync(route), true);
  const source = readFileSync(route, "utf8");
  assert.match(source, /editorialReviewService\.resolvePreview/);
  assert.match(source, /EditorialReviewRenderer/);
});
