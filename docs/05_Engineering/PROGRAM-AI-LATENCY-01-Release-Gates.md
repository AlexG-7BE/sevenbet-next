# PROGRAM-AI-LATENCY-01 Release Gates

- **Status date:** 2026-09-25
- **Authority:** Founder instruction dated 25 September 2026 and RFC-056
- **Remote base:** `origin/main` at `3c95d276e8978ab0cb16a2add9e2c0d46cfe7092`
- **Branch:** `codex/programme-ai-low-latency`
- **Release ceiling:** one PR and isolated Preview evidence; no merge or Production deployment

The repository root was confirmed and the active repository inventory was scanned
with dependencies, generated output, caches, test artefacts and
`tsconfig.tsbuildinfo` excluded from implementation claims.

## Implementation evidence

- **DETECTED:** M1 and the M2–M10 guidance/Review adapter use exact
  `gpt-6-luna`, reasoning `none`, strict structured output, `store=false`,
  `background=false` and Fast service tier. Explicit Review regeneration uses
  Fast; deterministic GET Reviews remain provider-free.
- **DETECTED:** provider ceilings changed from M1 `700` to `320`, Mission guidance
  `500` to `320`, and Review regeneration `700` to `620`; response-field schemas
  are correspondingly tighter while user-owned editable domain limits are not
  reduced.
- **DETECTED:** the preferred Mission 01 voice path is a transcription-only
  `gpt-live-transcribe` WebRTC session with `delay=minimal`, no server VAD,
  browser partial deltas and final-only transcript authority.
- **DETECTED:** the OpenAI key and session configuration remain server-side. The
  browser exchanges a bounded SDP offer through the Mission-owned route and
  receives only an SDP answer. No provider credential or `NEXT_PUBLIC_` model
  configuration is present in the client path.
- **DETECTED:** the current 4 MiB/90-second `gpt-4o-transcribe` upload remains as
  captured-file fallback. Cancel, unmount, failure and Type instead clean up
  microphone/peer resources; partial text cannot submit or award progress.
- **DETECTED:** metadata-only logging covers provider/model, requested/actual
  tier, token counts, request latency, voice mode, first partial, stop-to-final
  and a bounded fallback category. Source tests reject content/key logging.
- **DETECTED:** no Prisma schema, migration, reward, Mission order, prerequisite,
  protected Help, commercial-personalisation or Production-control change is in
  this package.

## Local verification

- **DETECTED / PASS:** TypeScript type-check.
- **DETECTED / PASS:** focused changed-file ESLint with zero warnings.
- **DETECTED / PASS:** full Programme AI provider, schema, privacy,
  transcription, internationalisation and structural test lane: `89/89`.
- **DETECTED / PASS:** full repository Programme unit/contract/language-QA gate
  under the required Node 24 runtime: `158/158`.
- **DETECTED / PASS:** optimized Next.js production build; the new realtime route
  appears in the route manifest.
- **DETECTED / PASS:** mocked Chromium realtime flow shows a partial while no
  editable transcript exists, enters finalizing, then promotes only the committed
  final; `1/1` (the complete browser lane is recorded separately below).
- **DETECTED / PASS:** mocked Chromium unsupported-WebRTC path retains bounded
  file transcription, cancellation, retry, track cleanup and mobile overflow
  behaviour; `1/1` (the complete browser lane is recorded separately below).
- **DETECTED / PASS:** the complete Programme AI and Programme
  internationalisation Chromium lane passes against an isolated, migrated and
  approved-fixture-seeded local database; `23/23`.
- **DETECTED / FAIL-CLOSED:** the existing 20-case paid quality harness stops at
  `CREDENTIAL REQUIRED` in this worktree. No live model quality, token, cost or
  latency result is inferred.
- **INFERRED:** static request/schema/safety coverage shows no policy-surface
  regression, but it is not a substitute for the required live old/new corpus
  comparison.

## Required PR and Preview gates

- [ ] Required GitHub CI checks pass on the exact PR head.
- [ ] Vercel Preview is Ready on the exact PR head and uses an isolated
  non-Production database.
- [ ] Preview server configuration resolves exact `gpt-6-luna`,
  `gpt-live-transcribe` and `gpt-4o-transcribe` without exposing values or keys to
  the client.
- [ ] Run the existing 20-case synthetic quality corpus using approved Preview
  credentials; record pass/fail, p50/p95 provider latency, token use and cost. If
  an exact old-model corpus result is unavailable, record the comparison as
  `UNKNOWN` rather than inventing a baseline.
- [ ] Record M1 typed submit-to-Starting-Point latency and one representative
  M2–M10 guidance latency, including actual service tier.
- [ ] Manually verify voice states on Preview: permission, recording, live
  partial, finalizing, committed final, editability, provider/setup failure to
  file fallback, cancellation and Type instead.
- [ ] Manually verify deterministic initial Reviews and explicit Review
  regeneration, safety-boundary cases, prompt injection and no commercial/XP
  authority.
- [ ] Verify 390 px mobile layout, keyboard focus, live-region behaviour and no
  horizontal overflow. Actual Safari permission/encoding remains a device gate.

## Rollback and remaining gates

Rollback sets `PROGRAM_AI_REAL_PROVIDER_ENABLED=false` to retain deterministic
text/type fallback, or `PROGRAM_AI_V1_ENABLED=false` to disable the full
PROGRAM-AI path. No database rollback exists or is required.

- **UNKNOWN:** live Preview provider quality and comparative latency until the PR
  environment is Ready and approved credentials are available.
- **UNKNOWN:** account-specific OpenAI ZDR/MAM, data-sharing, regional processing,
  contracting and transfer position; repository source does not prove them.
- **NOT AUTHORISED:** merge, Production deployment, Production flag/key/model
  changes and unrestricted Production personal-data processing.
