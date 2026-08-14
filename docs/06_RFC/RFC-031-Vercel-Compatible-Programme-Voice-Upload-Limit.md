# RFC-031: Vercel-Compatible Programme Voice Upload Limit

- **Status:** Approved for implementation and bounded Preview verification
- **Proposed:** 2026-08-13
- **Approved:** 2026-08-14
- **Decision authority:** Founder
- **Production authority:** Not granted; merge/Production deployment require a separate Founder decision after verification
- **Scope:** Reconcile the RFC-023 completed-file transcription contract with the Vercel Function request-payload ceiling
- **Base:** `b6fd5b20edd6fc2fcfc62e7d80ddc75c74968d19`
- **Depends on:** Product Vision & Principles v2.0, RFC-017, RFC-021, RFC-022, RFC-023, RFC-025, Programme Architecture Standards, Backend Programme Standards and Programme Definition of Done
- **Supersedes:** RFC-023 section 4 only for the maximum raw audio-file size and the bounded server/client enforcement described here

## 1. Problem and evidence

RFC-023 currently permits an 8 MiB raw audio file. The deployed transcription route is a Vercel Function, and Vercel documents a maximum 4.5 MB Function payload. That limit applies to the complete request body, not only the audio file; `multipart/form-data` adds boundaries and field headers around the file. A conforming 8 MiB file therefore cannot reach the application route on the documented host contract.

Primary platform evidence:

