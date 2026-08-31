import assert from "node:assert/strict";
import test from "node:test";

import {
  parseProgrammeAudioUpload,
} from "../lib/programme/application/programme-ai-transcription.service";
import { ProgrammeProviderError } from "../lib/programme/program-ai/provider-errors";
import { readBoundedProgrammeTranscriptionFormData } from "../lib/programme/program-ai/transcription-request";
import {
  PROGRAM_AI_MAX_AUDIO_BYTES,
  PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES,
  programmeAudioBlobFitsUploadLimit,
} from "../lib/programme/program-ai/transcription-limits";
import { ValidationError } from "../lib/services/service-error";

function providerCode(error: unknown) {
  assert.ok(error instanceof ProgrammeProviderError);
  return error.providerCode;
}

async function encodeForm(form: FormData) {
  const request = new Request("http://localhost/api/program/program-ai/transcription", {
    method: "POST",
    body: form,
  });
  return {
    body: new Uint8Array(await request.arrayBuffer()),
    contentType: request.headers.get("content-type")!,
  };
}

function requestFromBytes(
  body: Uint8Array,
  contentType: string,
  contentLength?: string,
) {
  return new Request("http://localhost/api/program/program-ai/transcription", {
    method: "POST",
    headers: {
      "content-type": contentType,
      ...(contentLength === undefined ? {} : { "content-length": contentLength }),
    },
    body: body as BodyInit,
  });
}

function audioForm(size: number) {
  const form = new FormData();
  form.set("audio", new File([new Uint8Array(size)], "capture", { type: "audio/webm" }));
  form.set("durationMs", "90000");
  form.set("locale", "en-GB");
  return form;
}

test("RFC-031 shared client/server audio limit is exactly 4 MiB", () => {
  assert.equal(PROGRAM_AI_MAX_AUDIO_BYTES, 4_194_304);
  assert.equal(PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES, 4_259_840);
  assert.equal(programmeAudioBlobFitsUploadLimit(PROGRAM_AI_MAX_AUDIO_BYTES), true);
  assert.equal(programmeAudioBlobFitsUploadLimit(PROGRAM_AI_MAX_AUDIO_BYTES + 1), false);
});

test("an exact 4 MiB raw audio file remains inside the bounded multipart envelope", async () => {
  const encoded = await encodeForm(audioForm(PROGRAM_AI_MAX_AUDIO_BYTES));
  assert.ok(encoded.body.byteLength <= PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES);
  const form = await readBoundedProgrammeTranscriptionFormData(
    requestFromBytes(encoded.body, encoded.contentType),
  );
  const parsed = await parseProgrammeAudioUpload(form);
  assert.equal(parsed.audio.byteLength, PROGRAM_AI_MAX_AUDIO_BYTES);
  assert.equal(parsed.durationMs, 90_000);
});

test("a 4 MiB plus one byte raw file is rejected before provider input is created", async () => {
  const encoded = await encodeForm(audioForm(PROGRAM_AI_MAX_AUDIO_BYTES + 1));
  assert.ok(encoded.body.byteLength <= PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES);
  const form = await readBoundedProgrammeTranscriptionFormData(
    requestFromBytes(encoded.body, encoded.contentType),
  );
  await assert.rejects(
    parseProgrammeAudioUpload(form),
    (error) => providerCode(error) === "INPUT_TOO_LARGE",
  );
});

test("declared Content-Length above the envelope is rejected", async () => {
  const encoded = await encodeForm(audioForm(1));
  await assert.rejects(
    readBoundedProgrammeTranscriptionFormData(requestFromBytes(
      encoded.body,
      encoded.contentType,
      String(PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES + 1),
    )),
    (error) => providerCode(error) === "INPUT_TOO_LARGE",
  );
});

test("invalid Content-Length is rejected as bounded validation input", async () => {
  const encoded = await encodeForm(audioForm(1));
  await assert.rejects(
    readBoundedProgrammeTranscriptionFormData(requestFromBytes(encoded.body, encoded.contentType, "not-a-number")),
    (error) => error instanceof ValidationError,
  );
});

test("understated Content-Length cannot bypass the actual request-byte counter", async () => {
  const body = new Uint8Array(PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES + 1);
  await assert.rejects(
    readBoundedProgrammeTranscriptionFormData(requestFromBytes(
      body,
      "multipart/form-data; boundary=understated",
      "1",
    )),
    (error) => providerCode(error) === "INPUT_TOO_LARGE",
  );
});

test("missing Content-Length cannot bypass the actual request-byte counter", async () => {
  const body = new Uint8Array(PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES + 1);
  await assert.rejects(
    readBoundedProgrammeTranscriptionFormData(requestFromBytes(
      body,
      "multipart/form-data; boundary=chunked-overflow",
    )),
    (error) => providerCode(error) === "INPUT_TOO_LARGE",
  );
});

test("oversized multipart fields consume the same complete-request envelope", async () => {
  const form = audioForm(1);
  form.set("unexpected", "x".repeat(PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES));
  const encoded = await encodeForm(form);
  assert.ok(encoded.body.byteLength > PROGRAM_AI_MAX_TRANSCRIPTION_REQUEST_BYTES);
  await assert.rejects(
    readBoundedProgrammeTranscriptionFormData(requestFromBytes(encoded.body, encoded.contentType)),
    (error) => providerCode(error) === "INPUT_TOO_LARGE",
  );
});

test("malformed multipart and extra fields fail as validation errors", async () => {
  await assert.rejects(
    readBoundedProgrammeTranscriptionFormData(requestFromBytes(
      new TextEncoder().encode("not multipart data"),
      "multipart/form-data; boundary=missing",
    )),
    (error) => error instanceof ValidationError,
  );

  const extra = audioForm(1);
  extra.set("extra", "not-authorised");
  await assert.rejects(
    parseProgrammeAudioUpload(extra),
    (error) => error instanceof ValidationError,
  );
});

test("duplicate audio or duration fields fail exact multipart validation", async () => {
  const duplicateAudio = audioForm(1);
  duplicateAudio.append("audio", new File([new Uint8Array([2])], "second", { type: "audio/webm" }));
  await assert.rejects(
    parseProgrammeAudioUpload(duplicateAudio),
    (error) => error instanceof ValidationError,
  );

  const duplicateDuration = audioForm(1);
  duplicateDuration.append("durationMs", "1000");
  await assert.rejects(
    parseProgrammeAudioUpload(duplicateDuration),
    (error) => error instanceof ValidationError,
  );
});
