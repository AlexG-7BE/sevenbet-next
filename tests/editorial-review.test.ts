import assert from "node:assert/strict";
import test from "node:test";

import { validateEditorialDocument } from "@/lib/editorial-review/validation";
import type { CasinoEditorialDocument } from "@/lib/editorial-review/types";

function document(): CasinoEditorialDocument {
  return { version: 1, title: "Example Casino Review", summary: "A factual editorial summary.", author: "Editorial Team", sections: [{ id: "overview", kind: "overview", title: "Overview", order: 0, blocks: [{ id: "intro", type: "paragraph", text: "Structured review content." }, { id: "safer-play", type: "responsible-gambling", title: "Pause first", text: "Set limits before registering." }] }], relatedCasinoIds: [], seo: { title: "Example Casino Review | SevenBet", description: "A factual editorial summary." } };
}

test("structured editorial documents validate without HTML", () => {
  assert.deepEqual(validateEditorialDocument(document()), []);
});

test("publication validation rejects duplicate blocks and unsafe embeds", () => {
  const invalid = document();
  invalid.sections[0].blocks.push({ id: "intro", type: "video", provider: "youtube", videoId: "x", title: "" });
  const codes = validateEditorialDocument(invalid).map((issue) => issue.code);
  assert.ok(codes.includes("DUPLICATE_BLOCK"));
  assert.ok(codes.includes("INVALID_VIDEO"));
});