- [Vercel `FUNCTION_PAYLOAD_TOO_LARGE` documentation](https://vercel.com/docs/errors/function_payload_too_large) states that Function request payloads must not exceed 4.5 MB and return `413` when the platform ceiling is exceeded.
- The same Vercel guidance suggests direct client uploads or external storage for larger files. Those alternatives would change the approved RFC-023 privacy and architecture boundary and are not adopted by this decision.

**Detected:** repository code and RFC-023 both use an 8 MiB file ceiling and a 90-second duration ceiling.

**Inferred:** multipart overhead varies with boundaries and headers, so setting the raw file limit equal to the platform limit would remain unsafe.

## 2. Decision

The completed-file transcription contract changes to:

```text
maximum raw audio file = 4 MiB (4,194,304 bytes)
maximum complete multipart request = 4 MiB + 64 KiB (4,259,840 bytes)
maximum declared duration = 90 seconds (unchanged)
```

The 64 KiB request-envelope allowance is for ordinary multipart boundaries and the existing bounded duration field. It is not additional audio capacity. Any request whose envelope itself exceeds that application limit is rejected even if a parsed file would otherwise fit.

This decision does not claim that every browser codec can record for 90 seconds within 4 MiB. Duration and byte size are independent limits; the first one reached ends eligibility for upload. Typed input remains an equal, complete path.

## 3. Server enforcement

The transcription route will enforce both declared and actual body size before provider invocation:

1. reject a syntactically invalid or greater-than-envelope `Content-Length` before reading the body;
2. read the request stream with an actual-byte counter and stop/cancel as soon as the complete multipart request exceeds 4,259,840 bytes;
3. apply the same actual-byte limit when `Content-Length` is absent, understated or delivered in chunks;
4. parse multipart data only after the complete request has remained inside the envelope;
5. require the existing exact fields and supported audio MIME allow-list;
6. reject `File.size > 4,194,304` bytes with the stable `INPUT_TOO_LARGE` response before an OpenAI request; and
7. keep the existing 90-second, timeout, no-retry, no-content logging and safe error contracts unchanged.

The route may retain only the one bounded in-memory request/file representation needed for parsing and the existing single provider request. It must not write the request, audio or transcript to disk, Prisma, logs or analytics.

## 4. Client preflight and user recovery

The recorder will check the completed Blob size before `fetch`. A Blob larger than 4 MiB is not uploaded. The interface will state that the recording is too large to upload and offer the existing **Type instead** action immediately. It must not imply that retrying an unchanged recording can bypass the limit.

Client preflight improves recovery but is not authority. The server applies the same raw-file and complete-request ceilings to every request.

The 90-second automatic stop remains unchanged. No background upload, chunked multi-request upload, automatic compression, direct browser-to-OpenAI request or silent recording-quality downgrade is authorised.

## 5. Privacy and architecture boundary

This decision preserves the RFC-023 server-mediated, completed-file path:

```text
explicit recording
→ bounded in-memory Blob
→ bounded B4GAMBLE request
→ one bounded OpenAI transcription request
→ editable transcript
→ release audio state
```

No Vercel Blob bucket, object store, presigned upload, public or durable file URL, second transcription provider, browser-held provider credential or direct client-to-provider upload is introduced. Those options require a separate approved privacy, retention, access-control and deletion decision.

## 6. Required verification

Automated evidence must cover at least:

- a raw audio file of exactly 4,194,304 bytes inside a normal bounded multipart envelope is accepted for validation;
- a raw audio file of 4,194,305 bytes returns `INPUT_TOO_LARGE` and invokes no provider;
- a declared `Content-Length` above 4,259,840 bytes is rejected before body parsing and provider invocation;
- a deliberately understated `Content-Length` cannot bypass the actual streamed-byte counter;
- a missing `Content-Length` with chunked overflow is stopped at the same actual-byte ceiling;
- oversized multipart headers or fields cannot consume more than the envelope allowance;
- malformed multipart, unsupported MIME and duration-over-90-second behavior remain bounded;
- client preflight makes no network request for an oversized Blob and exposes **Type instead**;
- an at-limit Blob still follows the ordinary single-upload path;
- cancellation, track/Blob cleanup, editable transcript and typed completion regressions pass;
- no audio, transcript, body, credential or provider error body enters logs or analytics; and
- feature-off, provider-off, Programme reward/claim, typecheck, build and relevant browser tests pass.

A Preview smoke must confirm an at-limit representative upload and the too-large recovery state without using Production data. A platform-generated `413` is not accepted as the product's only validation behavior for requests that fit inside the application envelope.

## 7. Alternatives considered

- **Keep 8 MiB:** rejected because it conflicts with the documented deployed Function limit.
- **Set the file limit to 4.5 MB:** rejected because it leaves no reliable room for multipart overhead.
- **Reduce only the duration:** rejected because encoded byte size varies by browser, codec and bitrate.
- **Direct/object-storage upload:** deferred because it creates new storage, access, retention, deletion and processor boundaries.
- **Split/chunk recordings across requests:** deferred because it adds assembly, retry, cleanup and abuse-control state not authorised by RFC-023.

## 8. Rollout and rollback

This decision authorises implementation on the focused `rfc-031-voice-upload-limit` branch and bounded non-Production/Preview verification only. It does not authorise merge to `main`, Production deployment, Production environment changes, Production database changes or Production-data testing. Those require a separate Founder decision after the required verification evidence is complete.

The implementation must land through a focused Pull Request with the tests above and exact Preview evidence.

Operational rollback after any later separately authorised Production release disables `PROGRAM_AI_REAL_PROVIDER_ENABLED` or `PROGRAM_AI_V1_ENABLED` and preserves typed input. Rollback must not restore the incompatible 8 MiB upload on Vercel. No schema or data rollback is required.

## 9. Evidence classification at approval

- **Detected:** RFC-023 and current code allow 8 MiB; current code uses one server-mediated multipart upload; Vercel documents a 4.5 MB Function payload ceiling; typed input and a 90-second cap already exist.
- **Inferred:** 4 MiB raw audio plus a bounded 64 KiB multipart envelope provides necessary headroom under the documented platform ceiling.
- **Approved:** the exact byte limits, streamed actual-byte enforcement, client preflight, tests and bounded Preview verification in this RFC.
- **Not detected / not authorised:** a compliant implementation, object storage, direct upload, Production merge/deployment, Production environment mutation, Production database mutation or Production verification.