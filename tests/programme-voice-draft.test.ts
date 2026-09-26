import assert from "node:assert/strict";
import test from "node:test";

import {
  applyProgrammeVoiceDraftText,
  beginProgrammeVoiceDraftSegment,
  reconcileProgrammeVoiceDraftEdit,
} from "../lib/programme/program-ai/voice-draft";

test("live partials reconcile in one session-owned draft segment without duplication", () => {
  const initial = "Typed opening";
  let segment = beginProgrammeVoiceDraftSegment(initial);
  const partial = applyProgrammeVoiceDraftText(initial, segment, "voice words");
  segment = partial.segment;
  assert.equal(partial.draft, "Typed opening voice words");

  const final = applyProgrammeVoiceDraftText(partial.draft, segment, "voice words completed");
  assert.equal(final.draft, "Typed opening voice words completed");
  assert.equal(final.draft.match(/voice words/g)?.length, 1);
});

test("repeated voice sessions append while edits outside the active segment are preserved", () => {
  const first = applyProgrammeVoiceDraftText(
    "Typed opening",
    beginProgrammeVoiceDraftSegment("Typed opening"),
    "first voice",
  );
  const manuallyEdited = `Carefully ${first.draft}!`;
  const secondSegment = beginProgrammeVoiceDraftSegment(manuallyEdited);
  const second = applyProgrammeVoiceDraftText(manuallyEdited, secondSegment, "second voice");
  assert.equal(second.draft, "Carefully Typed opening first voice! second voice");
});

test("an edit inside provisional voice text wins over later provider updates", () => {
  const initial = "Typed opening";
  const partial = applyProgrammeVoiceDraftText(
    initial,
    beginProgrammeVoiceDraftSegment(initial),
    "provisional words",
  );
  const edited = partial.draft.replace("provisional", "my corrected");
  const conflicted = reconcileProgrammeVoiceDraftEdit(partial.draft, edited, partial.segment);
  assert.equal(conflicted.conflicted, true);
  assert.equal(applyProgrammeVoiceDraftText(edited, conflicted, "provider final words").draft, edited);
});

test("voice text is bounded without removing existing draft text", () => {
  const existing = "x".repeat(3_990);
  const applied = applyProgrammeVoiceDraftText(
    existing,
    beginProgrammeVoiceDraftSegment(existing),
    "more than ten new characters",
  );
  assert.equal(applied.draft.length, 4_000);
  assert.equal(applied.draft.startsWith(existing), true);
  assert.equal(applied.truncated, true);
});
